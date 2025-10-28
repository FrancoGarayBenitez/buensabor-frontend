import React, { useState, useEffect } from "react";
import { useCocina } from "../../hooks/useCocina";
import { PedidoService } from "../../services/PedidoServices";
import type {
  PedidoResponseDTO,
  DetallePedidoResponseDTO,
} from "../../types/pedidos";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Alert } from "../common/Alert";
import { PedidoDetalleCocinaModal } from "../cocina/PedidoDetalleCocinaModal";
import { RecetaModal } from "../cocina/RecetaModal";
import { useAuth } from "../../hooks/useAuth";
import Header from "../layout/Header";
import { useWebSocket } from "../../hooks/useWebSocket";
import { type WebSocketMessage } from "../../services/WebSocketService";
import { toast } from "react-toastify";
import { isEmpleado } from "../../types/usuario/UserTypes";

// Componente para una tarjeta de pedido individual
interface PedidoCardProps {
  pedido: PedidoResponseDTO;
  onSiguienteEstado: (id: number, estadoActual: string) => void;
  onExtenderTiempo: (id: number) => void;
  onVerDetalle: (pedido: PedidoResponseDTO) => void;
  loading?: boolean;
}

const PedidoCard: React.FC<PedidoCardProps> = ({
  pedido,
  onSiguienteEstado,
  onExtenderTiempo,
  onVerDetalle,
  loading = false,
}) => {
  const [procesando, setProcesando] = useState(false);

  const handleSiguienteEstado = async () => {
    setProcesando(true);
    try {
      await onSiguienteEstado(pedido.idPedido, pedido.estado);
    } finally {
      setProcesando(false);
    }
  };

  const handleExtenderTiempo = () => {
    onExtenderTiempo(pedido.idPedido);
  };

  // Formatear tiempos
  const { fecha, hora, horaEstimada } = PedidoService.formatearTiempos(
    pedido.fecha,
    pedido.horaEstimadaFinalizacion
  );

  // Calcular si está retrasado (solo para pedidos en preparación)
  const ahora = new Date();
  const horaEstimadaDate = new Date();
  const [horas, minutos] = pedido.horaEstimadaFinalizacion
    .split(":")
    .map(Number);
  horaEstimadaDate.setHours(horas, minutos, 0, 0);
  const estaRetrasado =
    pedido.estado === "PREPARACION" && ahora > horaEstimadaDate;

  // Obtener botón según estado
  const getBotonSiguiente = () => {
    switch (pedido.estado) {
      case "PENDIENTE":
        return "Iniciar Preparación";
      case "PREPARACION":
        return "Marcar Listo";
      default:
        return null;
    }
  };

  const botonTexto = getBotonSiguiente();

  return (
    <div
      className={`bg-white rounded-lg shadow-md border-l-4 p-4 mb-3 transition-all hover:shadow-lg ${
        estaRetrasado
          ? "border-l-red-500 bg-red-50"
          : pedido.estado === "PENDIENTE"
          ? "border-l-yellow-500"
          : pedido.estado === "PREPARACION"
          ? "border-l-blue-500"
          : "border-l-green-500"
      }`}
    >
      {/* Header con número de pedido */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-800">
            Pedido #{pedido.idPedido}
          </h3>
          <p className="text-sm text-gray-600">
            {pedido.nombreCliente} {pedido.apellidoCliente}
          </p>
          <p className="text-xs text-gray-500">
            {pedido.tipoEnvio === "DELIVERY" ? "🚚 Delivery" : "📦 Take Away"}
          </p>
        </div>
        {estaRetrasado && (
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
            ⚠️ Retrasado
          </span>
        )}
      </div>

      {/* Productos resumidos */}
      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700 mb-1">Productos:</p>
        <div className="text-sm text-gray-600">
          {pedido.detalles.slice(0, 2).map((detalle, index) => (
            <div key={detalle.idDetallePedido} className="flex justify-between">
              <span>
                {detalle.cantidad}x {detalle.denominacionArticulo}
              </span>
            </div>
          ))}
          {pedido.detalles.length > 2 && (
            <p className="text-xs text-gray-500 italic">
              +{pedido.detalles.length - 2} productos más...
            </p>
          )}
        </div>
      </div>

      {/* Información de tiempo */}
      <div className="mb-3 p-2 bg-gray-50 rounded">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tiempo estimado:</span>
          <span
            className={`font-medium ${
              estaRetrasado ? "text-red-600" : "text-gray-800"
            }`}
          >
            {horaEstimada}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total:</span>
          <span className="font-medium text-gray-800">
            {pedido.tiempoEstimadoTotal} min
          </span>
        </div>
      </div>

      {/* Observaciones si las hay */}
      {pedido.observaciones && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs font-medium text-yellow-800">Observaciones:</p>
          <p className="text-sm text-yellow-700">{pedido.observaciones}</p>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-2">
        {/* Botón ver detalle - siempre disponible para pedidos en preparación */}
        {pedido.estado === "PREPARACION" && (
          <button
            onClick={() => onVerDetalle(pedido)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm py-2 px-3 rounded-md font-medium transition-colors"
          >
            Ver Detalle
          </button>
        )}

        {/* Botón +10 min - solo para pedidos en preparación */}
        {pedido.estado === "PREPARACION" && (
          <button
            onClick={handleExtenderTiempo}
            className="bg-orange-100 hover:bg-orange-200 text-orange-800 text-sm py-2 px-3 rounded-md font-medium transition-colors"
            disabled={procesando}
          >
            +10 min
          </button>
        )}

        {/* Botón siguiente estado */}
        {botonTexto && (
          <button
            onClick={handleSiguienteEstado}
            disabled={procesando || loading}
            className={`flex-1 text-white text-sm py-2 px-3 rounded-md font-medium transition-colors disabled:opacity-50 ${
              pedido.estado === "PENDIENTE"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {procesando ? "Procesando..." : botonTexto}
          </button>
        )}
      </div>
    </div>
  );
};

// Componente para una columna del Kanban
interface ColumnaKanbanProps {
  titulo: string;
  pedidos: PedidoResponseDTO[];
  color: string;
  onSiguienteEstado: (id: number, estadoActual: string) => void;
  onExtenderTiempo: (id: number) => void;
  onVerDetalle: (pedido: PedidoResponseDTO) => void;
  loading?: boolean;
}

const ColumnaKanban: React.FC<ColumnaKanbanProps> = ({
  titulo,
  pedidos,
  color,
  onSiguienteEstado,
  onExtenderTiempo,
  onVerDetalle,
  loading = false,
}) => {
  return (
    <div className="flex-1 min-w-80">
      {/* Header de la columna */}
      <div className={`${color} text-white p-3 rounded-t-lg`}>
        <h2 className="font-bold text-lg text-center">{titulo}</h2>
        <p className="text-center text-sm opacity-90">
          {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Contenido de la columna */}
      <div className="bg-gray-100 min-h-96 p-3 rounded-b-lg">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No hay pedidos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pedidos.map((pedido) => (
              <PedidoCard
                key={pedido.idPedido}
                pedido={pedido}
                onSiguienteEstado={onSiguienteEstado}
                onExtenderTiempo={onExtenderTiempo}
                onVerDetalle={onVerDetalle}
                loading={loading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Componente principal del Dashboard
export const CocinaDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const {
    pedidosPendientes,
    pedidosEnPreparacion,
    pedidosListos,
    loading,
    error,
    refreshPedidos,
    moverPedidoASiguienteEstado,
    extenderTiempo,
    totalPedidos,
    pedidoSeleccionado,
    setPedidoSeleccionado,
  } = useCocina();

  const [refreshing, setRefreshing] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showRecetaModal, setShowRecetaModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<DetallePedidoResponseDTO | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // ✅ NUEVO: WebSocket integration
  const { subscribe, isConnected } = useWebSocket();

  // ✅ NUEVO: Suscribirse a notificaciones WebSocket para cocineros
  useEffect(() => {
    if (!isConnected) {
      console.log("⏳ Esperando conexión WebSocket...");
      return;
    }

    console.log("🔌 Cocinero conectando a WebSocket...");

    const subscriptions: any[] = [];

    // Suscribirse a nuevos pedidos para cocina
    const nuevoPedidoSub = subscribe(
      "/topic/cocina/nuevos",
      (message: WebSocketMessage) => {
        console.log("🔔 Nuevo pedido para cocina:", message);

        if (message.tipo === "PEDIDO_NUEVO") {
          // Sonido de notificación más fuerte para cocina
          playKitchenNotificationSound();

          toast.success(
            `🆕 ¡Nuevo pedido #${message.pedidoId}! Cliente: ${
              message.cliente || "Sin nombre"
            }`,
            {
              position: "top-right",
              autoClose: 8000, // Más tiempo para cocina
              onClick: () => {
                // Al hacer click, refrescar automáticamente
                handleRefresh();
              },
            }
          );

          // Refrescar pedidos automáticamente
          refreshPedidos();
        }
      }
    );

    // Suscribirse a cambios de estado generales
    const estadoSub = subscribe(
      "/topic/pedidos/estados",
      (message: WebSocketMessage) => {
        console.log("🔄 Cambio de estado en cocina:", message);

        if (message.tipo === "CAMBIO_ESTADO") {
          const estadoTexto = getEstadoTextoCocinero(message.estado || "");

          toast.info(`🔄 Pedido #${message.pedidoId}: ${estadoTexto}`, {
            position: "top-right",
            autoClose: 4000,
          });

          // Refrescar para mostrar cambios
          refreshPedidos();
        }
      }
    );

    // Suscribirse específicamente a cancelaciones
    const cancelacionSub = subscribe(
      "/topic/cocina/cancelaciones",
      (message: WebSocketMessage) => {
        console.log("❌ Pedido cancelado:", message);

        if (message.tipo === "PEDIDO_CANCELADO") {
          toast.warn(`❌ Pedido #${message.pedidoId} ha sido cancelado`, {
            position: "top-right",
            autoClose: 6000,
          });

          // Refrescar lista
          refreshPedidos();
        }
      }
    );

    if (nuevoPedidoSub) subscriptions.push(nuevoPedidoSub);
    if (estadoSub) subscriptions.push(estadoSub);
    if (cancelacionSub) subscriptions.push(cancelacionSub);

    // Cleanup
    return () => {
      subscriptions.forEach((sub) => {
        if (sub?.unsubscribe) sub.unsubscribe();
      });
    };
  }, [isConnected, subscribe, refreshPedidos]);

  // ✅ NUEVO: Función para reproducir sonido específico de cocina
  const playKitchenNotificationSound = () => {
    try {
      // Sonido más prominente para cocina
      const audio = new Audio("/kitchen-bell.mp3"); // Agrega este archivo específico
      audio.volume = 0.7; // Más alto que otros roles
      audio.play().catch(() => {
        // Fallback a sonido genérico
        const fallbackAudio = new Audio("/notification.mp3");
        fallbackAudio.volume = 0.5;
        fallbackAudio.play().catch(() => console.log("Audio no disponible"));
      });
    } catch (error) {
      console.log("Audio no soportado");
    }
  };

  // ✅ NUEVO: Obtener texto específico para cocinero
  const getEstadoTextoCocinero = (estado: string): string => {
    switch (estado) {
      case "PENDIENTE":
        return "recibido, listo para preparar";
      case "EN_PREPARACION":
        return "enviado a preparación";
      case "LISTO":
        return "marcado como listo";
      case "ENTREGADO":
        return "entregado al cliente";
      case "CANCELADO":
        return "cancelado - detener preparación";
      default:
        return "actualizado";
    }
  };

  // Verificar que el usuario sea un empleado con rol COCINERO
  useEffect(() => {
    if (user && (!isEmpleado(user) || user.rol !== "COCINERO")) {
      console.error("Usuario no autorizado para acceder a cocina");
      logout();
    }
  }, [user, logout]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshPedidos();
      setLastUpdate(new Date());
      console.log("🔄 Pedidos actualizados en cocina");
    } catch (error) {
      console.error("Error al actualizar pedidos:", error);
      toast.error("Error al actualizar pedidos", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleExtenderTiempo = async (id: number) => {
    try {
      await extenderTiempo(id, 10); // Extender 10 minutos
      setLastUpdate(new Date());

      toast.success(`⏰ Tiempo extendido +10 min para pedido #${id}`, {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error al extender tiempo:", error);
      toast.error("Error al extender tiempo", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleVerDetalle = (pedido: PedidoResponseDTO) => {
    setPedidoSeleccionado(pedido);
    setShowDetalleModal(true);
  };

  const handleCerrarDetalle = () => {
    setShowDetalleModal(false);
    setPedidoSeleccionado(null);
  };

  const handleVerReceta = (producto: DetallePedidoResponseDTO) => {
    setProductoSeleccionado(producto);
    setShowRecetaModal(true);
  };

  const handleCerrarReceta = () => {
    setShowRecetaModal(false);
    setProductoSeleccionado(null);
  };

  const handleMarcarListo = async (id: number) => {
    try {
      await moverPedidoASiguienteEstado(id, "PREPARACION");
      setLastUpdate(new Date());

      toast.success(`✅ Pedido #${id} marcado como listo`, {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error al marcar como listo:", error);
      toast.error("Error al marcar como listo", {
        position: "top-right",
        autoClose: 3000,
      });
      throw error;
    }
  };

  const handleSiguienteEstado = async (id: number, estadoActual: string) => {
    try {
      await moverPedidoASiguienteEstado(id, estadoActual);
      setLastUpdate(new Date());

      const accionTexto =
        estadoActual === "PENDIENTE"
          ? "iniciada la preparación"
          : "marcado como listo";
      toast.success(`✅ Pedido #${id}: ${accionTexto}`, {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      toast.error("Error al cambiar estado del pedido", {
        position: "top-right",
        autoClose: 3000,
      });
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar específico de cocina */}
      <Header />

      {/* Contenido principal */}
      <div className="p-4">
        {/* Header con indicador WebSocket */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                👨‍🍳 Dashboard de Cocina
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
                  Gestión de pedidos • {totalPedidos} pedidos activos
                </p>
              </div>
            </div>

            {/* ✅ NUEVO: Botón de actualización mejorado */}
            <div className="flex space-x-2">
              {/* Indicador de pedidos pendientes urgentes */}
              {pedidosPendientes.length > 0 && (
                <div className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  <span className="animate-pulse mr-1">🔔</span>
                  {pedidosPendientes.length} pendiente(s)
                </div>
              )}

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className={`mr-2 ${refreshing ? "animate-spin" : ""}`}>
                  🔄
                </span>
                {refreshing ? "Actualizando..." : "Actualizar"}
              </button>
            </div>
          </div>

          {/* Indicadores de estado mejorados */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div
              className={`border rounded-lg p-3 text-center transition-all ${
                pedidosPendientes.length > 0
                  ? "bg-yellow-100 border-yellow-300 animate-pulse"
                  : "bg-yellow-50 border-yellow-200"
              }`}
            >
              <p className="text-yellow-800 font-bold text-xl">
                {pedidosPendientes.length}
              </p>
              <p className="text-yellow-700 text-sm">Pendientes</p>
              {pedidosPendientes.length > 0 && (
                <p className="text-xs text-yellow-600 mt-1">
                  ¡Requieren atención!
                </p>
              )}
            </div>
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 text-center">
              <p className="text-blue-800 font-bold text-xl">
                {pedidosEnPreparacion.length}
              </p>
              <p className="text-blue-700 text-sm">En Preparación</p>
            </div>
            <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
              <p className="text-green-800 font-bold text-xl">
                {pedidosListos.length}
              </p>
              <p className="text-green-700 text-sm">Listos</p>
            </div>
          </div>
        </div>

        {/* ✅ NUEVO: Información sobre notificaciones WebSocket */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">🔔</div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">
                Sistema de Notificaciones en Tiempo Real
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>
                  • <strong>🆕 Nuevos pedidos:</strong> Recibirás notificaciones
                  instantáneas con sonido
                </li>
                <li>
                  • <strong>🔄 Cambios de estado:</strong> Actualizaciones
                  automáticas del sistema
                </li>
                <li>
                  • <strong>❌ Cancelaciones:</strong> Alertas inmediatas de
                  pedidos cancelados
                </li>
                <li>
                  • <strong>⏰ Gestión de tiempo:</strong> Extiende tiempo de
                  preparación cuando sea necesario
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && <Alert type="error" message={error} className="mb-4" />}

        {/* Kanban Board */}
        <div className="flex gap-6 overflow-x-auto pb-4">
          <ColumnaKanban
            titulo="⏳ Pendiente"
            pedidos={pedidosPendientes}
            color="bg-yellow-600"
            onSiguienteEstado={handleSiguienteEstado}
            onExtenderTiempo={handleExtenderTiempo}
            onVerDetalle={handleVerDetalle}
            loading={loading}
          />

          <ColumnaKanban
            titulo="👨‍🍳 En Preparación"
            pedidos={pedidosEnPreparacion}
            color="bg-blue-600"
            onSiguienteEstado={handleSiguienteEstado}
            onExtenderTiempo={handleExtenderTiempo}
            onVerDetalle={handleVerDetalle}
            loading={loading}
          />

          <ColumnaKanban
            titulo="🍽️ Listo"
            pedidos={pedidosListos}
            color="bg-green-600"
            onSiguienteEstado={handleSiguienteEstado}
            onExtenderTiempo={handleExtenderTiempo}
            onVerDetalle={handleVerDetalle}
            loading={loading}
          />
        </div>

        {/* Modales */}
        <PedidoDetalleCocinaModal
          pedido={pedidoSeleccionado}
          isOpen={showDetalleModal}
          onClose={handleCerrarDetalle}
          onMarcarListo={handleMarcarListo}
          onVerReceta={handleVerReceta}
        />

        <RecetaModal
          producto={productoSeleccionado}
          isOpen={showRecetaModal}
          onClose={handleCerrarReceta}
        />

        {/* ✅ NUEVO: Footer informativo mejorado */}
        <div className="mt-8 bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                Flujo de trabajo:
              </h4>
              <ul className="space-y-1">
                <li>
                  ⏳ <strong>Pendiente:</strong> Iniciar preparación
                </li>
                <li>
                  👨‍🍳 <strong>En Preparación:</strong> Cocinar y marcar listo
                </li>
                <li>
                  🍽️ <strong>Listo:</strong> Esperando delivery/retiro
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Herramientas:</h4>
              <ul className="space-y-1">
                <li>
                  🔍 <strong>Ver detalle:</strong> Recetas e ingredientes
                </li>
                <li>
                  ⏰ <strong>+10 min:</strong> Extender tiempo estimado
                </li>
                <li>
                  ✅ <strong>Cambiar estado:</strong> Avanzar en el flujo
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                Notificaciones tiempo real:
              </h4>
              <ul className="space-y-1">
                <li>
                  🔔 <strong>Nuevos pedidos:</strong> Sonido + alerta visual
                </li>
                <li>
                  🔄 <strong>Actualizaciones:</strong> Sincronización automática
                </li>
                <li>
                  ❌ <strong>Cancelaciones:</strong> Avisos inmediatos
                </li>
                <li>
                  🔌 <strong>Estado conexión:</strong> Indicador en tiempo real
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
