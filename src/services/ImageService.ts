import { IMAGE_CONFIG, validateImageFile } from "../config/imageConfig";
import { apiClienteService } from "./ApiClienteService";
import AuthPasswordService from "./AuthPasswordService";

export interface ImageUploadResult {
  success: boolean;
  idImagen?: number;
  url?: string;
  denominacion?: string;
  error?: string;
}

/**
 * Servicio centralizado para manejar imágenes
 * Usa ApiClienteService para headers y autenticación
 */
const ImageService = {
  /**
   * ✅ Sube imagen asociada a una entidad (archivo + BD)
   * Funciona para: INSUMO, MANUFACTURADO, CLIENTE, PROMOCION
   *
   * POST /api/imagenes/upload/{entityType}
   * POST /api/imagenes/upload/{entityType}/{entityId}
   */
  uploadImage: async (
    file: File,
    entityType: string,
    entityId?: number,
    denominacion: string = file.name.split(".")[0]
  ): Promise<ImageUploadResult> => {
    try {
      // Validar archivo ANTES de enviar
      const validationError = validateImageFile(file);
      if (validationError) {
        console.warn(`⚠️ Validación fallida:`, validationError);
        return { success: false, error: validationError };
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("denominacion", denominacion);

      const endpoint = entityId
        ? `/imagenes/upload/${entityType}/${entityId}`
        : `/imagenes/upload/${entityType}`;

      console.log(
        `📤 Subiendo imagen: ${entityType}${
          entityId ? ` (ID: ${entityId})` : ""
        }`
      );

      // Usar fetch directamente con headers de ApiClienteService
      const token = AuthPasswordService.getToken();
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log("🔐 Token agregado a upload");
      }

      const response = await fetch(`${apiClienteService.baseURL}${endpoint}`, {
        method: "POST",
        headers, // NO incluir Content-Type (FormData lo agrega automáticamente)
        body: formData,
      });

      console.log(`📨 Respuesta upload: ${response.status}`);

      if (!response.ok) {
        try {
          const error = await response.json();
          const errorMsg = error.error || IMAGE_CONFIG.ERRORS.UPLOAD_FAILED;
          console.error(`❌ Error en upload:`, errorMsg);
          return { success: false, error: errorMsg };
        } catch {
          console.error(`❌ Error desconocido en upload`);
          return { success: false, error: IMAGE_CONFIG.ERRORS.UPLOAD_FAILED };
        }
      }

      const result = await response.json();
      console.log(`✅ Imagen subida:`, result);
      return result;
    } catch (error) {
      console.error("❌ Excepción en uploadImage:", error);
      return {
        success: false,
        error: IMAGE_CONFIG.ERRORS.UNKNOWN_ERROR,
      };
    }
  },

  /**
   * ✅ Actualiza imagen (elimina anterior + sube nueva)
   *
   * PUT /api/imagenes/{idImagen}
   */
  updateImage: async (
    file: File,
    idImagen: number,
    entityType: string,
    denominacion: string = file.name.split(".")[0]
  ): Promise<ImageUploadResult> => {
    try {
      const validationError = validateImageFile(file);
      if (validationError) {
        console.warn(`⚠️ Validación fallida:`, validationError);
        return { success: false, error: validationError };
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("denominacion", denominacion);

      console.log(`🔄 Actualizando imagen: ${idImagen}`);

      const token = AuthPasswordService.getToken();
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${apiClienteService.baseURL}/imagenes/${idImagen}`,
        {
          method: "PUT",
          headers,
          body: formData,
        }
      );

      console.log(`📨 Respuesta update: ${response.status}`);

      if (!response.ok) {
        try {
          const error = await response.json();
          const errorMsg = error.error || IMAGE_CONFIG.ERRORS.UPLOAD_FAILED;
          console.error(`❌ Error en update:`, errorMsg);
          return { success: false, error: errorMsg };
        } catch {
          console.error(`❌ Error desconocido en update`);
          return { success: false, error: IMAGE_CONFIG.ERRORS.UPLOAD_FAILED };
        }
      }

      const result = await response.json();
      console.log(`✅ Imagen actualizada:`, result);
      return result;
    } catch (error) {
      console.error("❌ Excepción en updateImage:", error);
      return {
        success: false,
        error: IMAGE_CONFIG.ERRORS.UNKNOWN_ERROR,
      };
    }
  },

  /**
   * ✅ Elimina imagen completamente (archivo + BD)
   *
   * DELETE /api/imagenes/{idImagen}
   */
  deleteImage: async (idImagen: number): Promise<boolean> => {
    try {
      console.log(`🗑️ Eliminando imagen: ${idImagen}`);

      const token = AuthPasswordService.getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${apiClienteService.baseURL}/imagenes/${idImagen}`,
        {
          method: "DELETE",
          headers,
        }
      );

      console.log(`📨 Respuesta delete: ${response.status}`);

      if (!response.ok) {
        console.error(`❌ Error al eliminar imagen`);
        return false;
      }

      try {
        const result = await response.json();
        console.log(`✅ Imagen eliminada:`, result);
        return result.success ?? true;
      } catch {
        // Si no hay body en respuesta (204), asumir éxito
        console.log(`✅ Imagen eliminada (sin cuerpo de respuesta)`);
        return true;
      }
    } catch (error) {
      console.error("❌ Excepción en deleteImage:", error);
      return false;
    }
  },

  /**
   * ✅ Obtiene imágenes de una entidad
   *
   * GET /api/imagenes/{entityType}/{entityId}
   */
  getImagesByEntity: async (
    entityType: string,
    entityId: number
  ): Promise<any[]> => {
    try {
      console.log(`🔍 Obteniendo imágenes de ${entityType}/${entityId}`);

      const token = AuthPasswordService.getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${apiClienteService.baseURL}/imagenes/${entityType}/${entityId}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        console.warn(`⚠️ Error obteniendo imágenes: ${response.status}`);
        return [];
      }

      const result = await response.json();
      console.log(`✅ Imágenes obtenidas: ${result.length} encontradas`);
      return result;
    } catch (error) {
      console.error("❌ Excepción en getImagesByEntity:", error);
      return [];
    }
  },

  /**
   * ✅ Obtiene una imagen por ID
   *
   * GET /api/imagenes/{idImagen}
   */
  getImageById: async (idImagen: number): Promise<any | null> => {
    try {
      console.log(`🔍 Obteniendo imagen: ${idImagen}`);

      const token = AuthPasswordService.getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${apiClienteService.baseURL}/imagenes/${idImagen}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        console.warn(`⚠️ Imagen no encontrada: ${idImagen}`);
        return null;
      }

      const result = await response.json();
      console.log(`✅ Imagen obtenida:`, result);
      return result;
    } catch (error) {
      console.error("❌ Excepción en getImageById:", error);
      return null;
    }
  },
};

export default ImageService;
