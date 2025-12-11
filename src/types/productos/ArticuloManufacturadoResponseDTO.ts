import type { ImagenDTO } from "../common/ImagenDTO";
import type { DetalleManufacturadoResponseDTO } from "./DetalleManufacturadoResponseDTO.ts";

export interface ArticuloManufacturadoResponseDTO {
  // Campos heredados de Articulo
  idArticulo: number;
  denominacion: string;
  precioVenta: number;
  eliminado: boolean;

  // Información de Unidad de Medida
  idUnidadMedida: number;
  denominacionUnidadMedida: string;

  // Información de Categoría
  idCategoria: number;
  denominacionCategoria: string;
  esSubcategoria?: boolean;
  denominacionCategoriaPadre?: string;

  // Campos específicos de ArticuloManufacturado
  descripcion?: string;
  tiempoEstimadoEnMinutos: number;
  preparacion?: string;
  margenGanancia: number;
  costoProduccion: number;

  // Detalles de la receta (USAR RESPONSE)
  detalles: DetalleManufacturadoResponseDTO[];

  // Imágenes
  imagenes?: ImagenDTO[];

  // Información calculada (viene del backend)
  stockSuficiente: boolean;
  cantidadMaximaPreparable: number;
}
