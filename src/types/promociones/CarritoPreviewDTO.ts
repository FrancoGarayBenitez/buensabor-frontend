import type { DetallePreviewDTO } from "./DetallepreviewDTO";

export interface CarritoPreviewDTO {
  subtotalOriginal: number;
  descuentoTotal: number;
  subtotalConDescuentos: number;
  gastosEnvio: number;
  totalFinal: number;
  tipoEnvio: 'DELIVERY' | 'TAKE_AWAY';
  resumenPromociones: string;
  detalles: DetallePreviewDTO[];
}