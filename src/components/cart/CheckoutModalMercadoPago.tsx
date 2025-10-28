import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  User,
  MessageSquare,
  CreditCard,
  AlertCircle,
  ChevronDown,
  DollarSign,
  Smartphone,
  CheckCircle,
  ExternalLink,
  Calculator,
  Tag,
  Truck,
  Clock,
  Gift,
} from "lucide-react";

// ✅ MIGRADO: Context Unificado en lugar del hook legacy
import {
  useCarritoItems,
  useCarritoTotales,
  useCarritoPromociones,
  useCarritoUnificado,
} from "../../context/CarritoUnificadoContext";

import { useAuth } from "../../hooks/useAuth";
import { PedidoService } from "../../services/PedidoServices";
import { MercadoPagoService } from "../../services/MercadoPagoService";
import ClienteService from "../../services/ClienteService";
import UsuarioService from "../../services/UsuarioService";
import { PagoService } from "../../services/PagoService";

import type { ClienteResponseDTO } from "../../types/clientes/ClienteResponseDTO";
import type { MetodoPago } from "../../types/mercadopago/MercadoPagoTypes";
import { isCliente } from "../../types/usuario/UserTypes";
import { apiClienteService } from "../../services/ApiClienteService";

const pedidoService = new PedidoService();
const mercadoPagoService = new MercadoPagoService();
const pagoService = new PagoService();

interface CheckoutModalMercadoPagoProps {
  abierto: boolean;
  onCerrar: () => void;
  onExito: (data?: any) => void;
}

const CheckoutModalMercadoPago: React.FC<CheckoutModalMercadoPagoProps> = ({
  abierto,
  onCerrar,
  onExito,
}) => {
  // ✅ MIGRADO: Context Unificado en lugar del hook legacy
  const { items, limpiarCarrito } = useCarritoItems();
  const {
    subtotal,
    total,
    totales,
    loading: loadingTotales,
  } = useCarritoTotales();
  const { promocionAgrupada } = useCarritoPromociones();
  const { state, setDatosEntrega } = useCarritoUnificado();

  const { user, isAuthenticated } = useAuth();

  // ✅ MIGRADO: Datos desde Context Unificado
  const datosEntrega = state.datosEntrega;
  const tipoEnvio = datosEntrega.tipoEnvio;
  const observaciones = datosEntrega.observaciones || "";
  const estaVacio = items.length === 0;

  const [loading, setLoading] = useState(false);
  const [loadingDomicilios, setLoadingDomicilios] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  // Estados del formulario
  const [idSucursal] = useState(1);
  const [domicilios, setDomicilios] = useState<
    ClienteResponseDTO["domicilios"]
  >([]);
  const [domicilioSeleccionado, setDomicilioSeleccionado] = useState<
    number | null
  >(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("EFECTIVO");

  // Estados para resultado del pedido
  const [pedidoCreado, setPedidoCreado] = useState<any>(null);
  const [linkPago, setLinkPago] = useState<string | null>(null);

  // ✅ MIGRADO: Variables derivadas del Context Unificado
  const tienePromocionAgrupada = promocionAgrupada !== null;
  const descuentoPromocionAgrupada = totales?.descuentoPromocionAgrupada || 0;
  const gastosEnvio = totales?.gastosEnvio || 0;
  const descuentoTakeAway = totales?.descuentoTakeAway || 0;
  const descuentoTotal = totales?.descuentoTotal || 0;

  // ==================== CARGAR DOMICILIOS CON DEBUG Y FALLBACKS ====================

  const cargarDomicilios = async () => {
    if (!user || !isCliente(user)) {
      setError("Solo los clientes pueden usar esta funcionalidad");
      setLoadingDomicilios(false);
      return;
    }

    try {
      setLoadingDomicilios(true);

      let clienteId = user.idCliente;

      // Fallback: Si no hay idCliente, obtenerlo del backend
      if (!clienteId) {
        console.log("⚠️ idCliente no disponible, obteniendo del backend...");
        const perfilCompleto = await UsuarioService.getMyProfile();

        if (isCliente(perfilCompleto)) {
          clienteId = perfilCompleto.idCliente;
          console.log("✅ idCliente obtenido del backend:", clienteId);
        } else {
          throw new Error("El usuario no es un cliente");
        }
      }

      console.log("🏠 Cargando domicilios para cliente:", clienteId);
      const clienteData = await ClienteService.getById(clienteId);
      setDomicilios(clienteData.domicilios || []);
    } catch (error: any) {
      console.error("❌ Error al cargar domicilios:", error);

      // Fallback: usar domicilios desde el user si están disponibles
      if (isCliente(user) && user.domicilios) {
        console.log("🔄 Fallback: usando domicilios desde user");
        setDomicilios(user.domicilios);
      } else {
        setError("Error al cargar domicilios del cliente");
      }
    } finally {
      setLoadingDomicilios(false);
    }
  };

  // Cargar domicilios cuando se abre el modal
  useEffect(() => {
    if (abierto && isAuthenticated && user && isCliente(user)) {
      cargarDomicilios();
    }
  }, [abierto, isAuthenticated, user]);

  // ==================== RESTO DEL CÓDIGO IGUAL ====================

  useEffect(() => {
    if (!abierto) {
      setError(null);
      setExito(null);
      setPedidoCreado(null);
      setLinkPago(null);
      setMetodoPago("EFECTIVO");
    }
  }, [abierto]);

  if (!abierto) return null;

  const handleConfirmarPedido = async () => {
    try {
      setLoading(true);
      setError(null);
      setExito(null);

      // Validar que el usuario esté autenticado y sea cliente
      if (!isAuthenticated || !user || !isCliente(user)) {
        setError("Debes iniciar sesión como cliente para realizar un pedido");
        return;
      }

      if (estaVacio) {
        setError("El carrito está vacío");
        return;
      }

      // Validar domicilio para delivery
      if (tipoEnvio === "DELIVERY") {
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

      console.log("🔍 Estado de promociones antes de crear pedido:", {
        tienePromocionAgrupada,
        promocionAgrupada,
        descuentoCalculado: descuentoPromocionAgrupada,
        items: items.length,
        subtotal,
        total,
      });

      // Decidir qué servicio usar según el método de pago
      if (metodoPago === "EFECTIVO") {
        await crearPedidoEfectivo();
      } else {
        await crearPedidoMercadoPago();
      }
    } catch (err: any) {
      console.error("❌ Error al crear pedido:", err);

      // 🔍 DEBUG: Mostrar más detalles del error
      if (err.response) {
        console.error("❌ Error response:", err.response);
        console.error("❌ Error response data:", err.response.data);
        console.error("❌ Error response status:", err.response.status);
      }

      // Intentar extraer más información del error
      let errorMessage =
        err.message || "Error al procesar el pedido. Intenta de nuevo.";

      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.data.mensaje) {
          errorMessage = err.response.data.mensaje;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const crearPedidoEfectivo = async () => {
    if (!user || !isCliente(user)) {
      throw new Error("Usuario no válido para crear pedido");
    }

    let clienteId = user.idCliente;

    // Fallback: Si no hay idCliente, obtenerlo del backend
    if (!clienteId) {
      console.log("⚠️ Obteniendo idCliente del backend...");
      const perfilCompleto = await UsuarioService.getMyProfile();

      if (isCliente(perfilCompleto)) {
        clienteId = perfilCompleto.idCliente;
        console.log("✅ idCliente obtenido:", clienteId);
      } else {
        throw new Error("El usuario no es un cliente");
      }
    }

    const pedidoRequest = {
      idCliente: clienteId,
      idSucursal: idSucursal,
      tipoEnvio: tipoEnvio,
      ...(tipoEnvio === "DELIVERY" && domicilioSeleccionado
        ? {
            idDomicilio: domicilioSeleccionado,
          }
        : {}),
      detalles: items.map((item) => ({
        idArticulo: item.id,
        cantidad: item.cantidad,
      })),
      ...(observaciones?.trim()
        ? {
            observaciones: observaciones.trim(),
          }
        : {}),

      // ✅ NUEVO: Incluir promoción agrupada si existe
      ...(tienePromocionAgrupada && promocionAgrupada
        ? {
            promocionAgrupada: {
              idPromocion: promocionAgrupada.idPromocion,
              denominacion: promocionAgrupada.denominacion,
              tipoDescuento: promocionAgrupada.tipoDescuento,
              valorDescuento: promocionAgrupada.valorDescuento,
              descripcion: promocionAgrupada.descripcion || "",
              descuentoAplicado: descuentoPromocionAgrupada,
            },
          }
        : {}),
    };

    console.log("💵 Creando pedido con pago en efectivo");
    const pedidoCreado = await pedidoService.crearPedido(pedidoRequest);

    // ✅ NUEVO: Crear pago en efectivo automáticamente
    try {
      console.log(
        "💳 Creando pago en efectivo para pedido:",
        pedidoCreado.idPedido
      );

      // Obtener la factura del pedido recién creado
      const factura = await pagoService.getFacturaPedido(pedidoCreado.idPedido);
      console.log("📄 Factura obtenida:", factura);

      // Crear el pago en efectivo
      const pagoRequest = {
        facturaId: factura.idFactura,
        formaPago: "EFECTIVO",
        monto: factura.totalVenta,
        moneda: "ARS",
        descripcion: `Pago en efectivo - Pedido #${pedidoCreado.idPedido} - ${tipoEnvio}`,
      };

      console.log("💰 Creando pago con datos:", pagoRequest);

      const pagoCreado = await apiClienteService.post("/pagos", pagoRequest);
      console.log("✅ Pago en efectivo creado exitosamente:", pagoCreado);
    } catch (pagoError: any) {
      console.error("❌ Error al crear pago en efectivo:", pagoError);
      console.log(
        "⚠️ El pedido se creó correctamente. El pago se puede crear manualmente."
      );
      // No fallar el proceso completo
    }

    setPedidoCreado(pedidoCreado);
    setExito(
      "¡Pedido creado exitosamente! Puedes pagar en efectivo al momento de la entrega."
    );

    limpiarCarrito();
    setTimeout(() => {
      onExito({ pedido: pedidoCreado, metodoPago: "EFECTIVO" });
      onCerrar();
    }, 2000);
  };

  const crearPedidoMercadoPago = async () => {
    if (!user || !isCliente(user)) {
      setError("Usuario no válido para crear pedido con MercadoPago");
      return;
    }

    // Validaciones previas
    if (!user.email || !user.nombre || !user.apellido) {
      setError("Datos de usuario incompletos. Actualiza tu perfil.");
      return;
    }

    let clienteId = user.idCliente;

    // Fallback: Si no hay idCliente, obtenerlo del backend
    if (!clienteId) {
      console.log("⚠️ Obteniendo idCliente del backend...");
      try {
        const perfilCompleto = await UsuarioService.getMyProfile();

        if (isCliente(perfilCompleto)) {
          clienteId = perfilCompleto.idCliente;
          console.log("✅ idCliente obtenido del backend:", clienteId);
        } else {
          throw new Error("El usuario no es un cliente");
        }
      } catch (error) {
        setError("Error obteniendo información del cliente");
        return;
      }
    }

    console.log("� Creando pedido con MercadoPago para cliente:", clienteId);

    // ✅ CREAR request con todos los campos validados
    const pedidoRequest: any = {
      idCliente: Number(clienteId),
      idSucursal: Number(idSucursal),
      tipoEnvio: tipoEnvio,
      detalles: items.map((item) => ({
        idArticulo: Number(item.id),
        cantidad: Number(item.cantidad),
      })),
      emailComprador: user.email,
      nombreComprador: user.nombre,
      apellidoComprador: user.apellido,
      porcentajeDescuentoTakeAway: 10.0,
      gastosEnvioDelivery: 200.0,
      aplicarDescuentoTakeAway: tipoEnvio === "TAKE_AWAY",
      crearPreferenciaMercadoPago: true,
      externalReference: `PEDIDO_${Date.now()}_${clienteId}`,

      ...(tienePromocionAgrupada && promocionAgrupada
        ? {
            promocionAgrupada: {
              idPromocion: promocionAgrupada.idPromocion,
              denominacion: promocionAgrupada.denominacion,
              tipoDescuento: promocionAgrupada.tipoDescuento,
              valorDescuento: promocionAgrupada.valorDescuento,
              descripcion: promocionAgrupada.descripcion || "",
              descuentoAplicado: descuentoPromocionAgrupada,
              subtotalOriginal: subtotal + descuentoPromocionAgrupada,
              subtotalConDescuento: subtotal,
            },
          }
        : {}),
    };

    if (domicilioSeleccionado) {
      pedidoRequest.idDomicilio = Number(domicilioSeleccionado);
    }
    if (observaciones?.trim()) {
      pedidoRequest.observaciones = observaciones.trim();
    }

    console.log(
      "💳 Request completo enviado a MercadoPago (CON PROMOCIONES):",
      JSON.stringify(pedidoRequest, null, 2)
    );

    if (tienePromocionAgrupada) {
      console.log("🎁 Promoción agrupada incluida en MercadoPago:", {
        nombre: promocionAgrupada?.denominacion,
        descuento: descuentoPromocionAgrupada,
        tienePromocion: tienePromocionAgrupada,
        promocionCompleta: promocionAgrupada,
      });
    } else {
      console.log("ℹ️ No hay promoción agrupada activa");
    }

    const response = await mercadoPagoService.crearPedidoConMercadoPago(
      pedidoRequest
    );

    if (!response.exito) {
      throw new Error(response.mensaje || "Error al crear el pedido");
    }

    setPedidoCreado(response.pedido);

    if (MercadoPagoService.debeUsarMercadoPago(response)) {
      const link = MercadoPagoService.obtenerLinkPago(response.mercadoPago);
      setLinkPago(link);
      setExito(
        '¡Pedido creado! Usa el botón "Pagar con MercadoPago" para completar el pago.'
      );
    } else {
      setError(
        response.mercadoPago?.errorMercadoPago ||
          "No se pudo generar el link de pago"
      );
    }

    // ✅ AGREGAR esto en crearPedidoEfectivo() ANTES de limpiarCarrito()
    console.log("🔍 VERIFICACIÓN ANTES DE LIMPIAR CARRITO:", {
      tienePromocionAgrupada,
      promocionAgrupada,
      descuentoCalculado: descuentoPromocionAgrupada,
      estabaIncluidoEnRequest: !!pedidoRequest.promocionAgrupada,
    });

    limpiarCarrito();
  };

  const abrirMercadoPago = () => {
    if (linkPago) {
      window.open(linkPago, "_blank");
    }
  };

  // ✅ MIGRADO: Función para manejar cambio de observaciones
  const handleObservacionesChange = (value: string) => {
    setDatosEntrega({
      ...datosEntrega,
      observaciones: value,
    });
  };

  // ==================== COMPONENTE RENDERIZADO ====================

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
          {/* Estado de Éxito */}
          {exito && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-800">
                    ¡Pedido Creado!
                  </h4>
                  <p className="text-green-600 text-sm">{exito}</p>

                  {/* Botón de MercadoPago si aplica */}
                  {linkPago && (
                    <button
                      onClick={abrirMercadoPago}
                      className="mt-3 inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Pagar con MercadoPago
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

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

          {/* Información del cliente */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <User className="w-5 h-5 text-[#CD6C50]" />
              <h3 className="font-semibold text-gray-800">
                Información del cliente
              </h3>
            </div>
            <p className="text-gray-700">
              {user?.nombre} {user?.apellido}
            </p>
            <p className="text-gray-600 text-sm">{user?.email}</p>
          </div>

          {/* Tipo de entrega y domicilio */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <MapPin className="w-5 h-5 text-[#CD6C50]" />
              <h3 className="font-semibold text-gray-800">Entrega</h3>
            </div>
            <p className="text-gray-700 mb-3">
              {tipoEnvio === "DELIVERY" ? "Delivery" : "Retiro en local"}
            </p>

            {/* Selector de domicilio para DELIVERY */}
            {tipoEnvio === "DELIVERY" && (
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
                        onChange={(e) =>
                          setDomicilioSeleccionado(
                            Number(e.target.value) || null
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent appearance-none bg-white"
                      >
                        <option value="">Selecciona una dirección</option>
                        {domicilios.map((domicilio, index) => {
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
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Método de Pago */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <CreditCard className="w-5 h-5 text-[#CD6C50]" />
              <h3 className="font-semibold text-gray-800">Método de pago</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Pago en Efectivo */}
              <button
                onClick={() => setMetodoPago("EFECTIVO")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  metodoPago === "EFECTIVO"
                    ? "border-[#CD6C50] bg-[#CD6C50]/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <DollarSign
                  className={`w-6 h-6 mx-auto mb-2 ${
                    metodoPago === "EFECTIVO"
                      ? "text-[#CD6C50]"
                      : "text-gray-400"
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    metodoPago === "EFECTIVO"
                      ? "text-[#CD6C50]"
                      : "text-gray-600"
                  }`}
                >
                  Efectivo
                </p>
                <p className="text-xs text-gray-500">Al entregar</p>
              </button>

              {/* MercadoPago */}
              <button
                onClick={() => setMetodoPago("MERCADO_PAGO")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  metodoPago === "MERCADO_PAGO"
                    ? "border-[#CD6C50] bg-[#CD6C50]/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Smartphone
                  className={`w-6 h-6 mx-auto mb-2 ${
                    metodoPago === "MERCADO_PAGO"
                      ? "text-[#CD6C50]"
                      : "text-gray-400"
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    metodoPago === "MERCADO_PAGO"
                      ? "text-[#CD6C50]"
                      : "text-gray-600"
                  }`}
                >
                  MercadoPago
                </p>
                <p className="text-xs text-gray-500">Online</p>
              </button>
            </div>
          </div>

          {/* Resumen del pedido con totales del Context Unificado */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Calculator className="w-5 h-5 text-[#CD6C50]" />
              <h3 className="font-semibold text-gray-800">
                Resumen del pedido
              </h3>
              {loadingTotales && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#CD6C50]"></div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              {/* Items del carrito */}
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.nombre} x{item.cantidad}
                  </span>
                  <span>${(item.precio * item.cantidad).toFixed(0)}</span>
                </div>
              ))}

              {/* ✅ MIGRADO: Promoción agrupada desde Context Unificado */}
              {tienePromocionAgrupada && promocionAgrupada && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Gift className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-800">
                      Promoción Especial Activa
                    </span>
                  </div>
                  <div className="text-sm text-red-700">
                    🎁 {promocionAgrupada.denominacion}
                  </div>
                  <div className="text-sm text-red-600 mt-1">
                    Descuento aplicado: ${descuentoPromocionAgrupada.toFixed(0)}
                  </div>
                </div>
              )}

              <div className="border-t pt-2 mt-2 space-y-1">
                {/* Subtotal */}
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(0)}</span>
                </div>

                {/* ✅ MIGRADO: Descuento Take Away desde Context */}
                {descuentoTakeAway > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center">
                      <Tag className="w-3 h-3 mr-1" />
                      Descuento retiro
                    </span>
                    <span>-${descuentoTakeAway.toFixed(0)}</span>
                  </div>
                )}

                {/* ✅ MIGRADO: Envío desde Context */}
                {gastosEnvio > 0 && (
                  <div className="flex justify-between">
                    <span className="flex items-center">
                      <Truck className="w-3 h-3 mr-1" />
                      Envío
                    </span>
                    <span>${gastosEnvio.toFixed(0)}</span>
                  </div>
                )}

                {/* Total final */}
                <div className="flex justify-between font-bold text-lg text-[#CD6C50] border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>${total.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* ✅ MIGRADO: Mostrar resumen del descuento desde Context */}
            {totales?.resumenDescuentos && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                ✨ {totales.resumenDescuentos}
              </div>
            )}
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
          </div>

          {/* Tiempo estimado */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <p className="text-blue-800 text-sm">
                <strong>Tiempo estimado:</strong>{" "}
                {items.length > 0
                  ? Math.max(
                      ...items.map((item: any) => item.tiempoPreparacion || 0)
                    ) + (tipoEnvio === "DELIVERY" ? 15 : 0)
                  : 0}{" "}
                minutos
              </p>
            </div>
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
              disabled={loading || estaVacio || !!exito}
              className="flex-1 px-4 py-3 bg-[#CD6C50] text-white rounded-lg hover:bg-[#b85a42] transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Procesando..."
                : exito
                ? "¡Creado!"
                : metodoPago === "EFECTIVO"
                ? "Confirmar Pedido"
                : "Crear y Pagar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModalMercadoPago;
