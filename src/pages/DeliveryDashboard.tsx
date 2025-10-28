// src/pages/DeliveryDashboard.tsx
import { useState, useEffect } from "react";
import {
  RefreshCw,
  Eye,
  Truck,
  Phone,
  MapPin,
  Bell,
  Clock,
} from "lucide-react";
import { PedidoService } from "../services/PedidoServices";
import type { PedidoResponseDTO } from "../types/pedidos";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import PedidoDetalleModal from "../components/delivery/PedidoDetalleModal";
import { useWebSocket } from "../hooks/useWebSocket";
import { type WebSocketMessage } from "../services/WebSocketService";
import { toast } from "react-toastify";

export default function DeliveryDashboard() {
  const [pedidos, setPedidos] = useState<PedidoResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para el modal
  const [selectedPedido, setSelectedPedido] =
    useState<PedidoResponseDTO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEntregando, setIsEntregando] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // ✅ NUEVO: WebSocket integration
  const { subscribe, isConnected } = useWebSocket();

  const pedidoService = new PedidoService();

  // ✅ NUEVO: Suscribirse a notificaciones WebSocket para delivery
  useEffect(() => {
    if (!isConnected) {
      console.log("⏳ Esperando conexión WebSocket para delivery...");
      return;
    }

    console.log("🔌 Delivery conectando a WebSocket...");

    const subscriptions: any[] = [];

    // Suscribirse a pedidos listos para delivery
    const pedidosListosSub = subscribe(
      "/topic/delivery/disponibles",
      (message: WebSocketMessage) => {
        console.log("🚚 Nuevo pedido listo para delivery:", message);

        if (message.tipo === "PEDIDO_LISTO_DELIVERY") {
          // Sonido de notificación para delivery
          playDeliveryNotificationSound();

          toast.success(
            `🆕 ¡Pedido #${message.pedidoId} listo para entregar! Cliente: ${
              message.cliente || "Sin nombre"
            }`,
            {
              position: "top-right",
              autoClose: 8000,
              onClick: () => {
                // Al hacer click, refrescar automáticamente
                handleRefresh();
              },
            }
          );

          // Refrescar pedidos automáticamente
          cargarPedidos();
        }
      }
    );

    // Suscribirse a cambios de estado generales
    const estadoSub = subscribe(
      "/topic/pedidos/estados",
      (message: WebSocketMessage) => {
        console.log("🔄 Cambio de estado en delivery:", message);

        if (message.tipo === "CAMBIO_ESTADO") {
          // Solo mostrar notificaciones relevantes para delivery
          if (message.estado === "LISTO" || message.estado === "ENTREGADO") {
            const estadoTexto = getEstadoTextoDelivery(message.estado || "");

            toast.info(`🔄 Pedido #${message.pedidoId}: ${estadoTexto}`, {
              position: "top-right",
              autoClose: 4000,
            });

            // Refrescar lista automáticamente
            cargarPedidos();
          }
        }
      }
    );

    // Suscribirse a cancelaciones (para remover de la lista)
    const cancelacionSub = subscribe(
      "/topic/pedidos/estados",
      (message: WebSocketMessage) => {
        if (
          message.tipo === "CAMBIO_ESTADO" &&
          message.estado === "CANCELADO"
        ) {
          console.log("❌ Pedido cancelado en delivery:", message);

          toast.warn(
            `❌ Pedido #${message.pedidoId} cancelado - Remover de entrega`,
            {
              position: "top-right",
              autoClose: 6000,
            }
          );

          // Remover de la lista automáticamente
          setPedidos((prev) =>
            prev.filter((p) => p.idPedido !== message.pedidoId)
          );
        }
      }
    );

    if (pedidosListosSub) subscriptions.push(pedidosListosSub);
    if (estadoSub) subscriptions.push(estadoSub);
    if (cancelacionSub) subscriptions.push(cancelacionSub);

    // Cleanup
    return () => {
      subscriptions.forEach((sub) => {
        if (sub?.unsubscribe) sub.unsubscribe();
      });
    };
  }, [isConnected, subscribe]);

  // ✅ NUEVO: Función para reproducir sonido específico de delivery
  const playDeliveryNotificationSound = () => {
    try {
      // Sonido específico para delivery
      const audio = new Audio("/delivery-ready.mp3"); // Agrega este archivo específico
      audio.volume = 0.6;
      audio.play().catch(() => {
        // Fallback a sonido genérico
        const fallbackAudio = new Audio("/notification.mp3");
        fallbackAudio.volume = 0.4;
        fallbackAudio.play().catch(() => console.log("Audio no disponible"));
      });
    } catch (error) {
      console.log("Audio no soportado");
    }
  };

  // ✅ NUEVO: Obtener texto específico para delivery
  const getEstadoTextoDelivery = (estado: string): string => {
    switch (estado) {
      case "LISTO":
        return "listo para entregar";
      case "ENTREGADO":
        return "entregado correctamente";
      case "CANCELADO":
        return "cancelado - remover de lista";
      default:
        return "actualizado";
    }
  };

  // Cargar pedidos listos para entrega
  const cargarPedidos = async () => {
    try {
      setError(null);
      const response = await pedidoService.getPedidosListosParaEntrega();
      setPedidos(response);
      setLastUpdate(new Date());
      console.log("🔄 Pedidos de delivery actualizados:", response.length);
    } catch (err) {
      setError("Error al cargar los pedidos");
      console.error("Error:", err);
      toast.error("Error al cargar pedidos", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refrescar pedidos
  const handleRefresh = async () => {
    setRefreshing(true);
    await cargarPedidos();
  };

  // Cargar pedidos al montar el componente
  useEffect(() => {
    cargarPedidos();
  }, []);

  // Formatear fecha y hora
  const formatearFechaHora = (fecha: string) => {
    const fechaObj = new Date(fecha);
    return {
      fecha: fechaObj.toLocaleDateString("es-AR"),
      hora: fechaObj.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  // ✅ NUEVO: Calcular tiempo transcurrido desde que está listo
  const calcularTiempoEspera = (fecha: string) => {
    const fechaPedido = new Date(fecha);
    const ahora = new Date();
    const diffMinutos = Math.floor(
      (ahora.getTime() - fechaPedido.getTime()) / (1000 * 60)
    );

    if (diffMinutos < 60) {
      return `${diffMinutos} min`;
    } else {
      const horas = Math.floor(diffMinutos / 60);
      const minutos = diffMinutos % 60;
      return `${horas}h ${minutos}m`;
    }
  };

  // ✅ NUEVO: Determinar prioridad basada en tiempo de espera
  const getPrioridad = (fecha: string) => {
    const fechaPedido = new Date(fecha);
    const ahora = new Date();
    const diffMinutos = Math.floor(
      (ahora.getTime() - fechaPedido.getTime()) / (1000 * 60)
    );

    if (diffMinutos > 30) return "alta";
    if (diffMinutos > 15) return "media";
    return "baja";
  };

  // Abrir modal de detalle
  const handleVerDetalle = (pedido: PedidoResponseDTO) => {
    setSelectedPedido(pedido);
    setIsModalOpen(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPedido(null);
  };

  // Marcar pedido como entregado
  const handleEntregar = async (idPedido: number) => {
    try {
      setIsEntregando(true);
      await pedidoService.marcarEntregado(idPedido);

      // Remover el pedido de la lista
      setPedidos((prev) => prev.filter((p) => p.idPedido !== idPedido));

      // Cerrar el modal
      handleCloseModal();

      // Toast de confirmación
      toast.success(`✅ Pedido #${idPedido} entregado correctamente`, {
        position: "top-right",
        autoClose: 3000,
      });

      console.log("✅ Pedido entregado correctamente");
    } catch (error) {
      console.error("❌ Error al entregar pedido:", error);
      setError("Error al marcar el pedido como entregado");
      toast.error("Error al marcar como entregado", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsEntregando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header mejorado con WebSocket */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🚚 Pedidos a Entregar
              </h1>
              <div className="flex items-center mt-2 space-x-4">
                {/* ✅ NUEVO: Indicador de estado WebSocket */}
                <div
                  className={`flex items-center ${
                    isConnected ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                    }`}
                  ></div>
                  <span className="text-sm">
                    {isConnected
                      ? "🔌 Notificaciones en tiempo real"
                      : "⚠️ Sin conexión tiempo real"}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} listo
                  {pedidos.length !== 1 ? "s" : ""} para entrega
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              {/* ✅ NUEVO: Indicador de pedidos urgentes */}
              {pedidos.filter((p) => getPrioridad(p.fecha) === "alta").length >
                0 && (
                <div className="flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  <span className="animate-pulse mr-1">🚨</span>
                  {
                    pedidos.filter((p) => getPrioridad(p.fecha) === "alta")
                      .length
                  }{" "}
                  urgente(s)
                </div>
              )}

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                <span>{refreshing ? "Actualizando..." : "Actualizar"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ NUEVO: Información sobre notificaciones WebSocket */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-orange-800 mb-2">
                Sistema de Notificaciones para Delivery
              </h3>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>
                  • <strong>🆕 Nuevos pedidos listos:</strong> Recibirás
                  notificaciones cuando un pedido esté listo para entregar
                </li>
                <li>
                  • <strong>🔄 Actualizaciones automáticas:</strong> La lista se
                  actualiza en tiempo real
                </li>
                <li>
                  • <strong>❌ Cancelaciones:</strong> Los pedidos cancelados se
                  remueven automáticamente
                </li>
                <li>
                  • <strong>🚨 Prioridades:</strong> Los pedidos con más tiempo
                  de espera se marcan como urgentes
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
            >
              Reintentar
            </button>
          </div>
        )}

        {pedidos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay pedidos para entregar
            </h3>
            <p className="text-gray-600 mb-4">
              Todos los pedidos han sido entregados. ¡Buen trabajo!
            </p>
            <p className="text-sm text-orange-600">
              🔔 Recibirás notificaciones automáticas cuando haya nuevos pedidos
              listos
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {/* ✅ NUEVO: Header con estadísticas */}
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  Total: {pedidos.length} pedidos • Urgentes:{" "}
                  {
                    pedidos.filter((p) => getPrioridad(p.fecha) === "alta")
                      .length
                  }{" "}
                  • Última actualización:{" "}
                  {lastUpdate.toLocaleTimeString("es-AR")}
                </span>
                {isConnected && (
                  <span className="text-green-600 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                    En tiempo real
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pedido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dirección
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiempo de Espera
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pedidos
                    .sort((a, b) => {
                      // Ordenar por prioridad: urgentes primero
                      const prioridadA = getPrioridad(a.fecha);
                      const prioridadB = getPrioridad(b.fecha);
                      if (prioridadA === "alta" && prioridadB !== "alta")
                        return -1;
                      if (prioridadB === "alta" && prioridadA !== "alta")
                        return 1;
                      return (
                        new Date(b.fecha).getTime() -
                        new Date(a.fecha).getTime()
                      );
                    })
                    .map((pedido) => {
                      const { fecha, hora } = formatearFechaHora(pedido.fecha);
                      const tiempoEspera = calcularTiempoEspera(pedido.fecha);
                      const prioridad = getPrioridad(pedido.fecha);

                      return (
                        <tr
                          key={pedido.idPedido}
                          className={`hover:bg-gray-50 ${
                            prioridad === "alta"
                              ? "bg-red-50 border-l-4 border-l-red-500"
                              : prioridad === "media"
                              ? "bg-yellow-50 border-l-4 border-l-yellow-500"
                              : "border-l-4 border-l-green-500"
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                #{pedido.idPedido}
                              </div>
                              {prioridad === "alta" && (
                                <span className="ml-2 text-red-500">🚨</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{fecha}</div>
                            <div className="text-sm text-gray-500">{hora}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {pedido.nombreCliente} {pedido.apellidoCliente}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs">
                              <div className="flex items-start space-x-1">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span>
                                  {pedido.domicilio?.calle}{" "}
                                  {pedido.domicilio?.numero}
                                </span>
                              </div>
                              {pedido.domicilio?.localidad && (
                                <div className="text-xs text-gray-500 ml-5">
                                  {pedido.domicilio.localidad}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {pedido.domicilio?.localidad || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <a
                                href={`tel:${pedido.telefonoCliente}`}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                {pedido.telefonoCliente}
                              </a>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div
                              className={`flex items-center space-x-1 ${
                                prioridad === "alta"
                                  ? "text-red-600"
                                  : prioridad === "media"
                                  ? "text-yellow-600"
                                  : "text-green-600"
                              }`}
                            >
                              <Clock className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {tiempoEspera}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleVerDetalle(pedido)}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver Detalle
                              </button>
                              <button
                                onClick={() => handleEntregar(pedido.idPedido)}
                                disabled={isEntregando}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                              >
                                <Truck className="w-4 h-4 mr-1" />
                                Entregar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalle */}
      {selectedPedido && (
        <PedidoDetalleModal
          pedido={selectedPedido}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onEntregar={handleEntregar}
          isEntregando={isEntregando}
        />
      )}
    </div>
  );
}
