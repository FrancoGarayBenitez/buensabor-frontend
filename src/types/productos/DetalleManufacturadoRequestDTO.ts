/**
 * DTO para enviar un ingrediente de la receta de un producto manufacturado.
 */
export interface DetalleManufacturadoRequestDTO {
  /**
   * Cantidad del insumo requerida para una unidad del producto.
   */
  cantidad: number;

  /**
   * ID del ArticuloInsumo (ingrediente).
   */
  idArticuloInsumo: number;
}
