// src/components/common/ImageUpload.tsx
import React, { useRef, useState, useEffect } from 'react';
import { useImageUpload } from '../../hooks/useImageUpload';
import type { ImagenDTO } from '../../types/common/ImagenDTO';

interface ImageUploadProps {
  currentImage?: ImagenDTO | null;
  onImageChange: (imagen: ImagenDTO | null) => void;
  className?: string;
  placeholder?: string;
  maxSize?: number; // en MB
  required?: boolean;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange,
  className = '',
  placeholder = 'Haz clic para seleccionar una imagen o arrastra aquí',
  maxSize = 5,
  required = false,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { uploadImage, deleteImage, isUploading, uploadProgress } = useImageUpload();

  // Establecer preview inicial si hay imagen actual
  useEffect(() => {
    if (currentImage?.url) {
      setPreviewUrl(currentImage.url);
    } else {
      setPreviewUrl(null);
    }
  }, [currentImage]);

  const handleFileSelect = async (file: File) => {
    if (disabled) return;
    
    setError(null);

    try {
      // Crear preview inmediato
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Subir archivo
      const result = await uploadImage(file);

      if (result.success && result.url && result.filename) {
        const newImage: ImagenDTO = {
          idImagen: undefined, // Se asignará cuando se guarde en BD
          denominacion: result.originalName || file.name,
          url: result.url
        };
        onImageChange(newImage);
      } else {
        setError(result.error || 'Error al subir la imagen');
        setPreviewUrl(currentImage?.url || null);
      }
    } catch (err) {
      setError('Error inesperado al procesar la imagen');
      setPreviewUrl(currentImage?.url || null);
    }
  };

  const handleRemoveImage = async () => {
    if (disabled) return;
    
    if (currentImage?.url) {
      // Extraer filename de la URL
      const filename = currentImage.url.split('/').pop();
      if (filename) {
        await deleteImage(filename);
      }
    }
    
    onImageChange(null);
    setPreviewUrl(null);
    setError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Área de carga */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ease-in-out
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}
          ${isDragOver && !disabled ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          required={required && !currentImage}
          disabled={disabled}
        />

        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="mx-auto max-h-48 rounded-lg shadow-md object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="text-white text-sm">Subiendo...</div>
                </div>
              )}
            </div>
            <div className="flex justify-center space-x-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUploading || disabled}
              >
                Cambiar imagen
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUploading || disabled}
              >
                Eliminar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl text-gray-400">📷</div>
            <div>
              <p className="text-gray-600">{disabled ? 'Carga de imagen deshabilitada' : placeholder}</p>
              <p className="text-sm text-gray-500 mt-2">
                Formatos soportados: JPG, PNG, GIF, WEBP (máx. {maxSize}MB)
              </p>
            </div>
          </div>
        )}

        {/* Barra de progreso */}
        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Subiendo... {uploadProgress}%</p>
          </div>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Información de la imagen actual */}
      {currentImage && !isUploading && (
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Nombre:</strong> {currentImage.denominacion}</p>
          <p><strong>URL:</strong> {currentImage.url}</p>
        </div>
      )}
    </div>
  );
};