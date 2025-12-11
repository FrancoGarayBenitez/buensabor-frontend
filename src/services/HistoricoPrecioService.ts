import { apiClienteService } from "./ApiClienteService";
import type { HistoricoPrecioDTO } from "../types/insumos/HistoricoPrecioDTO";
import type {
  HistoricoPrecioStatsDTO,
  PrecioVentaSugeridoDTO,
} from "../types/insumos/HistoricoPrecioDTO";

/**
 * ✅ Servicio para consultar histórico de precios (auditoría)
 * ✅ Solo lectura: generado automáticamente por backend
 * ✅ Proporciona análisis y sugerencias de precios
 */
export class HistoricoPrecioService {
  private readonly endpoint = "/historico-precios";

  /**
   * Obtener histórico completo de precios de un insumo
   */
  async getHistorial(idArticuloInsumo: number): Promise<HistoricoPrecioDTO[]> {
    return apiClienteService.get<HistoricoPrecioDTO[]>(
      `${this.endpoint}/${idArticuloInsumo}`
    );
  }

  /**
   * Obtener los últimos N precios
   */
  async getUltimosPrecios(
    idArticuloInsumo: number,
    limit: number = 10
  ): Promise<HistoricoPrecioDTO[]> {
    return apiClienteService.get<HistoricoPrecioDTO[]>(
      `${this.endpoint}/${idArticuloInsumo}/ultimos?limit=${limit}`
    );
  }

  /**
   * Obtener estadísticas de precios
   */
  async getEstadisticas(
    idArticuloInsumo: number
  ): Promise<HistoricoPrecioStatsDTO> {
    return apiClienteService.get<HistoricoPrecioStatsDTO>(
      `${this.endpoint}/${idArticuloInsumo}/estadisticas`
    );
  }

  /**
   * Obtener precio de venta sugerido basado en:
   * - Precio promedio histórico de compra
   * - Margen de ganancia deseado
   */
  async getPrecioVentaSugerido(
    idArticuloInsumo: number,
    margenGanancia: number = 1.2
  ): Promise<PrecioVentaSugeridoDTO> {
    return apiClienteService.get<PrecioVentaSugeridoDTO>(
      `${this.endpoint}/${idArticuloInsumo}/precio-venta-sugerido?margenGanancia=${margenGanancia}`
    );
  }
}

export const historicoPrecioService = new HistoricoPrecioService();
