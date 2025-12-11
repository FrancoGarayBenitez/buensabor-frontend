import { apiClienteService } from "./ApiClienteService";
import type { ArticuloInsumoRequestDTO } from "../types/insumos/ArticuloInsumoRequestDTO";
import type { ArticuloInsumoResponseDTO } from "../types/insumos/ArticuloInsumoResponseDTO";

/**
 * ✅ Servicio para operaciones CRUD de insumos
 */
export class InsumoService {
  private readonly endpoint = "/articulos-insumo";

  // ==================== CRUD ====================

  async getAll(): Promise<ArticuloInsumoResponseDTO[]> {
    return apiClienteService.get<ArticuloInsumoResponseDTO[]>(this.endpoint);
  }

  async getById(id: number): Promise<ArticuloInsumoResponseDTO> {
    return apiClienteService.get<ArticuloInsumoResponseDTO>(
      `${this.endpoint}/${id}`
    );
  }

  async create(
    data: ArticuloInsumoRequestDTO
  ): Promise<ArticuloInsumoResponseDTO> {
    return apiClienteService.post<ArticuloInsumoResponseDTO>(
      this.endpoint,
      data
    );
  }

  async update(
    id: number,
    data: ArticuloInsumoRequestDTO
  ): Promise<ArticuloInsumoResponseDTO> {
    return apiClienteService.put<ArticuloInsumoResponseDTO>(
      `${this.endpoint}/${id}`,
      data
    );
  }

  async delete(id: number): Promise<void> {
    console.log(`🗑️ Eliminando insumo ${id}`);
    const result = await apiClienteService.deleteRequest<void>(
      `${this.endpoint}/${id}`
    );
    console.log(`✅ Respuesta del delete:`, result);
    return result;
  }

  // ==================== BÚSQUEDAS POR FILTRO ====================

  async getByCategoria(
    idCategoria: number
  ): Promise<ArticuloInsumoResponseDTO[]> {
    return apiClienteService.get<ArticuloInsumoResponseDTO[]>(
      `${this.endpoint}/categoria/${idCategoria}`
    );
  }

  async getByUnidadMedida(
    idUnidadMedida: number
  ): Promise<ArticuloInsumoResponseDTO[]> {
    return apiClienteService.get<ArticuloInsumoResponseDTO[]>(
      `${this.endpoint}/unidad-medida/${idUnidadMedida}`
    );
  }

  async searchByDenominacion(
    denominacion: string
  ): Promise<ArticuloInsumoResponseDTO[]> {
    return apiClienteService.get<ArticuloInsumoResponseDTO[]>(
      `${this.endpoint}/buscar?denominacion=${encodeURIComponent(denominacion)}`
    );
  }

  // ==================== BÚSQUEDAS POR TIPO ====================

  async getParaElaborar(): Promise<ArticuloInsumoResponseDTO[]> {
    return apiClienteService.get<ArticuloInsumoResponseDTO[]>(
      `${this.endpoint}/tipo/para-elaborar`
    );
  }

  async getNoParaElaborar(): Promise<ArticuloInsumoResponseDTO[]> {
    return apiClienteService.get<ArticuloInsumoResponseDTO[]>(
      `${this.endpoint}/tipo/no-para-elaborar`
    );
  }

  // ==================== BÚSQUEDAS POR ESTADO DE STOCK ====================

  async getByCriticoStock(): Promise<ArticuloInsumoResponseDTO[]> {
    return apiClienteService.get<ArticuloInsumoResponseDTO[]>(
      `${this.endpoint}/stock/critico`
    );
  }

  async getByBajoStock(): Promise<ArticuloInsumoResponseDTO[]> {
    return apiClienteService.get<ArticuloInsumoResponseDTO[]>(
      `${this.endpoint}/stock/bajo`
    );
  }

  async getByAltoStock(): Promise<ArticuloInsumoResponseDTO[]> {
    return apiClienteService.get<ArticuloInsumoResponseDTO[]>(
      `${this.endpoint}/stock/alto`
    );
  }

  // ==================== BÚSQUEDAS POR PRECIO ====================

  async getByPrecioRange(
    precioMin: number,
    precioMax: number
  ): Promise<ArticuloInsumoResponseDTO[]> {
    return apiClienteService.get<ArticuloInsumoResponseDTO[]>(
      `${this.endpoint}/precio?precioMin=${precioMin}&precioMax=${precioMax}`
    );
  }

  // ==================== VALIDACIONES ====================

  async existsByDenominacion(denominacion: string): Promise<boolean> {
    return apiClienteService.get<boolean>(
      `${this.endpoint}/exists?denominacion=${encodeURIComponent(denominacion)}`
    );
  }

  async estaEnUso(idInsumo: number): Promise<boolean> {
    return apiClienteService.get<boolean>(
      `${this.endpoint}/${idInsumo}/en-uso`
    );
  }

  async tieneStockDisponible(
    idInsumo: number,
    cantidad: number
  ): Promise<boolean> {
    return apiClienteService.get<boolean>(
      `${this.endpoint}/${idInsumo}/stock-disponible?cantidad=${cantidad}`
    );
  }

  async countProductosQueLoUsan(idInsumo: number): Promise<number> {
    return apiClienteService.get<number>(
      `${this.endpoint}/${idInsumo}/productos-que-lo-usan`
    );
  }

  // ==================== INFORMACIÓN ====================

  async getInformacionStock(idInsumo: number): Promise<Record<string, any>> {
    return apiClienteService.get<Record<string, any>>(
      `${this.endpoint}/${idInsumo}/informacion-stock`
    );
  }
}

export const insumoService = new InsumoService();
