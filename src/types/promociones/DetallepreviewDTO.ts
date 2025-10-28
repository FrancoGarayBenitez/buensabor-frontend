export interface DetallePreviewDTO {
  idArticulo: number;
  denominacionArticulo: string;
  cantidad: number;
  precioUnitarioOriginal: number;
  precioUnitarioFinal: number;
  subtotalOriginal: number;
  subtotalFinal: number;
  descuentoAplicado: number;
  tienePromocion: boolean;
  observaciones?: string;
  nombrePromocion?: string;
  resumenDescuento?: string;
}