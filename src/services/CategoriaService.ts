import type { CategoriaRequestDTO } from "../types/categorias/CategoriaRequestDTO";
import type { CategoriaResponseDTO } from "../types/categorias/CategoriaResponseDTO";
import { apiClienteService } from "./ApiClienteService";

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

  // ✅ NUEVOS: Métodos específicos por tipo
  async getCategoriasComidas(): Promise<CategoriaResponseDTO[]> {
    try {
      return await apiClienteService.get<CategoriaResponseDTO[]>(
        `${this.endpoint}/tipo/comidas`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getCategoriasIngredientes(): Promise<CategoriaResponseDTO[]> {
    try {
      return await apiClienteService.get<CategoriaResponseDTO[]>(
        `${this.endpoint}/tipo/ingredientes`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getCategoriasByTipo(tipo: boolean): Promise<CategoriaResponseDTO[]> {
    try {
      return await apiClienteService.get<CategoriaResponseDTO[]>(
        `${this.endpoint}/tipo/${tipo}`
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

  async getSubcategoriasById(idPadre: number): Promise<CategoriaResponseDTO[]> {
    try {
      return await apiClienteService.get<CategoriaResponseDTO[]>(
        `${this.endpoint}/${idPadre}/subcategorias`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Obtener subcategorías filtradas por tipo
  async getSubcategoriasByIdAndTipo(
    idPadre: number,
    tipo: boolean
  ): Promise<CategoriaResponseDTO[]> {
    try {
      return await apiClienteService.get<CategoriaResponseDTO[]>(
        `${this.endpoint}/${idPadre}/subcategorias/tipo/${tipo}`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async searchByDenominacion(
    denominacion: string
  ): Promise<CategoriaResponseDTO[]> {
    try {
      return await apiClienteService.get<CategoriaResponseDTO[]>(
        `${this.endpoint}/buscar?denominacion=${encodeURIComponent(
          denominacion
        )}`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ✅ NUEVO: Buscar por denominación y tipo
  async searchByDenominacionAndTipo(
    denominacion: string,
    esParaIngredientes: boolean
  ): Promise<CategoriaResponseDTO[]> {
    try {
      return await apiClienteService.get<CategoriaResponseDTO[]>(
        `${this.endpoint}/buscar/tipo?denominacion=${encodeURIComponent(
          denominacion
        )}&esParaIngredientes=${esParaIngredientes}`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async existsByDenominacion(denominacion: string): Promise<boolean> {
    try {
      return await apiClienteService.get<boolean>(
        `${this.endpoint}/exists?denominacion=${encodeURIComponent(
          denominacion
        )}`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async hasSubcategorias(id: number): Promise<boolean> {
    try {
      return await apiClienteService.get<boolean>(
        `${this.endpoint}/${id}/has-subcategorias`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async hasArticulos(id: number): Promise<boolean> {
    try {
      return await apiClienteService.get<boolean>(
        `${this.endpoint}/${id}/has-articulos`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    return error instanceof Error
      ? error
      : new Error("Error en el servicio de categorías");
  }
}
