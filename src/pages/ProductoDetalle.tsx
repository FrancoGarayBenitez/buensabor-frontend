// src/pages/ProductoDetalle.tsx - MIGRADO AL CONTEXT UNIFICADO
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { productoService } from "../services/ProductoService";
import type { ArticuloManufacturadoResponseDTO } from "../types/productos/ArticuloManufacturadoResponseDTO";
import {
  ArrowLeft,
  Star,
  Clock,
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle,
  Tag,
  Truck,
  Store,
} from "lucide-react";

import {
  useCarritoItems,
  useCarritoTotales,
  useCarritoUnificado,
} from "../context/CarritoUnificadoContext";

import CarritoModal from "../components/cart/CarritoModal";

const ProductoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [producto, setProducto] =
    useState<ArticuloManufacturadoResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [showAgregarExito, setShowAgregarExito] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  const { items, cantidadTotal, estaVacio, agregarItem, obtenerItem } =
    useCarritoItems();

  const { subtotal, total, tieneDescuentos, totales } = useCarritoTotales();

  const { state, setDatosEntrega } = useCarritoUnificado();

  useEffect(() => {
    if (id) {
      productoService
        .getById(Number(id))
        .then((res) => setProducto(res))
        .catch(() => setProducto(null))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <span className="text-[#CD6C50] font-semibold text-xl">
          Cargando detalle...
        </span>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <span className="text-red-600 font-semibold text-xl">
          Producto no encontrado
        </span>
      </div>
    );
  }

  const imagenUrl = producto.imagenes?.[0]?.url ?? null;

  const getProductRating = (stockMax: number) => {
    if (stockMax >= 100) return 4.9;
    if (stockMax >= 50) return 4.7;
    if (stockMax >= 20) return 4.5;
    if (stockMax >= 10) return 4.3;
    return 4.0;
  };

  const handleAgregarAlCarrito = () => {
    if (!producto || !producto.stockSuficiente) return;

    console.log("🛒 Agregando al carrito desde ProductoDetalle:", {
      producto: producto.denominacion,
      cantidad,
      precio: producto.precioVenta,
    });

    agregarItem(producto, cantidad);
    setShowAgregarExito(true);

    setTimeout(() => {
      setShowAgregarExito(false);
    }, 3000);
  };

  const handleComprarAhora = () => {
    if (!producto || !producto.stockSuficiente) return;

    console.log("🚀 Comprar ahora desde ProductoDetalle");
    agregarItem(producto, cantidad);
    setCarritoAbierto(true);
  };

  const incrementarCantidad = () => {
    setCantidad((prev) => prev + 1);
  };

  const decrementarCantidad = () => {
    setCantidad((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const cantidadEnCarrito = obtenerItem(producto.idArticulo)?.cantidad || 0;

  const tipoEnvio = state.datosEntrega.tipoEnvio;
  const gastosEnvio = totales?.gastosEnvio || 0;
  const descuentoTotal = totales?.descuentoTotal || 0;

  const handleSetTakeAway = () => {
    setDatosEntrega({
      tipoEnvio: "TAKE_AWAY",
      observaciones: "",
    });
    console.log("📦 Tipo entrega cambiado a TAKE_AWAY");
  };

  const handleSetDelivery = () => {
    setDatosEntrega({
      tipoEnvio: "DELIVERY",
      observaciones: "",
    });
    console.log("🚚 Tipo entrega cambiado a DELIVERY");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        className="mb-6 flex items-center gap-2 text-[#CD6C50] hover:underline"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-5 h-5" /> Volver
      </button>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {showAgregarExito && (
          <div className="bg-green-500 text-white p-3 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            ¡Producto agregado al carrito!
            <span className="ml-2 text-sm opacity-90">
              (Total: {cantidadTotal} productos)
            </span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row">
          {/* Imagen del producto */}
          <div className="lg:w-1/2 p-6">
            {imagenUrl ? (
              <img
                src={imagenUrl}
                alt={producto.denominacion}
                className="rounded-xl object-cover w-full h-80"
              />
            ) : (
              <div className="bg-gray-100 w-full h-80 rounded-xl flex items-center justify-center text-6xl text-gray-400">
                {producto.denominacion.charAt(0)}
              </div>
            )}
          </div>

          {/* Info principal */}
          <div className="lg:w-1/2 p-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {producto.denominacion}
            </h2>

            <div className="flex items-center gap-4 mb-4">
              <span className="text-[#CD6C50] text-2xl font-bold">
                ${producto.precioVenta.toFixed(0)}
              </span>
              <span className="flex items-center text-yellow-500">
                <Star className="w-4 h-4 fill-current mr-1" />
                {getProductRating(producto.cantidadMaximaPreparable)}
              </span>
              <span className="flex items-center text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                {producto.tiempoEstimadoEnMinutos} min
              </span>
            </div>

            <div className="mb-4 flex items-center gap-2">
              <span className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
                {producto.denominacionCategoria}
              </span>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                {producto.denominacionUnidadMedida}
              </span>
            </div>

            <p className="text-gray-700 mb-4">
              {producto.descripcion || "Sin descripción"}
            </p>

            {producto.preparacion && (
              <p className="mb-4 text-gray-600 text-sm">
                <span className="font-semibold">Preparación:</span>{" "}
                {producto.preparacion}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
              <span>
                Costo: <b>${producto.costoProduccion.toFixed(0)}</b>
              </span>
              <span>
                Margen: <b>{(producto.margenGanancia * 100).toFixed(0)}%</b>
              </span>
            </div>

            <div className="mb-6">
              <span
                className={`text-sm font-bold ${
                  producto.stockSuficiente ? "text-green-600" : "text-red-600"
                }`}
              >
                {producto.stockSuficiente
                  ? `✅ Disponible (${producto.cantidadMaximaPreparable} porciones)`
                  : "❌ No disponible"}
              </span>
            </div>

            {/* Selector de cantidad */}
            {producto.stockSuficiente && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={decrementarCantidad}
                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>

                  <span className="font-semibold text-xl min-w-[3rem] text-center">
                    {cantidad}
                  </span>

                  <button
                    onClick={incrementarCantidad}
                    className="w-10 h-10 rounded-full bg-[#CD6C50] hover:bg-[#b85a42] text-white flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm text-gray-500 mt-1">
                  Subtotal: ${(producto.precioVenta * cantidad).toFixed(0)}
                </p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="space-y-3">
              {producto.stockSuficiente ? (
                <>
                  <button
                    onClick={handleComprarAhora}
                    className="w-full px-6 py-3 bg-[#CD6C50] text-white rounded-lg font-semibold hover:bg-[#b85a42] transition-colors duration-200 flex items-center justify-center"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Comprar Ahora
                  </button>

                  <button
                    onClick={handleAgregarAlCarrito}
                    className="w-full px-6 py-3 border-2 border-[#CD6C50] text-[#CD6C50] rounded-lg font-semibold hover:bg-[#CD6C50] hover:text-white transition-colors duration-200"
                  >
                    Agregar al Carrito ({cantidad})
                  </button>
                </>
              ) : (
                <button
                  disabled
                  className="w-full px-6 py-3 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                >
                  Producto Agotado
                </button>
              )}
            </div>

            {cantidadEnCarrito > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700 text-sm">
                  ✅ Ya tienes {cantidadEnCarrito} de este producto en tu
                  carrito
                  <br />
                  <span className="text-xs text-blue-600">
                    Total en carrito: {cantidadTotal} productos
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Ingredientes */}
        {producto.detalles && producto.detalles.length > 0 && (
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Ingredientes
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {producto.detalles.map((detalle, idx) => (
                <li
                  key={detalle.idDetalleManufacturado ?? idx}
                  className="bg-gray-50 px-4 py-3 rounded-lg flex justify-between items-center"
                >
                  <span className="font-medium">
                    {detalle.denominacionInsumo ?? "Ingrediente"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {detalle.cantidad} {detalle.unidadMedidaInsumo ?? ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Resumen del carrito */}
      {!estaVacio && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">
            Resumen de tu pedido ({cantidadTotal} productos)
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={handleSetTakeAway}
              className={`p-3 rounded-lg border-2 transition-all ${
                tipoEnvio === "TAKE_AWAY"
                  ? "border-[#CD6C50] bg-[#CD6C50] bg-opacity-10"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Store className="w-4 h-4 mx-auto mb-1 text-[#CD6C50]" />
              <div className="text-sm font-medium">Retiro</div>
              <div className="text-xs text-green-600">10% desc.</div>
            </button>

            <button
              onClick={handleSetDelivery}
              className={`p-3 rounded-lg border-2 transition-all ${
                tipoEnvio === "DELIVERY"
                  ? "border-[#CD6C50] bg-[#CD6C50] bg-opacity-10"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Truck className="w-4 h-4 mx-auto mb-1 text-[#CD6C50]" />
              <div className="text-sm font-medium">Delivery</div>
              <div className="text-xs text-gray-500">+$200</div>
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Productos ({cantidadTotal}):</span>
              <span>${subtotal.toFixed(0)}</span>
            </div>

            {tieneDescuentos && descuentoTotal > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="flex items-center">
                  <Tag className="w-3 h-3 mr-1" />
                  Descuentos aplicados:
                </span>
                <span>-${descuentoTotal.toFixed(0)}</span>
              </div>
            )}

            {gastosEnvio > 0 && (
              <div className="flex justify-between">
                <span>Envío:</span>
                <span>+${gastosEnvio.toFixed(0)}</span>
              </div>
            )}

            <div className="border-t pt-2 flex justify-between font-bold text-[#CD6C50]">
              <span>Total:</span>
              <span>${total.toFixed(0)}</span>
            </div>
          </div>

          {totales?.resumenDescuentos && tieneDescuentos && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
              ✨ {totales.resumenDescuentos}
            </div>
          )}

          <button
            onClick={() => setCarritoAbierto(true)}
            className="w-full mt-4 bg-[#CD6C50] text-white py-2 rounded-lg hover:bg-[#b85a42] transition-colors font-medium"
          >
            Ver Carrito Completo
          </button>
        </div>
      )}

      <CarritoModal
        abierto={carritoAbierto}
        onCerrar={() => setCarritoAbierto(false)}
      />
    </div>
  );
};

export default ProductoDetalle;
