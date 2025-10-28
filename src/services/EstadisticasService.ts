import { apiClienteService } from './ApiClienteService';
import type { MovimientosMonetariosDTO } from '../types/estadisticas/MovimientosMonetariosDTO';
import type { RankingProductoDTO } from '../types/estadisticas/RankingProductoDTO';

export const EstadisticasService = {
  getMovimientosMonetarios: async (fechaDesde: string, fechaHasta: string): Promise<MovimientosMonetariosDTO> => {
    const response = await apiClienteService.get<MovimientosMonetariosDTO>(`/estadisticas/movimientos?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`);
    return response;
  },

  getRankingProductos: async (fechaDesde: string, fechaHasta: string, limit: number = 10): Promise<RankingProductoDTO[]> => {
    const response = await apiClienteService.get<RankingProductoDTO[]>(`/estadisticas/ranking-productos?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&limit=${limit}`);
    return response;
  },
};