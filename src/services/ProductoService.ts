import { apiClienteService } from "./ApiClienteService";
import ImageService from "./ImageService";
import type { ArticuloManufacturadoRequestDTO } from "../types/productos/ArticuloManufacturadoRequestDTO";
import type { ArticuloManufacturadoResponseDTO } from "../types/productos/ArticuloManufacturadoResponseDTO";

/**
 * Servicio para operaciones CRUD de productos manufacturados.
 */
export class ProductoService {
  private readonly endpoint = "/articulos-manufacturados";

  async getAll(): Promise<ArticuloManufacturadoResponseDTO[]> {
    try {
      return await apiClienteService.get<ArticuloManufacturadoResponseDTO[]>(
        this.endpoint
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getById(id: number): Promise<ArticuloManufacturadoResponseDTO> {
    try {
      return await apiClienteService.get<ArticuloManufacturadoResponseDTO>(
        `${this.endpoint}/${id}`
      );
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async bajaLogica(id: number): Promise<void> {
    try {
      await apiClienteService.deleteRequest<void>(`${this.endpoint}/${id}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== MÉTODOS DE BÚSQUEDA ====================

  async getByCategoria(
    idCategoria: number
  ): Promise<ArticuloManufacturadoResponseDTO[]> {
    try {
      return await apiClienteService.get<ArticuloManufacturadoResponseDTO[]>(
        `${this.endpoint}/categoria/${idCategoria}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async searchByDenominacion(
    denominacion: string
  ): Promise<ArticuloManufacturadoResponseDTO[]> {
    try {
      return await apiClienteService.get<ArticuloManufacturadoResponseDTO[]>(
        `${this.endpoint}/buscar?denominacion=${denominacion}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== MÉTODOS DE IMÁGENES (usando ImageService) ====================

  /**
   * Sube una o más imágenes para un producto específico.
   */
  async uploadImagenes(idProducto: number, files: File[]): Promise<any[]> {
    const uploadPromises = files.map((file) =>
      ImageService.uploadImage(file, "manufacturados", idProducto)
    );
    return Promise.all(uploadPromises);
  }

  /**
   * ✅ Actualiza imagen de un producto (elimina anterior + sube nueva)
   * Utiliza el ImageService centralizado
   */
  async updateImagen(
    idProducto: number,
    file: File,
    denominacion: string = "Imagen del producto"
  ): Promise<any> {
    return ImageService.updateImage(
      file,
      idProducto,
      "manufacturados",
      denominacion
    );
  }

  /**
   * Elimina una imagen por su ID.
   */
  async deleteImagen(idImagen: number): Promise<boolean> {
    return ImageService.deleteImage(idImagen);
  }

  /**
   * Obtiene todas las imágenes de un producto.
   */
  async getImagenes(idProducto: number): Promise<any[]> {
    return ImageService.getImagesByEntity("manufacturados", idProducto);
  }

  /**
   * Manejo centralizado de errores.
   */
  private handleError(error: any): Error {
    return error instanceof Error
      ? error
      : new Error("Error en el servicio de productos.");
  }
}

export const productoService = new ProductoService();
