export interface ImagenDTO {
  idImagen?: number;
  denominacion: string;
  url: string;
}

export type EntityType = "INSUMO" | "MANUFACTURADO" | "CLIENTE" | "PROMOCION";
