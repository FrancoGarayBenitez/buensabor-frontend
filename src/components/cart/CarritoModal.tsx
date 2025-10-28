import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Clock,
  Truck,
  Store,
  Tag,
  Calculator,
  Gift,
  Percent,
  DollarSign,
  Zap,
  ChevronDown,
  Star,
  Flame,
  AlertTriangle,
  Info,
  ChevronUp,
} from "lucide-react";

// 🚀 Context Unificado
import {
  useCarritoItems,
  useCarritoTotales,
  useCarritoPromociones,
  useCarritoUnificado,
} from "../../context/CarritoUnificadoContext";

import CheckoutModalMercadoPago from "./CheckoutModalMercadoPago";
import type { PromocionResponseDTO } from "../../types/promociones";

interface CarritoModalProps {
  abierto: boolean;
  onCerrar: () => void;
}

interface ItemCarritoProps {
  item: any;
}

const ItemCarritoConPromociones: React.FC<ItemCarritoProps> = ({ item }) => {
  const {
    actualizarCantidad,
    incrementarCantidad,
    decrementarCantidad,
    removerItem,
  } = useCarritoItems();

  const {
    promocionesSeleccionadas,
    promocionAgrupada,
    cargarPromocionesParaItem,
    seleccionarPromocion,
    getPromocionesDisponibles,
  } = useCarritoPromociones();

  const [expandido, setExpandido] = useState(false);
  const [cargandoPromociones, setCargandoPromociones] = useState(false);

  // 🚀 MEJORADO: Datos de promociones desde Context
  const promocionesDisponibles = getPromocionesDisponibles(item.id);
  const promocionSeleccionadaId = promocionesSeleccionadas.get(item.id);
  const tienePromocionIndividual = promocionSeleccionadaId !== undefined;

  // ✅ FIX: Verificar si está en promoción agrupada correctamente
  const esPromocionAgrupada = promocionAgrupada !== null;
  const estaEnPromocionAgrupada =
    esPromocionAgrupada &&
    promocionAgrupada?.articulos?.some((p: any) => p.idArticulo === item.id);

  // ✅ NUEVO: Obtener descuento específico del producto en promoción agrupada
  const descuentoProductoEnPromo =
    estaEnPromocionAgrupada &&
    promocionAgrupada?.articulos?.find((p: any) => p.idArticulo === item.id);

  const tienePromocion = tienePromocionIndividual || estaEnPromocionAgrupada;

  useEffect(() => {
    if (promocionesDisponibles.length === 0 && !cargandoPromociones) {
      setCargandoPromociones(true);
      cargarPromocionesParaItem(item.id).finally(() => {
        setCargandoPromociones(false);
      });
    }
  }, [
    item.id,
    promocionesDisponibles.length,
    cargarPromocionesParaItem,
    cargandoPromociones,
  ]);

  // ✅ Cálculo de precios mejorado para promociones agrupadas
  const precioUnitarioOriginal = item.precio;
  let precioUnitarioFinal = precioUnitarioOriginal;
  let descuentoUnitario = 0;
  let infoPromocion = null;

  if (estaEnPromocionAgrupada && descuentoProductoEnPromo) {
    // ✅ Usar el descuento específico del producto en la promoción agrupada
    if (promocionAgrupada?.tipoDescuento === "PORCENTUAL") {
      descuentoUnitario =
        precioUnitarioOriginal * (promocionAgrupada.valorDescuento / 100);
    } else {
      // Para descuento fijo, distribuir proporcionalmente
      const totalOriginalPromo = promocionAgrupada.articulos.reduce(
        (sum: number, art: any) => sum + art.precioVenta,
        0
      );
      const proporcion = precioUnitarioOriginal / totalOriginalPromo;
      descuentoUnitario = promocionAgrupada.valorDescuento * proporcion;
    }

    precioUnitarioFinal = precioUnitarioOriginal - descuentoUnitario;

    infoPromocion = {
      id: promocionAgrupada.idPromocion,
      nombre: promocionAgrupada.denominacion,
      tipo: "agrupada",
      descuentoUnitario,
    };
  } else if (tienePromocionIndividual && !esPromocionAgrupada) {
    // Promoción individual
    const promocionSeleccionada = promocionesDisponibles.find(
      (p: PromocionResponseDTO) => p.idPromocion === promocionSeleccionadaId
    );

    if (promocionSeleccionada) {
      const descuentoTotal =
        promocionSeleccionada.tipoDescuento === "PORCENTUAL"
          ? (precioUnitarioOriginal *
              item.cantidad *
              promocionSeleccionada.valorDescuento) /
            100
          : Math.min(
              promocionSeleccionada.valorDescuento * item.cantidad,
              precioUnitarioOriginal * item.cantidad
            );

      descuentoUnitario = descuentoTotal / item.cantidad;
      precioUnitarioFinal = precioUnitarioOriginal - descuentoUnitario;

      infoPromocion = {
        id: promocionSeleccionada.idPromocion,
        nombre: promocionSeleccionada.denominacion,
        tipo: "individual",
        descuentoUnitario,
      };
    }
  }

  const subtotalOriginal = precioUnitarioOriginal * item.cantidad;
  const subtotalFinal = precioUnitarioFinal * item.cantidad;
  const descuentoTotal = subtotalOriginal - subtotalFinal;

  const handleSeleccionarPromocion = (idPromocion: number | undefined) => {
    seleccionarPromocion(item.id, idPromocion);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center space-x-4">
        <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center flex-shrink-0 relative">
          {item.imagen ? (
            <img
              src={item.imagen}
              alt={item.nombre}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-[#CD6C50] font-bold text-lg">
              {item.nombre.charAt(0)}
            </span>
          )}

          {tienePromocion && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
              <Gift className="w-3 h-3" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-800 text-base truncate">
            {item.nombre}
          </h4>

          <div className="flex items-center space-x-3">
            {tienePromocion ? (
              <>
                <span className="text-sm text-gray-500 line-through">
                  ${precioUnitarioOriginal.toFixed(0)}
                </span>
                <span className="text-[#CD6C50] font-bold text-lg">
                  ${precioUnitarioFinal.toFixed(0)}
                </span>
                <div className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                  -${descuentoUnitario.toFixed(0)}
                </div>
              </>
            ) : (
              <span className="text-[#CD6C50] font-bold text-lg">
                ${precioUnitarioOriginal.toFixed(0)}
              </span>
            )}
          </div>

          {/* ✅ Mostrar info detallada de promoción */}
          {infoPromocion && (
            <div className="mt-1 text-sm flex items-center">
              {infoPromocion.tipo === "agrupada" ? (
                <div className="text-red-600 flex items-center">
                  <Gift className="w-4 h-4 mr-1" />
                  🎁 {infoPromocion.nombre} - Descuento: $
                  {infoPromocion.descuentoUnitario.toFixed(0)} c/u
                </div>
              ) : (
                <div className="text-green-600 flex items-center">
                  <Tag className="w-4 h-4 mr-1" />
                  {infoPromocion.nombre} - Descuento: $
                  {infoPromocion.descuentoUnitario.toFixed(0)} c/u
                </div>
              )}
            </div>
          )}

          {item.tiempoPreparacion && (
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Clock className="w-4 h-4 mr-1" />
              {item.tiempoPreparacion} min
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {estaEnPromocionAgrupada ? (
            <div className="flex items-center space-x-2 bg-red-100 p-2 rounded border border-red-200">
              <span className="font-semibold text-base text-red-700">
                {item.cantidad}
              </span>
              <span className="text-xs text-red-600">(Promo)</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => decrementarCantidad(item.id)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors duration-200"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="font-semibold text-lg min-w-[2rem] text-center">
                {item.cantidad}
              </span>
              <button
                onClick={() => incrementarCantidad(item.id)}
                className="w-8 h-8 rounded-full bg-[#CD6C50] hover:bg-[#b85a42] text-white flex items-center justify-center transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <div className="flex flex-col items-end space-y-2">
          <div className="text-right">
            {tienePromocion ? (
              <>
                <div className="text-sm text-gray-500 line-through">
                  ${subtotalOriginal.toFixed(0)}
                </div>
                <div className="font-bold text-lg text-gray-800">
                  ${subtotalFinal.toFixed(0)}
                </div>
                {descuentoTotal > 0 && (
                  <div className="text-sm text-green-600 font-medium">
                    Ahorras ${descuentoTotal.toFixed(0)}
                  </div>
                )}
              </>
            ) : (
              <span className="font-bold text-lg text-gray-800">
                ${(item.precio * item.cantidad).toFixed(0)}
              </span>
            )}
          </div>

          {estaEnPromocionAgrupada ? (
            <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
              No editable
            </div>
          ) : (
            <button
              onClick={() => removerItem(item.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors duration-200"
              title="Eliminar producto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Selector de promociones */}
      {!estaEnPromocionAgrupada && promocionesDisponibles.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            💡 {promocionesDisponibles.length} promoción(es) disponible(s)
          </div>
        </div>
      )}
    </div>
  );
};

const CarritoModal: React.FC<CarritoModalProps> = ({ abierto, onCerrar }) => {
  const {
    items,
    estaVacio,
    cantidadTotal,
    cantidadTotalItems,
    limpiarCarrito,
  } = useCarritoItems();
  const { subtotal, total, tieneDescuentos, totales, loading } =
    useCarritoTotales();
  const { promocionAgrupada, quitarPromocionAgrupada } =
    useCarritoPromociones();
  const { state, setDatosEntrega } = useCarritoUnificado();

  const [observaciones, setObservaciones] = useState("");
  const [checkoutAbierto, setCheckoutAbierto] = useState(false);
  const [pedidoExitoso, setPedidoExitoso] = useState(false);
  const [mostrarConfirmacionLimpiar, setMostrarConfirmacionLimpiar] =
    useState(false);
  const [mostrarDetallePromo, setMostrarDetallePromo] = useState(false);

  useEffect(() => {
    setObservaciones(state.datosEntrega.observaciones || "");
  }, [state.datosEntrega.observaciones]);

  // Variables simplificadas desde Context
  const tipoEnvio = state.datosEntrega.tipoEnvio;
  const gastosEnvio = totales?.gastosEnvio || 0;
  const descuentoTotal = totales?.descuentoTotal || 0;
  const descuentoTakeAway = totales?.descuentoTakeAway || 0;
  const descuentoPromociones = totales?.descuentoPromociones || 0;
  const descuentoPromocionAgrupada = totales?.descuentoPromocionAgrupada || 0;

  // ✅ Separar items en promo y fuera de promo
  const itemsEnPromoAgrupada = promocionAgrupada
    ? items.filter((item) =>
        promocionAgrupada.articulos?.some(
          (art: any) => art.idArticulo === item.id
        )
      )
    : [];

  const itemsFueraDePromo = promocionAgrupada
    ? items.filter(
        (item) =>
          !promocionAgrupada.articulos?.some(
            (art: any) => art.idArticulo === item.id
          )
      )
    : items;

  if (!abierto) return null;

  const handleFinalizarCompra = () => {
    if (estaVacio) {
      alert("El carrito está vacío");
      return;
    }

    setDatosEntrega({
      ...state.datosEntrega,
      observaciones,
    });

    setCheckoutAbierto(true);
  };

  const handlePedidoExitoso = (data?: any) => {
    console.log("🎉 Pedido creado exitosamente:", data);
    setPedidoExitoso(true);
    alert('¡Pedido creado exitosamente! Puedes verlo en "Mis Pedidos"');
    setCheckoutAbierto(false);
    onCerrar();
    setTimeout(() => {
      setPedidoExitoso(false);
    }, 3000);
  };

  const handleTipoEnvioChange = (nuevoTipoEnvio: "DELIVERY" | "TAKE_AWAY") => {
    setDatosEntrega({
      ...state.datosEntrega,
      tipoEnvio: nuevoTipoEnvio,
      observaciones,
    });
  };

  const handleObservacionesChange = (value: string) => {
    setObservaciones(value);
    setDatosEntrega({
      ...state.datosEntrega,
      observaciones: value,
    });
  };

  const handleEliminarPromocionAgrupada = () => {
    quitarPromocionAgrupada();
  };

  const handleLimpiarCarrito = () => {
    if (cantidadTotalItems > 0) {
      setMostrarConfirmacionLimpiar(true);
    }
  };

  const confirmarLimpiarCarrito = () => {
    limpiarCarrito();
    setMostrarConfirmacionLimpiar(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* ✅ FIX 2: Modal más grande y mejor distribuido */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex">
        {/* COLUMNA IZQUIERDA: Productos */}
        <div className="flex-1 flex flex-col">
          {/* Header Productos */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#CD6C50] to-[#e07d5f] text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-bold">Mi Carrito</h2>
                  <p className="text-orange-100">
                    {cantidadTotalItems} producto
                    {cantidadTotalItems !== 1 ? "s" : ""}
                    {promocionAgrupada && (
                      <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded text-sm">
                        🎁 {promocionAgrupada.denominacion}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!estaVacio && (
                  <button
                    onClick={handleLimpiarCarrito}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors duration-200"
                    title="Vaciar carrito"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={onCerrar}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
          {/* Contenido Productos - SIN scroll interno, altura fija */}
          <div className="flex-1 overflow-y-auto p-6">
            {estaVacio ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart className="w-20 h-20 text-gray-300 mb-6" />
                <h3 className="text-2xl font-semibold text-gray-500 mb-3">
                  Tu carrito está vacío
                </h3>
                <p className="text-gray-400 mb-8 text-lg">
                  ¡Agrega algunos productos deliciosos!
                </p>
                <button
                  onClick={onCerrar}
                  className="px-8 py-4 bg-[#CD6C50] text-white rounded-lg hover:bg-[#b85a42] transition-colors duration-200 text-lg font-medium"
                >
                  Seguir comprando
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Banner de promoción agrupada MEJORADO */}
                {promocionAgrupada && (
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <Gift className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-red-800 text-lg">
                            🎁 {promocionAgrupada.denominacion}
                          </h3>
                          <p className="text-red-600">
                            {promocionAgrupada.tipoDescuento === "PORCENTUAL"
                              ? `${promocionAgrupada.valorDescuento}% OFF`
                              : `$${promocionAgrupada.valorDescuento} OFF`}{" "}
                            en productos incluidos
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-red-700 text-sm">Ahorras</div>
                          <div className="text-xl font-bold text-red-800">
                            ${descuentoPromocionAgrupada.toFixed(0)}
                          </div>
                        </div>

                        <button
                          onClick={handleEliminarPromocionAgrupada}
                          className="p-3 text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200 border border-red-200"
                          title="Eliminar promoción completa"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Detalle de promoción expandible */}
                    <div className="mt-3">
                      <button
                        onClick={() =>
                          setMostrarDetallePromo(!mostrarDetallePromo)
                        }
                        className="flex items-center text-sm text-red-700 hover:text-red-800"
                      >
                        <Info className="w-4 h-4 mr-1" />
                        {mostrarDetallePromo
                          ? "Ocultar detalle"
                          : "Ver detalle de descuentos"}
                        {mostrarDetallePromo ? (
                          <ChevronUp className="w-4 h-4 ml-1" />
                        ) : (
                          <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </button>

                      {mostrarDetallePromo && (
                        <div className="mt-3 p-3 bg-red-100 rounded-lg space-y-2">
                          <div className="text-sm text-red-800 font-medium mb-2">
                            📋 Descuento por producto:
                          </div>
                          {promocionAgrupada.articulos?.map(
                            (art: any, index: number) => {
                              const item = items.find(
                                (i) => i.id === art.idArticulo
                              );
                              if (!item) return null;

                              let descuentoProducto = 0;
                              if (
                                promocionAgrupada.tipoDescuento === "PORCENTUAL"
                              ) {
                                descuentoProducto =
                                  art.precioVenta *
                                  (promocionAgrupada.valorDescuento / 100);
                              } else {
                                const totalOriginal =
                                  promocionAgrupada.articulos.reduce(
                                    (sum: number, a: any) =>
                                      sum + a.precioVenta,
                                    0
                                  );
                                const proporcion =
                                  art.precioVenta / totalOriginal;
                                descuentoProducto =
                                  promocionAgrupada.valorDescuento * proporcion;
                              }

                              return (
                                <div
                                  key={index}
                                  className="flex justify-between text-sm text-red-700"
                                >
                                  <span>• {art.denominacion}</span>
                                  <span>
                                    -$
                                    {(
                                      descuentoProducto * item.cantidad
                                    ).toFixed(0)}
                                  </span>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Productos en promoción agrupada */}
                {itemsEnPromoAgrupada.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Gift className="w-5 h-5 text-red-600" />
                      <h4 className="text-lg font-semibold text-red-800">
                        Productos en promoción
                      </h4>
                    </div>
                    <div className="space-y-4">
                      {itemsEnPromoAgrupada.map((item) => (
                        <div
                          key={`promo-${item.id}`}
                          className="ring-2 ring-red-200 bg-red-50 rounded-lg"
                        >
                          <ItemCarritoConPromociones item={item} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Productos individuales / fuera de promoción */}
                {itemsFueraDePromo.length > 0 && (
                  <div>
                    {promocionAgrupada && (
                      <div className="flex items-center space-x-2 mb-4">
                        <ShoppingCart className="w-5 h-5 text-gray-600" />
                        <h4 className="text-lg font-semibold text-gray-800">
                          Productos adicionales
                        </h4>
                      </div>
                    )}
                    <div className="space-y-4">
                      {itemsFueraDePromo.map((item) => (
                        <ItemCarritoConPromociones
                          key={`individual-${item.id}`}
                          item={item}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: Resumen y checkout */}
        {!estaVacio && (
          <div className="w-96 border-l border-gray-200 bg-gray-50 flex flex-col">
            {/* Header Resumen */}
            <div className="p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-[#CD6C50]" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Resumen del pedido
                </h3>
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#CD6C50]"></div>
                )}
              </div>
            </div>

            {/* Contenido Resumen - Scrolleable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Tipo de entrega */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">
                  Tipo de entrega
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => handleTipoEnvioChange("TAKE_AWAY")}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      tipoEnvio === "TAKE_AWAY"
                        ? "border-[#CD6C50] bg-[#CD6C50] bg-opacity-10"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Store className="w-5 h-5 mx-auto mb-2 text-[#CD6C50]" />
                    <div className="font-medium">Retiro en local</div>
                    <div className="text-green-600 font-bold text-sm">
                      ✨ 10% descuento
                    </div>
                  </button>

                  <button
                    onClick={() => handleTipoEnvioChange("DELIVERY")}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      tipoEnvio === "DELIVERY"
                        ? "border-[#CD6C50] bg-[#CD6C50] bg-opacity-10"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Truck className="w-5 h-5 mx-auto mb-2 text-[#CD6C50]" />
                    <div className="font-medium">Delivery</div>
                    <div className="text-gray-500">+$200</div>
                  </button>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones (opcional)
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => handleObservacionesChange(e.target.value)}
                  placeholder="Ej: Sin cebolla, extra queso..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* Totales */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(0)}</span>
                  </div>

                  {/* Descuentos de promoción agrupada */}
                  {descuentoPromocionAgrupada > 0 && (
                    <div className="flex justify-between text-red-600 font-medium">
                      <span className="flex items-center">
                        <Gift className="w-4 h-4 mr-1" />
                        🎁 {promocionAgrupada?.denominacion}
                      </span>
                      <span>-${descuentoPromocionAgrupada.toFixed(0)}</span>
                    </div>
                  )}

                  {descuentoPromociones > 0 && !promocionAgrupada && (
                    <div className="flex justify-between text-purple-600">
                      <span className="flex items-center">
                        <Gift className="w-4 h-4 mr-1" />
                        Promociones aplicadas
                      </span>
                      <span>-${descuentoPromociones.toFixed(0)}</span>
                    </div>
                  )}

                  {descuentoTakeAway > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center">
                        <Tag className="w-4 h-4 mr-1" />
                        💰 Descuento retiro (10%)
                      </span>
                      <span>-${descuentoTakeAway.toFixed(0)}</span>
                    </div>
                  )}

                  {gastosEnvio > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span className="flex items-center">
                        <Truck className="w-4 h-4 mr-1" />
                        Envío
                      </span>
                      <span>+${gastosEnvio.toFixed(0)}</span>
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="flex justify-between text-2xl font-bold text-gray-800">
                      <span>Total</span>
                      <span className="text-[#CD6C50]">
                        ${total.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>

                {tieneDescuentos && totales?.resumenDescuentos && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm">
                      ✨ {totales.resumenDescuentos}
                    </p>
                  </div>
                )}

                {state.error && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-orange-700 text-sm">⚠️ {state.error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Fijo - Botones */}
            <div className="border-t border-gray-200 p-6 bg-white">
              <div className="space-y-3">
                <button
                  onClick={onCerrar}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Seguir comprando
                </button>
                <button
                  onClick={handleFinalizarCompra}
                  className="w-full px-6 py-3 bg-[#CD6C50] text-white rounded-lg hover:bg-[#b85a42] transition-colors duration-200 font-medium relative"
                >
                  Finalizar compra - ${total.toFixed(0)}
                  {tieneDescuentos && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                      🎁
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación para limpiar carrito */}
      {mostrarConfirmacionLimpiar && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-800">
                ¿Vaciar carrito?
              </h3>
            </div>
            <p className="text-gray-600 mb-6 text-sm">
              Se eliminarán todos los productos del carrito. Esta acción no se
              puede deshacer.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setMostrarConfirmacionLimpiar(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarLimpiarCarrito}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Vaciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      <CheckoutModalMercadoPago
        abierto={checkoutAbierto}
        onCerrar={() => setCheckoutAbierto(false)}
        onExito={handlePedidoExitoso}
      />
    </div>
  );
};

export default CarritoModal;
