export const IMAGE_CONFIG = {
  // URLs base
  API_BASE_URL: "http://localhost:8080/api",

  // Configuraciones de carga
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGES_PER_ENTITY: 5, // Máximo de imágenes por entidad (producto, insumo, etc)
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".gif", ".webp"],

  // Placeholder URLs
  PLACEHOLDER_URL:
    "https://via.placeholder.com/300x200/f3f4f6/6b7280?text=Sin+Imagen",
  ERROR_PLACEHOLDER_URL:
    "https://via.placeholder.com/300x200/fee2e2/dc2626?text=Error+al+cargar",

  // Mensajes de error
  ERRORS: {
    NO_FILE: "No se ha seleccionado ningún archivo",
    INVALID_TYPE: "Tipo de archivo no válido. Solo: JPG, PNG, GIF, WEBP",
    FILE_TOO_LARGE: "El archivo es demasiado grande. Máximo 5MB",
    UPLOAD_FAILED: "Error al subir la imagen",
    DELETE_FAILED: "Error al eliminar la imagen",
    UNKNOWN_ERROR: "Error desconocido al procesar la imagen",
    MAX_IMAGES_REACHED: "Se alcanzó el máximo de imágenes permitidas",
  },

  MESSAGES: {
    UPLOADING: "Subiendo imagen...",
    PENDING: "Pendiente de subir",
    UPLOADED: "Guardado en servidor",
    READY: "Listo para subir",
    PRIMARY_IMAGE: "Imagen principal",
  },

  ENTITY_TYPES: {
    INSUMO: "insumos",
    MANUFACTURADO: "manufacturados",
    CLIENTE: "clientes",
    PROMOCION: "promociones",
  },
};

export const getPlaceholderUrl = (
  width: number = 300,
  height: number = 200
): string => {
  return `https://via.placeholder.com/${width}x${height}/f3f4f6/6b7280?text=Sin+Imagen`;
};

export const getErrorPlaceholderUrl = (
  width: number = 300,
  height: number = 200
): string => {
  return `https://via.placeholder.com/${width}x${height}/fee2e2/dc2626?text=Error`;
};

export const isValidImageType = (contentType: string): boolean => {
  return IMAGE_CONFIG.ALLOWED_TYPES.includes(contentType);
};

export const isValidImageSize = (size: number): boolean => {
  return size <= IMAGE_CONFIG.MAX_FILE_SIZE;
};

export const isMaxImagesReached = (currentCount: number): boolean => {
  return currentCount >= IMAGE_CONFIG.MAX_IMAGES_PER_ENTITY;
};

export const extractFilenameFromUrl = (url: string): string | null => {
  try {
    const parts = url.split("/");
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
};

export const validateImageFile = (file: File): string | null => {
  if (!file) return IMAGE_CONFIG.ERRORS.NO_FILE;
  if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(file.type))
    return IMAGE_CONFIG.ERRORS.INVALID_TYPE;
  if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE)
    return IMAGE_CONFIG.ERRORS.FILE_TOO_LARGE;
  return null;
};

export const getMaxImagesErrorMessage = (): string => {
  return `${IMAGE_CONFIG.ERRORS.MAX_IMAGES_REACHED} (${IMAGE_CONFIG.MAX_IMAGES_PER_ENTITY} máximo)`;
};
