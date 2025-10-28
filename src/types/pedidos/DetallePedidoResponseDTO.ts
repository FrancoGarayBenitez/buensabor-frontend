// types/pedidos/DetallePedidoResponseDTO.ts

export interface DetallePedidoResponseDTO {
  idDetallePedido: number;
  idArticulo: number;
  denominacionArticulo: string;
  cantidad: number;
  precioUnitario: number;  // ⚠️ LEGACY - Mantener para compatibilidad
  subtotal: number;
  unidadMedida?: string;
  tiempoPreparacion?: number;
  observaciones?: string;

  // ==================== 🆕 CAMPOS PARA PROMOCIONES ====================
  precioUnitarioOriginal?: number;    // Precio sin promoción
  descuentoPromocion?: number;         // Monto del descuento aplicado
  precioUnitarioFinal?: number;        // Precio después del descuento
  tienePromocion?: boolean;            // Si tiene promoción aplicada

  // Detalle de la promoción aplicada
  promocionAplicada?: PromocionAplicadaDTO;
}

export interface PromocionAplicadaDTO {
  idPromocion: number;
  denominacion: string;
  descripcion?: string;
  tipoDescuento: 'PORCENTUAL' | 'MONTO_FIJO';
  valorDescuento: number;
  resumenDescuento: string; // "15% descuento - Ahorro: $150"
}
