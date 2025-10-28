import { useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import {
  webSocketService,
  type WebSocketMessage,
} from "../services/WebSocketService";
import { toast } from "react-toastify";
import AuthPasswordService from "../services/AuthPasswordService";

// Hook genérico para WebSocket
export const useWebSocket = () => {
  const { isAuthenticated, isLoading } = useAuth();

  const [isConnected, setIsConnected] = useState(false);
  const hasConnected = useRef(false);
  const connectionAttempted = useRef(false);

  useEffect(() => {
    const connectWebSocket = async () => {
      // Verificaciones simplificadas
      if (
        !isAuthenticated ||
        isLoading ||
        hasConnected.current ||
        connectionAttempted.current
      ) {
        console.log("🔌 WebSocket: No conectando, razones:", {
          isAuthenticated,
          isLoading,
          hasConnected: hasConnected.current,
          connectionAttempted: connectionAttempted.current,
        });
        return;
      }

      try {
        connectionAttempted.current = true;
        console.log("🔌 WebSocket: Conectando...");

        // Obtener token del servicio de auth local
        const token = AuthPasswordService.getToken();
        if (!token) {
          throw new Error("No hay token disponible");
        }

        // Conectar WebSocket
        webSocketService.connect();
        setIsConnected(true);
        hasConnected.current = true;
        console.log("✅ WebSocket conectado exitosamente");
      } catch (error) {
        console.error("❌ Error conectando WebSocket:", error);
        connectionAttempted.current = false; // Permitir reintentos
        setIsConnected(false);
      }
    };

    // Solo conectar cuando esté autenticado y no esté cargando
    if (isAuthenticated && !isLoading) {
      const timeoutId = setTimeout(connectWebSocket, 1000);
      return () => clearTimeout(timeoutId);
    }

    // Cleanup al desmontar o cambiar estado
    return () => {
      if (hasConnected.current && (!isAuthenticated || isLoading)) {
        console.log("🔌 WebSocket: Desconectando por cambio de estado auth");
        webSocketService.disconnect();
        setIsConnected(false);
        hasConnected.current = false;
        connectionAttempted.current = false;
      }
    };
  }, [isAuthenticated, isLoading]);

  // Cleanup final al desmontar
  useEffect(() => {
    return () => {
      if (hasConnected.current) {
        console.log("🔌 WebSocket: Cleanup final");
        webSocketService.disconnect();
        setIsConnected(false);
        hasConnected.current = false;
        connectionAttempted.current = false;
      }
    };
  }, []);

  // Monitorear estado de conexión del servicio
  useEffect(() => {
    const checkConnection = () => {
      const serviceConnected = webSocketService.connected;
      if (serviceConnected !== isConnected) {
        setIsConnected(serviceConnected);
      }
    };

    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, [isConnected]);

  return {
    isConnected,
    subscribe: webSocketService.subscribe.bind(webSocketService),
    send: webSocketService.send.bind(webSocketService),
  };
};

// Hook específico para diferentes roles (sin cambios)
export const useWebSocketByRole = (userRole: string) => {
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    if (!userRole || !isConnected) return;

    const subscriptions: any[] = [];

    switch (userRole) {
      case "CLIENTE":
        const clienteSub = subscribe(
          "/user/queue/pedido/estado",
          handleClienteMessage
        );
        if (clienteSub) subscriptions.push(clienteSub);
        break;

      case "COCINERO":
        const cocineroSubs = [
          subscribe("/topic/cocina/nuevos", handleNuevoPedidoCocinero),
          subscribe("/topic/pedidos/estados", handleEstadoCambio),
          subscribe("/topic/cocina/cancelaciones", handleCancelacionCocinero),
        ];

        cocineroSubs.forEach((sub) => {
          if (sub) subscriptions.push(sub);
        });
        break;

      case "DELIVERY":
        const deliverySubs = [
          subscribe("/topic/delivery/disponibles", handlePedidoListoDelivery),
          subscribe("/topic/pedidos/estados", (message: WebSocketMessage) => {
            if (message.estado === "LISTO" || message.estado === "ENTREGADO") {
              handleEstadoCambio(message);
            }
          }),
        ];

        deliverySubs.forEach((sub) => {
          if (sub) subscriptions.push(sub);
        });
        break;

      case "CAJERO":
        const cajeroSubs = [
          subscribe("/topic/cajero/pedidos", handleCajeroMessage),
          subscribe("/topic/pedidos/estados", handleEstadoCambio),
        ];

        cajeroSubs.forEach((sub) => {
          if (sub) subscriptions.push(sub);
        });
        break;

      case "ADMIN":
        const adminSubs = [
          subscribe("/topic/cajero/pedidos", handleAdminMessage),
          subscribe("/topic/pedidos/estados", handleEstadoCambio),
        ];

        adminSubs.forEach((sub) => {
          if (sub) subscriptions.push(sub);
        });
        break;
    }

    return () => {
      subscriptions.forEach((sub) => {
        if (sub && sub.unsubscribe) {
          sub.unsubscribe();
        }
      });
    };
  }, [userRole, isConnected, subscribe]);
};

// Handlers para diferentes tipos de mensajes (sin cambios)
const handleClienteMessage = (message: WebSocketMessage) => {
  if (message.tipo === "CAMBIO_ESTADO" && message.estado) {
    const estadoTexto = getEstadoTexto(message.estado);
    toast.info(`🔔 ${estadoTexto}`, {
      position: "top-right",
      autoClose: 5000,
    });
  }
};

const handleNuevoPedidoCocinero = (message: WebSocketMessage) => {
  toast.success(
    `🔔 ¡Nuevo pedido #${message.pedidoId}! Cliente: ${
      message.cliente || "Sin nombre"
    }`,
    {
      position: "top-right",
      autoClose: 7000,
    }
  );

  playNotificationSound("kitchen");
};

const handleCancelacionCocinero = (message: WebSocketMessage) => {
  toast.warn(
    `❌ ¡CANCELADO! Pedido #${message.pedidoId} - Detener preparación`,
    {
      position: "top-right",
      autoClose: 8000,
      className: "toast-cancel",
    }
  );

  playNotificationSound("cancel");
};

const handlePedidoListoDelivery = (message: WebSocketMessage) => {
  toast.info(
    `🔔 Pedido #${message.pedidoId} listo para entregar - ${message.cliente}`,
    {
      position: "top-right",
      autoClose: 6000,
    }
  );

  playNotificationSound("delivery");
};

const handleCajeroMessage = (message: WebSocketMessage) => {
  if (message.tipo === "PEDIDO_NUEVO") {
    toast.info(
      `🔔 Nuevo pedido #${message.pedidoId} - Cliente: ${message.cliente}`,
      {
        position: "top-right",
        autoClose: 5000,
      }
    );
    playNotificationSound("default");
  } else if (message.tipo === "PEDIDO_CANCELADO") {
    toast.warn(`❌ Pedido #${message.pedidoId} cancelado`, {
      position: "top-right",
      autoClose: 4000,
    });
  }
};

const handleAdminMessage = (_message: WebSocketMessage) => {
  // Admin recibe mensajes pero sin toasts para evitar saturación
};

const handleEstadoCambio = (_message: WebSocketMessage) => {
  // Manejar cambios de estado generales
};

// Utilidades (sin cambios)
const getEstadoTexto = (estado: string): string => {
  switch (estado) {
    case "PENDIENTE":
      return "Tu pedido ha sido recibido";
    case "EN_PREPARACION":
      return "Tu pedido está siendo preparado";
    case "LISTO":
      return "Tu pedido está listo";
    case "ENTREGADO":
      return "Tu pedido ha sido entregado";
    case "CANCELADO":
      return "Tu pedido ha sido cancelado";
    default:
      return "Estado del pedido actualizado";
  }
};

const playNotificationSound = (
  type: "default" | "kitchen" | "delivery" | "cancel" = "default"
) => {
  try {
    const soundFiles = {
      default: "/notification.mp3",
      kitchen: "/kitchen-bell.mp3",
      delivery: "/delivery-ready.mp3",
      cancel: "/cancel-alert.mp3",
    };

    const volumes = {
      default: 0.3,
      kitchen: 0.6,
      delivery: 0.5,
      cancel: 0.7,
    };

    const audio = new Audio(soundFiles[type]);
    audio.volume = volumes[type];

    audio.play().catch(() => {
      if (type !== "default") {
        const fallbackAudio = new Audio(soundFiles.default);
        fallbackAudio.volume = 0.4;
        fallbackAudio.play().catch(() => {
          // Silencioso si no hay audio disponible
        });
      }
    });
  } catch (error) {
    // Silencioso si no hay soporte de audio
  }
};

// Hook específico para componentes que necesitan enviar mensajes WebSocket
export const useWebSocketSender = () => {
  const { send, isConnected } = useWebSocket();

  const sendMessage = (destination: string, message: any) => {
    if (!isConnected) {
      console.warn("⚠️ WebSocket no conectado, no se puede enviar mensaje");
      return false;
    }

    return send(destination, message);
  };

  const sendPing = () => {
    webSocketService.ping();
  };

  return {
    sendMessage,
    sendPing,
    isConnected,
  };
};
