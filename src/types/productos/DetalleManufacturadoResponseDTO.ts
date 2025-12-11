export interface DetalleManufacturadoResponseDTO {
  idDetalleManufacturado?: number;
  cantidad: number;

  // Información del Insumo
  idArticuloInsumo: number;
  denominacionInsumo?: string;
  unidadMedidaInsumo?: string;
  costoInsumo?: number; // precioCompra del insumo
}
