import { apiClienteService } from "./ApiClienteService";
import type { ArticuloManufacturadoRequestDTO } from "../types/productos/ArticuloManufacturadoRequestDTO";
import type { ArticuloManufacturadoResponseDTO } from "../types/productos/ArticuloManufacturadoResponseDTO";

/**
 * Servicio para realizar operaciones CRUD y búsquedas en productos manufacturados.
 */
export class ProductoService {
  private readonly endpoint = "/articulos-manufacturados";

  // Helper para extraer el mensaje del backend
  private extractErrorMessage(err: unknown, fallback: string): string {
    const anyErr = err as any;
    return (
      anyErr?.response?.data?.message ||
      anyErr?.data?.message ||
      anyErr?.message ||
      fallback
    );
  }

  // ==================== CRUD ====================

  /**
   * Obtiene todos los productos manufacturados.
   */
  async getAll(): Promise<ArticuloManufacturadoResponseDTO[]> {
    return apiClienteService.get<ArticuloManufacturadoResponseDTO[]>(
      this.endpoint
    );
  }

  /**
   * Obtiene un producto manufacturado por su ID.
   * @param id - El ID del producto.
   */
  async getById(id: number): Promise<ArticuloManufacturadoResponseDTO> {
    return apiClienteService.get<ArticuloManufacturadoResponseDTO>(
      `${this.endpoint}/${id}`
    );
  }

  /**
   * Crea un nuevo producto manufacturado.
   * @param data - DTO con los datos del producto.
   */
  async create(
    data: ArticuloManufacturadoRequestDTO
  ): Promise<ArticuloManufacturadoResponseDTO> {
    try {
      return await apiClienteService.post<ArticuloManufacturadoResponseDTO>(
        this.endpoint,
        data
      );
    } catch (err) {
      const msg = this.extractErrorMessage(
        err,
        "No se pudo crear el producto. Verifique la denominación."
      );
      throw new Error(msg);
    }
  }

  /**
   * Actualiza un producto manufacturado existente.
   * @param id - El ID del producto a actualizar.
   * @param data - DTO con los nuevos datos del producto.
   */
  async update(
    id: number,
    data: ArticuloManufacturadoRequestDTO
  ): Promise<ArticuloManufacturadoResponseDTO> {
    try {
      return await apiClienteService.put<ArticuloManufacturadoResponseDTO>(
        `${this.endpoint}/${id}`,
        data
      );
    } catch (err) {
      const msg = this.extractErrorMessage(
        err,
        "No se pudo actualizar el producto. Verifique la denominación."
      );
      throw new Error(msg);
    }
  }

  /**
   * Realiza una baja lógica de un producto manufacturado.
   * @param id - El ID del producto a eliminar.
   */
  async delete(id: number): Promise<void> {
    return apiClienteService.deleteRequest<void>(`${this.endpoint}/${id}`);
  }

  // ✅ Activar/Desactivar (PATCH)
  async activate(id: number): Promise<void> {
    return apiClienteService.patch<void>(`${this.endpoint}/${id}/activate`);
  }

  async deactivate(id: number): Promise<void> {
    return apiClienteService.patch<void>(`${this.endpoint}/${id}/deactivate`);
  }

  // ==================== BÚSQUEDAS POR FILTRO ====================

  /**
   * Busca productos por su denominación.
   * @param denominacion - El término de búsqueda.
   */
  async searchByDenominacion(
    denominacion: string
  ): Promise<ArticuloManufacturadoResponseDTO[]> {
    return apiClienteService.get<ArticuloManufacturadoResponseDTO[]>(
      `${this.endpoint}/buscar?denominacion=${encodeURIComponent(denominacion)}`
    );
  }

  /**
   * Obtiene todos los productos que pertenecen a una categoría específica.
   * @param idCategoria - El ID de la categoría.
   */
  async getByCategoria(
    idCategoria: number
  ): Promise<ArticuloManufacturadoResponseDTO[]> {
    return apiClienteService.get<ArticuloManufacturadoResponseDTO[]>(
      `${this.endpoint}/categoria/${idCategoria}`
    );
  }
}

/**
 * Instancia única del servicio de productos.
 */
export const productoService = new ProductoService();
