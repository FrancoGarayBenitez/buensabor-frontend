// ✅ OPCIÓN 1: Actualizar PedidoRequestDTO básico para incluir campos de descuento
// Archivo: types/pedidos/PedidoRequestDTO.ts

import type { DetallePedidoRequestDTO } from "./DetallePedidoRequestDTO";

export interface PedidoRequestDTO {
  // ==================== CAMPOS BÁSICOS EXISTENTES ====================
  idCliente: number;
  idSucursal: number;
  tipoEnvio: 'DELIVERY' | 'TAKE_AWAY';
  idDomicilio?: number; // Solo si es DELIVERY
  detalles: DetallePedidoRequestDTO[];
  observaciones?: string;

  // ==================== 🆕 CAMPOS PARA DESCUENTOS TAKE_AWAY ====================
  porcentajeDescuentoTakeAway?: number;        // Por defecto: 10.0
  gastosEnvioDelivery?: number;                // Por defecto: 200.0
  aplicarDescuentoTakeAway?: boolean;          // true si tipoEnvio === 'TAKE_AWAY'

  // ==================== 🆕 CAMPOS ADICIONALES OPCIONALES ====================
  calcularAutomaticamente?: boolean;          // true para que backend calcule totales
  incluirGastosEnvio?: boolean;               // true para incluir gastos de envío
  validarStock?: boolean;                     // true para validar disponibilidad

  // ==================== 🆕 CAMPOS PARA PROMOCIONES AGRUPADAS ====================
  promocionAgrupada?: {
    idPromocion: number;
    denominacion: string;
    tipoDescuento: string;                     // "PORCENTUAL" | "MONTO_FIJO"
    valorDescuento: number;
    descripcion?: string;
    descuentoAplicado: number;                 // Monto calculado del descuento
    subtotalOriginal?: number;                 // Subtotal antes del descuento
    subtotalConDescuento?: number;             // Subtotal después del descuento
  };
}