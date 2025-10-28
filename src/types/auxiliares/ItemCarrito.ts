// src/types/auxiliares/ItemCarrito.ts - VERSIÓN EXTENDIDA CON PROMOCIONES
import type { PromocionResponseDTO } from '../promociones';

export interface ItemCarrito {
  // ==================== CAMPOS ORIGINALES (sin cambios) ====================
  id: number;
  nombre: string;
  cantidad: number;
  precio: number;
  imagen?: string;
  tiempoPreparacion?: number;

  // ==================== NUEVOS CAMPOS PARA PROMOCIONES (opcionales) ====================
  
  // Promoción seleccionada por el usuario para este item
  promocionSeleccionada?: number;
  
  // Lista de promociones disponibles para este producto (se carga lazy)
  promocionesDisponibles?: PromocionResponseDTO[];
  
  // Flag para saber si ya se cargaron las promociones
  promocionesCargadas?: boolean;
  
  // Precios calculados con promoción (para mostrar en UI)
  precioOriginal?: number;        // Precio sin descuento (backup del precio original)
  precioConDescuento?: number;    // Precio después del descuento
  descuentoAplicado?: number;     // Monto del descuento
  tienePromocion?: boolean;       // Flag rápido
  
  // Información de la promoción aplicada (para mostrar en UI)
  infoPromocion?: {
    id: number;
    nombre: string;
    descripcion?: string;
    tipoDescuento: 'PORCENTUAL' | 'MONTO_FIJO';
    valorDescuento: number;
    resumenDescuento: string;     // "15% descuento - Ahorro: $150"
  };
}

// ==================== TIPOS AUXILIARES ====================

// Tipo para items básicos (backward compatibility)
export type ItemCarritoBasico = Pick<ItemCarrito, 
  'id' | 'nombre' | 'cantidad' | 'precio' | 'imagen' | 'tiempoPreparacion'
>;

// Tipo para items con promociones completas
export type ItemCarritoConPromociones = Required<Pick<ItemCarrito,
  'id' | 'nombre' | 'cantidad' | 'precio' | 'promocionSeleccionada' | 'promocionesDisponibles'
>> & Partial<ItemCarrito>;

// ==================== UTILIDADES ESTÁTICAS ====================

export class ItemCarritoUtils {
  
  /**
   * Crear item básico (sin promociones) - para backward compatibility
   */
  static crearItemBasico(
    id: number,
    nombre: string, 
    precio: number, 
    cantidad: number = 1,
    imagen?: string,
    tiempoPreparacion?: number
  ): ItemCarrito {
    return {
      id,
      nombre,
      cantidad,
      precio,
      imagen,
      tiempoPreparacion,
      // Campos de promoción con valores por defecto
      promocionSeleccionada: undefined,
      promocionesDisponibles: [],
      promocionesCargadas: false,
      precioOriginal: precio,
      tienePromocion: false
    };
  }

  /**
   * Actualizar item con promoción seleccionada
   */
  static aplicarPromocion(
    item: ItemCarrito, 
    promocion: PromocionResponseDTO
  ): ItemCarrito {
    // Calcular descuento usando la lógica del servicio
    const descuento = promocion.tipoDescuento === 'PORCENTUAL'
      ? (item.precio * item.cantidad * promocion.valorDescuento) / 100
      : Math.min(promocion.valorDescuento * item.cantidad, item.precio * item.cantidad);

    const precioConDescuento = item.precio - (descuento / item.cantidad);

    return {
      ...item,
      promocionSeleccionada: promocion.idPromocion,
      precioOriginal: item.precioOriginal || item.precio,
      precioConDescuento,
      descuentoAplicado: descuento,
      tienePromocion: true,
      infoPromocion: {
        id: promocion.idPromocion,
        nombre: promocion.denominacion,
        descripcion: promocion.descripcionDescuento,
        tipoDescuento: promocion.tipoDescuento,
        valorDescuento: promocion.valorDescuento,
        resumenDescuento: `${promocion.denominacion} - Ahorro: $${descuento.toFixed(0)}`
      }
    };
  }

  /**
   * Remover promoción de un item
   */
  static removerPromocion(item: ItemCarrito): ItemCarrito {
    return {
      ...item,
      promocionSeleccionada: undefined,
      precioConDescuento: undefined,
      descuentoAplicado: undefined,
      tienePromocion: false,
      infoPromocion: undefined
    };
  }

  /**
   * Verificar si item tiene promoción aplicada
   */
  static tienePromocionAplicada(item: ItemCarrito): boolean {
    return !!item.promocionSeleccionada && !!item.tienePromocion;
  }

  /**
   * Obtener precio efectivo (con o sin promoción)
   */
  static getPrecioEfectivo(item: ItemCarrito): number {
    return item.precioConDescuento ?? item.precio;
  }

  /**
   * Obtener subtotal del item (cantidad * precio efectivo)
   */
  static getSubtotal(item: ItemCarrito): number {
    return ItemCarritoUtils.getPrecioEfectivo(item) * item.cantidad;
  }

  /**
   * Obtener subtotal original (sin promociones)
   */
  static getSubtotalOriginal(item: ItemCarrito): number {
    return (item.precioOriginal ?? item.precio) * item.cantidad;
  }

  /**
   * Convertir a formato para backend (DetallePedidoRequestDTO)
   */
  static toDetallePedidoRequest(item: ItemCarrito) {
    return {
      idArticulo: item.id,
      cantidad: item.cantidad,
      // ✅ NUEVO: Incluir promoción seleccionada
      ...(item.promocionSeleccionada ? { 
        idPromocionSeleccionada: item.promocionSeleccionada 
      } : {})
    };
  }

  /**
   * Validar que el item tiene los campos mínimos necesarios
   */
  static esValido(item: Partial<ItemCarrito>): item is ItemCarrito {
    return !!(
      item.id && 
      item.nombre && 
      typeof item.cantidad === 'number' && item.cantidad > 0 &&
      typeof item.precio === 'number' && item.precio >= 0
    );
  }
}

// ==================== CONSTANTES ====================

export const ITEM_CARRITO_DEFAULTS = {
  CANTIDAD_INICIAL: 1,
  PROMOCIONES_VACIAS: [],
  PROMOCIONES_NO_CARGADAS: false,
  SIN_PROMOCION: false
} as const;