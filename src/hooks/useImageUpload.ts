import { useState } from "react";
import ImageService, { type ImageUploadResult } from "../services/ImageService";
import type { EntityType, ImagenDTO } from "../types/common/ImagenDTO";

interface UseImageUploadReturn {
  uploading: boolean;
  progress: number;
  uploadImage: (
    file: File,
    entityType: EntityType,
    denominacion?: string
  ) => Promise<ImageUploadResult>;
  deleteImage: (idImagen: number) => Promise<boolean>;
  getImagesByEntity: (
    entityType: EntityType,
    entityId: number
  ) => Promise<ImagenDTO[]>;
}

/**
 * ✅ Hook unificado para manejo de imágenes en CREACIÓN y EDICIÓN
 */
export const useImageUpload = (): UseImageUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * ✅ Sube imagen sin asociación inmediata
   *
   * La asociación ocurre al guardar el formulario completo.
   * Funciona para CREACIÓN y EDICIÓN.
   *
   * @param file Archivo a subir
   * @param entityType Tipo de entidad (INSUMO, MANUFACTURADO, PROMOCION)
   * @param entityId IGNORADO (nunca se usa)
   * @param denominacion Nombre de la imagen
   */
  const uploadImage = async (
    file: File,
    entityType: EntityType,
    denominacion?: string
  ): Promise<ImageUploadResult> => {
    setUploading(true);
    setProgress(0);

    try {
      // Simular progreso mientras se sube
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? prev : prev + 10));
      }, 100);

      // ✅ CORRECCIÓN: NUNCA pasar entityId
      const result = await ImageService.uploadImage(
        file,
        entityType,
        denominacion
      );

      clearInterval(progressInterval);
      setProgress(100);

      console.log(
        `✅ Imagen subida: ${denominacion} (URL: ${result.url}, idImagen: ${result.idImagen})`
      );

      return result;
    } catch (error) {
      console.error(
        "❌ Error en uploadImage:",
        error instanceof Error ? error.message : error
      );
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido al subir imagen",
      };
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  /**
   * ✅ Elimina imagen completamente (archivo + registro BD)
   *
   * Solo elimina en servidor si idImagen existe.
   */
  const deleteImage = async (idImagen: number): Promise<boolean> => {
    try {
      console.log(`🗑️ Eliminando imagen ${idImagen}...`);
      const result = await ImageService.deleteImage(idImagen);

      if (result) {
        console.log(`✅ Imagen ${idImagen} eliminada correctamente`);
      } else {
        console.warn(`⚠️ No se pudo eliminar imagen ${idImagen} en servidor`);
      }

      return result;
    } catch (error) {
      console.error(
        "❌ Error en deleteImage:",
        error instanceof Error ? error.message : error
      );
      return false;
    }
  };

  /**
   * ✅ Obtiene imágenes asociadas a una entidad
   */
  const getImagesByEntity = async (
    entityType: EntityType,
    entityId: number
  ): Promise<ImagenDTO[]> => {
    try {
      console.log(`📸 Obteniendo imágenes de ${entityType}/${entityId}...`);
      const images = await ImageService.getImagesByEntity(entityType, entityId);
      console.log(`✅ Se obtuvieron ${images.length} imágenes`);
      return images;
    } catch (error) {
      console.error(
        "❌ Error en getImagesByEntity:",
        error instanceof Error ? error.message : error
      );
      return [];
    }
  };

  return {
    uploading,
    progress,
    uploadImage,
    deleteImage,
    getImagesByEntity,
  };
};
