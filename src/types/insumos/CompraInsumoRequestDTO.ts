/**
 * DTO para registrar compra de insumo al proveedor
 * ✅ Backend automáticamente:
 *    - Actualiza stockActual
 *    - Crea registro en HistoricoPrecio
 *    - Recalcula estadoStock
 */
export interface CompraInsumoRequestDTO {
  idArticuloInsumo: number;
  cantidad: number;
  precioUnitario: number;
  // fechaCompra?: Date;  // ✅ Backend genera automáticamente
}
