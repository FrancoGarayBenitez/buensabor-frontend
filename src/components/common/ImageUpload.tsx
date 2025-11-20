import React, { useRef, useState, useEffect } from "react";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { useImageUpload } from "../../hooks/useImageUpload";
import { IMAGE_CONFIG } from "../../config/imageConfig";
import type { ImagenDTO } from "../../types/common/ImagenDTO";
import ImageService from "../../services/ImageService";

interface ImageUploadProps {
  entityType: string;
  entityId?: number;
  currentImage?: ImagenDTO | null;
  onImageChange: (imagen: ImagenDTO | null) => void;
  onError?: (error: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  entityType,
  entityId,
  currentImage,
  onImageChange,
  onError,
  label = "Cargar Imagen",
  required = false,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { uploading, progress, uploadImage, updateImage, deleteImage } =
    useImageUpload();

  useEffect(() => {
    setPreviewUrl(currentImage?.url || null);
  }, [currentImage]);

  const handleFileSelect = async (file: File) => {
    if (disabled || uploading) return;

    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      let result;

      if (currentImage?.idImagen) {
        result = await ImageService.updateImage(
          file,
          currentImage.idImagen,
          entityType,
          file.name.split(".")[0]
        );
      } else {
        result = await ImageService.uploadImage(
          file,
          entityType,
          entityId,
          file.name.split(".")[0]
        );
      }

      if (result.success && result.url) {
        const newImage: ImagenDTO = {
          idImagen: result.idImagen,
          denominacion: result.denominacion || file.name,
          url: result.url,
        };
        onImageChange(newImage);
      } else {
        const errorMsg = result.error || IMAGE_CONFIG.ERRORS.UPLOAD_FAILED;
        setError(errorMsg);
        onError?.(errorMsg);
        setPreviewUrl(currentImage?.url || null);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : IMAGE_CONFIG.ERRORS.UNKNOWN_ERROR;
      setError(errorMsg);
      onError?.(errorMsg);
      setPreviewUrl(currentImage?.url || null);
    }
  };

  const handleRemoveImage = async () => {
    if (disabled || uploading) return;

    console.log(`🗑️ Eliminando imagen:`, currentImage?.idImagen);

    if (currentImage?.idImagen) {
      const deleted = await ImageService.deleteImage(currentImage.idImagen);
      if (!deleted) {
        console.warn(
          `⚠️ Error al eliminar imagen en servidor, pero se limpia localmente`
        );
      }
    }

    onImageChange(null);
    setPreviewUrl(null);
    setError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>

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
          disabled={disabled}
        />

        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="preview"
                className="h-40 w-40 object-cover rounded-lg shadow-md"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <span className="text-white text-sm">{progress}%</span>
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
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={uploading || disabled}
              >
                Cambiar
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={uploading || disabled}
              >
                Eliminar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <PhotoIcon className="w-12 h-12 mx-auto text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                {uploading ? "Subiendo imagen..." : "Haz clic o arrastra aquí"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, GIF, WEBP - Máx 5MB
              </p>
            </div>
          </div>
        )}

        {/* Barra de progreso */}
        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">⚠️ {error}</p>
        </div>
      )}
    </div>
  );
};
