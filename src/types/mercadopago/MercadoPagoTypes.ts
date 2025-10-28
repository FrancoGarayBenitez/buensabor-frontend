// ==================== REQUEST DTOs ====================

export interface PedidoConMercadoPagoRequestDTO {
  // Datos del pedido (reutilizando tu lógica existente)
  idCliente: number;
  tipoEnvio: 'DELIVERY' | 'TAKE_AWAY';
  idDomicilio?: number;
  idSucursal: number;
  observaciones?: string;
  detalles: Array<{
    idArticulo: number;    // ✅ CORREGIDO: era "idArticulo" en el backend
    cantidad: number;
    observaciones?: string; // ✅ AGREGADO: campo opcional del backend
  }>;
  
  // Configuración de descuentos
  porcentajeDescuentoTakeAway?: number; // 10.0 por defecto
  gastosEnvioDelivery?: number; // 200.0 por defecto
  
  // Datos para MercadoPago
  emailComprador: string;
  nombreComprador: string;
  apellidoComprador: string;
  
  // Configuración opcional
  aplicarDescuentoTakeAway?: boolean; // true por defecto
  crearPreferenciaMercadoPago?: boolean; // true por defecto
  externalReference?: string;
}

// ✅ CORREGIDO: Estructura que coincide exactamente con el backend
export interface CalcularTotalesRequestDTO {
  tipoEnvio: 'DELIVERY' | 'TAKE_AWAY';
  detalles: Array<{
    idArticulo: number;    // ✅ CORREGIDO: "idArticulo" no "productoId"
    cantidad: number;
    observaciones?: string; // ✅ AGREGADO: campo opcional
  }>;
  porcentajeDescuentoTakeAway?: number;
  gastosEnvioDelivery?: number;
  aplicarDescuentoTakeAway?: boolean;
}

// ==================== RESPONSE DTOs ====================

export interface PedidoConMercadoPagoResponseDTO {
  // Información del pedido creado
  pedido: any; // PedidoResponseDTO (ya tienes este tipo)
  
  // Información de la factura generada
  factura: any; // FacturaResponseDTO
  
  // Desglose de totales con descuentos
  calculoTotales: CalculoTotalesDTO;
  
  // Información de MercadoPago
  mercadoPago: MercadoPagoInfoDTO;
  
  // Estado general
  exito: boolean;
  mensaje: string;
  tiempoProcesamientoMs: number;
}

// ✅ CORREGIDO: Estructura que coincide con el backend
export interface CalculoTotalesDTO {
  subtotalProductos: number;      // Total de productos sin descuentos
  descuentoTakeAway: number;      // Monto del descuento aplicado
  porcentajeDescuento: number;    // % de descuento aplicado
  gastosEnvio: number;            // Gastos de envío (si es DELIVERY)
  totalFinal: number;             // Total final a pagar
  tipoEnvio: 'DELIVERY' | 'TAKE_AWAY';
  resumenCalculo: string;         // Descripción del cálculo
  seAplicoDescuento: boolean;     // Si se aplicó descuento
}

export interface MercadoPagoInfoDTO {
  preferenciaCreada: boolean;     // Si se creó la preferencia
  preferenceId?: string;          // ID de la preferencia
  linkPago?: string;              // URL para pagar (initPoint)
  linkPagoSandbox?: string;       // URL de sandbox para testing
  externalReference?: string;     // Referencia externa
  qrCodeUrl?: string;             // URL del QR
  errorMercadoPago?: string;      // Error si falló la creación
}

// ==================== CONFIGURACIÓN ====================

export interface ConfiguracionMercadoPagoDTO {
  porcentajeDescuentoTakeAway: number;
  gastosEnvioDelivery: number;
  aplicarDescuentoTakeAwayPorDefecto: boolean;
  mensaje: string;
}

// ==================== CONFIRMACIÓN DE PAGOS ====================

export interface ConfirmarPagoManualRequestDTO {
  idFactura: number;
  metodoPago: 'MERCADO_PAGO' | 'EFECTIVO';
  montoRecibido: number;
  referenciaPago?: string;
  observaciones?: string;
}

export interface ConfirmarPagoManualResponseDTO {
  exito: boolean;
  mensaje: string;
  factura: any; // FacturaResponseDTO actualizada
  pagoRegistrado: any; // Info del pago registrado
}

// ==================== ESTADOS DE PAGO ====================

export type EstadoPago = 'PENDIENTE' | 'PAGADO' | 'FALLIDO' | 'CANCELADO';

export type MetodoPago = 'EFECTIVO' | 'MERCADO_PAGO';

// ==================== UTILIDADES ====================

export interface TotalesCalculados {
  subtotal: number;
  descuento: number;
  costoEnvio: number;
  total: number;
  tiempoEstimado: number;
  resumenDescuento?: string;
}

export interface EstadoPedidoCompleto {
  pedido: any;
  factura: any;
  estadoPago: EstadoPago;
  linkPago?: string;
  montoTotal: number;
  metodoPago?: MetodoPago;
}

// ==================== TIPOS AUXILIARES PARA DEBUGGING ====================

export interface RequestDebugInfo {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  timestamp: string;
}

export interface ResponseDebugInfo {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  timestamp: string;
}

export interface ErrorDebugInfo {
  message: string;
  stack?: string;
  request?: RequestDebugInfo;
  response?: ResponseDebugInfo;
  timestamp: string;
}

// ==================== VALIDADORES DE TIPOS ====================

export const validarCalcularTotalesRequest = (request: any): request is CalcularTotalesRequestDTO => {
  if (!request || typeof request !== 'object') {
    console.error('❌ Request no es un objeto válido');
    return false;
  }

  if (!request.tipoEnvio || !['DELIVERY', 'TAKE_AWAY'].includes(request.tipoEnvio)) {
    console.error('❌ Tipo de envío inválido:', request.tipoEnvio);
    return false;
  }

  if (!Array.isArray(request.detalles) || request.detalles.length === 0) {
    console.error('❌ Detalles debe ser un array no vacío:', request.detalles);
    return false;
  }

  for (let i = 0; i < request.detalles.length; i++) {
    const detalle = request.detalles[i];
    
    if (!detalle || typeof detalle !== 'object') {
      console.error(`❌ Detalle ${i} no es un objeto válido:`, detalle);
      return false;
    }

    if (typeof detalle.idArticulo !== 'number' || detalle.idArticulo <= 0) {
      console.error(`❌ Detalle ${i} - idArticulo inválido:`, detalle.idArticulo);
      return false;
    }

    if (typeof detalle.cantidad !== 'number' || detalle.cantidad <= 0) {
      console.error(`❌ Detalle ${i} - cantidad inválida:`, detalle.cantidad);
      return false;
    }
  }

  console.log('✅ Request de calcular totales válido');
  return true;
};

export const crearDetalleItem = (idArticulo: number, cantidad: number, observaciones?: string) => {
  if (typeof idArticulo !== 'number' || idArticulo <= 0) {
    throw new Error(`ID de artículo inválido: ${idArticulo}`);
  }

  if (typeof cantidad !== 'number' || cantidad <= 0) {
    throw new Error(`Cantidad inválida: ${cantidad}`);
  }

  return {
    idArticulo: Number(idArticulo),
    cantidad: Number(cantidad),
    ...(observaciones && { observaciones })
  };
};