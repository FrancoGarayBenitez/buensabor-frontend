export interface ManufacturadoDetalleDTO {
  idDetalleManufacturado?: number;
  idArticuloInsumo: number;
  denominacionInsumo?: string;
  unidadMedida?: string;
  precioCompraUnitario?: number;
  subtotal?: number;
  cantidad: number;
}
