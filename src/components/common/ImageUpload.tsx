import React, { useState, useCallback, useEffect, useRef } from "react";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  IMAGE_CONFIG,
  validateImageFile,
  getMaxImagesErrorMessage,
} from "../../config/imageConfig";
import type { ImagenDTO, EntityType } from "../../types/common/ImagenDTO";
import { useImageUpload } from "../../hooks/useImageUpload";
import { TrashIcon } from "lucide-react";

interface ImageUploadProps {
  entityType: EntityType;
  currentImages?: ImagenDTO[];
  onImagesChange: (imagenes: ImagenDTO[]) => void;
  onNewImageUploaded?: (url: string) => void;
  onError?: (error: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
}

/**
 * Componente interno para renderizar la previsualización de cada imagen.
 * Maneja su propio estado de carga para mostrar un esqueleto hasta que la imagen esté lista.
 */
const ImagePreview: React.FC<{
  image: ImagenDTO;
  onRemove: (image: ImagenDTO) => void;
  disabled?: boolean;
}> = ({ image, onRemove, disabled }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative group w-24 h-24 flex-shrink-0">
      {/* Esqueleto de carga (visible hasta que la imagen carga) */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-300 rounded-md animate-pulse"></div>
      )}

      <img
        src={image.url}
        alt={image.denominacion}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover rounded-md transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {!disabled && (
        <button
          type="button"
          onClick={() => onRemove(image)}
          className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Eliminar imagen"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  entityType,
  currentImages,
  onImagesChange,
  onNewImageUploaded,
  onError,
  label = "Cargar Imagen",
  required = false,
  disabled = false,
  multiple = false,
}) => {
  const images = currentImages || [];
  const { uploading, progress, uploadImage, deleteImage } = useImageUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUpload = !disabled && !uploading;

  const handleFileSelect = useCallback(
    async (files: FileList) => {
      if (!canUpload) return;
      setError(null);

      if (!multiple && files.length > 1) {
        const msg = "Solo se puede cargar una imagen";
        setError(msg);
        onError?.(msg);
        return;
      }

      // ✅ Usar la variable local 'images' que es segura
      if (
        multiple &&
        images.length + files.length > IMAGE_CONFIG.MAX_IMAGES_PER_ENTITY
      ) {
        const msg = getMaxImagesErrorMessage();
        setError(msg);
        onError?.(msg);
        return;
      }

      // ✅ Usar la variable local 'images'
      const newImages: ImagenDTO[] = [...images];

      for (const file of Array.from(files)) {
        try {
          const result = await uploadImage(file, entityType, file.name);
          if (result && result.success && result.url) {
            newImages.push({
              denominacion: result.denominacion || file.name,
              url: result.url,
            });
            // Notifica al componente padre sobre la nueva URL para el seguimiento.
            onNewImageUploaded?.(result.url);
          } else {
            const errorMessage =
              result?.error || IMAGE_CONFIG.ERRORS.UPLOAD_FAILED;
            console.error(`[ImageUpload] ❌ La subida falló: ${errorMessage}`);
            setError(errorMessage);
            onError?.(errorMessage);
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

      onImagesChange(newImages);

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [
      canUpload,
      entityType,
      images,
      onError,
      onImagesChange,
      onNewImageUploaded,
      uploadImage,
    ]
  );

  const handleRemoveImage = async (imageToRemove: ImagenDTO) => {
    if (disabled || uploading) return;

    // Si la imagen tiene un ID, significa que existe en la BD.
    // Si no tiene ID pero sí una URL que no es un blob, fue recién subida.
    // En ambos casos, intentamos borrarla del servidor.
    if (
      imageToRemove.idImagen ||
      (imageToRemove.url && !imageToRemove.url.startsWith("blob:"))
    ) {
      try {
        // Extraer el ID de la imagen si existe, o deducirlo de la URL si es necesario.
        // Por ahora, asumimos que las imágenes recién subidas no necesitan borrado inmediato
        // si el backend las limpia, pero es más seguro borrarlas explícitamente.
        // Para este ejemplo, solo borraremos las que tienen ID.
        if (imageToRemove.idImagen) {
          await deleteImage(imageToRemove.idImagen);
        }
        // NOTA: Una lógica más avanzada podría extraer un identificador de la URL
        // para borrar archivos recién subidos que aún no tienen ID en el estado del formulario.
      } catch (error) {
        console.error(
          "No se pudo eliminar la imagen del servidor, se eliminará solo de la vista.",
          error
        );
        // Opcional: notificar al usuario del error.
        const msg =
          "La imagen no se pudo eliminar del servidor, pero se quitará de la vista.";
        setError(msg);
        onError?.(msg);
      }
    }

    const updatedImages = images.filter((img) => img.url !== imageToRemove.url);
    onImagesChange(updatedImages);
    setError(null); // Limpiar errores previos al tener éxito
  };

  const handleClick = () => {
    // ✅ Usar la variable local 'images'
    if (!canUpload || uploading || (!multiple && images.length >= 1)) return;
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (!canUpload || uploading) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!canUpload || uploading) return;
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const isFull =
    (!multiple && images.length >= 1) ||
    (multiple && images.length >= IMAGE_CONFIG.MAX_IMAGES_PER_ENTITY);

  // ✅ CORRECCIÓN: Inicializar con las imágenes actuales como 'loaded'
  const [imageLoadStates, setImageLoadStates] = useState<{
    [key: string]: "loading" | "loaded" | "error";
  }>(() => {
    const initialState: { [key: string]: "loading" | "loaded" | "error" } = {};
    images.forEach((image) => {
      if (image.url) {
        initialState[image.url] = "loaded"; // Asumir que las existentes están cargadas
      }
    });
    return initialState;
  });

  // ✅ NUEVO: Sincronizar cuando cambien las props
  React.useEffect(() => {
    setImageLoadStates((prev) => {
      const newState = { ...prev };
      images.forEach((image) => {
        if (image.url && !newState[image.url]) {
          newState[image.url] = "loaded";
        }
      });
      return newState;
    });
  }, [images]);

  const handleImageLoad = (url: string) => {
    console.log(`✅ Imagen cargada exitosamente: ${url}`);
    setImageLoadStates((prev) => ({ ...prev, [url]: "loaded" }));
  };

  const handleImageError = (url: string, error: any) => {
    console.error(`❌ Error al cargar imagen: ${url}`, error);
    setImageLoadStates((prev) => ({ ...prev, [url]: "error" }));
  };

  return (
    <div className="space-y-4">
      {/* Previsualización de Imágenes */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {images.map((img, index) => (
            <ImagePreview
              key={img.idImagen || img.url || index}
              image={img}
              onRemove={handleRemoveImage}
              disabled={disabled || uploading}
            />
          ))}
        </div>
      )}

      {/* Zona de Carga (Dropzone) */}
      {!isFull && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-all
            ${
              !canUpload // La clase de deshabilitado ahora solo depende de `canUpload`.
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
