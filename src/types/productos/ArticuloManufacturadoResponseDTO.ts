import type { CategoriaInfo } from "../common/CategoriaInfo";
import type { ImagenDTO } from "../common/ImagenDTO";
import type { ManufacturadoDetalleDTO } from "./ManufacturadoDetalleDTO";

export interface ArticuloManufacturadoResponseDTO {
  idArticulo: number;
  denominacion: string;
  precioVenta: number;
  eliminado: boolean;   // <- agregar este campo

  idUnidadMedida: number;
  denominacionUnidadMedida: string;

  categoria: CategoriaInfo;

  descripcion?: string;
  tiempoEstimadoEnMinutos: number;
  preparacion?: string;

  detalles: ManufacturadoDetalleDTO[];

  costoTotal: number;
  margenGanancia: number;
  cantidadIngredientes: number;
  stockSuficiente: boolean;
  cantidadMaximaPreparable: number;

  imagenes: ImagenDTO[];

  cantidadVendida: number;
}
