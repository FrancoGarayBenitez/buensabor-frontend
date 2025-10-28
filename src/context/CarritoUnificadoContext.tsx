// src/context/CarritoUnificadoContext.tsx - VERSIÓN MEJORADA CON PERSISTENCIA
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  CalculadoraDescuentosService,
  type TotalesCalculados,
  type PromocionAgrupada,
  type ConfiguracionDescuentos,
} from "../services/CalculadoraDescuentosService";
import type { ItemCarrito } from "../types/auxiliares/ItemCarrito";
import type { DatosEntrega } from "../types/auxiliares/DatosEntrega";
import type { PromocionResponseDTO } from "../types/promociones";

// ==================== CONFIGURACIÓN DE PERSISTENCIA ====================

const CARRITO_STORAGE_KEY = 'elBuenSabor_carrito_v2';
const CARRITO_VERSION = '2.0'; // Version para compatibilidad
const CLEANUP_DAYS = 7; // Días antes de limpiar carrito automáticamente

// ==================== INTERFACES (mantener las existentes) ====================

export interface CarritoState {
  // Items del carrito
  items: ItemCarrito[];

  // Promociones
  promocionesSeleccionadas: Map<number, number>; // idArticulo -> idPromocion
  promocionesDisponibles: Map<number, PromocionResponseDTO[]>; // idArticulo -> promociones[]
  promocionAgrupada: PromocionAgrupada | null;

  // ✅ NUEVO: Trackear productos agregados automáticamente por promoción agrupada
  productosAutomaticosPromocion: Set<number>; // IDs de productos agregados automáticamente

  // Datos de entrega
  datosEntrega: DatosEntrega;

  // Totales calculados
  totales: TotalesCalculados | null;

  // Estados de la UI
  loading: boolean;
  error: string | null;

  // Configuración
  configuracion: ConfiguracionDescuentos;

  // ✅ NUEVO: Metadata de persistencia
  ultimaActualizacion?: number;
  version?: string;
}

// ✅ NUEVO: Interface para datos serializables
interface CarritoSerializable {
  version: string;
  ultimaActualizacion: number;
  items: ItemCarrito[];
  promocionesSeleccionadas: Array<[number, number]>; // Map serializado
  promocionAgrupada: PromocionAgrupada | null;
  productosAutomaticosPromocion: number[]; // ✅ NUEVO: Set serializado
  datosEntrega: DatosEntrega;
  configuracion: ConfiguracionDescuentos;
  // NO guardamos: promocionesDisponibles (se cargan dinámicamente), totales (se calculan), loading, error
}

// ✅ NUEVO: Funciones de persistencia
const cargarEstadoDesdeStorage = (): Partial<CarritoState> => {
  try {
    const datosGuardados = localStorage.getItem(CARRITO_STORAGE_KEY);
    if (!datosGuardados) {
      console.log('📱 No hay datos guardados en localStorage');
      return {};
    }

    const datos: CarritoSerializable = JSON.parse(datosGuardados);
    
    // Verificar versión
    if (datos.version !== CARRITO_VERSION) {
      console.warn(`⚠️ Versión incompatible: ${datos.version} != ${CARRITO_VERSION}. Limpiando carrito...`);
      localStorage.removeItem(CARRITO_STORAGE_KEY);
      return {};
    }

    // Verificar si es muy antiguo (más de 7 días)
    const ahora = Date.now();
    const diasTranscurridos = (ahora - datos.ultimaActualizacion) / (1000 * 60 * 60 * 24);
    
    if (diasTranscurridos > CLEANUP_DAYS) {
      console.warn(`🗑️ Carrito muy antiguo (${diasTranscurridos.toFixed(1)} días). Limpiando...`);
      localStorage.removeItem(CARRITO_STORAGE_KEY);
      return {};
    }

    // Restaurar Maps y Sets desde arrays serializados
    const promocionesSeleccionadas = new Map(datos.promocionesSeleccionadas || []);
    const productosAutomaticosPromocion = new Set(datos.productosAutomaticosPromocion || []);
    
    console.log('📱 ✅ Estado cargado desde localStorage:', {
      items: datos.items?.length || 0,
      promociones: promocionesSeleccionadas.size,
      productosAutomaticos: productosAutomaticosPromocion.size,
      tipoEnvio: datos.datosEntrega?.tipoEnvio,
      antiguedad: `${diasTranscurridos.toFixed(1)} días`
    });

    return {
      items: datos.items || [],
      promocionesSeleccionadas,
      promocionAgrupada: datos.promocionAgrupada,
      productosAutomaticosPromocion, // ✅ NUEVO
      datosEntrega: datos.datosEntrega || { tipoEnvio: "TAKE_AWAY", observaciones: "" },
      configuracion: datos.configuracion || {
        aplicarDescuentoTakeAway: true,
        porcentajeDescuentoTakeAway: 10,
        gastosEnvioDelivery: 200,
        tipoEnvio: "TAKE_AWAY",
      },
      ultimaActualizacion: datos.ultimaActualizacion,
      version: datos.version
    };

  } catch (error) {
    console.error('❌ Error cargando estado desde localStorage:', error);
    // En caso de error, limpiar localStorage corrupto
    localStorage.removeItem(CARRITO_STORAGE_KEY);
    return {};
  }
};

const guardarEstadoEnStorage = (state: CarritoState): void => {
  try {
    // Solo guardar si hay items o promoción agrupada
    if (state.items.length === 0 && !state.promocionAgrupada) {
      localStorage.removeItem(CARRITO_STORAGE_KEY);
      console.log('📱 Carrito vacío - removido de localStorage');
      return;
    }

    const datosSerializables: CarritoSerializable = {
      version: CARRITO_VERSION,
      ultimaActualizacion: Date.now(),
      items: state.items,
      promocionesSeleccionadas: Array.from(state.promocionesSeleccionadas.entries()),
      promocionAgrupada: state.promocionAgrupada,
      productosAutomaticosPromocion: Array.from(state.productosAutomaticosPromocion), // ✅ NUEVO
      datosEntrega: state.datosEntrega,
      configuracion: state.configuracion,
    };

    localStorage.setItem(CARRITO_STORAGE_KEY, JSON.stringify(datosSerializables));
    
    console.log('📱 ✅ Estado guardado en localStorage:', {
      items: datosSerializables.items.length,
      promociones: datosSerializables.promocionesSeleccionadas.length,
      size: `${JSON.stringify(datosSerializables).length} chars`
    });

  } catch (error) {
    console.error('❌ Error guardando en localStorage:', error);
    
    // Si falla por espacio, intentar limpiar datos antiguos
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.log('🧹 Espacio insuficiente, limpiando localStorage...');
      try {
        // Limpiar solo nuestro carrito y reintentar
        localStorage.removeItem(CARRITO_STORAGE_KEY);
        localStorage.setItem(CARRITO_STORAGE_KEY, JSON.stringify({
          version: CARRITO_VERSION,
          ultimaActualizacion: Date.now(),
          items: state.items,
          promocionesSeleccionadas: Array.from(state.promocionesSeleccionadas.entries()),
          promocionAgrupada: null, // Sacrificar promoción agrupada por espacio
          datosEntrega: state.datosEntrega,
          configuracion: state.configuracion,
        }));
        console.log('📱 ✅ Guardado exitoso después de limpieza');
      } catch (retryError) {
        console.error('❌ Error persistente guardando:', retryError);
      }
    }
  }
};

// ==================== ESTADO INICIAL MEJORADO ====================

const createInitialState = (): CarritoState => {
  // Cargar estado base desde localStorage
  const estadoGuardado = cargarEstadoDesdeStorage();
  
  // Combinar con valores por defecto
  return {
    items: [],
    promocionesSeleccionadas: new Map(),
    promocionesDisponibles: new Map(), // Siempre vacío al inicio - se carga dinámicamente
    promocionAgrupada: null,
    productosAutomaticosPromocion: new Set(), // ✅ NUEVO
    datosEntrega: {
      tipoEnvio: "TAKE_AWAY",
      observaciones: "",
    },
    totales: null, // Siempre se recalcula
    loading: false,
    error: null,
    configuracion: {
      aplicarDescuentoTakeAway: true,
      porcentajeDescuentoTakeAway: 10,
      gastosEnvioDelivery: 200,
      tipoEnvio: "TAKE_AWAY",
    },
    ultimaActualizacion: Date.now(),
    version: CARRITO_VERSION,
    // ✅ Sobrescribir con datos guardados
    ...estadoGuardado,
  };
};

// ==================== TYPES (mantener existentes) ====================

export type CarritoAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "AGREGAR_ITEM"; payload: { producto: any; cantidad: number } }
  | { type: "REMOVER_ITEM"; payload: number }
  | {
      type: "ACTUALIZAR_CANTIDAD";
      payload: { idArticulo: number; cantidad: number };
    }
  | { type: "LIMPIAR_CARRITO" }
  | { type: "SET_DATOS_ENTREGA"; payload: DatosEntrega }
  | {
      type: "SET_PROMOCIONES_DISPONIBLES";
      payload: { idArticulo: number; promociones: PromocionResponseDTO[] };
    }
  | {
      type: "SELECCIONAR_PROMOCION";
      payload: { idArticulo: number; idPromocion: number | undefined };
    }
  | { type: "SET_PROMOCION_AGRUPADA"; payload: PromocionAgrupada | null }
  | { type: "RECALCULAR_TOTALES" }
  | {
      type: "SET_CONFIGURACION";
      payload: Partial<ConfiguracionDescuentos>;
    }
  | { type: "RESTAURAR_ESTADO"; payload: Partial<CarritoState> } // ✅ NUEVO
  | { type: "PERSISTIR_ESTADO" }; // ✅ NUEVO

export interface CarritoContextValue {
  // Estado
  state: CarritoState;

  // Getters computados
  estaVacio: boolean;
  cantidadTotal: number;
  cantidadTotalItems: number;
  subtotal: number;
  total: number;
  tieneDescuentos: boolean;

  // Acciones de items
  agregarItem: (producto: any, cantidad?: number) => void;
  removerItem: (idArticulo: number) => void;
  actualizarCantidad: (idArticulo: number, cantidad: number) => void;
  incrementarCantidad: (idArticulo: number) => void;
  decrementarCantidad: (idArticulo: number) => void;
  limpiarCarrito: () => void;

  // Acciones de promociones
  cargarPromocionesParaItem: (idArticulo: number) => Promise<void>;
  seleccionarPromocion: (
    idArticulo: number,
    idPromocion: number | undefined
  ) => void;
  aplicarPromocionAgrupada: (promocion: PromocionAgrupada) => void;
  quitarPromocionAgrupada: () => void;

  // Acciones de entrega
  setDatosEntrega: (datos: DatosEntrega) => void;

  // Utilidades
  obtenerItem: (idArticulo: number) => ItemCarrito | undefined;
  getPromocionesDisponibles: (idArticulo: number) => PromocionResponseDTO[];
  recalcularTotales: () => void;

  // ✅ NUEVAS: Funciones de persistencia
  forzarGuardado: () => void;
  limpiarPersistencia: () => void;
  obtenerInfoPersistencia: () => { ultimaActualizacion?: number; version?: string; tamano: string };
}

// ==================== REDUCER MEJORADO ====================

function carritoReducer(
  state: CarritoState,
  action: CarritoAction
): CarritoState {
  console.log(
    "🔄 CarritoReducer:",
    action.type,
    "payload" in action ? action.payload : "(sin payload)"
  );

  let newState: CarritoState;

  switch (action.type) {
    case "SET_LOADING":
      newState = { ...state, loading: action.payload };
      break;

    case "SET_ERROR":
      newState = { ...state, error: action.payload };
      break;

    case "AGREGAR_ITEM": {
      const { producto, cantidad } = action.payload;
      const itemExistente = state.items.find(
        (item) => item.id === producto.idArticulo
      );

      if (itemExistente) {
        // Incrementar cantidad del item existente
        newState = {
          ...state,
          items: state.items.map((item) =>
            item.id === producto.idArticulo
              ? { ...item, cantidad: item.cantidad + cantidad }
              : item
          ),
          error: null,
          ultimaActualizacion: Date.now(),
        };
      } else {
        // Agregar nuevo item
        const nuevoItem: ItemCarrito = {
          id: producto.idArticulo,
          nombre: producto.denominacion,
          cantidad,
          precio: producto.precioVenta,
          imagen: producto.imagenes?.[0]?.url,
          tiempoPreparacion: producto.tiempoEstimadoEnMinutos,
        };

        newState = {
          ...state,
          items: [...state.items, nuevoItem],
          error: null,
          ultimaActualizacion: Date.now(),
        };
      }
      break;
    }

    case "REMOVER_ITEM":
      newState = {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
        promocionesSeleccionadas: new Map(
          Array.from(state.promocionesSeleccionadas.entries()).filter(
            ([idArticulo]) => idArticulo !== action.payload
          )
        ),
        ultimaActualizacion: Date.now(),
      };
      break;

    case "ACTUALIZAR_CANTIDAD": {
      const { idArticulo, cantidad } = action.payload;

      if (cantidad <= 0) {
        // Si cantidad es 0 o menor, remover el item
        return carritoReducer(state, {
          type: "REMOVER_ITEM",
          payload: idArticulo,
        });
      }

      newState = {
        ...state,
        items: state.items.map((item) =>
          item.id === idArticulo ? { ...item, cantidad } : item
        ),
        ultimaActualizacion: Date.now(),
      };
      break;
    }

    case "LIMPIAR_CARRITO":
      newState = {
        ...state,
        items: [],
        promocionesSeleccionadas: new Map(),
        promocionesDisponibles: new Map(),
        promocionAgrupada: null,
        totales: null,
        error: null,
        ultimaActualizacion: Date.now(),
      };
      // ✅ Limpiar localStorage inmediatamente
      localStorage.removeItem(CARRITO_STORAGE_KEY);
      console.log('🧹 Carrito limpiado y localStorage removido');
      break;

    case "SET_DATOS_ENTREGA": {
      // Actualizar configuración automáticamente según tipo de envío
      const nuevaConfiguracion = {
        ...state.configuracion,
        aplicarDescuentoTakeAway: action.payload.tipoEnvio === "TAKE_AWAY",
        tipoEnvio: action.payload.tipoEnvio,
      };

      newState = {
        ...state,
        datosEntrega: action.payload,
        configuracion: nuevaConfiguracion,
        ultimaActualizacion: Date.now(),
      };
      break;
    }

    case "SET_PROMOCIONES_DISPONIBLES": {
      const { idArticulo, promociones } = action.payload;
      const nuevasPromociones = new Map(state.promocionesDisponibles);
      nuevasPromociones.set(idArticulo, promociones);

      // ✅ NO persistir promocionesDisponibles (son temporales y se recargan)
      newState = {
        ...state,
        promocionesDisponibles: nuevasPromociones,
      };
      break;
    }

    case "SELECCIONAR_PROMOCION": {
      const { idArticulo, idPromocion } = action.payload;
      const nuevasSelecciones = new Map(state.promocionesSeleccionadas);

      if (idPromocion) {
        nuevasSelecciones.set(idArticulo, idPromocion);
      } else {
        nuevasSelecciones.delete(idArticulo);
      }

      newState = {
        ...state,
        promocionesSeleccionadas: nuevasSelecciones,
        ultimaActualizacion: Date.now(),
      };
      break;
    }

    case "SET_PROMOCION_AGRUPADA": {
      if (!action.payload) {
        // ✅ Si se quita la promoción agrupada, eliminar productos automáticos
        console.log("❌ Quitando promoción agrupada y productos automáticos");
        console.log("Productos automáticos a eliminar:", Array.from(state.productosAutomaticosPromocion));
        
        const itemsFinales = state.items.filter(item => 
          !state.productosAutomaticosPromocion.has(item.id)
        );
        
        console.log(`🗑️ Eliminados ${state.items.length - itemsFinales.length} productos automáticos`);
        console.log("Items restantes:", itemsFinales.map(i => ({ id: i.id, nombre: i.nombre })));
        
        newState = {
          ...state,
          items: itemsFinales,
          promocionAgrupada: null,
          productosAutomaticosPromocion: new Set(), // ✅ Limpiar tracking
          ultimaActualizacion: Date.now(),
        };
        break;
      }

      // Verificar que no se duplique la misma promoción
      if (state.promocionAgrupada?.idPromocion === action.payload.idPromocion) {
        console.log("⚠️ Promoción ya está aplicada, evitando duplicación");
        return state; // No hacer nada si es la misma promoción
      }

      console.log("🎁 Aplicando promoción agrupada y trackeando productos automáticos");

      // Identificar qué productos de la promoción NO están en el carrito
      const productosPromoFaltantes = action.payload.articulos.filter(
        (artPromo: any) =>
          !state.items.some((item) => item.id === artPromo.idArticulo)
      );

      console.log("📦 Productos faltantes que se agregarán automáticamente:", 
        productosPromoFaltantes.map((a: any) => `${a.denominacion} (id: ${a.idArticulo})`)
      );

      // Crear items para los productos faltantes SOLO con cantidad 1
      const nuevosItemsPromo: ItemCarrito[] = productosPromoFaltantes.map(
        (art: any) => ({
          id: art.idArticulo,
          nombre: art.denominacion,
          cantidad: 1, // ✅ SIEMPRE cantidad 1 para promoción agrupada
          precio: art.precioVenta,
          imagen: undefined,
          tiempoPreparacion: undefined,
        })
      );

      // ✅ NUEVO: Trackear IDs de productos agregados automáticamente
      const nuevosProductosAutomaticos = new Set([
        ...state.productosAutomaticosPromocion,
        ...productosPromoFaltantes.map((art: any) => art.idArticulo)
      ]);

      console.log("🏷️ Productos automáticos trackeados:", Array.from(nuevosProductosAutomaticos));

      const itemsFinales = [...state.items, ...nuevosItemsPromo];

      newState = {
        ...state,
        items: itemsFinales,
        promocionAgrupada: action.payload,
        productosAutomaticosPromocion: nuevosProductosAutomaticos, // ✅ NUEVO
        ultimaActualizacion: Date.now(),
      };
      break;
    }

    case "RECALCULAR_TOTALES": {
      // Usar la CalculadoraDescuentosService para consistency
      if (state.items.length === 0) {
        newState = {
          ...state,
          totales: null,
        };
        break;
      }

      try {
        const totales = CalculadoraDescuentosService.calcularTotalesCarrito(
          state.items,
          state.promocionesSeleccionadas,
          state.promocionesDisponibles,
          state.promocionAgrupada,
          state.configuracion
        );

        newState = {
          ...state,
          totales,
          error: null,
        };
      } catch (error: any) {
        console.error("❌ Error calculando totales:", error);
        newState = {
          ...state,
          error: error.message,
        };
      }
      break;
    }

    case "SET_CONFIGURACION":
      newState = {
        ...state,
        configuracion: { ...state.configuracion, ...action.payload },
        ultimaActualizacion: Date.now(),
      };
      break;

    case "RESTAURAR_ESTADO":
      console.log('🔄 Restaurando estado desde localStorage');
      newState = { ...state, ...action.payload };
      break;

    case "PERSISTIR_ESTADO":
      // Forzar persistencia inmediata
      newState = { ...state, ultimaActualizacion: Date.now() };
      break;

    default:
      return state;
  }

  // ✅ Auto-persistir después de cada acción relevante (excepto acciones temporales)
  if (action.type !== "SET_LOADING" && 
      action.type !== "SET_ERROR" && 
      action.type !== "SET_PROMOCIONES_DISPONIBLES" && 
      action.type !== "RECALCULAR_TOTALES") {
    
    // Guardar con debounce para evitar writes excesivos
    setTimeout(() => guardarEstadoEnStorage(newState), 100);
  }

  return newState;
}

// ==================== CONTEXT ====================

const CarritoContext = createContext<CarritoContextValue | null>(null);

// ==================== PROVIDER ====================

interface CarritoProviderProps {
  children: React.ReactNode;
}

export const CarritoUnificadoProvider: React.FC<CarritoProviderProps> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(carritoReducer, null, createInitialState);

  // ✅ Auto-cargar promociones para items restaurados
  useEffect(() => {
    if (state.items.length > 0) {
      console.log(`🔄 Cargando promociones para ${state.items.length} items restaurados...`);
      state.items.forEach(item => {
        if (!state.promocionesDisponibles.has(item.id)) {
          // Cargar promociones de forma lazy
          setTimeout(() => {
            cargarPromocionesParaItem(item.id).catch(error => {
              console.warn(`⚠️ Error cargando promociones para ${item.id}:`, error);
            });
          }, 500); // Delay para evitar spam de requests
        }
      });
    }
  }, []); // Solo al montar

  // ✅ Limpiar localStorage al desmontar (opcional)
  useEffect(() => {
    return () => {
      // Guardar estado final al desmontar
      if (state.items.length > 0) {
        guardarEstadoEnStorage(state);
      }
    };
  }, [state]);

  // ==================== GETTERS COMPUTADOS (mantener existentes) ====================

  const estaVacio = state.items.length === 0;

  const cantidadTotal = useMemo(() => {
    return state.items.reduce((total, item) => {
      const estaEnPromoAgrupada = state.promocionAgrupada?.articulos?.some(
        (art: any) => art.idArticulo === item.id
      );

      if (estaEnPromoAgrupada) {
        return total + 1;
      }

      return total + item.cantidad;
    }, 0);
  }, [state.items, state.promocionAgrupada]);

  const cantidadTotalItems = state.items.length;

  const subtotal =
    state.totales?.subtotalOriginal ||
    state.items.reduce((total, item) => total + item.precio * item.cantidad, 0);
  const total = state.totales?.totalFinal || subtotal;
  const tieneDescuentos = state.totales?.tieneDescuentos || false;

  // ==================== ACCIONES DE ITEMS (mantener existentes) ====================

  const agregarItem = useCallback((producto: any, cantidad: number = 1) => {
    console.log("➕ Agregando item al carrito:", producto.denominacion, "x", cantidad);
    dispatch({ type: "AGREGAR_ITEM", payload: { producto, cantidad } });
  }, []);

  const removerItem = useCallback((idArticulo: number) => {
    console.log("🗑️ Removiendo item del carrito:", idArticulo);
    dispatch({ type: "REMOVER_ITEM", payload: idArticulo });
  }, []);

  const actualizarCantidad = useCallback((idArticulo: number, cantidad: number) => {
    console.log("🔄 Actualizando cantidad:", idArticulo, "→", cantidad);
    dispatch({
      type: "ACTUALIZAR_CANTIDAD",
      payload: { idArticulo, cantidad },
    });
  }, []);

  const incrementarCantidad = useCallback((idArticulo: number) => {
    const item = state.items.find((i) => i.id === idArticulo);
    if (item) {
      actualizarCantidad(idArticulo, item.cantidad + 1);
    }
  }, [state.items, actualizarCantidad]);

  const decrementarCantidad = useCallback((idArticulo: number) => {
    const item = state.items.find((i) => i.id === idArticulo);
    if (item && item.cantidad > 1) {
      actualizarCantidad(idArticulo, item.cantidad - 1);
    } else if (item && item.cantidad === 1) {
      removerItem(idArticulo);
    }
  }, [state.items, actualizarCantidad, removerItem]);

  const limpiarCarrito = useCallback(() => {
    console.log("🧹 Limpiando carrito completo");
    dispatch({ type: "LIMPIAR_CARRITO" });
  }, []);

  // ==================== ACCIONES DE PROMOCIONES (mantener existentes) ====================

  const cargarPromocionesParaItem = useCallback(
    async (idArticulo: number) => {
      if (state.promocionesDisponibles.has(idArticulo)) {
        console.log("✅ Promociones ya cargadas para artículo:", idArticulo);
        return;
      }

      try {
        dispatch({ type: "SET_LOADING", payload: true });

        const { PromocionService } = await import("../services/PromocionService");
        const promocionService = new PromocionService();

        const promociones = await promocionService.getPromocionesParaArticulo(idArticulo);

        dispatch({
          type: "SET_PROMOCIONES_DISPONIBLES",
          payload: { idArticulo, promociones },
        });

        console.log(`✅ Cargadas ${promociones.length} promociones para artículo ${idArticulo}`);
      } catch (error: any) {
        console.error("❌ Error cargando promociones:", error);
        dispatch({ type: "SET_ERROR", payload: error.message });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [state.promocionesDisponibles]
  );

  const seleccionarPromocion = useCallback(
    (idArticulo: number, idPromocion: number | undefined) => {
      console.log("🎯 Seleccionando promoción:", { idArticulo, idPromocion });
      dispatch({
        type: "SELECCIONAR_PROMOCION",
        payload: { idArticulo, idPromocion },
      });
    },
    []
  );

  const aplicarPromocionAgrupada = useCallback((promocion: PromocionAgrupada) => {
    console.log("🎁 Aplicando promoción agrupada:", promocion.denominacion);
    dispatch({ type: "SET_PROMOCION_AGRUPADA", payload: promocion });
  }, []);

  const quitarPromocionAgrupada = useCallback(() => {
    console.log("❌ Quitando promoción agrupada");
    dispatch({ type: "SET_PROMOCION_AGRUPADA", payload: null });
  }, []);

  // ==================== ACCIONES DE ENTREGA (mantener existentes) ====================

  const setDatosEntrega = useCallback((datos: DatosEntrega) => {
    console.log("📦 Actualizando datos de entrega:", datos);
    dispatch({ type: "SET_DATOS_ENTREGA", payload: datos });
  }, []);

  // ==================== RECÁLCULO AUTOMÁTICO (mantener existente) ====================

  const recalcularTotales = useCallback(() => {
    console.log("💰 Recalculando totales automáticamente...");
    dispatch({ type: "RECALCULAR_TOTALES" });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (state.items.length > 0) {
        recalcularTotales();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [
    state.items,
    state.promocionesSeleccionadas,
    state.promocionAgrupada,
    state.configuracion,
    recalcularTotales,
  ]);

  // ==================== UTILIDADES (mantener existentes) ====================

  const obtenerItem = useCallback(
    (idArticulo: number) => {
      return state.items.find((item) => item.id === idArticulo);
    },
    [state.items]
  );

  const getPromocionesDisponibles = useCallback(
    (idArticulo: number) => {
      return state.promocionesDisponibles.get(idArticulo) || [];
    },
    [state.promocionesDisponibles]
  );

  // ✅ NUEVAS UTILIDADES DE PERSISTENCIA
  
  const forzarGuardado = useCallback(() => {
    console.log('💾 Forzando guardado manual...');
    dispatch({ type: "PERSISTIR_ESTADO" });
    guardarEstadoEnStorage(state);
  }, [state]);

  const limpiarPersistencia = useCallback(() => {
    console.log('🗑️ Limpiando persistencia...');
    localStorage.removeItem(CARRITO_STORAGE_KEY);
  }, []);

  const obtenerInfoPersistencia = useCallback(() => {
    try {
      const datos = localStorage.getItem(CARRITO_STORAGE_KEY);
      const tamano = datos ? `${(datos.length / 1024).toFixed(2)} KB` : '0 KB';
      
      return {
        ultimaActualizacion: state.ultimaActualizacion,
        version: state.version,
        tamano
      };
    } catch {
      return {
        ultimaActualizacion: state.ultimaActualizacion,
        version: state.version,
        tamano: 'Error'
      };
    }
  }, [state.ultimaActualizacion, state.version]);

  // ==================== VALOR DEL CONTEXT ====================

  const contextValue: CarritoContextValue = useMemo(
    () => ({
      // Estado
      state,

      // Getters computados
      estaVacio,
      cantidadTotal,
      cantidadTotalItems,
      subtotal,
      total,
      tieneDescuentos,

      // Acciones de items
      agregarItem,
      removerItem,
      actualizarCantidad,
      incrementarCantidad,
      decrementarCantidad,
      limpiarCarrito,

      // Acciones de promociones
      cargarPromocionesParaItem,
      seleccionarPromocion,
      aplicarPromocionAgrupada,
      quitarPromocionAgrupada,

      // Acciones de entrega
      setDatosEntrega,

      // Utilidades
      obtenerItem,
      getPromocionesDisponibles,
      recalcularTotales,

      // ✅ NUEVAS: Funciones de persistencia
      forzarGuardado,
      limpiarPersistencia,
      obtenerInfoPersistencia,
    }),
    [
      state,
      estaVacio,
      cantidadTotal,
      cantidadTotalItems,
      subtotal,
      total,
      tieneDescuentos,
      agregarItem,
      removerItem,
      actualizarCantidad,
      incrementarCantidad,
      decrementarCantidad,
      limpiarCarrito,
      cargarPromocionesParaItem,
      seleccionarPromocion,
      aplicarPromocionAgrupada,
      quitarPromocionAgrupada,
      setDatosEntrega,
      obtenerItem,
      getPromocionesDisponibles,
      recalcularTotales,
      forzarGuardado,
      limpiarPersistencia,
      obtenerInfoPersistencia,
    ]
  );

  return (
    <CarritoContext.Provider value={contextValue}>
      {children}
    </CarritoContext.Provider>
  );
};

// ==================== HOOKS ESPECIALIZADOS (mantener existentes) ====================

export const useCarritoUnificado = (): CarritoContextValue => {
  const context = useContext(CarritoContext);

  if (!context) {
    throw new Error("useCarritoUnificado debe usarse dentro de CarritoUnificadoProvider");
  }

  return context;
};

export const useCarritoTotales = () => {
  const { state } = useCarritoUnificado();

  return useMemo(
    () => ({
      totales: state.totales,
      subtotal: state.totales?.subtotalOriginal || 0,
      descuentoTotal: state.totales?.descuentoTotal || 0,
      gastosEnvio: state.totales?.gastosEnvio || 0,
      total: state.totales?.totalFinal || 0,
      tieneDescuentos: state.totales?.tieneDescuentos || false,
      resumenDescuentos: state.totales?.resumenDescuentos || "",
      loading: state.loading,
    }),
    [state.totales, state.loading]
  );
};

export const useCarritoPromociones = () => {
  const {
    state,
    cargarPromocionesParaItem,
    seleccionarPromocion,
    aplicarPromocionAgrupada,
    quitarPromocionAgrupada,
    getPromocionesDisponibles,
  } = useCarritoUnificado();

  return useMemo(
    () => ({
      promocionesSeleccionadas: state.promocionesSeleccionadas,
      promocionAgrupada: state.promocionAgrupada,
      promocionesAplicadas: state.totales?.promocionesAplicadas || [],
      cargarPromocionesParaItem,
      seleccionarPromocion,
      aplicarPromocionAgrupada,
      quitarPromocionAgrupada,
      getPromocionesDisponibles,
      loading: state.loading,
    }),
    [
      state.promocionesSeleccionadas,
      state.promocionAgrupada,
      state.totales?.promocionesAplicadas,
      state.loading,
      cargarPromocionesParaItem,
      seleccionarPromocion,
      aplicarPromocionAgrupada,
      quitarPromocionAgrupada,
      getPromocionesDisponibles,
    ]
  );
};

export const useCarritoItems = () => {
  const {
    state,
    estaVacio,
    cantidadTotal,
    cantidadTotalItems,
    agregarItem,
    removerItem,
    actualizarCantidad,
    incrementarCantidad,
    decrementarCantidad,
    limpiarCarrito,
    obtenerItem,
  } = useCarritoUnificado();

  return useMemo(
    () => ({
      items: state.items,
      estaVacio,
      cantidadTotal,
      cantidadTotalItems,
      agregarItem,
      removerItem,
      actualizarCantidad,
      incrementarCantidad,
      decrementarCantidad,
      limpiarCarrito,
      obtenerItem,
      loading: state.loading,
    }),
    [
      state.items,
      state.loading,
      estaVacio,
      cantidadTotal,
      cantidadTotalItems,
      agregarItem,
      removerItem,
      actualizarCantidad,
      incrementarCantidad,
      decrementarCantidad,
      limpiarCarrito,
      obtenerItem,
    ]
  );
};

// ✅ NUEVO: Hook para funciones de persistencia
export const useCarritoPersistencia = () => {
  const { forzarGuardado, limpiarPersistencia, obtenerInfoPersistencia } = useCarritoUnificado();

  return useMemo(
    () => ({
      forzarGuardado,
      limpiarPersistencia,
      obtenerInfoPersistencia,
      // Utilidades adicionales
      esDisponible: typeof Storage !== "undefined",
      claveStorage: CARRITO_STORAGE_KEY,
    }),
    [forzarGuardado, limpiarPersistencia, obtenerInfoPersistencia]
  );
};

export default CarritoUnificadoProvider;