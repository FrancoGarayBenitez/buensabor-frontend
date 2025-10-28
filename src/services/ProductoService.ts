import { apiClienteService } from "./ApiClienteService";
import type { ArticuloManufacturadoRequestDTO } from "../types/productos/ArticuloManufacturadoRequestDTO";
import type { ArticuloManufacturadoResponseDTO } from "../types/productos/ArticuloManufacturadoResponseDTO";

/**
 * Servicio para operaciones CRUD de productos manufacturados
 * Usa apiClienteService que maneja automáticamente los tokens de Auth0
 */
export class ProductoService {
  private readonly endpoint = "/articulos-manufacturados";

  async getAll(): Promise<ArticuloManufacturadoResponseDTO[]> {
    try {
      return await apiClienteService.get<ArticuloManufacturadoResponseDTO[]>(
        this.endpoint
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getById(id: number): Promise<ArticuloManufacturadoResponseDTO> {
    try {
      return await apiClienteService.get<ArticuloManufacturadoResponseDTO>(
        `${this.endpoint}/${id}`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async create(
    data: ArticuloManufacturadoRequestDTO
  ): Promise<ArticuloManufacturadoResponseDTO> {
    try {
      return await apiClienteService.post<ArticuloManufacturadoResponseDTO>(
        this.endpoint,
        data
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }
  
  async desactivar(id: number): Promise<ArticuloManufacturadoResponseDTO> {
    try {
      return await apiClienteService.deleteRequest<ArticuloManufacturadoResponseDTO>(
        `${this.endpoint}/${id}/desactivar`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

   async activar(id: number): Promise<ArticuloManufacturadoResponseDTO> {
    try {
      return await apiClienteService.put<ArticuloManufacturadoResponseDTO>(
        `${this.endpoint}/${id}/activar`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async update(
    id: number,
    data: ArticuloManufacturadoRequestDTO
  ): Promise<ArticuloManufacturadoResponseDTO> {
    try {
      return await apiClienteService.put<ArticuloManufacturadoResponseDTO>(
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
   * ✅ Sube imagen para un producto manufacturado específico
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
   * ✅ Actualiza imagen de un producto manufacturado (elimina anterior + sube nueva)
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
   * ✅ Elimina todas las imágenes de un producto manufacturado
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
   * ✅ Obtiene todas las imágenes de un producto manufacturado
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

  async getByCategoria(
    idCategoria: number
  ): Promise<ArticuloManufacturadoResponseDTO[]> {
    try {
      return await apiClienteService.get<ArticuloManufacturadoResponseDTO[]>(
        `${this.endpoint}/categoria/${idCategoria}`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getProductosDisponibles(): Promise<ArticuloManufacturadoResponseDTO[]> {
    try {
      return await apiClienteService.get<ArticuloManufacturadoResponseDTO[]>(
        `${this.endpoint}/disponibles`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async calcularCosto(
    id: number
  ): Promise<{ costoTotal: number; margenGanancia: number }> {
    try {
      return await apiClienteService.get<{
        costoTotal: number;
        margenGanancia: number;
      }>(`${this.endpoint}/${id}/costo`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async verificarStock(
    id: number
  ): Promise<{ stockSuficiente: boolean; cantidadMaximaPreparable: number }> {
    try {
      return await apiClienteService.get<{
        stockSuficiente: boolean;
        cantidadMaximaPreparable: number;
      }>(`${this.endpoint}/${id}/stock`);
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
      : new Error("Error en el servicio de productos");
  }
}