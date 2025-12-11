/**
 * DTO para consultar histórico de compras (precios)
 * ✅ Solo lectura: generado automáticamente por backend
 */
export interface HistoricoPrecioDTO {
  idHistoricoPrecio: number;
  idCompra: number;
  precioUnitario: number;
  cantidad: number;
  fecha: string; // ISO string desde backend (LocalDateTime)
}

/**
 * DTO para estadísticas de histórico
 */
export interface HistoricoPrecioStatsDTO {
  totalRegistros: number;
  precioPromedio: number;
  precioMinimo: number;
  precioMaximo: number;
}

/**
 * DTO para precio de venta sugerido
 */
export interface PrecioVentaSugeridoDTO {
  precioVentaSugerido: number;
  gananciaUnitaria: number;
}
