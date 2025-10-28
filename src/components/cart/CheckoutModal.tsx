import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  User,
  MessageSquare,
  CreditCard,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

// ✅ CAMBIO PRINCIPAL: Usar Context Unificado
import { useCarritoUnificado } from "../../context/CarritoUnificadoContext";

import { useAuth } from "../../hooks/useAuth";
import { PedidoService } from "../../services/PedidoServices";
import { ClienteService } from "../../services/ClienteService";
import type { PedidoRequestDTO } from "../../types/pedidos/PedidoRequestDTO";
import type { ClienteResponseDTO } from "../../types/clientes/ClienteResponseDTO";

import { PagoService } from "../../services/PagoService";
import { apiClienteService } from "../../services/ApiClienteService";

const pedidoService = new PedidoService();
const pagoService = new PagoService();

interface CheckoutModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onExito: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  abierto,
  onCerrar,
  onExito,
}) => {
  // ✅ CAMBIO: Usar Context Unificado en lugar del anterior
  const carrito = useCarritoUnificado();

  const {
    user,
    backendUser,
    auth0User,
    isAuthenticated,
    backendSynced,
    isLoading,
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [loadingDomicilios, setLoadingDomicilios] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idSucursal] = useState(1);
  const [domicilios, setDomicilios] = useState<
    ClienteResponseDTO["domicilios"]
  >([]);
  const [domicilioSeleccionado, setDomicilioSeleccionado] = useState<
    number | null
  >(null);

  // ✅ ADAPTAR: Usar observaciones del Context Unificado
  const observaciones = carrito.state.datosEntrega.observaciones || "";

  // ✅ ADAPTAR: Función para actualizar observaciones
  const handleObservacionesChange = (value: string) => {
    carrito.setDatosEntrega({
      ...carrito.state.datosEntrega,
      observaciones: value,
    });
  };

  // 🚨 FUNCIÓN HELPER PARA OBTENER EL USER ID - ADAPTADA AL useAuth
  const getUserId = (): number | null => {
    console.log("🔍 DEBUG getUserId:", {
      backendUser,
      backendUserIdCliente: backendUser?.idCliente,
      user,
      userHasIdCliente: user && "idCliente" in user,
      userHasUserId: user && "userId" in user,
      userIdCliente:
        user && "idCliente" in user ? (user as any).idCliente : "NO_TIENE",
      userUserId: user && "userId" in user ? (user as any).userId : "NO_TIENE",
    });

    // Priorizar backendUser.idCliente si está disponible
    if (backendUser?.idCliente) {
      console.log("✅ Usando backendUser.idCliente:", backendUser.idCliente);
      return backendUser.idCliente;
    }

    // Si user es backendUser, buscar idCliente
    if (user && "idCliente" in user) {
      const userId = (user as any).idCliente;
      console.log("✅ Usando user.idCliente:", userId);
      return userId;
    }

    // Si user tiene userId (como vimos en logs anteriores)
    if (user && "userId" in user) {
      const userId = (user as any).userId;
      console.log("✅ Usando user.userId:", userId);
      return userId;
    }

    console.log("❌ No se encontró userId válido");
    return null;
  };

  // 🚨 FUNCIÓN HELPER PARA OBTENER DATOS DEL USUARIO - ADAPTADA AL useAuth
  const getUserData = () => {
    // Priorizar backendUser si está disponible
    if (backendUser) {
      return {
        nombre: backendUser.nombre,
        apellido: backendUser.apellido,
        email: backendUser.email,
      };
    }

    // Si user es backendUser (cuando authState.backendUser se asigna a user)
    if (user && "idCliente" in user) {
      const backendUserData = user as any;
      return {
        nombre: backendUserData.nombre,
        apellido: backendUserData.apellido,
        email: backendUserData.email,
      };
    }

    // Fallback a auth0User si no hay datos del backend
    if (auth0User) {
      return {
        nombre:
          auth0User.given_name || auth0User.name?.split(" ")[0] || "Usuario",
        apellido: auth0User.family_name || auth0User.name?.split(" ")[1] || "",
        email: auth0User.email,
      };
    }

    return null;
  };

  const cargarDomicilios = async () => {
    try {
      setLoadingDomicilios(true);
      const userId = getUserId();

      console.log("🏠 Cargando domicilios para usuario:", userId);
      console.log("🔍 Estado del auth:", {
        isAuthenticated,
        backendSynced,
        userId,
        backendUser: !!backendUser,
        user: !!user,
      });

      if (!userId) {
        console.log("❌ No se pudo obtener el ID del usuario");
        return;
      }

      const cliente = await ClienteService.getById(userId);
      console.log("👤 Cliente completo:", cliente);
      console.log("🏠 Domicilios del cliente:", cliente.domicilios);

      if (cliente.domicilios && cliente.domicilios.length > 0) {
        setDomicilios(cliente.domicilios);
        console.log("🏠 Domicilios cargados:", cliente.domicilios.length);
      } else {
        console.log("🏠 Usuario sin domicilios registrados");
        setDomicilios([]);
      }
    } catch (err) {
      console.error("❌ Error al cargar domicilios:", err);
    } finally {
      setLoadingDomicilios(false);
    }
  };

  useEffect(() => {
    const userId = getUserId();
    if (abierto && isAuthenticated && backendSynced && userId) {
      cargarDomicilios();
    }
  }, [abierto, isAuthenticated, backendSynced, backendUser?.idCliente]);

  if (!abierto) return null;

  // Mostrar loading si Auth0 está cargando o no está sincronizado
  if (isLoading || !backendSynced) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CD6C50] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información del usuario...</p>
        </div>
      </div>
    );
  }

  const handleConfirmarPedido = async () => {
    try {
      setLoading(true);
      setError(null);

      // 🚨 LOGS DE DEBUG
      const userId = getUserId();
      const userData = getUserData();

      console.log("🔐 ESTADO DE AUTH AL CONFIRMAR:", {
        isAuthenticated,
        backendSynced,
        userId,
        userData,
        backendUser: !!backendUser,
        user: !!user,
        isLoading,
      });

      // Validaciones básicas
      if (!isAuthenticated || !backendSynced) {
        console.error(
          "❌ FALLO EN VALIDACIÓN AUTH - No autenticado o no sincronizado"
        );
        setError("Debes iniciar sesión para realizar un pedido");
        return;
      }

      if (!userId) {
        console.error(
          "❌ FALLO EN VALIDACIÓN AUTH - No se pudo obtener userId"
        );
        setError(
          "Error al obtener información del usuario. Intenta recargar la página."
        );
        return;
      }

      if (carrito.estaVacio) {
        setError("El carrito está vacío");
        return;
      }

      // ✅ ADAPTAR: Validar domicilio para delivery usando Context Unificado
      if (carrito.state.datosEntrega.tipoEnvio === "DELIVERY") {
        if (domicilios.length === 0) {
          setError(
            'No tienes domicilios registrados. Agrega uno en tu perfil o selecciona "Retiro en local"'
          );
          return;
        }
        if (!domicilioSeleccionado) {
          setError("Debes seleccionar un domicilio para delivery");
          return;
        }
      }

      // ✅ ADAPTAR: Crear el request del pedido usando Context Unificado
      const pedidoRequest: PedidoRequestDTO = {
        idCliente: userId,
        idSucursal: idSucursal,
        tipoEnvio: carrito.state.datosEntrega.tipoEnvio,
        // SOLO incluir domicilio si es delivery Y está seleccionado
        ...(carrito.state.datosEntrega.tipoEnvio === "DELIVERY" &&
        domicilioSeleccionado
          ? {
              idDomicilio: domicilioSeleccionado,
            }
          : {}),
        detalles: carrito.state.items.map((item) => ({
          idArticulo: item.id,
          cantidad: item.cantidad,
        })),
        // Incluir observaciones si hay alguna
        ...(observaciones.trim()
          ? { observaciones: observaciones.trim() }
          : {}),
      };

      // 🚨 LOGS IMPORTANTES PARA DEBUG
      console.log(
        "🛒 PEDIDO REQUEST COMPLETO:",
        JSON.stringify(pedidoRequest, null, 2)
      );
      console.log("📝 Observaciones enviadas:", `"${observaciones}"`);
      console.log("🏠 ID Domicilio enviado:", domicilioSeleccionado);
      console.log("🚚 Tipo de envío:", carrito.state.datosEntrega.tipoEnvio);
      console.log("👤 ID Cliente:", userId);

      // Crear el pedido
      const pedidoCreado = await pedidoService.crearPedido(pedidoRequest);

      console.log("✅ Pedido creado exitosamente:", pedidoCreado);

      // ✅ NUEVO: Crear pago en efectivo automáticamente
      try {
        console.log("💵 Creando pago en efectivo para el pedido...");

        // Obtener la factura del pedido
        const factura = await pagoService.getFacturaPedido(
          pedidoCreado.idPedido
        );
        console.log("📄 Factura obtenida para pago:", factura);

        // Crear el pago en efectivo - SIN TIPOS ESPECÍFICOS
        const pagoRequest = {
          facturaId: factura.idFactura,
          formaPago: "EFECTIVO",
          monto: factura.totalVenta,
          moneda: "ARS",
          descripcion: `Pago en efectivo - Pedido #${pedidoCreado.idPedido} - ${carrito.state.datosEntrega.tipoEnvio}`,
        };

        console.log("💳 Datos del pago a crear:", pagoRequest);

        const pagoCreado = await apiClienteService.post("/pagos", pagoRequest);
        console.log("✅ Pago en efectivo creado exitosamente:", pagoCreado);
      } catch (pagoError: any) {
        console.error("❌ Error al crear pago en efectivo:", pagoError);
        console.log(
          "⚠️ El pedido se creó correctamente. El pago se puede crear manualmente desde gestión."
        );
        // No fallar todo el proceso
      }

      console.log("✅ Pedido creado exitosamente:", pedidoCreado);
      console.log("📝 Observaciones en respuesta:", pedidoCreado.observaciones);

      // ✅ ADAPTAR: Limpiar carrito usando Context Unificado
      carrito.limpiarCarrito();

      // Notificar éxito
      onExito();
      onCerrar();
    } catch (err: any) {
      console.error("❌ Error al crear pedido:", err);
      setError(err.message || "Error al procesar el pedido. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Obtener datos del usuario para mostrar
  const userData = getUserData();
  const userId = getUserId();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-6 h-6 text-[#CD6C50]" />
            <h2 className="text-xl font-bold text-gray-800">
              Confirmar Pedido
            </h2>
          </div>
          <button
            onClick={onCerrar}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Error</h4>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* DEBUG INFO - Remover en producción */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
            <strong>🐛 DEBUG:</strong>
            <br />
            UserID: {userId}
            <br />
            Observaciones: "{observaciones}"
            <br />
            Domicilio: {domicilioSeleccionado || "Sin seleccionar"}
            <br />
            Tipo: {carrito.state.datosEntrega.tipoEnvio}
            <br />
            Auth: {isAuthenticated ? "Sí" : "No"} | Synced:{" "}
            {backendSynced ? "Sí" : "No"} | Loading: {isLoading ? "Sí" : "No"}
            <br />
            Backend User: {backendUser ? "Sí" : "No"}
            <br />
            Items en carrito: {carrito.state.items.length}
          </div>

          {/* Información del cliente */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <User className="w-5 h-5 text-[#CD6C50]" />
              <h3 className="font-semibold text-gray-800">
                Información del cliente
              </h3>
            </div>
            {userData ? (
              <>
                <p className="text-gray-700">
                  {userData.nombre} {userData.apellido}
                </p>
                <p className="text-gray-600 text-sm">{userData.email}</p>
              </>
            ) : (
              <p className="text-gray-500">
                Cargando información del usuario...
              </p>
            )}
          </div>

          {/* Tipo de entrega y domicilio */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <MapPin className="w-5 h-5 text-[#CD6C50]" />
              <h3 className="font-semibold text-gray-800">Entrega</h3>
            </div>
            <p className="text-gray-700 mb-3">
              {carrito.state.datosEntrega.tipoEnvio === "DELIVERY"
                ? "Delivery"
                : "Retiro en local"}
            </p>

            {/* Selector de domicilio para DELIVERY */}
            {carrito.state.datosEntrega.tipoEnvio === "DELIVERY" && (
              <div className="space-y-3">
                {loadingDomicilios ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : domicilios.length === 0 ? (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-orange-700 text-sm font-medium">
                      ⚠️ No tienes domicilios registrados
                    </p>
                    <p className="text-orange-600 text-xs mt-1">
                      Agrega un domicilio en tu perfil o selecciona "Retiro en
                      local"
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccionar dirección:
                    </label>
                    <div className="relative">
                      <select
                        value={domicilioSeleccionado || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          const nuevoId = value ? Number(value) : null;
                          console.log(
                            "🏠 Cambiando domicilio de",
                            domicilioSeleccionado,
                            "a:",
                            nuevoId
                          );
                          setDomicilioSeleccionado(nuevoId);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent appearance-none bg-white"
                      >
                        <option value="">Selecciona una dirección</option>
                        {domicilios.map((domicilio, index) => {
                          // Usar idDomicilio si existe, sino usar el índice + 1
                          const valorOption =
                            domicilio.idDomicilio || index + 1;
                          return (
                            <option key={index} value={valorOption}>
                              {domicilio.calle} {domicilio.numero},{" "}
                              {domicilio.localidad} - CP {domicilio.cp}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Mostrar dirección seleccionada */}
                    {domicilioSeleccionado && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        {(() => {
                          const domicilio = domicilios.find((d, index) => {
                            const idABuscar = d.idDomicilio || index + 1;
                            return idABuscar === domicilioSeleccionado;
                          });
                          return domicilio ? (
                            <p className="text-green-700 text-sm">
                              📍 <strong>Entregar en:</strong> {domicilio.calle}{" "}
                              {domicilio.numero}, {domicilio.localidad} - CP{" "}
                              {domicilio.cp}
                            </p>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ✅ ADAPTAR: Resumen del pedido usando Context Unificado */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              Resumen del pedido
            </h3>
            <div className="space-y-2 text-sm">
              {carrito.state.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.nombre} x{item.cantidad}
                  </span>
                  <span>${(item.precio * item.cantidad).toFixed(0)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${carrito.subtotal.toFixed(0)}</span>
                </div>
                {/* ✅ NOTA: Ajustar cuando implementemos promociones en Context Unificado */}
                <div className="flex justify-between font-bold text-lg text-[#CD6C50] border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>${carrito.total.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Observaciones adicionales
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => handleObservacionesChange(e.target.value)}
              placeholder="Ej: Sin cebolla, extra queso, tocar timbre del 2do piso..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent resize-none"
              rows={3}
            />
            {observaciones.trim() && (
              <p className="text-xs text-green-600 mt-1">
                ✓ "{observaciones.trim()}"
              </p>
            )}
          </div>

          {/* ✅ NOTA: Tiempo estimado - ajustar cuando implementemos en Context */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>Tiempo estimado:</strong>{" "}
              {carrito.state.items.length > 0
                ? Math.max(
                    ...carrito.state.items.map(
                      (item) => item.tiempoPreparacion || 20
                    )
                  ) +
                  (carrito.state.datosEntrega.tipoEnvio === "DELIVERY" ? 15 : 0)
                : 0}{" "}
              minutos
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={onCerrar}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmarPedido}
              disabled={
                loading ||
                carrito.estaVacio ||
                !userId ||
                !isAuthenticated ||
                !backendSynced
              }
              className="flex-1 px-4 py-3 bg-[#CD6C50] text-white rounded-lg hover:bg-[#b85a42] transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Procesando..." : "Confirmar Pedido"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
