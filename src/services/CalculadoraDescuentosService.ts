// src/services/CalculadoraDescuentosService.ts - FIX PARA PROMOCIONES

import type { PromocionResponseDTO } from "../types/promociones";
import type { ItemCarrito } from "../types/auxiliares/ItemCarrito";

// ==================== INTERFACES (mantener las existentes) ====================

export interface PromocionAplicada {
  idPromocion: number;
  idArticulo: number;
  promocion: PromocionResponseDTO;
  descuentoCalculado: number;
  precioOriginal: number;
  precioFinal: number;
  cantidad: number;
}

export interface PromocionAgrupada {
  idPromocion: number;
  denominacion: string;
  tipoDescuento: "PORCENTUAL" | "MONTO_FIJO";
  valorDescuento: number;
  descripcion: string;
  descuentoAplicado: number;
  articulos: Array<{
    idArticulo: number;
    denominacion: string;
    precioVenta: number;
  }>;
}

export interface ConfiguracionDescuentos {
  aplicarDescuentoTakeAway: boolean;
  porcentajeDescuentoTakeAway: number;
  gastosEnvioDelivery: number;
  tipoEnvio: "DELIVERY" | "TAKE_AWAY";
}

export interface TotalesCalculados {
  // Subtotales separados
  subtotalOriginal: number;
  subtotalProductosEnPromo: number; // ✅ NUEVO: Solo productos en promoción agrupada
  subtotalProductosSinPromo: number; // ✅ NUEVO: Solo productos SIN promoción agrupada
  subtotalConPromociones: number;
  subtotalConDescuentoTakeAway: number;

  // Descuentos detallados
  descuentoPromociones: number;
  descuentoTakeAway: number;
  descuentoPromocionAgrupada: number;
  descuentoTotal: number;

  // Gastos adicionales
  gastosEnvio: number;

  // Total final
  totalFinal: number;

  // Metadata
  tieneDescuentos: boolean;
  resumenDescuentos: string;
  promocionesAplicadas: PromocionAplicada[];

  // Configuración usada
  configuracion: ConfiguracionDescuentos;
}

export interface DescuentoCalculado {
  montoDescuento: number;
  precioOriginal: number;
  precioFinal: number;
  porcentajeDescuento: number;
  esValido: boolean;
  razonInvalido?: string;
}

// ==================== CALCULADORA PRINCIPAL CORREGIDA ====================

export class CalculadoraDescuentosService {
  // Configuración por defecto
  private static readonly CONFIG_DEFAULT: ConfiguracionDescuentos = {
    aplicarDescuentoTakeAway: true,
    porcentajeDescuentoTakeAway: 10,
    gastosEnvioDelivery: 200,
    tipoEnvio: "TAKE_AWAY",
  };

  // ==================== MÉTODOS INDIVIDUALES (sin cambios) ====================

  static calcularDescuentoPromocion(
    promocion: PromocionResponseDTO,
    precioUnitario: number,
    cantidad: number
  ): DescuentoCalculado {
    console.log("🧮 Calculando descuento promoción:", {
      promocion: promocion.denominacion,
      tipo: promocion.tipoDescuento,
      valor: promocion.valorDescuento,
      precio: precioUnitario,
      cantidad,
    });

    if (!promocion.estaVigente) {
      return {
        montoDescuento: 0,
        precioOriginal: precioUnitario,
        precioFinal: precioUnitario,
        porcentajeDescuento: 0,
        esValido: false,
        razonInvalido: "Promoción no vigente",
      };
    }

    if (cantidad < promocion.cantidadMinima) {
      return {
        montoDescuento: 0,
        precioOriginal: precioUnitario,
        precioFinal: precioUnitario,
        porcentajeDescuento: 0,
        esValido: false,
        razonInvalido: `Cantidad mínima requerida: ${promocion.cantidadMinima}`,
      };
    }

    const totalSinDescuento = precioUnitario * cantidad;
    let montoDescuento = 0;

    if (promocion.tipoDescuento === "PORCENTUAL") {
      montoDescuento = totalSinDescuento * (promocion.valorDescuento / 100);
    } else {
      montoDescuento = Math.min(
        promocion.valorDescuento * cantidad,
        totalSinDescuento
      );
    }

    const descuentoPorUnidad = montoDescuento / cantidad;
    const precioFinal = precioUnitario - descuentoPorUnidad;
    const porcentajeDescuento = (montoDescuento / totalSinDescuento) * 100;

    return {
      montoDescuento,
      precioOriginal: precioUnitario,
      precioFinal,
      porcentajeDescuento,
      esValido: true,
    };
  }

  // ✅ CORREGIDO: Promoción agrupada se aplica solo a SUS productos
  static calcularDescuentoPromocionAgrupada(
    promocionAgrupada: PromocionAgrupada,
    itemsEnPromocion: ItemCarrito[] // ✅ CAMBIO: Solo items que están en la promoción
  ): DescuentoCalculado {
    console.log("🎁 Calculando descuento promoción agrupada:", {
      promocion: promocionAgrupada.denominacion,
      tipo: promocionAgrupada.tipoDescuento,
      valor: promocionAgrupada.valorDescuento,
      itemsEnPromo: itemsEnPromocion.length,
    });

    if (itemsEnPromocion.length === 0) {
      return {
        montoDescuento: 0,
        precioOriginal: 0,
        precioFinal: 0,
        porcentajeDescuento: 0,
        esValido: false,
        razonInvalido: "No hay items en la promoción",
      };
    }

    // ✅ CALCULAR SUBTOTAL SOLO DE PRODUCTOS EN LA PROMOCIÓN
    const subtotalPromocion = itemsEnPromocion.reduce(
      (sum, item) => sum + (item.precio * item.cantidad), 
      0
    );

    console.log("💰 Subtotal SOLO productos en promoción:", subtotalPromocion);

    if (subtotalPromocion <= 0) {
      return {
        montoDescuento: 0,
        precioOriginal: subtotalPromocion,
        precioFinal: subtotalPromocion,
        porcentajeDescuento: 0,
        esValido: false,
        razonInvalido: "Subtotal de promoción inválido",
      };
    }

    let montoDescuento = 0;

    if (promocionAgrupada.tipoDescuento === "PORCENTUAL") {
      montoDescuento = subtotalPromocion * (promocionAgrupada.valorDescuento / 100);
    } else {
      montoDescuento = Math.min(promocionAgrupada.valorDescuento, subtotalPromocion);
    }

    const precioFinal = subtotalPromocion - montoDescuento;
    const porcentajeDescuento = (montoDescuento / subtotalPromocion) * 100;

    console.log("✅ Descuento promoción agrupada calculado:", {
      subtotalPromocion,
      montoDescuento,
      porcentajeDescuento: `${porcentajeDescuento.toFixed(1)}%`
    });

    return {
      montoDescuento,
      precioOriginal: subtotalPromocion,
      precioFinal,
      porcentajeDescuento,
      esValido: true,
    };
  }

  // ✅ CORREGIDO: TAKE_AWAY se aplica sobre el subtotal con promociones aplicadas
  static calcularDescuentoTakeAway(
    subtotalConPromociones: number, // ✅ CAMBIO: Subtotal después de aplicar promociones
    configuracion: Partial<ConfiguracionDescuentos> = {}
  ): DescuentoCalculado {
    const config = { ...this.CONFIG_DEFAULT, ...configuracion };

    console.log("🏪 Calculando descuento TAKE_AWAY:", {
      subtotalConPromociones: subtotalConPromociones,
      aplicar: config.aplicarDescuentoTakeAway,
      porcentaje: config.porcentajeDescuentoTakeAway,
      tipoEnvio: config.tipoEnvio,
    });

    if (
      !config.aplicarDescuentoTakeAway ||
      config.tipoEnvio !== "TAKE_AWAY" ||
      subtotalConPromociones <= 0
    ) {
      return {
        montoDescuento: 0,
        precioOriginal: subtotalConPromociones,
        precioFinal: subtotalConPromociones,
        porcentajeDescuento: 0,
        esValido: false,
        razonInvalido: "No aplica descuento TAKE_AWAY",
      };
    }

    const montoDescuento = subtotalConPromociones * (config.porcentajeDescuentoTakeAway / 100);
    const precioFinal = subtotalConPromociones - montoDescuento;

    console.log("✅ Descuento TAKE_AWAY calculado:", {
      base: subtotalConPromociones,
      descuento: montoDescuento
    });

    return {
      montoDescuento,
      precioOriginal: subtotalConPromociones,
      precioFinal,
      porcentajeDescuento: config.porcentajeDescuentoTakeAway,
      esValido: true,
    };
  }

  // ==================== MÉTODO PRINCIPAL CORREGIDO ====================

  static calcularTotalesCarrito(
    items: ItemCarrito[],
    promocionesSeleccionadas: Map<number, number> = new Map(),
    promocionesDisponibles: Map<number, PromocionResponseDTO[]> = new Map(),
    promocionAgrupada: PromocionAgrupada | null = null,
    configuracion: Partial<ConfiguracionDescuentos> = {}
  ): TotalesCalculados {
    const config = { ...this.CONFIG_DEFAULT, ...configuracion };

    console.log("💰 === CALCULANDO TOTALES CORREGIDOS ===");
    console.log("Items:", items.length);
    console.log("Promociones seleccionadas:", promocionesSeleccionadas.size);
    console.log("Promoción agrupada:", promocionAgrupada?.denominacion || "Ninguna");

    // 1. Subtotal original completo
    const subtotalOriginal = items.reduce(
      (sum, item) => sum + item.precio * item.cantidad,
      0
    );
    console.log("💰 Subtotal original:", subtotalOriginal);

    // ✅ 2. SEPARAR ITEMS EN PROMOCIÓN AGRUPADA VS. RESTO
    let itemsEnPromocionAgrupada: ItemCarrito[] = [];
    let itemsFueraDePromocionAgrupada: ItemCarrito[] = [];

    if (promocionAgrupada) {
      // Identificar qué items están en la promoción agrupada
      const idsEnPromocion = new Set(
        promocionAgrupada.articulos.map(art => art.idArticulo)
      );

      itemsEnPromocionAgrupada = items.filter(item => idsEnPromocion.has(item.id));
      itemsFueraDePromocionAgrupada = items.filter(item => !idsEnPromocion.has(item.id));
    } else {
      // Si no hay promoción agrupada, todos están fuera
      itemsFueraDePromocionAgrupada = [...items];
    }

    const subtotalProductosEnPromo = itemsEnPromocionAgrupada.reduce(
      (sum, item) => sum + item.precio * item.cantidad, 0
    );
    const subtotalProductosSinPromo = itemsFueraDePromocionAgrupada.reduce(
      (sum, item) => sum + item.precio * item.cantidad, 0
    );

    console.log("📊 Separación de productos:", {
      enPromoAgrupada: itemsEnPromocionAgrupada.length,
      fueraDePromoAgrupada: itemsFueraDePromocionAgrupada.length,
      subtotalEnPromo: subtotalProductosEnPromo,
      subtotalFueraPromo: subtotalProductosSinPromo
    });

    // 3. Aplicar promociones individuales (solo a productos FUERA de promo agrupada)
    const promocionesAplicadas: PromocionAplicada[] = [];
    let descuentoPromociones = 0;

    for (const item of itemsFueraDePromocionAgrupada) { // ✅ Solo productos fuera de promo agrupada
      const idPromocionSeleccionada = promocionesSeleccionadas.get(item.id);

      if (idPromocionSeleccionada) {
        const promocionesItem = promocionesDisponibles.get(item.id) || [];
        const promocion = promocionesItem.find(
          (p) => p.idPromocion === idPromocionSeleccionada
        );

        if (promocion) {
          const descuentoCalculado = this.calcularDescuentoPromocion(
            promocion,
            item.precio,
            item.cantidad
          );

          if (descuentoCalculado.esValido) {
            promocionesAplicadas.push({
              idPromocion: promocion.idPromocion,
              idArticulo: item.id,
              promocion,
              descuentoCalculado: descuentoCalculado.montoDescuento,
              precioOriginal: item.precio,
              precioFinal: descuentoCalculado.precioFinal,
              cantidad: item.cantidad,
            });

            descuentoPromociones += descuentoCalculado.montoDescuento;
          }
        }
      }
    }

    console.log("🎯 Descuento promociones individuales:", descuentoPromociones);

    // ✅ 4. APLICAR PROMOCIÓN AGRUPADA (solo a sus productos)
    let descuentoPromocionAgrupada = 0;
    if (promocionAgrupada && itemsEnPromocionAgrupada.length > 0) {
      const descuentoAgrupada = this.calcularDescuentoPromocionAgrupada(
        promocionAgrupada,
        itemsEnPromocionAgrupada // ✅ Solo productos de la promoción
      );

      if (descuentoAgrupada.esValido) {
        descuentoPromocionAgrupada = descuentoAgrupada.montoDescuento;
      }
    }

    console.log("🎁 Descuento promoción agrupada:", descuentoPromocionAgrupada);

    // 5. Subtotal con promociones aplicadas
    const subtotalConPromociones = subtotalOriginal - descuentoPromociones - descuentoPromocionAgrupada;

    // ✅ 6. APLICAR DESCUENTO TAKE_AWAY (sobre subtotal CON promociones aplicadas)
    let descuentoTakeAway = 0;
    let subtotalConDescuentoTakeAway = subtotalConPromociones;

    if (config.aplicarDescuentoTakeAway && config.tipoEnvio === "TAKE_AWAY") {
      // ✅ CORREGIDO: TAKE_AWAY se aplica sobre subtotal DESPUÉS de promociones
      const descuentoCalculado = this.calcularDescuentoTakeAway(
        subtotalConPromociones, // ✅ Subtotal después de aplicar promociones
        config
      );

      if (descuentoCalculado.esValido) {
        descuentoTakeAway = descuentoCalculado.montoDescuento;
        subtotalConDescuentoTakeAway = subtotalConPromociones - descuentoTakeAway;
      }
    }

    console.log("🏪 Descuento TAKE_AWAY (sobre subtotal con promociones):", descuentoTakeAway);

    // 7. Gastos de envío
    const gastosEnvio = config.tipoEnvio === "DELIVERY" ? config.gastosEnvioDelivery : 0;

    // 8. Totales finales
    const descuentoTotal = descuentoPromociones + descuentoPromocionAgrupada + descuentoTakeAway;
    const totalFinal = Math.max(0, subtotalConDescuentoTakeAway + gastosEnvio);

    // 9. Generar resumen
    const resumenDescuentos = this.generarResumenDescuentos(
      descuentoPromociones,
      descuentoPromocionAgrupada,
      descuentoTakeAway,
      promocionesAplicadas,
      promocionAgrupada
    );

    const resultado: TotalesCalculados = {
      subtotalOriginal,
      subtotalProductosEnPromo, // ✅ NUEVO
      subtotalProductosSinPromo, // ✅ NUEVO
      subtotalConPromociones,
      subtotalConDescuentoTakeAway,
      descuentoPromociones,
      descuentoTakeAway,
      descuentoPromocionAgrupada,
      descuentoTotal,
      gastosEnvio,
      totalFinal,
      tieneDescuentos: descuentoTotal > 0,
      resumenDescuentos,
      promocionesAplicadas,
      configuracion: config,
    };

    console.log("💰 === TOTALES FINALES CORREGIDOS ===");
    console.log("Subtotal original:", subtotalOriginal);
    console.log("- Productos en promo agrupada:", subtotalProductosEnPromo);
    console.log("- Productos sin promo agrupada:", subtotalProductosSinPromo);
    console.log("Descuento total:", descuentoTotal);
    console.log("Total final:", totalFinal);

    return resultado;
  }

  // ==================== UTILIDADES (sin cambios) ====================

  private static generarResumenDescuentos(
    descuentoPromociones: number,
    descuentoPromocionAgrupada: number,
    descuentoTakeAway: number,
    promocionesAplicadas: PromocionAplicada[],
    promocionAgrupada: PromocionAgrupada | null
  ): string {
    const descuentos: string[] = [];

    if (descuentoPromociones > 0) {
      const cantidadPromociones = promocionesAplicadas.length;
      descuentos.push(
        `${cantidadPromociones} promoción${
          cantidadPromociones > 1 ? "es" : ""
        } (-$${descuentoPromociones.toFixed(0)})`
      );
    }

    if (descuentoPromocionAgrupada > 0 && promocionAgrupada) {
      descuentos.push(
        `${promocionAgrupada.denominacion} (-$${descuentoPromocionAgrupada.toFixed(0)})`
      );
    }

    if (descuentoTakeAway > 0) {
      descuentos.push(
        `10% retiro en local (-$${descuentoTakeAway.toFixed(0)})`
      );
    }

    if (descuentos.length === 0) {
      return "Sin descuentos aplicados";
    }

    const totalDescuento = descuentoPromociones + descuentoPromocionAgrupada + descuentoTakeAway;
    return `${descuentos.join(", ")} • Total ahorro: $${totalDescuento.toFixed(0)}`;
  }

  static validarPromocionAplicable(
    promocion: PromocionResponseDTO,
    idArticulo: number,
    cantidad: number
  ): { esAplicable: boolean; razon?: string } {
    if (!promocion.estaVigente) {
      return { esAplicable: false, razon: "Promoción no vigente" };
    }

    if (cantidad < promocion.cantidadMinima) {
      return {
        esAplicable: false,
        razon: `Cantidad mínima requerida: ${promocion.cantidadMinima}`,
      };
    }

    const articulo = promocion.articulos.find(
      (art) => art.idArticulo === idArticulo
    );
    if (!articulo) {
      return {
        esAplicable: false,
        razon: "Promoción no aplica a este artículo",
      };
    }

    return { esAplicable: true };
  }

  static formatearMonto(monto: number): string {
    return `$${monto.toFixed(0)}`;
  }

  static formatearPorcentaje(porcentaje: number): string {
    return `${porcentaje.toFixed(1)}%`;
  }
}