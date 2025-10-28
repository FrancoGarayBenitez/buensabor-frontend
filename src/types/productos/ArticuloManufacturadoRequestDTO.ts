import type { ImagenDTO } from "../common/ImagenDTO";
import type { ManufacturadoDetalleDTO } from "./ManufacturadoDetalleDTO";

export interface ArticuloManufacturadoRequestDTO {
  denominacion: string;
  idUnidadMedida: number;
  idCategoria: number;
  descripcion?: string;
  tiempoEstimadoEnMinutos: number;
  preparacion?: string;
  precioVenta: number;
  margenGanancia: number;
  detalles: ManufacturadoDetalleDTO[];
  imagen?: ImagenDTO;
}
