import React, { useRef, useState, useEffect } from "react";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  IMAGE_CONFIG,
  validateImageFile,
  getMaxImagesErrorMessage,
} from "../../config/imageConfig";
import type { ImagenDTO, EntityType } from "../../types/common/ImagenDTO";
import { useImageUpload } from "../../hooks/useImageUpload";

interface ImageUploadProps {
  entityType: EntityType; // ✅ usar tipo union
  entityId?: number;
  currentImages?: ImagenDTO[] | null;
  onImagesChange: (imagenes: ImagenDTO[]) => void;
  onError?: (error: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  entityType,
  entityId,
  currentImages = [],
  onImagesChange,
  onError,
  label = "Cargar Imagen",
  required = false,
  disabled = false,
  multiple = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [images, setImages] = useState<ImagenDTO[]>(currentImages || []);
  const [error, setError] = useState<string | null>(null);

  // ✅ usar hook centralizado para progreso/llamadas
  const { uploading, progress, uploadImage, deleteImage } = useImageUpload();

  useEffect(() => {
    setImages(currentImages || []);
  }, [currentImages]);

  const canUpload = !disabled && !!entityId; // ✅ bloquear si no hay entityId

  const handleFileSelect = async (files: FileList) => {
    if (!canUpload) {
      const msg =
        "Primero guarda la entidad para obtener un ID y habilitar la subida.";
      setError(msg);
      onError?.(msg);
      return;
    }

    if (uploading) return;
    setError(null);

    if (!multiple && files.length > 1) {
      const msg = "Solo se puede cargar una imagen";
      setError(msg);
      onError?.(msg);
      return;
    }

    if (
      multiple &&
      images.length + files.length > IMAGE_CONFIG.MAX_IMAGES_PER_ENTITY
    ) {
      const msg = getMaxImagesErrorMessage();
      setError(msg);
      onError?.(msg);
      return;
    }

    const newImages: ImagenDTO[] = [...images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        onError?.(validationError);
        continue;
      }

      try {
        const result = await uploadImage(
          file,
          entityType,
          entityId!,
          file.name.split(".")[0]
        );

        if (result.success && result.url) {
          newImages.push({
            idImagen: result.idImagen,
            denominacion: result.denominacion || file.name,
            url: result.url,
          });
        } else {
          const msg = result.error || IMAGE_CONFIG.ERRORS.UPLOAD_FAILED;
          setError(msg);
          onError?.(msg);
        }
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : IMAGE_CONFIG.ERRORS.UNKNOWN_ERROR;
        setError(msg);
        onError?.(msg);
      }
    }

    setImages(newImages);
    onImagesChange(newImages);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = async (imageToRemove: ImagenDTO) => {
    if (disabled || uploading) return;

    try {
      if (imageToRemove.idImagen) {
        const ok = await deleteImage(imageToRemove.idImagen);
        if (!ok) {
          console.warn(
            "No se pudo eliminar en servidor, se remueve localmente"
          );
        }
      }
      const updated = images.filter(
        (img) => img.idImagen !== imageToRemove.idImagen
      );
      setImages(updated);
      onImagesChange(updated);
      setError(null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al eliminar imagen";
      setError(msg);
      onError?.(msg);
    }
  };

  const handleClick = () => {
    if (!canUpload) return;
    if (disabled || uploading || (!multiple && images.length >= 1)) return;
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (!canUpload || disabled || uploading) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!canUpload || disabled || uploading) return;
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const isFull =
    (!multiple && images.length >= 1) ||
    (multiple && images.length >= IMAGE_CONFIG.MAX_IMAGES_PER_ENTITY);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
        {multiple && (
          <span className="text-gray-500 text-xs ml-2">
            ({images.length}/{IMAGE_CONFIG.MAX_IMAGES_PER_ENTITY})
          </span>
        )}
      </label>

      {!canUpload && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            Primero guarda la entidad para habilitar la subida de imágenes.
          </p>
        </div>
      )}

      {/* ZONA DE CARGA */}
      {!isFull && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-all
            ${
              disabled
                ? "opacity-50 cursor-not-allowed bg-gray-50"
                : "cursor-pointer"
            }
            ${
              isDragOver && !disabled
                ? "border-orange-500 bg-orange-50"
                : "border-gray-300"
            }
            ${uploading ? "pointer-events-none opacity-60" : ""}
          `}
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled || uploading || isFull || !canUpload}
            multiple={multiple}
          />

          <div className="space-y-3">
            <PhotoIcon className="w-12 h-12 mx-auto text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                {uploading
                  ? "Subiendo imágenes..."
                  : multiple
                  ? "Haz clic o arrastra múltiples imágenes"
                  : "Haz clic o arrastra una imagen"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, GIF, WEBP - Máx{" "}
                {IMAGE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB
                {multiple &&
                  ` - Máx ${IMAGE_CONFIG.MAX_IMAGES_PER_ENTITY} imágenes`}
              </p>
            </div>
          </div>

          {/* Barra de progreso general */}
          {uploading && (
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* GALERÍA */}
      {images.length > 0 && (
        <div
          className={`grid gap-4 ${
            multiple
              ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-1"
          }`}
        >
          {images.map((image, index) => (
            <div key={image.idImagen || index} className="relative group">
              <img
                src={image.url}
                alt={image.denominacion}
                className="w-full h-40 object-cover rounded-lg shadow-md"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveImage(image);
                  }}
                  className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  title="Eliminar imagen"
                  disabled={uploading || disabled}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              {multiple && index === 0 && (
                <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">⚠️ {error}</p>
        </div>
      )}

      {isFull && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-600">
            ℹ️{" "}
            {multiple
              ? `Máximo de ${IMAGE_CONFIG.MAX_IMAGES_PER_ENTITY} imágenes alcanzado`
              : "Una imagen cargada"}
          </p>
        </div>
      )}
    </div>
  );
};
