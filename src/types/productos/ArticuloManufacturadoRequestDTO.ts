import type { ImagenDTO } from "../common/ImagenDTO";
import type { DetalleManufacturadoRequestDTO } from "./DetalleManufacturadoRequestDTO.ts";

export interface ArticuloManufacturadoRequestDTO {
  // Campos heredados de Articulo
  denominacion: string;
  precioVenta: number;
  idUnidadMedida: number;
  idCategoria: number;

  // Campos específicos de ArticuloManufacturado
  descripcion?: string;
  tiempoEstimadoEnMinutos: number;
  preparacion: string;
  margenGanancia: number;

  // Detalles de la receta
  detalles: DetalleManufacturadoRequestDTO[];

  // Imágenes (opcional)
  imagenes?: ImagenDTO[];
}
