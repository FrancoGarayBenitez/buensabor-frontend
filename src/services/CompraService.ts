import { apiClienteService } from "./ApiClienteService";
import type { CompraInsumoRequestDTO } from "../types/insumos/CompraInsumoRequestDTO";
import type { ArticuloInsumoResponseDTO } from "../types/insumos/ArticuloInsumoResponseDTO";
import type { CompraInsumoResponseDTO } from "../types/insumos/CompraInsumoResponseDTO";

/**
 * ✅ Servicio para registrar compras de insumos al proveedor
 * ✅ Cada compra:
 *    - Actualiza stock en backend
 *    - Crea registro en HistoricoPrecio automáticamente
 *    - Recalcula estadoStock
 */
export class CompraService {
  private readonly endpoint = "/compras-insumo";

  /**
   * Registrar compra de insumo al proveedor
   */
  async registrarCompra(
    compra: CompraInsumoRequestDTO
  ): Promise<ArticuloInsumoResponseDTO> {
    return apiClienteService.post<ArticuloInsumoResponseDTO>(
      this.endpoint,
      compra
    );
  }

  /**
   * Obtener todas las compras registradas
   */
  async getAllCompras(): Promise<CompraInsumoResponseDTO[]> {
    return apiClienteService.get<CompraInsumoResponseDTO[]>(this.endpoint);
  }

  /**
   * Obtener compras de un insumo específico
   */
  async getComprasByInsumo(
    idArticuloInsumo: number
  ): Promise<CompraInsumoResponseDTO[]> {
    return apiClienteService.get<CompraInsumoResponseDTO[]>(
      `${this.endpoint}/insumo/${idArticuloInsumo}`
    );
  }

  /**
   * Eliminar compra individual
   */
  async deleteCompra(idCompra: number): Promise<ArticuloInsumoResponseDTO> {
    return apiClienteService.deleteRequest<ArticuloInsumoResponseDTO>(
      `${this.endpoint}/${idCompra}`
    );
  }
}

export const compraService = new CompraService();
