import type { TipoCategoria } from "../categorias/TipoCategoria";
import type { ImagenDTO } from "../common";
import type { DetalleManufacturadoResponseDTO } from "./DetalleManufacturadoResponseDTO";

/**
 * DTO para recibir un producto manufacturado desde el backend.
 */
export interface ArticuloManufacturadoResponseDTO {
  // Datos del artículo
  idArticulo: number;
  denominacion: string;
  precioVenta: number;
  eliminado: boolean;

  // Unidad de medida
  idUnidadMedida: number;
  denominacionUnidadMedida: string;

  // Categoría
  idCategoria: number;
  denominacionCategoria: string;
  esSubcategoria: boolean;
  denominacionCategoriaPadre?: string;
  tipoCategoria: TipoCategoria;

  // Datos del manufacturado
  descripcion: string;
  preparacion: string;
  tiempoEstimadoEnMinutos: number;

  // Receta
  detalles: DetalleManufacturadoResponseDTO[];

  // Imágenes
  imagenes: ImagenDTO[];

  // --- CAMPOS CALCULADOS Y DE NEGOCIO ---

  /**
   * Costo total de los ingredientes.
   */
  costoProduccion: number;

  /**
   * Margen de ganancia como multiplicador (ej: 1.3).
   */
  margenGanancia: number;

  /**
   * Margen de ganancia como porcentaje (ej: 30.0).
   */
  margenGananciaPorcentaje: number;

  /**
   * Indica si hay stock suficiente de todos los ingredientes para preparar al menos una unidad.
   */
  stockSuficiente: boolean;

  /**
   * Cantidad máxima de unidades que se pueden preparar con el stock actual de ingredientes.
   */
  cantidadMaximaPreparable: number;
}
