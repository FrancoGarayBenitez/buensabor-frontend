/**
 * DTO para recibir un ingrediente de la receta de un producto manufacturado.
 */
export interface DetalleManufacturadoResponseDTO {
  /**
   * ID del detalle.
   */
  idDetalleManufacturado: number;

  /**
   * Cantidad del insumo requerida.
   */
  cantidad: number;

  /**
   * ID del ArticuloInsumo (ingrediente).
   */
  idArticuloInsumo: number;

  /**
   * Denominación del ingrediente.
   */
  denominacionInsumo: string;

  /**
   * Unidad de medida del ingrediente (ej: "g", "ml", "unidad").
   */
  unidadMedidaInsumo: string;

  /**
   * Precio de compra unitario del ingrediente.
   */
  precioCompraInsumo: number;

  /**
   * Costo del ingrediente para esta receta (cantidad * precioCompra del insumo).
   */
  subtotal: number;
}
