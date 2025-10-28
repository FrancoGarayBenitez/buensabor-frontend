import type {
  PromocionCompletaDTO,
  ArticuloBasicoDTO,
} from "../types/promociones";
import type { PromocionAgrupada } from "../services/CalculadoraDescuentosService";

/**
 * 🔄 Convierte PromocionCompletaDTO (backend) a PromocionAgrupada (context)
 */
export const adaptarPromocionCompleta = (
  promocionCompleta: PromocionCompletaDTO
): PromocionAgrupada => {
  return {
    idPromocion: promocionCompleta.idPromocion,
    denominacion: promocionCompleta.denominacion,
    tipoDescuento: promocionCompleta.tipoDescuento,
    valorDescuento: promocionCompleta.valorDescuento,
    // ✅ AGREGAR campo requerido - se calculará dinámicamente
    descuentoAplicado: 0,
    articulos: promocionCompleta.articulos.map((articulo) => ({
      idArticulo: articulo.idArticulo,
      denominacion: articulo.denominacion,
      precioVenta: articulo.precioVenta,
    })),
  };
};

/**
 * 🔄 Convierte PromocionAgrupada (context) a PromocionCompletaDTO (para mostrar)
 */
export const adaptarPromocionAgrupada = (
  promocionAgrupada: PromocionAgrupada,
  promocionCompleta?: PromocionCompletaDTO
): PromocionCompletaDTO => {
  // Si tenemos la promoción completa original, la usamos como base
  if (promocionCompleta) {
    return {
      ...promocionCompleta,
      // Actualizar con valores del context si es necesario
      valorDescuento: promocionAgrupada.valorDescuento,
    };
  }

  // Si no, crear una nueva estructura mínima
  return {
    idPromocion: promocionAgrupada.idPromocion,
    denominacion: promocionAgrupada.denominacion,
    descripcionDescuento: `Promoción especial: ${promocionAgrupada.denominacion}`,
    tipoDescuento: promocionAgrupada.tipoDescuento,
    valorDescuento: promocionAgrupada.valorDescuento,
    fechaDesde: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    fechaHasta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // 7 días
    horaDesde: "00:00",
    horaHasta: "23:59",
    articulos: promocionAgrupada.articulos.map((articulo) => ({
      idArticulo: articulo.idArticulo,
      denominacion: articulo.denominacion,
      precioVenta: articulo.precioVenta,
      imagenUrl: "", // Se puede mejorar si es necesario
    })),
  };
};

/**
 * 🔍 Validar que una promoción completa sea compatible
 */
export const validarPromocionCompleta = (
  promocion: PromocionCompletaDTO
): { esValida: boolean; razon?: string } => {
  // Validar fechas
  const hoy = new Date();
  const fechaDesde = new Date(promocion.fechaDesde);
  const fechaHasta = new Date(promocion.fechaHasta);

  if (hoy < fechaDesde) {
    return { esValida: false, razon: "Promoción aún no vigente" };
  }

  if (hoy > fechaHasta) {
    return { esValida: false, razon: "Promoción expirada" };
  }

  // Validar artículos
  if (!promocion.articulos || promocion.articulos.length === 0) {
    return { esValida: false, razon: "Promoción sin artículos" };
  }

  // Validar tipo de descuento
  if (!["PORCENTUAL", "MONTO_FIJO"].includes(promocion.tipoDescuento)) {
    return { esValida: false, razon: "Tipo de descuento no válido" };
  }

  // Validar valor de descuento
  if (promocion.valorDescuento <= 0) {
    return { esValida: false, razon: "Valor de descuento inválido" };
  }

  // Validar que los artículos tengan precios válidos
  const articulosSinPrecio = promocion.articulos.filter(
    (a) => !a.precioVenta || a.precioVenta <= 0
  );
  if (articulosSinPrecio.length > 0) {
    return {
      esValida: false,
      razon: "Algunos artículos no tienen precio válido",
    };
  }

  return { esValida: true };
};

/**
 * 💰 Calcular subtotal de una promoción completa
 */
export const calcularSubtotalPromocionCompleta = (
  promocion: PromocionCompletaDTO
): number => {
  return promocion.articulos.reduce(
    (total, articulo) => total + (articulo.precioVenta || 0),
    0
  );
};

/**
 * 🎯 Calcular descuento real de una promoción completa
 */
export const calcularDescuentoPromocionCompleta = (
  promocion: PromocionCompletaDTO
): number => {
  const subtotal = calcularSubtotalPromocionCompleta(promocion);

  if (promocion.tipoDescuento === "PORCENTUAL") {
    return (subtotal * promocion.valorDescuento) / 100;
  } else {
    // MONTO_FIJO - no puede ser mayor al subtotal
    return Math.min(promocion.valorDescuento, subtotal);
  }
};

/**
 * 🏷️ Formatear promoción para mostrar
 */
export const formatearPromocionCompleta = (
  promocion: PromocionCompletaDTO
): {
  textoDescuento: string;
  subtotalOriginal: number;
  descuentoCalculado: number;
  precioFinal: number;
  porcentajeDescuento: number;
  esValidaCalcular: boolean;
} => {
  const validacion = validarPromocionCompleta(promocion);

  if (!validacion.esValida) {
    return {
      textoDescuento: "No disponible",
      subtotalOriginal: 0,
      descuentoCalculado: 0,
      precioFinal: 0,
      porcentajeDescuento: 0,
      esValidaCalcular: false,
    };
  }

  const subtotalOriginal = calcularSubtotalPromocionCompleta(promocion);
  const descuentoCalculado = calcularDescuentoPromocionCompleta(promocion);
  const precioFinal = subtotalOriginal - descuentoCalculado;
  const porcentajeDescuento =
    subtotalOriginal > 0 ? (descuentoCalculado / subtotalOriginal) * 100 : 0;

  const textoDescuento =
    promocion.tipoDescuento === "PORCENTUAL"
      ? `${promocion.valorDescuento}% OFF`
      : `${promocion.valorDescuento} OFF`;

  return {
    textoDescuento,
    subtotalOriginal,
    descuentoCalculado,
    precioFinal,
    porcentajeDescuento,
    esValidaCalcular: true,
  };
};

/**
 * 🎯 Validar horario de promoción
 */
export const estaEnHorarioValido = (
  promocion: PromocionCompletaDTO
): boolean => {
  if (!promocion.horaDesde || !promocion.horaHasta) {
    return true; // Si no hay restricción de horario, siempre es válido
  }

  const ahora = new Date();
  const horaActual = ahora.getHours() * 100 + ahora.getMinutes(); // Formato HHMM

  const horaDesde = parseInt(promocion.horaDesde.replace(":", ""));
  const horaHasta = parseInt(promocion.horaHasta.replace(":", ""));

  // Manejar casos donde la promoción cruza medianoche
  if (horaDesde <= horaHasta) {
    return horaActual >= horaDesde && horaActual <= horaHasta;
  } else {
    return horaActual >= horaDesde || horaActual <= horaHasta;
  }
};

/**
 * 📊 Obtener estadísticas de una promoción
 */
export const obtenerEstadisticasPromocion = (
  promocion: PromocionCompletaDTO
) => {
  const info = formatearPromocionCompleta(promocion);

  return {
    ...info,
    cantidadArticulos: promocion.articulos.length,
    precioPromedioArticulo: info.subtotalOriginal / promocion.articulos.length,
    ahorroPromedio: info.descuentoCalculado / promocion.articulos.length,
    estaVigente: validarPromocionCompleta(promocion).esValida,
    estaEnHorario: estaEnHorarioValido(promocion),
    diasRestantes: (() => {
      const hoy = new Date();
      const fechaHasta = new Date(promocion.fechaHasta);
      const diffTime = fechaHasta.getTime() - hoy.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    })(),
  };
};
