// ✅ ACTUALIZAR: src/components/promociones/PromocionAgrupada.tsx

import React from "react";
import {
  Gift,
  ShoppingCart,
  Flame,
  Clock,
  Calendar,
  AlertCircle,
} from "lucide-react";
import type { PromocionCompletaDTO } from "../../types/promociones";
// ✅ NUEVO: Import del adaptador
import {
  formatearPromocionCompleta,
  validarPromocionCompleta,
  estaEnHorarioValido,
  obtenerEstadisticasPromocion,
} from "../../utils/promocionTypeAdapters";

interface PromocionAgrupadaProps {
  promocion: PromocionCompletaDTO;
  onAgregarAlCarrito: (promocion: PromocionCompletaDTO) => void;
  className?: string;
  mostrarDetalles?: boolean;
}

export const PromocionAgrupada: React.FC<PromocionAgrupadaProps> = ({
  promocion,
  onAgregarAlCarrito,
  className = "",
  mostrarDetalles = true,
}) => {
  // ✅ NUEVO: Usar el adaptador para cálculos consistentes
  const infoPromocion = formatearPromocionCompleta(promocion);
  const validacion = validarPromocionCompleta(promocion);
  const estadisticas = obtenerEstadisticasPromocion(promocion);
  const enHorario = estaEnHorarioValido(promocion);

  // ✅ Si la promoción no es válida, mostrar estado de error
  if (!validacion.esValida || !infoPromocion.esValidaCalcular) {
    return (
      <div
        className={`bg-gray-100 border-2 border-gray-300 rounded-2xl p-6 opacity-60 ${className}`}
      >
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-600 mb-2">
            {promocion.denominacion}
          </h3>
          <p className="text-red-600 text-sm font-medium">
            {validacion.razon || "Promoción no disponible"}
          </p>
          <div className="mt-3 text-xs text-gray-500">
            📅 {promocion.fechaDesde} - {promocion.fechaHasta}
            {promocion.horaDesde && promocion.horaHasta && (
              <span className="block">
                ⏰ {promocion.horaDesde} - {promocion.horaHasta}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ✅ Si está fuera de horario, mostrar advertencia
  if (!enHorario) {
    return (
      <div
        className={`bg-orange-100 border-2 border-orange-300 rounded-2xl p-6 ${className}`}
      >
        <div className="text-center">
          <Clock className="w-12 h-12 text-orange-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-orange-800 mb-2">
            {promocion.denominacion}
          </h3>
          <p className="text-orange-700 text-sm font-medium mb-2">
            Disponible de {promocion.horaDesde} a {promocion.horaHasta}
          </p>
          <div className="bg-orange-200 rounded-lg p-3 text-orange-800 text-sm">
            🎁 {infoPromocion.textoDescuento} • Ahorro: $
            {infoPromocion.descuentoCalculado.toFixed(0)}
          </div>
        </div>
      </div>
    );
  }

  // ✅ Promoción válida y disponible
  return (
    <div
      className={`bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl overflow-hidden relative ${className}`}
    >
      {/* Efecto de brillo */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>

      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold mb-2">
          <Flame className="w-4 h-4 mr-1" />
          ¡OFERTA ESPECIAL!
          {estadisticas.diasRestantes <= 3 &&
            estadisticas.diasRestantes > 0 && (
              <span className="ml-2 bg-yellow-400 text-red-800 px-2 py-0.5 rounded-full text-xs">
                ¡{estadisticas.diasRestantes} día
                {estadisticas.diasRestantes !== 1 ? "s" : ""}!
              </span>
            )}
        </div>
        <h3 className="text-2xl font-bold">{promocion.denominacion}</h3>
        <div className="text-lg font-semibold mt-1 text-yellow-300">
          {infoPromocion.textoDescuento}
        </div>

        {/* ✅ NUEVO: Mostrar porcentaje de descuento real */}
        <div className="text-sm opacity-90 mt-1">
          ({infoPromocion.porcentajeDescuento.toFixed(1)}% de descuento total)
        </div>
      </div>

      {/* Artículos incluidos */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
        <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
          <span className="flex items-center">
            <Gift className="w-4 h-4 mr-1" />
            Incluye ({promocion.articulos.length} productos):
          </span>
          {mostrarDetalles && (
            <span className="text-xs opacity-80">
              Promedio: ${estadisticas.precioPromedioArticulo.toFixed(0)} c/u
            </span>
          )}
        </h4>
        <div className="space-y-2">
          {promocion.articulos.map((articulo, index) => (
            <div
              key={articulo.idArticulo}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center">
                {articulo.imagenUrl ? (
                  <img
                    src={articulo.imagenUrl}
                    alt={articulo.denominacion}
                    className="w-8 h-8 rounded-lg object-cover mr-2 border border-white/20"
                    onError={(e) => {
                      // Fallback si la imagen no carga
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove(
                        "hidden"
                      );
                    }}
                  />
                ) : null}
                <div
                  className={`w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mr-2 text-xs ${
                    articulo.imagenUrl ? "hidden" : ""
                  }`}
                >
                  {index + 1}
                </div>
                <span className="font-medium">{articulo.denominacion}</span>
              </div>
              <div className="text-right">
                <span className="text-white/80 line-through text-xs block">
                  ${articulo.precioVenta.toFixed(0)}
                </span>
                {/* ✅ NUEVO: Mostrar ahorro individual */}
                <span className="text-green-300 text-xs">
                  -{estadisticas.ahorroPromedio.toFixed(0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Precios */}
      <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm opacity-90">Precio original:</span>
          <span className="text-lg line-through opacity-80">
            ${infoPromocion.subtotalOriginal.toFixed(0)}
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-lg">Precio promocional:</span>
          <span className="font-bold text-2xl text-yellow-300">
            ${infoPromocion.precioFinal.toFixed(0)}
          </span>
        </div>
        <div className="text-center pt-2 border-t border-white/20">
          <span className="text-green-300 font-bold text-lg">
            ¡Ahorras ${infoPromocion.descuentoCalculado.toFixed(0)}!
          </span>
        </div>
      </div>

      {/* ✅ NUEVO: Información adicional si se solicita */}
      {mostrarDetalles &&
        (promocion.horaDesde ||
          promocion.horaHasta ||
          estadisticas.diasRestantes > 0) && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-4 text-xs">
            <div className="flex items-center justify-between">
              {promocion.horaDesde && promocion.horaHasta && (
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>
                    {promocion.horaDesde} - {promocion.horaHasta}
                  </span>
                </div>
              )}
              {estadisticas.diasRestantes > 0 && (
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>
                    {estadisticas.diasRestantes} día
                    {estadisticas.diasRestantes !== 1 ? "s" : ""} restante
                    {estadisticas.diasRestantes !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Botón de acción */}
      <button
        onClick={() => onAgregarAlCarrito(promocion)}
        className="w-full bg-white text-red-600 font-bold py-3 px-6 rounded-xl hover:bg-yellow-100 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg transform hover:scale-105 active:scale-95"
      >
        <ShoppingCart className="w-5 h-5" />
        <span>Agregar Promoción Completa</span>
      </button>

      {/* Descripción adicional */}
      {promocion.descripcionDescuento && (
        <p className="text-center text-xs opacity-80 mt-3 leading-relaxed">
          {promocion.descripcionDescuento}
        </p>
      )}

      {/* ✅ NUEVO: Debug info en desarrollo */}
      {process.env.NODE_ENV === "development" && (
        <details className="mt-3 text-xs opacity-70">
          <summary className="cursor-pointer">🐛 Debug Info</summary>
          <pre className="mt-2 bg-black/20 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(
              {
                validacion,
                estadisticas: {
                  estaVigente: estadisticas.estaVigente,
                  estaEnHorario: estadisticas.estaEnHorario,
                  diasRestantes: estadisticas.diasRestantes,
                  porcentajeDescuento: estadisticas.porcentajeDescuento,
                },
                calculo: {
                  subtotal: infoPromocion.subtotalOriginal,
                  descuento: infoPromocion.descuentoCalculado,
                  final: infoPromocion.precioFinal,
                },
              },
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
};

export default PromocionAgrupada;
