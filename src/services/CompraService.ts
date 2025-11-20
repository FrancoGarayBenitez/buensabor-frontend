import { apiClienteService } from "./ApiClienteService";
import type { CompraInsumoRequestDTO } from "../types/insumos/CompraInsumoRequestDTO";
import type { ArticuloInsumoResponseDTO } from "../types/insumos/ArticuloInsumoResponseDTO";

class CompraService {
  private basePath = "/compras-insumo";

  async registrarCompra(
    compra: CompraInsumoRequestDTO
  ): Promise<ArticuloInsumoResponseDTO> {
    return await apiClienteService.post<ArticuloInsumoResponseDTO>(
      this.basePath,
      compra
    );
  }

  async listarCompras(): Promise<any[]> {
    return await apiClienteService.get(this.basePath);
  }

  async obtenerPorInsumo(idArticulo: number): Promise<any[]> {
    return await apiClienteService.get(`${this.basePath}/insumo/${idArticulo}`);
  }
}

export const compraService = new CompraService();
