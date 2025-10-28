import React, { useState, useEffect } from "react";
import {
  usePedidosGestion,
  type EstadoFiltro,
} from "../hooks/usePedidosGestion";
import { PedidosGestionTable } from "../components/cajero/PedidoGestionTable";
import { useWebSocket } from "../hooks/useWebSocket";
import { type WebSocketMessage } from "../services/WebSocketService";
import { toast } from "react-toastify";

const ESTADOS_FILTRO: { value: EstadoFiltro; label: string; color: string }[] =
  [
    { value: "TODOS", label: "Todos", color: "bg-gray-100 text-gray-800" },
    {
      value: "PENDIENTE",
      label: "A Confirmar",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "PREPARACION",
      label: "En Cocina",
      color: "bg-blue-100 text-blue-800",
    },
    { value: "LISTO", label: "Listos", color: "bg-green-100 text-green-800" },
    {
      value: "ENTREGADO",
      label: "Entregados",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "CANCELADO",
      label: "Cancelados",
      color: "bg-red-100 text-red-800",
    },
  ];

export const GestionPedidos: React.FC = () => {
  const {
    pedidos,
    loading,
    error,
    filtroEstado,
    busquedaCodigo,
    setFiltroEstado,
    setBusquedaCodigo,
    refreshPedidos,
    cambiarEstadoPedido,
    pedidosFiltrados,
  } = usePedidosGestion();

  const [showMore, setShowMore] = useState(false);
  const ITEMS_PER_PAGE = 20;

  // ✅ NUEVO: WebSocket integration
  const { subscribe, isConnected } = useWebSocket();

  // ✅ NUEVO: Suscribirse a notificaciones WebSocket
  useEffect(() => {
    if (!isConnected) {
      console.log("⏳ Esperando conexión WebSocket...");
      return;
    }

    console.log("🔌 Cajero conectando a WebSocket...");

    const subscriptions: any[] = [];

    // Suscribirse a nuevos pedidos
    const nuevoPedidoSub = subscribe(
      "/topic/cajero/pedidos",
      (message: WebSocketMessage) => {
        console.log("🔔 Nuevo pedido recibido:", message);

        if (message.tipo === "PEDIDO_NUEVO") {
          // Sonido de notificación
          playNotificationSound();

          toast.success(`🆕 ¡Nuevo pedido #${message.pedidoId}!`, {
            position: "top-right",
            autoClose: 6000,
            onClick: () => {
              // Buscar el pedido específico al hacer click
              setBusquedaCodigo(message.pedidoId?.toString() || "");
              setFiltroEstado("PENDIENTE"); // Mostrar pendientes
            },
          });

          // Refrescar lista automáticamente
          refreshPedidos();
        }
      }
    );

    // Suscribirse a cambios de estado
    const estadoSub = subscribe(
      "/topic/pedidos/estados",
      (message: WebSocketMessage) => {
        console.log("🔄 Cambio de estado recibido:", message);

        if (message.tipo === "CAMBIO_ESTADO") {
          const estadoTexto = getEstadoTextoNotificacion(message.estado || "");

          toast.info(`🔄 Pedido #${message.pedidoId}: ${estadoTexto}`, {
            position: "top-right",
            autoClose: 4000,
          });

          // Refrescar para mostrar cambios
          refreshPedidos();
        }
      }
    );

    if (nuevoPedidoSub) subscriptions.push(nuevoPedidoSub);
    if (estadoSub) subscriptions.push(estadoSub);

    // Cleanup
    return () => {
      subscriptions.forEach((sub) => {
        if (sub?.unsubscribe) sub.unsubscribe();
      });
    };
  }, [
    isConnected,
    subscribe,
    refreshPedidos,
    setBusquedaCodigo,
    setFiltroEstado,
  ]);

  // ✅ NUEVO: Función para reproducir sonido
  const playNotificationSound = () => {
    try {
      const audio = new Audio("/notification.mp3"); // Agrega este archivo a public/
      audio.volume = 0.5;
      audio.play().catch(() => console.log("Audio no disponible"));
    } catch (error) {
      console.log("Audio no soportado");
    }
  };

  // ✅ NUEVO: Obtener texto amigable del estado
  const getEstadoTextoNotificacion = (estado: string): string => {
    switch (estado) {
      case "PENDIENTE":
        return "recibido y esperando confirmación";
      case "EN_PREPARACION":
        return "enviado a cocina";
      case "LISTO":
        return "listo para entregar";
      case "ENTREGADO":
        return "entregado al cliente";
      case "CANCELADO":
        return "cancelado";
      default:
        return "actualizado";
    }
  };

  // Paginación simple
  const pedidosAMostrar = showMore
    ? pedidosFiltrados
    : pedidosFiltrados.slice(0, ITEMS_PER_PAGE);

  const handleRefresh = async () => {
    try {
      await refreshPedidos();
    } catch (error) {
      console.error("Error al refrescar:", error);
    }
  };

  // Callback para cuando se confirma un pago
  const handlePagoConfirmado = async () => {
    console.log("💵 Pago confirmado, recargando pedidos...");
    try {
      await refreshPedidos();
      // Toast de confirmación
      toast.success("💵 Pago confirmado correctamente", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error(
        "Error al recargar pedidos después de confirmar pago:",
        error
      );
      toast.error("Error al actualizar la lista de pedidos", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with WebSocket status */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Pedidos
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
              <p className="text-gray-600">
                Administra y controla el estado de todos los pedidos
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            {/* ✅ NUEVO: Indicador de pedidos pendientes con sonido */}
            {pedidos.filter((p) => p.estado === "PENDIENTE").length > 0 && (
              <div className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                <span className="animate-pulse mr-1">🔔</span>
                {pedidos.filter((p) => p.estado === "PENDIENTE").length}{" "}
                pendiente(s)
              </div>
            )}

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className={`mr-2 ${loading ? "animate-spin" : ""}`}>
                🔄
              </span>
              Actualizar
            </button>
          </div>
        </div>

        {/* Estadísticas rápidas - mejoradas con WebSocket */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          {ESTADOS_FILTRO.slice(1).map((estado) => {
            const count = pedidos.filter(
              (p) => p.estado === estado.value
            ).length;
            const isActive = filtroEstado === estado.value;

            return (
              <div
                key={estado.value}
                className={`bg-white p-4 rounded-lg shadow border transition-all cursor-pointer hover:shadow-md ${
                  isActive ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => setFiltroEstado(estado.value)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{estado.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      estado.color
                    } ${
                      count > 0 && estado.value === "PENDIENTE"
                        ? "animate-pulse"
                        : ""
                    }`}
                  >
                    {estado.value === "PENDIENTE"
                      ? "⏳"
                      : estado.value === "PREPARACION"
                      ? "👨‍🍳"
                      : estado.value === "LISTO"
                      ? "🍽️"
                      : estado.value === "ENTREGADO"
                      ? "✅"
                      : "❌"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Información sobre pagos pendientes - mejorada */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">💡</div>
          <div>
            <h3 className="font-semibold text-yellow-800 mb-2">
              Información sobre Pagos en Efectivo
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>
                • Los pedidos con <strong>💵 Pago pendiente</strong> requieren
                confirmación manual del cajero
              </li>
              <li>
                • Usa el botón <strong>"Confirmar Pago"</strong> cuando el
                cliente pague en efectivo
              </li>
              <li>• Los pagos con MercadoPago se confirman automáticamente</li>
              <li>
                •{" "}
                <strong className="text-yellow-800">
                  🔔 Recibirás notificaciones en tiempo real
                </strong>{" "}
                de nuevos pedidos y cambios
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda - sin cambios */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda por código */}
          <div>
            <label
              htmlFor="busqueda"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Buscar por código de pedido
            </label>
            <div className="relative">
              <input
                type="text"
                id="busqueda"
                placeholder="Ej: 123"
                value={busquedaCodigo}
                onChange={(e) => setBusquedaCodigo(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">🔍</span>
              </div>
            </div>
          </div>

          {/* Filtro por estado */}
          <div>
            <label
              htmlFor="filtro-estado"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Filtrar por estado
            </label>
            <select
              id="filtro-estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as EstadoFiltro)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {ESTADOS_FILTRO.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Información de resultados */}
        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <span>
            Mostrando {pedidosAMostrar.length} de {pedidosFiltrados.length}{" "}
            pedidos
            {filtroEstado !== "TODOS" &&
              ` (filtrado por: ${
                ESTADOS_FILTRO.find((e) => e.value === filtroEstado)?.label
              })`}
            {busquedaCodigo && ` (búsqueda: "${busquedaCodigo}")`}
          </span>
          {busquedaCodigo || filtroEstado !== "TODOS" ? (
            <button
              onClick={() => {
                setBusquedaCodigo("");
                setFiltroEstado("TODOS");
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">❌</span>
            <span className="text-red-700">{error}</span>
            <button
              onClick={handleRefresh}
              className="ml-auto text-red-600 hover:text-red-800 underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Tabla de pedidos - con callback mejorado */}
      <PedidosGestionTable
        pedidos={pedidosAMostrar}
        loading={loading}
        onCambiarEstado={cambiarEstadoPedido}
        onPagoConfirmado={handlePagoConfirmado}
      />

      {/* Resto del código sin cambios */}
      {pedidosFiltrados.length > ITEMS_PER_PAGE && !showMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowMore(true)}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Ver más pedidos ({pedidosFiltrados.length - ITEMS_PER_PAGE}{" "}
            restantes)
          </button>
        </div>
      )}

      {showMore && pedidosFiltrados.length > ITEMS_PER_PAGE && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowMore(false)}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Ver menos
          </button>
        </div>
      )}

      {/* Footer mejorado */}
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              Estados disponibles:
            </h4>
            <ul className="space-y-1">
              <li>
                ⏳ <strong>Pendiente:</strong> Esperando confirmación
              </li>
              <li>
                👨‍🍳 <strong>En Preparación:</strong> Siendo cocinado
              </li>
              <li>
                🍽️ <strong>Listo:</strong> Preparado para entrega/retiro
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              Acciones disponibles:
            </h4>
            <ul className="space-y-1">
              <li>
                🔍 <strong>Ver detalle:</strong> Información completa
              </li>
              <li>
                💵 <strong>Confirmar pago:</strong> Para pagos en efectivo
              </li>
              <li>
                ✅ <strong>Cambiar estado:</strong> Según flujo del pedido
              </li>
              <li>
                ❌ <strong>Anular:</strong> Cancelar pedido (si no está
                entregado)
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              Notificaciones tiempo real:
            </h4>
            <ul className="space-y-1">
              <li>
                🔔 <strong>Nuevos pedidos:</strong> Sonido + notificación
              </li>
              <li>
                🔄 <strong>Cambios estado:</strong> Actualización automática
              </li>
              <li>
                💵 <strong>Pagos:</strong> Confirmación instantánea
              </li>
              <li>
                🔌 <strong>Estado conexión:</strong> Indicador en tiempo real
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
