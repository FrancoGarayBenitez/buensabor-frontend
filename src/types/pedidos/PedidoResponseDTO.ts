import type { DomicilioDTO } from "../clientes";
import type { DetallePedidoResponseDTO } from "./DetallePedidoResponseDTO";

export interface PedidoResponseDTO {
  idPedido: number;
  fecha: string; // ISO string
  horaEstimadaFinalizacion: string; // time string "HH:mm:ss"
  total: number;
  estado: "PREPARACION" | "PENDIENTE" | "CANCELADO" | "LISTO" | "ENTREGADO";
  tipoEnvio: "DELIVERY" | "TAKE_AWAY";

  // Información del cliente
  idCliente: number;
  nombreCliente: string;
  apellidoCliente: string;
  telefonoCliente: string;

  // Información del domicilio (si es delivery)
  domicilio?: DomicilioDTO;

  // Detalles del pedido
  detalles: DetallePedidoResponseDTO[];

  // Información adicional
  tiempoEstimadoTotal: number; // en minutos
  stockSuficiente: boolean;

  observaciones?: string; // opcional
  // ✅ NUEVO: Resumen de promociones del pedido
  resumenPromociones?: ResumenPromocionesDTO;
}

export interface ResumenPromocionesDTO {
  subtotalOriginal: number; // Total sin promociones
  totalDescuentos: number; // Total de descuentos aplicados
  subtotalConDescuentos: number; // Total después de promociones
  cantidadPromociones: number; // Número de promociones aplicadas
  nombresPromociones: string[]; // Lista de promociones aplicadas
  resumenTexto: string; // "3 promociones aplicadas - Ahorro: $450"
}
