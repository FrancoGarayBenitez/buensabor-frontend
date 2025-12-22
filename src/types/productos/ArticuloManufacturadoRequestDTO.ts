import type { ImagenDTO } from "../common";
import type { DetalleManufacturadoRequestDTO } from "./DetalleManufacturadoRequestDTO";

/**
 * DTO para crear o actualizar un producto manufacturado.
 */
export interface ArticuloManufacturadoRequestDTO {
  denominacion: string;
  idUnidadMedida: number;
  idCategoria: number;
  descripcion: string;
  preparacion: string;
  tiempoEstimadoEnMinutos: number;

  /**
   * Margen de ganancia en formato de porcentaje (ej: 30 para un 30%).
   */
  margenGananciaPorcentaje: number;

  /**
   * El precio de venta es opcional. Si no se envía, el backend lo calcula
   * usando el costo de producción y el margen de ganancia.
   */
  precioVenta?: number;

  /**
   * Lista de ingredientes que componen la receta.
   */
  detalles: DetalleManufacturadoRequestDTO[];

  /**
   * Lista de imágenes asociadas al producto.
   */
  imagenes?: ImagenDTO[];
}
