// ==================== Constantes ====================

import type { ImagenDTO } from "../common";

export const TIPO_DESCUENTO = {
  PORCENTUAL: "PORCENTUAL",
  MONTO_FIJO: "MONTO_FIJO",
} as const;

export const TIPO_PROMOCION = {
  COMBO: "COMBO",
  NXM: "NXM",
} as const;

export const ESTADO_PROMOCION = {
  VIGENTE: "VIGENTE",
  PROGRAMADA: "PROGRAMADA",
  EXPIRADA: "EXPIRADA",
  INACTIVA: "INACTIVA",
} as const;

// ==================== Tipos ====================

export type TipoDescuento =
  (typeof TIPO_DESCUENTO)[keyof typeof TIPO_DESCUENTO];
export type TipoPromocion =
  (typeof TIPO_PROMOCION)[keyof typeof TIPO_PROMOCION];
export type EstadoPromocion =
  (typeof ESTADO_PROMOCION)[keyof typeof ESTADO_PROMOCION];

// ==================== Tipos Auxiliares ====================

export interface ArticuloShort {
  id: number;
  denominacion: string;
  precioVenta: number;
}

export interface PromocionDetalleRequest {
  idArticulo: number;
  cantidad: number;
}

export interface PromocionDetalleResponse {
  articulo: ArticuloShort;
  cantidad: number;
}

// ==================== Tipos Principales ====================

export interface PromocionRequest {
  denominacion: string;
  fechaDesde: string;
  fechaHasta: string;
  horaDesde: string;
  horaHasta: string;
  descripcionDescuento?: string;
  tipoPromocion: TipoPromocion;
  tipoDescuento: TipoDescuento;
  valorDescuento: number;
  activo: boolean;
  cantidadMinima: number;
  detalles: PromocionDetalleRequest[];
  imagenes: ImagenDTO[];
}

export interface PromocionResponse {
  id: number;
  denominacion: string;
  fechaDesde: string;
  fechaHasta: string;
  horaDesde: string;
  horaHasta: string;
  descripcionDescuento?: string;
  tipoPromocion: TipoPromocion;
  tipoDescuento: TipoDescuento;
  valorDescuento: number;
  activo: boolean;
  cantidadMinima: number;
  estado: EstadoPromocion;
  detalles: PromocionDetalleResponse[];
  imagenes: ImagenDTO[];
}
