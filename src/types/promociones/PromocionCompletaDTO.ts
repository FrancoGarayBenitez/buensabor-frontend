export interface ArticuloBasicoDTO {
  idArticulo: number;
  denominacion: string;
  precioVenta: number;
  imagenUrl?: string;
}

export interface PromocionCompletaDTO {
  idPromocion: number;
  denominacion: string;
  descripcionDescuento: string;
  fechaDesde: string;
  fechaHasta: string;
  horaDesde: string;
  horaHasta: string;
  tipoDescuento: "PORCENTUAL" | "MONTO_FIJO";
  valorDescuento: number;
  articulos: ArticuloBasicoDTO[];
}
