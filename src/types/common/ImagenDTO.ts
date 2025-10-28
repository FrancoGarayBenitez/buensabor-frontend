export interface ImagenDTO {
  idImagen?: number;
  denominacion: string;
  url: string;
  idPromocion?: number; // Opcional, si la imagen está asociada a una promoción
}
