import type { CategoriaRequestDTO } from "../types/categorias/CategoriaRequestDTO";
import type { CategoriaResponseDTO } from "../types/categorias/CategoriaResponseDTO";
import { apiClienteService } from "./ApiClienteService";

/**
 * Servicio para operaciones CRUD de categorías
 * Usa apiClienteService que maneja automáticamente los tokens de Auth0
 */
export class CategoriaService {
  private readonly endpoint = "/categorias";

  async getAll(): Promise<CategoriaResponseDTO[]> {
    try {
      return await apiClienteService.get<CategoriaResponseDTO[]>(this.endpoint);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getById(id: number): Promise<CategoriaResponseDTO> {
    try {
      return await apiClienteService.get<CategoriaResponseDTO>(
        `${this.endpoint}/${id}`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async create(data: CategoriaRequestDTO): Promise<CategoriaResponseDTO> {
    try {
      return await apiClienteService.post<CategoriaResponseDTO>(
        this.endpoint,
        data
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async update(
    id: number,
    data: CategoriaRequestDTO
  ): Promise<CategoriaResponseDTO> {
    try {
      return await apiClienteService.put<CategoriaResponseDTO>(
        `${this.endpoint}/${id}`,
        data
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClienteService.deleteRequest<void>(`${this.endpoint}/${id}`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Métodos específicos para categorías
  async getCategoriasIngredientes(): Promise<CategoriaResponseDTO[]> {
    try {
      return await apiClienteService.get<CategoriaResponseDTO[]>(
        `${this.endpoint}/ingredientes`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getCategoriasProductos(): Promise<CategoriaResponseDTO[]> {
    try {
      return await apiClienteService.get<CategoriaResponseDTO[]>(
        `${this.endpoint}/productos`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getSubcategorias(
    idCategoriaPadre: number
  ): Promise<CategoriaResponseDTO[]> {
    try {
      return await apiClienteService.get<CategoriaResponseDTO[]>(
        `${this.endpoint}/${idCategoriaPadre}/subcategorias`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: any): Error {
    return error instanceof Error
      ? error
      : new Error("Error en el servicio de categorías");
  }
}
