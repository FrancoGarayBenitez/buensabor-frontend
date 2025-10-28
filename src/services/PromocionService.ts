import { apiClienteService } from "./ApiClienteService";
import type { 
  PromocionRequestDTO, 
  PromocionResponseDTO, 
  PromocionAplicacionDTO 
} from "../types/promociones";
import type { PromocionCompletaDTO } from "../types/promociones";

/**
 * Servicio para operaciones de promociones
 * Usa apiClienteService que maneja automáticamente los tokens de Auth0
 */
export class PromocionService {
  private readonly endpoint = "/promociones";

  // ==================== MÉTODOS PARA CLIENTES (PÚBLICOS) ====================

  /**
   * Obtener todas las promociones vigentes (para mostrar en catálogo)
   */
  async getPromocionesVigentes(): Promise<PromocionResponseDTO[]> {
    try {
      console.log("🎯 Obteniendo promociones vigentes...");
      const response = await apiClienteService.get<PromocionResponseDTO[]>(
        `${this.endpoint}/vigentes`
      );
      console.log("✅ Promociones vigentes obtenidas:", response.length);
      return response;
    } catch (error: any) {
      console.error("❌ Error al obtener promociones vigentes:", error);
      throw this.handleError(error);
    }
  }

  /**
 * Obtener promociones vigentes completas con artículos agrupados
 */
async getPromocionesVigentesCompletas(): Promise<PromocionCompletaDTO[]> {
  try {
    console.log("🎯 Obteniendo promociones vigentes completas...");
    const response = await apiClienteService.get<PromocionCompletaDTO[]>(
      `${this.endpoint}/vigentes-completas`
    );
    console.log("✅ Promociones vigentes completas obtenidas:", response.length);
    return response;
  } catch (error: any) {
    console.error("❌ Error al obtener promociones vigentes completas:", error);
    throw this.handleError(error);
  }
}

  /**
   * Obtener promociones disponibles para un artículo específico
   */
  async getPromocionesParaArticulo(idArticulo: number): Promise<PromocionResponseDTO[]> {
    try {
      console.log(`🎯 Obteniendo promociones para artículo ${idArticulo}...`);
      const response = await apiClienteService.get<PromocionResponseDTO[]>(
        `${this.endpoint}/articulo/${idArticulo}`
      );
      console.log(`✅ Promociones para artículo ${idArticulo}:`, response.length);
      return response;
    } catch (error: any) {
      console.error(`❌ Error al obtener promociones para artículo ${idArticulo}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtener promociones aplicables para un artículo en una sucursal
   */
  async getPromocionesAplicables(idArticulo: number, idSucursal: number = 1): Promise<PromocionResponseDTO[]> {
    try {
      console.log(`🎯 Obteniendo promociones aplicables: artículo ${idArticulo}, sucursal ${idSucursal}...`);
      const response = await apiClienteService.get<PromocionResponseDTO[]>(
        `${this.endpoint}/aplicables?idArticulo=${idArticulo}&idSucursal=${idSucursal}`
      );
      console.log(`✅ Promociones aplicables obtenidas:`, response.length);
      return response;
    } catch (error: any) {
      console.error(`❌ Error al obtener promociones aplicables:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Calcular descuentos para preview del carrito
   */
  async calcularDescuentos(
    idSucursal: number = 1,
    aplicaciones: PromocionAplicacionDTO[]
  ): Promise<any> {
    try {
      console.log("💰 Calculando descuentos para:", aplicaciones.length, "aplicaciones");
      const response = await apiClienteService.post<any>(
        `${this.endpoint}/calcular-descuentos?idSucursal=${idSucursal}`,
        aplicaciones
      );
      console.log("✅ Descuentos calculados:", response);
      return response;
    } catch (error: any) {
      console.error("❌ Error al calcular descuentos:", error);
      throw this.handleError(error);
    }
  }

  // ==================== MÉTODOS PARA ADMINISTRACIÓN ====================

  /**
   * Obtener todas las promociones (solo admin)
   */
  async getAll(): Promise<PromocionResponseDTO[]> {
    try {
      console.log("📋 Admin: Obteniendo todas las promociones...");
      const response = await apiClienteService.get<PromocionResponseDTO[]>(
        this.endpoint
      );
      console.log("✅ Admin: Promociones obtenidas:", response.length);
      return response;
    } catch (error: any) {
      console.error("❌ Admin: Error al obtener promociones:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtener promoción por ID (solo admin)
   */
  async getById(id: number): Promise<PromocionResponseDTO> {
    try {
      console.log(`🔍 Admin: Obteniendo promoción ${id}...`);
      const response = await apiClienteService.get<PromocionResponseDTO>(
        `${this.endpoint}/${id}`
      );
      console.log("✅ Admin: Promoción obtenida:", response.denominacion);
      return response;
    } catch (error: any) {
      console.error(`❌ Admin: Error al obtener promoción ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Crear nueva promoción (solo admin)
   */
  async create(data: PromocionRequestDTO): Promise<PromocionResponseDTO> {
    try {
      console.log("➕ Admin: Creando promoción:", data.denominacion);
      const response = await apiClienteService.post<PromocionResponseDTO>(
        this.endpoint,
        data
      );
      console.log("✅ Admin: Promoción creada:", response.idPromocion);
      return response;
    } catch (error: any) {
      console.error("❌ Admin: Error al crear promoción:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Actualizar promoción existente (solo admin)
   */
  async update(id: number, data: PromocionRequestDTO): Promise<PromocionResponseDTO> {
    try {
      console.log(`✏️ Admin: Actualizando promoción ${id}:`, data.denominacion);
      const response = await apiClienteService.put<PromocionResponseDTO>(
        `${this.endpoint}/${id}`,
        data
      );
      console.log("✅ Admin: Promoción actualizada:", response.idPromocion);
      return response;
    } catch (error: any) {
      console.error(`❌ Admin: Error al actualizar promoción ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Eliminar promoción (solo admin)
   */
  async delete(id: number): Promise<void> {
    try {
      console.log(`🗑️ Admin: Eliminando promoción ${id}...`);
      await apiClienteService.deleteRequest<void>(`${this.endpoint}/${id}`);
      console.log("✅ Admin: Promoción eliminada:", id);
    } catch (error: any) {
      console.error(`❌ Admin: Error al eliminar promoción ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Activar promoción (solo admin)
   */
  async activar(id: number): Promise<void> {
    try {
      console.log(`🟢 Admin: Activando promoción ${id}...`);
      await apiClienteService.patch<void>(`${this.endpoint}/${id}/activar`);
      console.log("✅ Admin: Promoción activada:", id);
    } catch (error: any) {
      console.error(`❌ Admin: Error al activar promoción ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Desactivar promoción (solo admin)
   */
  async desactivar(id: number): Promise<void> {
    try {
      console.log(`🔴 Admin: Desactivando promoción ${id}...`);
      await apiClienteService.patch<void>(`${this.endpoint}/${id}/desactivar`);
      console.log("✅ Admin: Promoción desactivada:", id);
    } catch (error: any) {
      console.error(`❌ Admin: Error al desactivar promoción ${id}:`, error);
      throw this.handleError(error);
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Formatear información de promoción para mostrar
   */
  static formatearPromocion(promocion: PromocionResponseDTO): {
    textoDescuento: string;
    textoVigencia: string;
    colorEstado: string;
  } {
    const textoDescuento = promocion.tipoDescuento === 'PORCENTUAL' 
      ? `${promocion.valorDescuento}% de descuento`
      : `$${promocion.valorDescuento} de descuento`;

    const colorEstado = promocion.estaVigente 
      ? 'green' 
      : promocion.activo 
        ? 'yellow' 
        : 'red';

    return {
      textoDescuento,
      textoVigencia: promocion.estadoDescripcion,
      colorEstado
    };
  }

  /**
   * Verificar si una promoción es aplicable a un artículo
   */
  static esAplicableAArticulo(promocion: PromocionResponseDTO, idArticulo: number): boolean {
    return promocion.articulos.some(articulo => articulo.idArticulo === idArticulo);
  }

  /**
   * Calcular descuento de una promoción
   */
  static calcularDescuentoLocal(
    promocion: PromocionResponseDTO, 
    precioUnitario: number, 
    cantidad: number
  ): number {
    if (!promocion.estaVigente || cantidad < promocion.cantidadMinima) {
      return 0;
    }

    const totalSinDescuento = precioUnitario * cantidad;

    if (promocion.tipoDescuento === 'PORCENTUAL') {
      return totalSinDescuento * (promocion.valorDescuento / 100);
    } else {
      // MONTO_FIJO
      return Math.min(promocion.valorDescuento * cantidad, totalSinDescuento);
    }
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: any): Error {
    return error instanceof Error
      ? error
      : new Error("Error en el servicio de promociones");
  }
}