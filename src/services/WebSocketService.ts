import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import AuthPasswordService from "./AuthPasswordService";

// Tipos para los mensajes
export interface WebSocketMessage {
  tipo:
    | "PEDIDO_NUEVO"
    | "CAMBIO_ESTADO"
    | "ERROR"
    | "PEDIDO_CANCELADO"
    | "PEDIDO_LISTO_DELIVERY"
    | "PAGO_CONFIRMADO"
    | "TIEMPO_EXTENDIDO";
  pedidoId?: number;
  estado?: string;
  cliente?: string;
  mensaje?: string;
  timestamp: string;
  minutosExtra?: number;
  tipoPago?: string;
}

class WebSocketService {
  private client: Client | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.setupClient();
  }

  private setupClient() {
    const backendUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    const wsUrl = `${backendUrl}/ws`;

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),

      onConnect: () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // Limpiar timeout de reconexión si existe
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }

        // Test de conexión silencioso
        this.testConnection();
      },

      onDisconnect: () => {
        this.isConnected = false;
        this.attemptReconnect();
      },

      onStompError: (frame) => {
        console.error(
          "❌ Error WebSocket:",
          frame.headers?.message || "Error desconocido"
        );
        this.isConnected = false;
        this.attemptReconnect();
      },

      connectHeaders: {
        Authorization: `Bearer ${AuthPasswordService.getToken()}`,
      },

      // Configuración de heartbeat para mantener conexión
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });
  }

  private testConnection() {
    if (this.client && this.isConnected) {
      this.client.publish({
        destination: "/app/test",
        body: JSON.stringify({
          message: "Connection test",
          timestamp: new Date().toISOString(),
        }),
      });
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Backoff exponencial

      this.reconnectTimeout = setTimeout(() => {
        if (!this.isConnected) {
          this.connect();
        }
      }, delay);
    } else {
      console.error("❌ Máximo de reintentos de WebSocket alcanzado");
    }
  }

  // Métodos públicos
  connect() {
    const token = AuthPasswordService.getToken();
    if (!token) {
      console.warn("⚠️ No hay token disponible para WebSocket");
      return;
    }

    if (!this.isConnected && this.client) {
      // Actualizar headers con token actual
      this.client.connectHeaders = {
        Authorization: `Bearer ${token}`,
      };

      try {
        this.client.activate();
      } catch (error) {
        console.error("❌ Error activando WebSocket:", error);
      }
    }
  }

  disconnect() {
    // Limpiar timeout de reconexión
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.client) {
      try {
        this.client.deactivate();
      } catch (error) {
        console.error("❌ Error desactivando WebSocket:", error);
      } finally {
        this.isConnected = false;
      }
    }
  }

  // Suscribirse a un canal
  subscribe(
    destination: string,
    callback: (message: WebSocketMessage) => void
  ) {
    if (!this.client || !this.isConnected) {
      console.warn("⚠️ WebSocket no conectado para suscripción:", destination);
      return null;
    }

    try {
      return this.client.subscribe(destination, (message: IMessage) => {
        try {
          const parsedMessage: WebSocketMessage = JSON.parse(message.body);
          callback(parsedMessage);
        } catch (error) {
          console.error("❌ Error parseando mensaje WebSocket:", error);
        }
      });
    } catch (error) {
      console.error("❌ Error suscribiéndose a canal:", destination, error);
      return null;
    }
  }

  // Enviar mensaje
  send(destination: string, message: any) {
    if (!this.client || !this.isConnected) {
      console.warn("⚠️ No se puede enviar mensaje: WebSocket desconectado");
      return false;
    }

    try {
      this.client.publish({
        destination,
        body: JSON.stringify(message),
      });
      return true;
    } catch (error) {
      console.error("❌ Error enviando mensaje WebSocket:", error);
      return false;
    }
  }

  // Ping para mantener conexión activa
  ping() {
    this.send("/app/ping", { timestamp: new Date().toISOString() });
  }

  // Getters
  get connected() {
    return this.isConnected;
  }

  get connectionAttempts() {
    return this.reconnectAttempts;
  }
}

// Singleton
export const webSocketService = new WebSocketService();
