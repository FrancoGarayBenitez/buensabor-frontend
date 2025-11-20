import type { HistoricoPrecioDTO } from "../types/insumos/HistoricoPrecioDTO";
import type { HistoricoPrecioStats } from "../types/insumos/HistoricoPrecioStats";
import type { PrecioVentaSugeridoDTO } from "../types/insumos/PrecioVentaSugeridoDTO";
import { apiClienteService } from "./ApiClienteService";

const HistoricoPrecioService = {
  /**
   * ✅ Obtiene el historial de precios de un artículo
   */
  getHistorial: async (idArticulo: number): Promise<HistoricoPrecioDTO[]> => {
    try {
      return await apiClienteService.get<HistoricoPrecioDTO[]>(
        `/historico-precios/${idArticulo}`
      );
    } catch (error) {
      console.error("❌ Error obteniendo historial:", error);
      return [];
    }
  },

  /**
   * ✅ Obtiene los últimos N precios
   */
  getUltimosPrecios: async (
    idArticulo: number,
    limit: number = 10
  ): Promise<HistoricoPrecioDTO[]> => {
    try {
      return await apiClienteService.get<HistoricoPrecioDTO[]>(
        `/historico-precios/${idArticulo}/ultimos?limit=${limit}`
      );
    } catch (error) {
      console.error("❌ Error obteniendo últimos precios:", error);
      return [];
    }
  },

  /**
   * ✅ Obtiene estadísticas de precios
   */
  getEstadisticas: async (
    idArticulo: number
  ): Promise<HistoricoPrecioStats | null> => {
    try {
      return await apiClienteService.get<HistoricoPrecioStats>(
        `/historico-precios/${idArticulo}/estadisticas`
      );
    } catch (error) {
      console.error("❌ Error obteniendo estadísticas:", error);
      return null;
    }
  },

  /**
   * Obtiene precio SUGERIDO DE VENTA
   * Basado en:
   * - Precio promedio histórico de compra
   * - Margen de ganancia deseado
   */
  getPrecioVentaSugerido: async (
    idArticulo: number,
    margenGanancia: number = 1.2
  ): Promise<PrecioVentaSugeridoDTO | null> => {
    try {
      return await apiClienteService.get(
        `/historico-precios/${idArticulo}/precio-venta-sugerido?margenGanancia=${margenGanancia}`
      );
    } catch (error) {
      console.error("❌ Error obteniendo precio de venta sugerido:", error);
      return null;
    }
  },

  /**
   * ✅ Registra un nuevo precio en el historial
   */
  registrarPrecio: async (
    idArticulo: number,
    precioUnitario: number,
    cantidad?: number
  ): Promise<HistoricoPrecioDTO | null> => {
    try {
      return await apiClienteService.post<HistoricoPrecioDTO>(
        `/historico-precios`,
        {
          idArticulo,
          precioUnitario,
          cantidad: cantidad || 0,
        }
      );
    } catch (error) {
      console.error("❌ Error registrando precio:", error);
      return null;
    }
  },

  /**
   * Elimina una compra individual del historial
   */
  deleteCompra: async (idHistoricoPrecio: number): Promise<boolean> => {
    try {
      await apiClienteService.deleteRequest(
        `/historico-precios/${idHistoricoPrecio}`
      );
      return true;
    } catch (error) {
      console.error("❌ Error eliminando compra:", error);
      return false;
    }
  },
};

export default HistoricoPrecioService;
