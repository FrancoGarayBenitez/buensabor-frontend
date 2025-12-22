/**
 * DTO para registrar compra de insumo al proveedor
 * ✅ Backend automáticamente:
 *    - Actualiza stockActual
 *    - Crea registro en HistoricoPrecio
 *    - Recalcula estadoStock
 */
export interface CompraInsumoRequestDTO {
  idArticuloInsumo: number;

  // ✅ nuevo modelo (solo paquetes)
  paquetes: number; // cantidad de paquetes
  precioPorPaquete: number; // precio de cada paquete
  unidadContenido: "g" | "kg" | "ml" | "l" | "unidad";
  contenidoPorPaquete: number; // contenido de un paquete en unidadContenido

  // opcional: fecha (si el backend la acepta, sino la setea automáticamente)
  fechaCompra?: string; // ISO
}
