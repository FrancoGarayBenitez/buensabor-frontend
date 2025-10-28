// src/components/common/ArticleImageUpload.tsx
// ✅ VERSIÓN SIMPLIFICADA - Sin forwardRef, más fácil de usar

import React, { useRef, useState, useEffect } from 'react';
import { useImageUpload } from '../../hooks/useImageUpload';
import type { ImagenDTO } from '../../types/common/ImagenDTO';

interface ArticleImageUploadProps {
  // Información del artículo
  idArticulo?: number; // undefined para creación, number para edición
  currentImage?: ImagenDTO | null;
  
  // Callbacks
  onImageChange: (imagen: ImagenDTO | null) => void;
  onImageUploaded?: (result: any) => void;
  onError?: (error: string) => void;
  
  // Configuración
  className?: string;
  placeholder?: string;
  maxSize?: number; // en MB
  required?: boolean;
  disabled?: boolean;
  
  // Modo de operación
  mode?: 'immediate' | 'deferred';
}

export const ArticleImageUpload: React.FC<ArticleImageUploadProps> = ({
  idArticulo,
  currentImage,
  onImageChange,
  onImageUploaded,
  onError,
  className = '',
  placeholder = 'Haz clic para seleccionar una imagen o arrastra aquí',
  maxSize = 5,
  required = false,
  disabled = false,
  mode = 'immediate' // ✅ Por defecto inmediato para simplicidad
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    uploadImageForArticulo, 
    updateImageForArticulo, 
    deleteImageCompletely, 
    isUploading, 
    uploadProgress 
  } = useImageUpload();

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
      // Validaciones básicas
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no válido. Solo se permiten: JPG, PNG, GIF, WEBP');
      }

      if (file.size > maxSize * 1024 * 1024) {
        throw new Error(`El archivo es demasiado grande. Máximo ${maxSize}MB`);
      }

      // Crear preview inmediato
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      if (mode === 'immediate' && idArticulo) {
        // ✅ Modo inmediato: subir archivo inmediatamente
        await uploadImageToServer(file, idArticulo);
      } else if (mode === 'immediate' && !idArticulo) {
        // Crear imagen temporal para preview
        const tempImage: ImagenDTO = {
          idImagen: undefined,
          denominacion: file.name,
          url: URL.createObjectURL(file)
        };
        onImageChange(tempImage);
        
        // Mostrar advertencia
        setError('⚠️ La imagen se subirá cuando se guarde el artículo');
      } else {
        // Modo diferido
        const tempImage: ImagenDTO = {
          idImagen: undefined,
          denominacion: file.name,
          url: URL.createObjectURL(file)
        };
        onImageChange(tempImage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado al procesar la imagen';
      setError(errorMessage);
      onError?.(errorMessage);
      setPreviewUrl(currentImage?.url || null);
    }
  };

  const uploadImageToServer = async (file: File, articuloId: number) => {
    try {
      let result;
      
      if (currentImage?.idImagen) {
        // Actualizar imagen existente
        result = await updateImageForArticulo(file, articuloId, file.name);
      } else {
        // Subir nueva imagen
        result = await uploadImageForArticulo(file, articuloId, file.name);
      }

      if (result.success && result.url) {
        const newImage: ImagenDTO = {
          idImagen: result.idImagen,
          denominacion: result.denominacion || file.name,
          url: result.url
        };
        onImageChange(newImage);
        onImageUploaded?.(result);
        setError(null);
      } else {
        const errorMessage = result.error || 'Error al subir la imagen';
        setError(errorMessage);
        onError?.(errorMessage);
        setPreviewUrl(currentImage?.url || null);
      }
    } catch (err) {
      const errorMessage = 'Error al comunicarse con el servidor';
      setError(errorMessage);
      onError?.(errorMessage);
      setPreviewUrl(currentImage?.url || null);
    }
  };

  const handleRemoveImage = async () => {
    if (disabled) return;
    
    if (mode === 'immediate' && currentImage?.idImagen) {
      // Eliminar del servidor si es modo inmediato
      try {
        await deleteImageCompletely(currentImage.idImagen);
      } catch (err) {
        console.error('Error eliminando imagen del servidor:', err);
      }
    }
    
    // Limpiar estado local
    onImageChange(null);
    setPreviewUrl(null);
    setError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ✅ MÉTODO PÚBLICO para subir imagen desde el formulario padre
  const uploadForArticulo = async (articuloId: number): Promise<boolean> => {
    if (!currentImage || !currentImage.url?.startsWith('blob:')) {
      return true; // No hay imagen pendiente
    }
    
    try {
      // Convertir blob URL a File
      const response = await fetch(currentImage.url);
      const blob = await response.blob();
      const file = new File([blob], currentImage.denominacion, { type: blob.type });
      
      await uploadImageToServer(file, articuloId);
      return true;
    } catch (err) {
      const errorMessage = 'Error al subir la imagen al servidor';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    }
  };

  // ✅ Exponer método a través de una prop callback
  useEffect(() => {
    if (idArticulo && currentImage?.url?.startsWith('blob:')) {
      // Si tenemos ID de artículo y hay imagen temporal, subirla automáticamente
      uploadForArticulo(idArticulo);
    }
  }, [idArticulo]);

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
              {currentImage?.url?.startsWith('blob:') && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                  Pendiente
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
        <div className={`p-3 border rounded-md ${
          error.startsWith('⚠️') 
            ? 'bg-yellow-50 border-yellow-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-sm ${
            error.startsWith('⚠️') 
              ? 'text-yellow-600' 
              : 'text-red-600'
          }`}>
            {error}
          </p>
        </div>
      )}

      {/* Información de la imagen actual */}
      {currentImage && !isUploading && (
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Nombre:</strong> {currentImage.denominacion}</p>
          <p><strong>Estado:</strong> {
            currentImage.url?.startsWith('blob:') 
              ? '🟡 Pendiente de subir' 
              : currentImage.idImagen 
                ? '🟢 Guardado en servidor' 
                : '🔵 Listo para subir'
          }</p>
        </div>
      )}
    </div>
  );
};