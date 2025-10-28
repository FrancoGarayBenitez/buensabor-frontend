export interface FacturaResponseDTO {
  idFactura: number;
  fechaFactura: string;
  nroComprobante: string;
  subTotal: number;
  descuento: number;
  gastosEnvio: number;
  totalVenta: number;
  
  // Información del pedido asociado
  pedidoId: number;
  estadoPedido: string;
  tipoEnvio: string;
  
  // Información del cliente
  clienteId: number;
  nombreCliente: string;
  apellidoCliente: string;
  
  // Información de pagos
  pagos: PagoSummaryDTO[];
  totalPagado: number;
  saldoPendiente: number;
  completamentePagada: boolean;
}

export interface PagoSummaryDTO {
  idPago: number;
  formaPago: string;
  estado: string;
  monto: number;
  fechaCreacion: string;
}

export interface FacturaPdfOptions {
  preview?: boolean;
  filename?: string;
}

export interface FacturaApiResponse {
  data?: FacturaResponseDTO[];
  error?: string;
  success: boolean;
}

// Estados para UI
export type FacturaDownloadStatus = 'idle' | 'downloading' | 'success' | 'error';

export interface FacturaDownloadState {
  status: FacturaDownloadStatus;
  error?: string;
  filename?: string;
}