import { apiClienteService } from "./ApiClienteService";
import type { ArticuloInsumoRequestDTO } from "../types/insumos/ArticuloInsumoRequestDTO";
import type { ArticuloInsumoResponseDTO } from "../types/insumos/ArticuloInsumoResponseDTO";

export interface CompraInsumoDTO {
  idArticulo: number;
  cantidad: number;
  precioCompra: number;
}

/**
 * Servicio para operaciones CRUD de insumos
 * Usa apiClienteService que maneja automáticamente los tokens de Auth0
 */
export class InsumoService {
  private readonly endpoint = "/articulos-insumo";

  async getAll(): Promise<ArticuloInsumoResponseDTO[]> {
    try {
      return await apiClienteService.get<ArticuloInsumoResponseDTO[]>(
        this.endpoint
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getById(id: number): Promise<ArticuloInsumoResponseDTO> {
    try {
      return await apiClienteService.get<ArticuloInsumoResponseDTO>(
        `${this.endpoint}/${id}`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async create(
    data: ArticuloInsumoRequestDTO
  ): Promise<ArticuloInsumoResponseDTO> {
    try {
      return await apiClienteService.post<ArticuloInsumoResponseDTO>(
        this.endpoint,
        data
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async update(
    id: number,
    data: ArticuloInsumoRequestDTO
  ): Promise<ArticuloInsumoResponseDTO> {
    try {
      return await apiClienteService.put<ArticuloInsumoResponseDTO>(
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

  // ==================== NUEVOS MÉTODOS PARA MANEJO DE IMÁGENES ====================

  /**
   * ✅ Sube imagen para un insumo específico
   */
  async uploadImagen(
    id: number,
    file: File,
    denominacion: string = 'Imagen del producto'
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('denominacion', denominacion);

      const response = await fetch(`http://localhost:8080/api${this.endpoint}/${id}/imagen`, {
        method: 'POST',
        body: formData,
        headers: {
          // No incluir Content-Type para FormData, el browser lo maneja automáticamente
          // Aquí deberías incluir el token de Auth0 si es necesario
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir imagen');
      }

      return await response.json();
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * ✅ Actualiza imagen de un insumo (elimina anterior + sube nueva)
   */
  async updateImagen(
    id: number,
    file: File,
    denominacion: string = 'Imagen del producto'
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('denominacion', denominacion);

      const response = await fetch(`http://localhost:8080/api${this.endpoint}/${id}/imagen`, {
        method: 'PUT',
        body: formData,
        headers: {
          // Aquí deberías incluir el token de Auth0 si es necesario
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar imagen');
      }

      return await response.json();
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * ✅ Elimina todas las imágenes de un insumo
   */
  async deleteImagenes(id: number): Promise<any> {
    try {
      const response = await fetch(`http://localhost:8080/api${this.endpoint}/${id}/imagenes`, {
        method: 'DELETE',
        headers: {
          // Aquí deberías incluir el token de Auth0 si es necesario
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar imágenes');
      }

      return await response.json();
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * ✅ Obtiene todas las imágenes de un insumo
   */
  async getImagenes(id: number): Promise<any[]> {
    try {
      const response = await fetch(`http://localhost:8080/api${this.endpoint}/${id}/imagenes`);

      if (!response.ok) {
        throw new Error('Error al obtener imágenes');
      }

      return await response.json();
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ==================== MÉTODOS ESPECÍFICOS EXISTENTES ====================

  async getInsumosParaElaborar(): Promise<ArticuloInsumoResponseDTO[]> {
    try {
      return await apiClienteService.get<ArticuloInsumoResponseDTO[]>(
        `${this.endpoint}/para-elaborar`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getInsumosStockBajo(): Promise<ArticuloInsumoResponseDTO[]> {
    try {
      return await apiClienteService.get<ArticuloInsumoResponseDTO[]>(
        `${this.endpoint}/stock-bajo`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getInsumosStockCritico(): Promise<ArticuloInsumoResponseDTO[]> {
    try {
      return await apiClienteService.get<ArticuloInsumoResponseDTO[]>(
        `${this.endpoint}/stock-critico`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async registrarCompra(
    data: CompraInsumoDTO
  ): Promise<ArticuloInsumoResponseDTO> {
    try {
      return await apiClienteService.post<ArticuloInsumoResponseDTO>(
        `${this.endpoint}/compra`,
        data
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getByCategoria(
    idCategoria: number
  ): Promise<ArticuloInsumoResponseDTO[]> {
    try {
      return await apiClienteService.get<ArticuloInsumoResponseDTO[]>(
        `${this.endpoint}/categoria/${idCategoria}`
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
      : new Error("Error en el servicio de insumos");
  }
}

export const insumoService = new InsumoService();