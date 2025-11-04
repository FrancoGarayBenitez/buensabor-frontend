// src/pages/MisPedidos.tsx
import React, { useState, useEffect } from "react";
import {
  Clock,
  MapPin,
  Phone,
  Package,
  Truck,
  Store,
  ChevronDown,
  ChevronUp,
  FileText,
  Gift,
  Tag,
} from "lucide-react";
import { PedidoService } from "../services/PedidoServices";

import { useAuth } from "../hooks/useAuth";
import { isCliente } from "../types/usuario/UserTypes";
import type { PedidoResponseDTO } from "../types/pedidos/PedidoResponseDTO";

// 🆕 NUEVO: Importaciones para facturas
import { BotonDescargarFacturaPdf } from "../components/facturas/BotonDescargarFactura";
import { useFacturas } from "../hooks/useFacturas";
import PerfilService from "../services/PerfilService";

const pedidoService = new PedidoService();

const detectarPromocionesEnPedido = (pedido: PedidoResponseDTO) => {
  const tienePromocionesIndividuales = pedido.detalles.some(
    (d) =>
      d.tienePromocion ||
      d.promocionAplicada ||
      (d.descuentoPromocion && d.descuentoPromocion > 0)
  );

  const tieneResumenPromociones =
    pedido.resumenPromociones &&
    pedido.resumenPromociones.cantidadPromociones > 0;

  const descuentoTotal = pedido.resumenPromociones?.totalDescuentos || 0;
  const subtotalOriginal = pedido.resumenPromociones?.subtotalOriginal || 0;

  return {
    tienePromociones: tienePromocionesIndividuales || tieneResumenPromociones,
    cantidadPromociones: pedido.resumenPromociones?.cantidadPromociones || 0,
    descuentoTotal,
    subtotalOriginal,
    resumenTexto: pedido.resumenPromociones?.resumenTexto || "",
    nombresPromociones: pedido.resumenPromociones?.nombresPromociones || [],
  };
};

const PromocionesBadge: React.FC<{ pedido: PedidoResponseDTO }> = ({
  pedido,
}) => {
  const promociones = detectarPromocionesEnPedido(pedido);

  if (!promociones.tienePromociones) return null;

  return (
    <div className="flex items-center space-x-2 mb-2">
      <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
        <Gift className="w-4 h-4 mr-1" />
        {promociones.cantidadPromociones} promoción
        {promociones.cantidadPromociones !== 1 ? "es" : ""} aplicada
        {promociones.cantidadPromociones !== 1 ? "s" : ""}
      </div>
      {promociones.descuentoTotal > 0 && (
        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
          <Tag className="w-4 h-4 mr-1" />
          Ahorro: ${promociones.descuentoTotal.toFixed(0)}
        </div>
      )}
    </div>
  );
};

const ProductoConPromocion: React.FC<{ detalle: any }> = ({ detalle }) => {
  // 🆕 LÓGICA MEJORADA: Detectar promociones de múltiples formas
  const tienePromocionAplicada = Boolean(
    detalle.tienePromocion ||
      detalle.promocionAplicada ||
      (detalle.descuentoPromocion && detalle.descuentoPromocion > 0)
  );

  // 🆕 LÓGICA MEJORADA: Calcular precios originales y finales
  const precioOriginal =
    detalle.precioUnitarioOriginal || detalle.precioUnitario || 0;
  const precioFinal =
    detalle.precioUnitarioFinal || detalle.precioUnitario || 0;
  const subtotalOriginal =
    detalle.subtotalOriginal || precioOriginal * detalle.cantidad || 0;
  const subtotalFinal = detalle.subtotal || 0;

  // 🆕 LÓGICA MEJORADA: Determinar si mostrar precio tachado
  const deberMostrarDescuento =
    tienePromocionAplicada &&
    (precioOriginal !== precioFinal ||
      subtotalOriginal !== subtotalFinal ||
      (detalle.descuentoPromocion && detalle.descuentoPromocion > 0));

  // ✅ NUEVO: Calcular ahorro real para evitar mostrar 0s
  const ahorroCalculado =
    subtotalOriginal > subtotalFinal ? subtotalOriginal - subtotalFinal : 0;

  // ✅ ULTRA SEGURO: Validaciones boolean explícitas
  const promocionValida = Boolean(
    detalle.promocionAplicada &&
      detalle.promocionAplicada.denominacion &&
      detalle.promocionAplicada.denominacion.trim().length > 0
  );

  const descuentoValidoSinPromocion = Boolean(
    !detalle.promocionAplicada &&
      detalle.descuentoPromocion &&
      detalle.descuentoPromocion > 0
  );

  // ✅ ULTRA SEGURO: Validar cantidad
  const cantidad =
    detalle.cantidad && detalle.cantidad > 0 ? detalle.cantidad : 1;

  // ✅ ULTRA SEGURO: Validar observaciones
  const tieneObservacionesValidas = Boolean(
    detalle.observaciones &&
      detalle.observaciones.toString().trim().length > 0 &&
      detalle.observaciones.toString().trim() !== "0" &&
      detalle.observaciones.toString().toLowerCase() !== "null"
  );

  // ✅ ULTRA SEGURO: Validar tiempo de preparación
  const tieneTiempoPreparacion = Boolean(
    detalle.tiempoPreparacion && detalle.tiempoPreparacion > 0
  );

  // 🔍 DEBUG: Log para identificar el problema
  console.log(`🔍 DEBUG ULTRA SEGURO ${detalle.denominacionArticulo}:`, {
    cantidad: detalle.cantidad,
    cantidadFinal: cantidad,
    observaciones: detalle.observaciones,
    tieneObservacionesValidas,
    tiempoPreparacion: detalle.tiempoPreparacion,
    tieneTiempoPreparacion,
    tienePromocionAplicada,
    todoElDetalle: detalle,
  });

  return (
    <div
      className={`flex justify-between items-center rounded-lg p-4 ${
        tienePromocionAplicada
          ? "bg-gradient-to-r from-red-50 to-pink-50 border border-red-200"
          : "bg-white"
      }`}
    >
      <div>
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-800">
            {detalle.denominacionArticulo || "Producto"}
          </span>
          {/* ✅ CANTIDAD SEGURA: Siempre mostrar cantidad válida */}
          <span className="text-gray-500">x{cantidad}</span>
          {/* ✅ PROMOCIÓN SEGURA: Solo si tienePromocionAplicada es true */}
          {tienePromocionAplicada === true && (
            <div className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium flex items-center">
              <Gift className="w-3 h-3 mr-1" />
              Promoción
            </div>
          )}
        </div>

        {/* ✅ PROMOCIÓN VÁLIDA: Solo si promocionValida es true */}
        {promocionValida === true && (
          <div className="text-sm text-red-600 mt-1">
            {detalle.promocionAplicada.denominacion} - Ahorro: $
            {(detalle.descuentoPromocion || 0).toFixed(0)}
          </div>
        )}

        {/* ✅ DESCUENTO SIN PROMOCIÓN: Solo si descuentoValidoSinPromocion es true */}
        {descuentoValidoSinPromocion === true && (
          <div className="text-sm text-red-600 mt-1">
            Descuento aplicado: ${detalle.descuentoPromocion.toFixed(0)}
          </div>
        )}

        {/* ✅ OBSERVACIONES SEGURAS: Solo si tieneObservacionesValidas es true */}
        {tieneObservacionesValidas === true && (
          <div className="text-sm text-gray-600 italic mt-1">
            Obs: {detalle.observaciones}
          </div>
        )}

        {/* ✅ TIEMPO SEGURO: Solo si tieneTiempoPreparacion es true */}
        {tieneTiempoPreparacion === true && (
          <div className="text-sm text-gray-500 flex items-center mt-1">
            <Clock className="w-3 h-3 mr-1" />
            {detalle.tiempoPreparacion} min
          </div>
        )}
      </div>

      <div className="text-right">
        {/* ✅ PRECIOS SEGUROS: Solo si deberMostrarDescuento Y ahorroCalculado > 0 */}
        {deberMostrarDescuento === true && ahorroCalculado > 0 ? (
          <div>
            {/* Precio/subtotal original tachado */}
            <div className="text-sm text-gray-500 line-through">
              ${subtotalOriginal.toFixed(0)}
            </div>
            {/* Precio/subtotal final */}
            <div className="font-semibold text-gray-800">
              ${subtotalFinal.toFixed(0)}
            </div>
            {/* Ahorro calculado */}
            <div className="text-xs text-red-600 font-medium">
              Ahorro: ${ahorroCalculado.toFixed(0)}
            </div>
          </div>
        ) : (
          /* ✅ PRECIO NORMAL SEGURO */
          <span className="font-semibold text-gray-800">
            ${subtotalFinal.toFixed(0)}
          </span>
        )}
      </div>
    </div>
  );
};

// ✅ NUEVO: Componente para mostrar descuento TAKE_AWAY
const DescuentoTakeAwayInfo: React.FC<{ pedido: PedidoResponseDTO }> = ({
  pedido,
}) => {
  // Solo mostrar si es TAKE_AWAY
  if (pedido.tipoEnvio !== "TAKE_AWAY") {
    return null;
  }

  // Calcular descuento TAKE_AWAY
  const resumenPromociones = detectarPromocionesEnPedido(pedido);
  const subtotalConPromociones =
    resumenPromociones.subtotalOriginal - resumenPromociones.descuentoTotal;
  const porcentajeTakeAway = 10; // 10% de descuento TAKE_AWAY
  const descuentoTakeAwayCalculado =
    subtotalConPromociones * (porcentajeTakeAway / 100);

  // Verificar que el descuento se aplicó (comparando totales)
  const totalEsperadoSinTakeAway = subtotalConPromociones;
  const totalConTakeAway = pedido.total;
  const descuentoReal = totalEsperadoSinTakeAway - totalConTakeAway;

  // Solo mostrar si hay descuento significativo
  if (Math.abs(descuentoReal - descuentoTakeAwayCalculado) > 5) {
    // Los números no coinciden exactamente, podría no tener descuento TAKE_AWAY
    // Pero si hay alguna diferencia, mostrarla
    if (descuentoReal < 5) {
      return null;
    }
  }

  return (
    <div className="mb-6">
      <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
        <Store className="w-5 h-5 mr-2 text-orange-600" />
        Descuento Retiro en Local
      </h4>
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-orange-800">
              🏪 10% OFF por Retiro en Local
            </div>
            <div className="text-xs text-orange-600 mt-1">
              Descuento sobre subtotal con promociones: $
              {subtotalConPromociones.toFixed(0)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-orange-800">
              -${descuentoReal.toFixed(0)}
            </div>
            <div className="text-xs text-orange-600">
              ({porcentajeTakeAway}% OFF)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ NUEVO: Componente para mostrar costo de delivery
const CostoDeliveryInfo: React.FC<{ pedido: PedidoResponseDTO }> = ({
  pedido,
}) => {
  // Solo mostrar si es DELIVERY
  if (pedido.tipoEnvio !== "DELIVERY") {
    return null;
  }

  const costoDelivery = 200; // Costo fijo de delivery

  return (
    <div className="mb-6">
      <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
        <Truck className="w-5 h-5 mr-2 text-purple-600" />
        Costo de Envío
      </h4>
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-purple-800">
              🚚 Envío a Domicilio
            </div>
            <div className="text-xs text-purple-600 mt-1">
              Costo fijo de delivery a tu domicilio
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-purple-800">
              +${costoDelivery}
            </div>
            <div className="text-xs text-purple-600">(Envío)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ MODIFICADO: Componente de resumen de totales mejorado
const ResumenTotales: React.FC<{ pedido: PedidoResponseDTO }> = ({
  pedido,
}) => {
  const resumenPromociones = detectarPromocionesEnPedido(pedido);
  const subtotalConPromociones =
    resumenPromociones.subtotalOriginal - resumenPromociones.descuentoTotal;

  // Calcular descuento TAKE_AWAY si aplica
  let descuentoTakeAway = 0;
  if (pedido.tipoEnvio === "TAKE_AWAY") {
    const totalEsperadoSinTakeAway = subtotalConPromociones;
    descuentoTakeAway = totalEsperadoSinTakeAway - pedido.total;
    // Redondear para evitar decimales extraños
    descuentoTakeAway = Math.max(0, Math.round(descuentoTakeAway));
  }

  // Detectar costo de delivery
  let costoDelivery = 0;
  if (pedido.tipoEnvio === "DELIVERY") {
    // Calcular costo delivery basado en diferencia de totales
    const totalSinEnvio = subtotalConPromociones;
    const totalConEnvio = pedido.total;
    costoDelivery = totalConEnvio - totalSinEnvio;
    costoDelivery = Math.max(0, Math.round(costoDelivery));

    // Si la diferencia no es significativa, asumir $200
    if (costoDelivery < 50) {
      costoDelivery = 200;
    }
  }

  return (
    <div className="border-t pt-4 space-y-3 mt-6">
      <h4 className="font-semibold text-gray-800 mb-3">Resumen del Pedido</h4>

      {/* Subtotal original */}
      <div className="flex justify-between text-gray-700">
        <span>Subtotal original:</span>
        <span className="font-medium">
          ${resumenPromociones.subtotalOriginal.toFixed(0)}
        </span>
      </div>

      {/* Descuentos promociones */}
      {resumenPromociones.descuentoTotal > 0 && (
        <div className="flex justify-between text-red-600">
          <span>- Descuentos promociones:</span>
          <span className="font-medium">
            -${resumenPromociones.descuentoTotal.toFixed(0)}
          </span>
        </div>
      )}

      {/* Subtotal con promociones */}
      {resumenPromociones.descuentoTotal > 0 && (
        <div className="flex justify-between text-gray-700 border-b pb-2">
          <span>Subtotal con promociones:</span>
          <span className="font-medium">
            ${subtotalConPromociones.toFixed(0)}
          </span>
        </div>
      )}

      {/* Descuento TAKE_AWAY */}
      {descuentoTakeAway > 0 && (
        <div className="flex justify-between text-orange-600">
          <span>- Descuento Retiro en Local (10%):</span>
          <span className="font-medium">-${descuentoTakeAway.toFixed(0)}</span>
        </div>
      )}

      {/* Costo de delivery */}
      {costoDelivery > 0 && pedido.tipoEnvio === "DELIVERY" && (
        <div className="flex justify-between text-purple-600">
          <span>+ Costo de envío:</span>
          <span className="font-medium">+${costoDelivery.toFixed(0)}</span>
        </div>
      )}

      {/* Total final */}
      <div className="flex justify-between items-center text-xl font-bold text-[#CD6C50] pt-3 border-t-2">
        <span>Total del Pedido:</span>
        <span>${pedido.total.toFixed(0)}</span>
      </div>

      {/* Mensaje informativo */}
      <div className="text-xs text-gray-500 text-center pt-2">
        {pedido.tipoEnvio === "TAKE_AWAY"
          ? "🏪 ¡Ahorraste con el retiro en local!"
          : "🚚 Incluye costo de envío a domicilio"}
      </div>
    </div>
  );
};

const MisPedidos: React.FC = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pedidoExpandido, setPedidoExpandido] = useState<number | null>(null);

  // 🆕 NUEVO: Hook para facturas y estado
  const { checkFacturaExists } = useFacturas();
  const [pedidosConFactura, setPedidosConFactura] = useState<Set<number>>(
    new Set()
  );
  const [verificandoFacturas, setVerificandoFacturas] = useState(false);

  // ✅ CORREGIDO: useEffect simplificado
  useEffect(() => {
    console.log("🔍 User object:", user);

    // Verificar que el usuario existe y es un cliente
    if (user && isCliente(user)) {
      console.log("🔍 User idUsuario:", user.idUsuario);
      console.log("🔍 User idCliente:", user.idCliente);
      cargarPedidos();
    } else if (user && !isCliente(user)) {
      // Si el usuario existe pero no es cliente, mostrar error
      setError("Esta página es solo para clientes. Acceso denegado.");
      setLoading(false);
    }
    // Si user es null, el componente seguirá en loading hasta que se resuelva la autenticación
  }, [user]);

  // ✅ CORREGIDO: Función principal con la misma lógica del checkout
  const cargarPedidos = async () => {
    if (!user || !isCliente(user)) {
      setError("Usuario no válido para ver pedidos");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let clienteId = user.idCliente;

      if (!clienteId) {
        console.log(
          "⚠️ Obteniendo idCliente del backend para cargar pedidos..."
        );
        try {
          const perfilCompleto = await PerfilService.getMyProfile();

          if (isCliente(perfilCompleto)) {
            clienteId = perfilCompleto.idCliente;
            console.log("✅ idCliente obtenido para pedidos:", clienteId);
          } else {
            throw new Error("El usuario no es un cliente");
          }
        } catch (error) {
          console.error("❌ Error obteniendo perfil del cliente:", error);
          setError("No se pudo obtener la información del cliente");
          return;
        }
      }

      if (!clienteId) {
        setError("No se pudo obtener la información del cliente");
        return;
      }

      console.log("📋 Buscando pedidos para cliente:", clienteId);
      const pedidosUsuario = await pedidoService.getPedidosByCliente(clienteId);
      console.log("✅ Pedidos recibidos:", pedidosUsuario);
      console.log("📊 Cantidad de pedidos:", pedidosUsuario.length);

      // ✅ DEBUG: Buscar pedido #63
      const pedido63 = pedidosUsuario.find((p) => p.idPedido === 63);
      if (pedido63) {
        console.log(
          "🔍 PEDIDO #63 CON PROMOCIÓN:",
          JSON.stringify(pedido63, null, 2)
        );
      } else {
        console.log("❌ Pedido #63 no encontrado");
      }

      setPedidos(pedidosUsuario);
      console.log("📋 Pedidos cargados:", pedidosUsuario.length);

      // 🆕 NUEVO: Verificar facturas después de cargar pedidos
      if (pedidosUsuario.length > 0) {
        await verificarFacturas(pedidosUsuario);
      }
    } catch (err) {
      console.error("❌ Error al cargar pedidos:", err);
      setError("Error al cargar los pedidos. Por favor, intenta de nuevo.");
    } finally {
      console.log("🏁 Terminando carga, setLoading(false)");
      setLoading(false);
    }
  };

  // 🆕 NUEVO: Función para verificar qué pedidos tienen factura
  const verificarFacturas = async (pedidos: PedidoResponseDTO[]) => {
    setVerificandoFacturas(true);
    const facturasSet = new Set<number>();

    try {
      console.log("🔍 Verificando facturas para", pedidos.length, "pedidos...");

      // Verificar cada pedido de forma secuencial para evitar sobrecarga
      for (const pedido of pedidos) {
        try {
          const tieneFactura = await checkFacturaExists(pedido.idPedido);
          if (tieneFactura) {
            facturasSet.add(pedido.idPedido);
            console.log(`✅ Factura encontrada para pedido ${pedido.idPedido}`);
          } else {
            console.log(`ℹ️ Sin factura para pedido ${pedido.idPedido}`);
          }
        } catch (error) {
          console.log(
            `⚠️ Error verificando factura del pedido ${pedido.idPedido}:`,
            error
          );
        }
      }

      setPedidosConFactura(facturasSet);
      console.log(
        `📄 Total pedidos con factura: ${facturasSet.size}/${pedidos.length}`
      );
    } catch (error) {
      console.error("❌ Error verificando facturas:", error);
    } finally {
      setVerificandoFacturas(false);
    }
  };

  const toggleExpandir = (idPedido: number) => {
    setPedidoExpandido(pedidoExpandido === idPedido ? null : idPedido);
  };

  const getEstadoConfig = (estado: string) => {
    const estados = {
      PENDIENTE: {
        texto: "Pendiente",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icono: "⏳",
        descripcion: "Tu pedido está siendo procesado",
      },
      PREPARACION: {
        texto: "En Preparación",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icono: "👨‍🍳",
        descripcion: "Nuestros chefs están preparando tu pedido",
      },
      ENTREGADO: {
        texto: "Entregado",
        color: "bg-green-100 text-green-800 border-green-200",
        icono: "✅",
        descripcion: "Tu pedido ha sido entregado",
      },
      CANCELADO: {
        texto: "Cancelado",
        color: "bg-red-100 text-red-800 border-red-200",
        icono: "❌",
        descripcion: "El pedido fue cancelado",
      },
      RECHAZADO: {
        texto: "Rechazado",
        color: "bg-red-100 text-red-800 border-red-200",
        icono: "🚫",
        descripcion: "El pedido fue rechazado",
      },
    };

    return (
      estados[estado as keyof typeof estados] || {
        texto: estado,
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icono: "❓",
        descripcion: "Estado desconocido",
      }
    );
  };

  const formatearFecha = (fecha: string) => {
    const fechaObj = new Date(fecha);
    return {
      fecha: fechaObj.toLocaleDateString("es-AR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      hora: fechaObj.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  // 🆕 NUEVO: Componente para el botón de factura
  const BotonFactura: React.FC<{ pedido: PedidoResponseDTO }> = ({
    pedido,
  }) => {
    const tieneFactura = pedidosConFactura.has(pedido.idPedido);

    if (!tieneFactura) {
      return (
        <div className="flex items-center text-sm text-gray-400">
          <FileText className="w-4 h-4 mr-1" />
          <span>Sin factura</span>
        </div>
      );
    }

    return (
      <BotonDescargarFacturaPdf
        pedidoId={pedido.idPedido}
        size="sm"
        variant="outline"
        texto="📄 Factura PDF"
        className="text-sm"
        onSuccess={() => {
          console.log(`✅ Factura descargada para pedido ${pedido.idPedido}`);
        }}
        onError={(error) => {
          console.error(
            `❌ Error descargando factura del pedido ${pedido.idPedido}:`,
            error
          );
        }}
      />
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4"
            >
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">
            Error al cargar pedidos
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={cargarPedidos}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mis Pedidos</h1>
        <p className="text-gray-600">
          {pedidos.length > 0
            ? `Tienes ${pedidos.length} pedido${
                pedidos.length !== 1 ? "s" : ""
              }`
            : "Aún no has realizado ningún pedido"}
          {/* 🆕 NUEVO: Indicador de verificación de facturas */}
          {verificandoFacturas && (
            <span className="ml-2 text-sm text-blue-600">
              • Verificando facturas...
            </span>
          )}
        </p>
      </div>

      {pedidos.length === 0 ? (
        // Sin pedidos
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">
            No tienes pedidos aún
          </h3>
          <p className="text-gray-400 mb-6">
            ¡Haz tu primer pedido y aparecerá aquí!
          </p>
          <button
            onClick={() => (window.location.href = "/catalogo")}
            className="px-6 py-3 bg-[#CD6C50] text-white rounded-lg hover:bg-[#b85a42] transition-colors duration-200"
          >
            Ver Catálogo
          </button>
        </div>
      ) : (
        // Lista de pedidos
        <div className="space-y-6">
          {pedidos.map((pedido) => {
            const estadoConfig = getEstadoConfig(pedido.estado);
            const fechaFormateada = formatearFecha(pedido.fecha);
            const expandido = pedidoExpandido === pedido.idPedido;

            return (
              <div
                key={pedido.idPedido}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Header del pedido */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        Pedido #{pedido.idPedido}
                      </h3>
                      <p className="text-gray-500">
                        {fechaFormateada.fecha} a las {fechaFormateada.hora}
                      </p>
                    </div>

                    <div className="text-right">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${estadoConfig.color} mb-2`}
                      >
                        <span className="mr-2">{estadoConfig.icono}</span>
                        {estadoConfig.texto}
                      </div>
                      <p className="text-2xl font-bold text-[#CD6C50]">
                        ${pedido.total.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  {/* Info básica */}
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <PromocionesBadge pedido={pedido} />
                    <div className="flex items-center space-x-2">
                      {pedido.tipoEnvio === "DELIVERY" ? (
                        <Truck className="w-5 h-5 text-[#CD6C50]" />
                      ) : (
                        <Store className="w-5 h-5 text-[#CD6C50]" />
                      )}
                      <span className="text-gray-700">
                        {pedido.tipoEnvio === "DELIVERY"
                          ? "Delivery"
                          : "Retiro en local"}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-[#CD6C50]" />
                      <span className="text-gray-700">
                        {pedido.tiempoEstimadoTotal} min estimados
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Package className="w-5 h-5 text-[#CD6C50]" />
                      <span className="text-gray-700">
                        {pedido.detalles.length} producto
                        {pedido.detalles.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Estado descripción */}
                  <p className="text-sm text-gray-600 mb-4">
                    {estadoConfig.descripcion}
                  </p>

                  {/* 🆕 MODIFICADO: Sección de acciones con facturas */}
                  <div className="flex items-center justify-between">
                    {/* Botón expandir (tu código original) */}
                    <button
                      onClick={() => toggleExpandir(pedido.idPedido)}
                      className="flex items-center space-x-2 text-[#CD6C50] hover:text-[#b85a42] transition-colors duration-200"
                    >
                      <span>
                        {expandido ? "Ocultar detalles" : "Ver detalles"}
                      </span>
                      {expandido ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {/* 🆕 NUEVO: Botón de factura */}
                    <BotonFactura pedido={pedido} />
                  </div>
                </div>

                {/* ✅ MODIFICADO: Detalles expandidos con nuevos componentes */}
                {expandido && (
                  <div className="p-6 bg-gray-50">
                    {/* Productos */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 mb-4">
                        Productos
                      </h4>
                      <div className="space-y-3">
                        {pedido.detalles.map((detalle) => (
                          <ProductoConPromocion
                            key={detalle.idDetallePedido}
                            detalle={detalle}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Promociones Aplicadas */}
                    {detectarPromocionesEnPedido(pedido).tienePromociones && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                          <Gift className="w-5 h-5 mr-2 text-red-600" />
                          Promociones Aplicadas
                        </h4>
                        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
                          <div className="text-sm text-red-700">
                            {detectarPromocionesEnPedido(pedido).resumenTexto}
                          </div>

                          {detectarPromocionesEnPedido(pedido)
                            .nombresPromociones.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-red-600 font-medium">
                                Promociones:
                              </div>
                              <ul className="text-xs text-red-600 ml-4">
                                {detectarPromocionesEnPedido(
                                  pedido
                                ).nombresPromociones.map((nombre, index) => (
                                  <li key={index}>• {nombre}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {detectarPromocionesEnPedido(pedido).descuentoTotal >
                            0 && (
                            <div className="mt-2 text-sm font-bold text-red-800">
                              💰 Total ahorrado: $
                              {detectarPromocionesEnPedido(
                                pedido
                              ).descuentoTotal.toFixed(0)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ✅ NUEVO: Descuento TAKE_AWAY */}
                    <DescuentoTakeAwayInfo pedido={pedido} />

                    {/* ✅ NUEVO: Costo de Delivery */}
                    <CostoDeliveryInfo pedido={pedido} />

                    {/* Domicilio si es delivery */}
                    {pedido.tipoEnvio === "DELIVERY" && pedido.domicilio && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-800 mb-2">
                          Dirección de entrega
                        </h4>
                        <div className="bg-white rounded-lg p-4 flex items-start space-x-3">
                          <MapPin className="w-5 h-5 text-[#CD6C50] mt-0.5" />
                          <div>
                            <p className="text-gray-800">
                              {pedido.domicilio.calle} {pedido.domicilio.numero}
                            </p>
                            <p className="text-gray-600">
                              {pedido.domicilio.localidad} - CP{" "}
                              {pedido.domicilio.cp}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Información de contacto */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 mb-2">
                        Información de contacto
                      </h4>
                      <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <Phone className="w-5 h-5 text-[#CD6C50]" />
                          <span className="text-gray-700">
                            {pedido.telefonoCliente}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ✅ NUEVO: Resumen de totales mejorado */}
                    <ResumenTotales pedido={pedido} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MisPedidos;
