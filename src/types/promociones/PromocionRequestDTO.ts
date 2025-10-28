// src/types/promociones/PromocionRequestDTO.ts

export interface PromocionRequestDTO {
  denominacion: string;
  fechaDesde: string; // ISO string
  fechaHasta: string; // ISO string 
  horaDesde: string; // "HH:mm:ss"
  horaHasta: string; // "HH:mm:ss"
  descripcionDescuento?: string;
  tipoDescuento: 'PORCENTUAL' | 'MONTO_FIJO';
  valorDescuento: number;
  precioPromocional: number; // ← AGREGAR ESTE CAMPO OBLIGATORIO
  cantidadMinima?: number;
  activo?: boolean;
  idsArticulos: number[];
  urlsImagenes?: string[];
}