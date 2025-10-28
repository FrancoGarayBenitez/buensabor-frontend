import { ProductoService } from './ProductoService';
import type { ArticuloManufacturadoResponseDTO } from '../types/productos/ArticuloManufacturadoResponseDTO';
import type { DetallePedidoResponseDTO } from '../types/pedidos';

export interface RecetaDetalle {
  idArticulo: number;
  denominacion: string;
  imagen: string;
  tiempoPreparacion: number;
  preparacion: string;
  ingredientes: Array<{
    nombre: string;
    cantidad: number;
    unidadMedida: string;
    cantidadRequerida: number; // cantidad * cantidad del pedido
  }>;
  instrucciones: string[];
  descripcion?: string;
  categoria: string;
}

export class RecetaService {
  private productoService = new ProductoService();

  /**
   * Obtiene la receta completa de un producto basándose en el detalle del pedido
   */
  async obtenerRecetaPorDetallePedido(detallePedido: DetallePedidoResponseDTO): Promise<RecetaDetalle> {
    try {
      // Obtener información completa del producto manufacturado
      const producto = await this.productoService.getById(detallePedido.idArticulo);
      
      return this.convertirProductoAReceta(producto, detallePedido.cantidad);
    } catch (error) {
      console.error('Error al obtener receta:', error);
      // Devolver receta genérica si hay error
      return this.crearRecetaGenerica(detallePedido);
    }
  }

  /**
   * Convierte un ArticuloManufacturadoResponseDTO a RecetaDetalle
   */
  private convertirProductoAReceta(producto: ArticuloManufacturadoResponseDTO, cantidadPedido: number): RecetaDetalle {
    // Obtener la imagen principal o usar emoji por defecto
    const imagenPrincipal = producto.imagenes?.[0]?.url || this.obtenerEmojiPorCategoria(producto.categoria.denominacion);

    // Convertir ingredientes (detalles del manufacturado)
    const ingredientes = producto.detalles.map(detalle => ({
      nombre: detalle.denominacionInsumo || 'Ingrediente',
      cantidad: detalle.cantidad,
      unidadMedida: detalle.unidadMedida || 'unidad',
      cantidadRequerida: detalle.cantidad * cantidadPedido
    }));

    // Procesar instrucciones de preparación
    const instrucciones = this.procesarInstrucciones(producto.preparacion);

    return {
      idArticulo: producto.idArticulo,
      denominacion: producto.denominacion,
      imagen: imagenPrincipal,
      tiempoPreparacion: producto.tiempoEstimadoEnMinutos,
      preparacion: producto.preparacion || 'No hay instrucciones específicas disponibles.',
      ingredientes,
      instrucciones,
      descripcion: producto.descripcion,
      categoria: producto.categoria.denominacion
    };
  }

  /**
   * Procesa el texto de preparación y lo convierte en pasos numerados
   */
  private procesarInstrucciones(preparacion?: string): string[] {
    if (!preparacion) {
      return [
        'Revisar todos los ingredientes necesarios',
        'Seguir las técnicas estándar de preparación',
        'Verificar punto de cocción y presentación',
        'Servir según especificaciones del restaurante'
      ];
    }

    // Si ya está dividido por saltos de línea o números
    const lineas = preparacion.split(/\n|\.(?=\s*\d)|\.(?=\s*[A-Z])/);
    
    return lineas
      .map(linea => linea.trim())
      .filter(linea => linea.length > 0)
      .map(linea => {
        // Limpiar numeración existente si la hay
        return linea.replace(/^\d+\.?\s*/, '').trim();
      })
      .filter(linea => linea.length > 0);
  }

  /**
   * Obtiene emoji apropiado según la categoría del producto
   */
  private obtenerEmojiPorCategoria(categoria: string): string {
    const categoriaLower = categoria.toLowerCase();
    
    if (categoriaLower.includes('hamburguesa') || categoriaLower.includes('burger')) return '🍔';
    if (categoriaLower.includes('pizza')) return '🍕';
    if (categoriaLower.includes('empanada')) return '🥟';
    if (categoriaLower.includes('pasta') || categoriaLower.includes('fideos')) return '🍝';
    if (categoriaLower.includes('sandwich') || categoriaLower.includes('sándwich')) return '🥪';
    if (categoriaLower.includes('ensalada')) return '🥗';
    if (categoriaLower.includes('bebida') || categoriaLower.includes('drink')) return '🥤';
    if (categoriaLower.includes('postre') || categoriaLower.includes('dulce')) return '🍰';
    if (categoriaLower.includes('carne') || categoriaLower.includes('asado')) return '🥩';
    if (categoriaLower.includes('pollo')) return '🍗';
    if (categoriaLower.includes('pescado') || categoriaLower.includes('mariscos')) return '🐟';
    if (categoriaLower.includes('taco') || categoriaLower.includes('mexicana')) return '🌮';
    if (categoriaLower.includes('sushi') || categoriaLower.includes('japonesa')) return '🍣';
    if (categoriaLower.includes('café') || categoriaLower.includes('coffee')) return '☕';
    
    return '🍽️'; // Emoji por defecto
  }

  /**
   * Crea una receta genérica cuando no se puede obtener información del producto
   */
  private crearRecetaGenerica(detallePedido: DetallePedidoResponseDTO): RecetaDetalle {
    return {
      idArticulo: detallePedido.idArticulo,
      denominacion: detallePedido.denominacionArticulo,
      imagen: '🍽️',
      tiempoPreparacion: detallePedido.tiempoPreparacion,
      preparacion: 'Receta no disponible en el sistema. Consultar con supervisor.',
      ingredientes: [
        {
          nombre: 'Ingredientes según receta estándar',
          cantidad: 1,
          unidadMedida: 'porción',
          cantidadRequerida: detallePedido.cantidad
        }
      ],
      instrucciones: [
        'Consultar receta física o supervisor',
        'Preparar según estándares del restaurante',
        'Verificar presentación antes de servir'
      ],
      categoria: 'General'
    };
  }

  /**
   * Obtiene múltiples recetas para un pedido completo
   */
  async obtenerRecetasPedido(detallesPedido: DetallePedidoResponseDTO[]): Promise<RecetaDetalle[]> {
    const promesasRecetas = detallesPedido.map(detalle => 
      this.obtenerRecetaPorDetallePedido(detalle)
    );

    try {
      return await Promise.all(promesasRecetas);
    } catch (error) {
      console.error('Error al obtener recetas del pedido:', error);
      // Devolver recetas genéricas en caso de error
      return detallesPedido.map(detalle => this.crearRecetaGenerica(detalle));
    }
  }

  /**
   * Formatea el tiempo de preparación considerando múltiples cantidades
   */
  static calcularTiempoTotal(receta: RecetaDetalle, cantidad: number): number {
    // Para múltiples unidades, el tiempo no es completamente lineal
    // Aplicamos una fórmula que considera eficiencia en preparación múltiple
    if (cantidad === 1) return receta.tiempoPreparacion;
    
    // El tiempo base + tiempo adicional reducido por unidad extra
    const tiempoBase = receta.tiempoPreparacion;
    const tiempoAdicionalPorUnidad = Math.floor(receta.tiempoPreparacion * 0.3); // 30% del tiempo base
    
    return tiempoBase + ((cantidad - 1) * tiempoAdicionalPorUnidad);
  }

  /**
   * Verifica si un producto requiere ingredientes especiales o preparación compleja
   */
  static esRecetaCompleja(receta: RecetaDetalle): boolean {
    return receta.ingredientes.length > 5 || 
           receta.tiempoPreparacion > 20 ||
           receta.instrucciones.length > 6;
  }
}