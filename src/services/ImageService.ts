import { validateImageFile } from "../config/imageConfig";
import { apiClienteService } from "./ApiClienteService";
import type { ImagenDTO, EntityType } from "../types/common/ImagenDTO";

export interface ImageUploadResult {
  success: boolean;
  idImagen?: number | null;
  url?: string;
  denominacion?: string;
  error?: string;
}

/**
 * Servicio centralizado para manejar la subida, eliminación y obtención de imágenes.
 */
const ImageService = {
  /**
   * Sube un archivo de imagen al servidor sin asociarlo a una entidad.
   * Devuelve la URL pública del archivo subido.
   * POST /imagenes/upload/{entityType}
   */
  uploadImage: async (
    file: File,
    entityType: EntityType,
    denominacion: string = file.name.split(".")[0]
  ): Promise<ImageUploadResult> => {
    const validationError = validateImageFile(file);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("denominacion", denominacion);

    const endpoint = `/imagenes/upload/${entityType}`;

    try {
      return await apiClienteService.postFormData<ImageUploadResult>(
        endpoint,
        formData
      );
    } catch (error) {
      return {
        success: false,
        error:
          (error as Error).message || "Error desconocido al subir la imagen",
      };
    }
  },

  /**
   * Elimina una imagen completamente (registro en la base de datos y archivo físico).
   * DELETE /imagenes/{idImagen}
   */
  deleteImage: async (idImagen: number): Promise<boolean> => {
    try {
      await apiClienteService.deleteRequest(`/imagenes/${idImagen}`);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Elimina solo el archivo físico del servidor.
   * Se usa para limpiar archivos subidos que no fueron asociados a ninguna entidad (ej. al cancelar un formulario).
   * DELETE /imagenes/upload (con body)
   */
  deletePhysicalFile: async (filename: string): Promise<boolean> => {
    try {
      const endpoint = "/imagenes/upload";
      await apiClienteService.deleteRequest(endpoint, { filename });
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Obtiene todas las imágenes asociadas a una entidad específica.
   * GET /imagenes/by-entity/{entityType}/{entityId}
   */
  getImagesByEntity: async (
    entityType: EntityType,
    entityId: number
  ): Promise<ImagenDTO[]> => {
    try {
      const endpoint = `/imagenes/by-entity/${entityType}/${entityId}`;
      return await apiClienteService.get<ImagenDTO[]>(endpoint);
    } catch (error) {
      return [];
    }
  },

  /**
   * Obtiene los metadatos de una imagen por su ID.
   * GET /imagenes/{idImagen}
   */
  getImageById: async (idImagen: number): Promise<ImagenDTO | null> => {
    try {
      return await apiClienteService.get<ImagenDTO>(`/imagenes/${idImagen}`);
    } catch (error) {
      return null;
    }
  },
};

export default ImageService;
