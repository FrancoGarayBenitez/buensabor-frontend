import { useState } from "react";
import ImageService, { type ImageUploadResult } from "../services/ImageService";

interface UseImageUploadReturn {
  uploading: boolean;
  progress: number;
  uploadImage: (
    file: File,
    entityType: string,
    entityId?: number,
    denominacion?: string
  ) => Promise<ImageUploadResult>;
  updateImage: (
    file: File,
    idImagen: number,
    entityType: string,
    denominacion?: string
  ) => Promise<ImageUploadResult>;
  deleteImage: (idImagen: number) => Promise<boolean>;
  getImagesByEntity: (entityType: string, entityId: number) => Promise<any[]>;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (
    file: File,
    entityType: string,
    entityId?: number,
    denominacion?: string
  ): Promise<ImageUploadResult> => {
    setUploading(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? prev : prev + 10));
      }, 100);

      const result = await ImageService.uploadImage(
        file,
        entityType,
        entityId,
        denominacion
      );

      clearInterval(progressInterval);
      setProgress(100);
      return result;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const updateImage = async (
    file: File,
    idImagen: number,
    entityType: string,
    denominacion?: string
  ): Promise<ImageUploadResult> => {
    setUploading(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? prev : prev + 10));
      }, 100);

      const result = await ImageService.updateImage(
        file,
        idImagen,
        entityType,
        denominacion
      );

      clearInterval(progressInterval);
      setProgress(100);
      return result;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const deleteImage = async (idImagen: number): Promise<boolean> => {
    return ImageService.deleteImage(idImagen);
  };

  const getImagesByEntity = async (
    entityType: string,
    entityId: number
  ): Promise<any[]> => {
    return ImageService.getImagesByEntity(entityType, entityId);
  };

  return {
    uploading,
    progress,
    uploadImage,
    updateImage,
    deleteImage,
    getImagesByEntity,
  };
};
