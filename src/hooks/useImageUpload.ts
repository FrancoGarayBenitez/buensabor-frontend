// src/hooks/useImageUpload.ts
import { useState } from 'react';
import { ImageService } from '../services/ImageService';

interface ImageUploadResult {
  success: boolean;
  idImagen?: number;
  filename?: string;
  url?: string;
  originalName?: string;
  denominacion?: string;
  size?: number;
  contentType?: string;
  error?: string;
  message?: string;
}

interface UseImageUploadReturn {
  // Métodos legacy (solo archivos)
  uploadImage: (file: File) => Promise<ImageUploadResult>;
  deleteImage: (filename: string) => Promise<boolean>;
  validateImage: (filename: string) => Promise<boolean>;
  
  // Nuevos métodos integrados (archivo + BD)
  uploadImageForArticulo: (file: File, idArticulo: number, denominacion?: string) => Promise<ImageUploadResult>;
  updateImageForArticulo: (file: File, idArticulo: number, denominacion?: string) => Promise<ImageUploadResult>;
  deleteImageCompletely: (idImagen: number) => Promise<boolean>;
  getImagesByArticulo: (idArticulo: number) => Promise<any[]>;
  
  // Estados
  isUploading: boolean;
  uploadProgress: number;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ==================== MÉTODOS LEGACY (SOLO ARCHIVOS) ====================

  const uploadImage = async (file: File): Promise<ImageUploadResult> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const result = await ImageService.uploadImage(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      return result;
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al subir la imagen'
      };
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const deleteImage = async (filename: string): Promise<boolean> => {
    try {
      return await ImageService.deleteImage(filename);
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  };

  const validateImage = async (filename: string): Promise<boolean> => {
    try {
      const result = await ImageService.validateImage(filename);
      return result.exists;
    } catch (error) {
      console.error('Error validating image:', error);
      return false;
    }
  };

  // ==================== NUEVOS MÉTODOS INTEGRADOS (ARCHIVO + BD) ====================

  const uploadImageForArticulo = async (
    file: File, 
    idArticulo: number, 
    denominacion: string = 'Imagen del producto'
  ): Promise<ImageUploadResult> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const result = await ImageService.uploadImageForArticulo(file, idArticulo, denominacion);

      clearInterval(progressInterval);
      setUploadProgress(100);

      return result;
    } catch (error) {
      console.error('Error uploading image for articulo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al subir la imagen'
      };
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const updateImageForArticulo = async (
    file: File, 
    idArticulo: number, 
    denominacion: string = 'Imagen del producto'
  ): Promise<ImageUploadResult> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const result = await ImageService.updateImageForArticulo(file, idArticulo, denominacion);

      clearInterval(progressInterval);
      setUploadProgress(100);

      return result;
    } catch (error) {
      console.error('Error updating image for articulo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al actualizar la imagen'
      };
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const deleteImageCompletely = async (idImagen: number): Promise<boolean> => {
    try {
      return await ImageService.deleteImageCompletely(idImagen);
    } catch (error) {
      console.error('Error deleting image completely:', error);
      return false;
    }
  };

  const getImagesByArticulo = async (idArticulo: number): Promise<any[]> => {
    try {
      return await ImageService.getImagesByArticulo(idArticulo);
    } catch (error) {
      console.error('Error getting images by articulo:', error);
      return [];
    }
  };

  return {
    // Métodos legacy
    uploadImage,
    deleteImage,
    validateImage,
    
    // Nuevos métodos integrados
    uploadImageForArticulo,
    updateImageForArticulo,
    deleteImageCompletely,
    getImagesByArticulo,
    
    // Estados
    isUploading,
    uploadProgress
  };
};