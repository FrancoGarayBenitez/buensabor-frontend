// src/hooks/useCarritoMercadoPago.ts - PRESERVACIÓN DE ESTADO FORZADA
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useCarritoContext } from '../context/CarritoContext';
import { MercadoPagoService } from '../services/MercadoPagoService';
import { PromocionService } from '../services/PromocionService';
import { PedidoService } from '../services/PedidoServices';
import { ItemCarritoUtils } from '../types/auxiliares/ItemCarrito';
import type { CalculoTotalesDTO, CalcularTotalesRequestDTO } from '../types/mercadopago/MercadoPagoTypes';
import type { PromocionResponseDTO, CarritoPreviewDTO } from '../types/promociones';
import type { ItemCarrito } from '../types/auxiliares/ItemCarrito';
import type { PromocionCompletaDTO } from '../types/promociones';

const mercadoPagoService = new MercadoPagoService();
const promocionService = new PromocionService();
const pedidoService = new PedidoService();

export interface UseCarritoMercadoPagoReturn {
    // ==================== ESTADOS BÁSICOS DEL CARRITO ====================
    items: ItemCarrito[];
    cantidadTotal: number;
    estaVacio: boolean;
    tiempoEstimadoTotal: number;

    // ==================== TOTALES CALCULADOS POR EL BACKEND ====================
    totalesBackend: CalculoTotalesDTO | null;
    cargandoTotales: boolean;
    errorTotales: string | null;

    // ==================== TOTALES FORMATEADOS PARA LA UI ====================
    subtotal: number;
    descuento: number;
    costoEnvio: number;
    total: number;
    tieneDescuento: boolean;
    resumenDescuento: string;

    // ==================== DATOS DE ENTREGA ====================
    datosEntrega: any;
    setDatosEntrega: (datos: any) => void;

    // ==================== ACCIONES DEL CARRITO ORIGINAL ====================
    agregarItem: (producto: any, cantidad?: number) => void;
    removerItem: (idProducto: number) => void;
    actualizarCantidad: (idProducto: number, nuevaCantidad: number) => void;
    incrementarCantidad: (idProducto: number) => void;
    decrementarCantidad: (idProducto: number) => void;
    limpiarCarrito: () => void;
    obtenerItem: (idProducto: number) => ItemCarrito | undefined;

    // ==================== 🎉 NUEVAS FUNCIONES DE PROMOCIONES ====================

    // Cargar promociones disponibles para un item
    cargarPromocionesParaItem: (idArticulo: number) => Promise<void>;

    // Seleccionar/deseleccionar promoción para un item
    seleccionarPromocion: (idArticulo: number, idPromocion: number | undefined) => Promise<void>;

    // Obtener promociones disponibles para un item
    getPromocionesDisponibles: (idArticulo: number) => PromocionResponseDTO[];

    // Verificar si un item tiene promoción aplicada
    itemTienePromocion: (idArticulo: number) => boolean;

    // Obtener información de promoción aplicada
    getInfoPromocionItem: (idArticulo: number) => ItemCarrito['infoPromocion'] | null;

    // ==================== PREVIEW CON PROMOCIONES ====================
    previewConPromociones: CarritoPreviewDTO | null;
    cargandoPreview: boolean;
    errorPreview: string | null;
    calcularPreviewConPromociones: () => Promise<void>;

    // ==================== UTILIDADES MEJORADAS ====================
    recalcularTotales: () => Promise<void>;
    obtenerTotalesFormateados: () => any;

    // Nuevas utilidades para promociones
    getTotalDescuentosPromociones: () => number;
    getResumenPromociones: () => string;
    tienePromociones: () => boolean;

    // ✅ AGREGAR estas funciones:
    aplicarDescuentoRetiro: () => void;
    quitarDescuentoRetiro: () => void;
    tieneDescuentoRetiro: boolean;
    descuentoRetiro: number;

    // PROMOCIONES AGRUPADAS
    promocionAgrupada: any | null;
    tienePromocionAgrupada: boolean;
    aplicarPromocionAgrupada: (promocion: any) => void;
    quitarPromocionAgrupada: () => void;
    getDescuentoPromocionAgrupada: () => number;
    descuentoPromocionAgrupada: number;
}

// ✅ VARIABLE GLOBAL PARA PERSISTIR PROMOCIÓN AGRUPADA
let PROMOCION_AGRUPADA_GLOBAL: any = null;

export const useCarritoMercadoPago = (): UseCarritoMercadoPagoReturn => {
    const carrito = useCarritoContext();

    // ==================== ESTADOS EXISTENTES ====================
    const [totalesBackend, setTotalesBackend] = useState<CalculoTotalesDTO | null>(null);
    const [isCalculandoTotales, setIsCalculandoTotales] = useState(false);
    const [errorTotales, setErrorTotales] = useState<string | null>(null);
    const isCalculandoRef = useRef(false);

    // ✅ NUEVOS ESTADOS PARA DESCUENTO RETIRO
    const [descuentoRetiroLocal, setDescuentoRetiroLocal] = useState(0);
    const [tieneDescuentoRetiroLocal, setTieneDescuentoRetiroLocal] = useState(false);

    // ==================== 🎉 NUEVOS ESTADOS PARA PROMOCIONES ====================
    const [promociones, setPromociones] = useState<Map<number, PromocionResponseDTO[]>>(new Map());
    const [promocionesSeleccionadas, setPromocionesSeleccionadas] = useState<Map<number, number>>(new Map());
    const [cargandoPromociones, setCargandoPromociones] = useState<Set<number>>(new Set());

    // ✅ ESTADO PROMOCIÓN AGRUPADA CON BACKUP GLOBAL
    const [promocionAgrupadaActual, setPromocionAgrupadaActual] = useState<any>(PROMOCION_AGRUPADA_GLOBAL);
    const promocionAgrupadaRef = useRef<any>(PROMOCION_AGRUPADA_GLOBAL);

    // Estados para preview con promociones
    const [previewConPromociones, setPreviewConPromociones] = useState<CarritoPreviewDTO | null>(null);
    const [cargandoPreview, setCargandoPreview] = useState(false);
    const [errorPreview, setErrorPreview] = useState<string | null>(null);

    // ✅ SINCRONIZAR CON VARIABLE GLOBAL AL MONTAR
    useEffect(() => {
        if (PROMOCION_AGRUPADA_GLOBAL && !promocionAgrupadaActual) {
            console.log('🔄 [HOOK] Restaurando promoción desde variable global:', PROMOCION_AGRUPADA_GLOBAL.denominacion);
            setPromocionAgrupadaActual(PROMOCION_AGRUPADA_GLOBAL);
            promocionAgrupadaRef.current = PROMOCION_AGRUPADA_GLOBAL;
        }
    }, []);

    // ==================== FUNCIONES EXISTENTES (sin cambios) ====================

    const aplicarPromocionAgrupada = useCallback((promocion: any) => {
        console.log('🎁 [HOOK] Aplicando promoción agrupada:', promocion.denominacion);
        
        // ✅ GUARDAR EN TODOS LOS LUGARES POSIBLES
        setPromocionAgrupadaActual(promocion);
        promocionAgrupadaRef.current = promocion;
        PROMOCION_AGRUPADA_GLOBAL = promocion; // ✅ VARIABLE GLOBAL
        
        console.log('🔒 [HOOK] Promoción guardada en:', {
            estado: promocion.denominacion,
            ref: promocionAgrupadaRef.current?.denominacion,
            global: PROMOCION_AGRUPADA_GLOBAL?.denominacion
        });
        
        // ✅ VERIFICACIÓN INMEDIATA:
        setTimeout(() => {
            console.log('🔍 [HOOK] Estado después de aplicar:', {
                promocionAgrupadaActual: promocionAgrupadaActual?.denominacion || promocion.denominacion,
                promocionAgrupadaRef: promocionAgrupadaRef.current?.denominacion,
                global: PROMOCION_AGRUPADA_GLOBAL?.denominacion,
                tienePromocionAgrupada: true
            });
        }, 100);
    }, [promocionAgrupadaActual]);

    const quitarPromocionAgrupada = useCallback(() => {
        console.log('❌ Quitando promoción agrupada');
        setPromocionAgrupadaActual(null);
        promocionAgrupadaRef.current = null;
        PROMOCION_AGRUPADA_GLOBAL = null; // ✅ LIMPIAR GLOBAL
    }, []);

    const getDescuentoPromocionAgrupada = useCallback((): number => {
        // ✅ BUSCAR EN TODOS LOS LUGARES POSIBLES
        const promocionActiva = promocionAgrupadaActual || promocionAgrupadaRef.current || PROMOCION_AGRUPADA_GLOBAL;
        
        if (!promocionActiva || carrito.estaVacio) {
            // ✅ SOLO MOSTRAR LOG SI REALMENTE NO HAY PROMOCIÓN
            if (!PROMOCION_AGRUPADA_GLOBAL) {
                console.log('🔍 No hay promoción agrupada activa o carrito vacío');
            }
            return 0;
        }
        
        const subtotalSinDescuentos = carrito.subtotal;
        console.log('🧮 Calculando descuento promoción:', {
            promocion: promocionActiva.denominacion,
            tipo: promocionActiva.tipoDescuento,
            valor: promocionActiva.valorDescuento,
            subtotal: subtotalSinDescuentos
        });
        
        if (promocionActiva.tipoDescuento === 'PORCENTUAL') {
            const descuento = (subtotalSinDescuentos * promocionActiva.valorDescuento) / 100;
            console.log('💰 Descuento calculado (%):', descuento);
            return descuento;
        } else {
            const descuento = Math.min(promocionActiva.valorDescuento, subtotalSinDescuentos);
            console.log('💰 Descuento calculado (fijo):', descuento);
            return descuento;
        }
    }, [promocionAgrupadaActual, carrito.subtotal, carrito.estaVacio]);

    const tienePromocionAgrupada = useMemo((): boolean => {
        // ✅ BUSCAR EN TODOS LOS LUGARES POSIBLES
        const tienePromocion = promocionAgrupadaActual !== null || 
                              promocionAgrupadaRef.current !== null || 
                              PROMOCION_AGRUPADA_GLOBAL !== null;
        
        console.log('🔍 [MEMO] tienePromocionAgrupada:', {
            estado: promocionAgrupadaActual !== null,
            ref: promocionAgrupadaRef.current !== null,
            global: PROMOCION_AGRUPADA_GLOBAL !== null,
            resultado: tienePromocion
        });
        return tienePromocion;
    }, [promocionAgrupadaActual]);

    // ✅ SINCRONIZAR TODAS LAS FUENTES
    useEffect(() => {
        if (promocionAgrupadaActual && !promocionAgrupadaRef.current) {
            promocionAgrupadaRef.current = promocionAgrupadaActual;
            PROMOCION_AGRUPADA_GLOBAL = promocionAgrupadaActual;
        }
        if (!promocionAgrupadaActual && (promocionAgrupadaRef.current || PROMOCION_AGRUPADA_GLOBAL)) {
            const promocionBackup = promocionAgrupadaRef.current || PROMOCION_AGRUPADA_GLOBAL;
            setPromocionAgrupadaActual(promocionBackup);
        }
    }, [promocionAgrupadaActual]);

    const validarDatosItems = (items: any[]): boolean => {
        if (!items || items.length === 0) {
            console.log('📝 No hay items para validar');
            return false;
        }

        for (const item of items) {
            if (!item.id || !item.cantidad) {
                console.error('❌ Item inválido - falta id o cantidad:', item);
                return false;
            }

            const idNumero = Number(item.id);
            const cantidadNumero = Number(item.cantidad);

            if (isNaN(idNumero) || isNaN(cantidadNumero)) {
                console.error('❌ Item con datos no numéricos:', { id: item.id, cantidad: item.cantidad });
                return false;
            }

            if (idNumero <= 0 || cantidadNumero <= 0) {
                console.error('❌ Item con valores inválidos:', { id: idNumero, cantidad: cantidadNumero });
                return false;
            }
        }

        console.log('✅ Validación de items exitosa');
        return true;
    };

    const construirRequestCalculo = (): CalcularTotalesRequestDTO | null => {
        if (!validarDatosItems(carrito.items)) {
            return null;
        }

        const detalles = carrito.items.map(item => ({
            idArticulo: Number(item.id),
            cantidad: Number(item.cantidad)
        }));

        const request: CalcularTotalesRequestDTO = {
            tipoEnvio: carrito.datosEntrega.tipoEnvio,
            detalles,
            porcentajeDescuentoTakeAway: 10,
            gastosEnvioDelivery: 200,
            aplicarDescuentoTakeAway: carrito.datosEntrega.tipoEnvio === 'TAKE_AWAY'
        };

        return request;
    };

    const recalcularTotales = useCallback(async () => {
        if (isCalculandoRef.current || carrito.estaVacio) {
            console.log('⏭️ Saltando recálculo - ya calculando o carrito vacío');
            return;
        }

        try {
            isCalculandoRef.current = true;
            setIsCalculandoTotales(true);
            setErrorTotales(null);

            const request = construirRequestCalculo();
            if (!request) {
                console.error('❌ No se pudo construir request válido');
                setErrorTotales('Datos del carrito inválidos');
                return;
            }

            console.log('📤 REQUEST ENVIADO AL BACKEND:', JSON.stringify(request, null, 2));

            const totales = await mercadoPagoService.calcularTotales(request);
            setTotalesBackend(totales);
            console.log('✅ Totales actualizados exitosamente:', totales);

        } catch (error: any) {
            console.error('❌ Error al calcular totales:', error);
            setErrorTotales(error.message || 'Error al calcular totales');

            // Fallback a cálculos locales
            setTotalesBackend({
                subtotalProductos: carrito.subtotal,
                descuentoTakeAway: carrito.datosEntrega.tipoEnvio === 'TAKE_AWAY' ? carrito.subtotal * 0.1 : 0,
                porcentajeDescuento: carrito.datosEntrega.tipoEnvio === 'TAKE_AWAY' ? 10 : 0,
                gastosEnvio: carrito.costoEnvio,
                totalFinal: carrito.total,
                tipoEnvio: carrito.datosEntrega.tipoEnvio,
                resumenCalculo: 'Cálculo local (backend no disponible)',
                seAplicoDescuento: carrito.datosEntrega.tipoEnvio === 'TAKE_AWAY'
            });
        } finally {
            isCalculandoRef.current = false;
            setIsCalculandoTotales(false);
        }
    }, [carrito.items, carrito.datosEntrega.tipoEnvio, carrito.estaVacio]);

    // ==================== 🎉 NUEVAS FUNCIONES PARA PROMOCIONES ====================

    const cargarPromocionesParaItem = useCallback(async (idArticulo: number) => {
        if (promociones.has(idArticulo)) {
            console.log(`✅ Promociones ya cargadas para artículo ${idArticulo}`);
            return;
        }

        setCargandoPromociones(prev => new Set([...prev, idArticulo]));

        try {
            console.log(`🎯 Cargando promociones para artículo ${idArticulo}...`);
            const promocionesDisponibles = await promocionService.getPromocionesParaArticulo(idArticulo);

            setPromociones(prev => new Map([...prev, [idArticulo, promocionesDisponibles]]));
            console.log(`✅ Cargadas ${promocionesDisponibles.length} promociones para artículo ${idArticulo}`);

        } catch (error) {
            console.error(`❌ Error cargando promociones para artículo ${idArticulo}:`, error);
            setPromociones(prev => new Map([...prev, [idArticulo, []]]));
        } finally {
            setCargandoPromociones(prev => {
                const newSet = new Set(prev);
                newSet.delete(idArticulo);
                return newSet;
            });
        }
    }, [promociones]);

    const seleccionarPromocion = useCallback(async (idArticulo: number, idPromocion: number | undefined) => {
        console.log(`🎯 Seleccionando promoción ${idPromocion} para artículo ${idArticulo}`);

        // Actualizar mapa de promociones seleccionadas
        setPromocionesSeleccionadas(prev => {
            const newMap = new Map(prev);
            if (idPromocion) {
                newMap.set(idArticulo, idPromocion);
            } else {
                newMap.delete(idArticulo);
            }
            return newMap;
        });

        // Recalcular preview con promociones
        await calcularPreviewConPromociones();
    }, []);

    const calcularPreviewConPromociones = useCallback(async () => {
        if (carrito.estaVacio) {
            setPreviewConPromociones(null);
            return;
        }

        try {
            setCargandoPreview(true);
            setErrorPreview(null);

            // Construir request con promociones seleccionadas
            const detalles = carrito.items.map(item => ({
                idArticulo: item.id,
                cantidad: item.cantidad,
                // ✅ Incluir promoción seleccionada si existe
                ...(promocionesSeleccionadas.has(item.id) ? {
                    idPromocionSeleccionada: promocionesSeleccionadas.get(item.id)
                } : {})
            }));

            // ✅ USAR EL MÉTODO DE PREVIEW EXISTENTE
            const pedidoRequest = {
                idCliente: 1, // Temporal - se obtendría del auth
                idSucursal: 1,
                tipoEnvio: carrito.datosEntrega.tipoEnvio,
                detalles
            };

            console.log('🛒 Calculando preview con promociones:', pedidoRequest);
            const preview = await pedidoService.previewCarrito(pedidoRequest);

            setPreviewConPromociones(preview);
            console.log('✅ Preview con promociones calculado:', preview);

        } catch (error: any) {
            console.error('❌ Error calculando preview con promociones:', error);
            setErrorPreview(error.message || 'Error al calcular preview');
        } finally {
            setCargandoPreview(false);
        }
    }, [carrito.items, carrito.datosEntrega.tipoEnvio, promocionesSeleccionadas, carrito.estaVacio]);

    // ==================== FUNCIONES PARA DESCUENTO RETIRO ====================

    const aplicarDescuentoRetiro = useCallback(() => {
        console.log('🎯 Aplicando descuento retiro...');
        console.log('Subtotal actual:', carrito.subtotal);
        
        if (!carrito.estaVacio && carrito.subtotal > 0) {
            const descuento = carrito.subtotal * 0.1; // 10% del subtotal
            setDescuentoRetiroLocal(descuento);
            setTieneDescuentoRetiroLocal(true);
            console.log('✅ Descuento retiro aplicado:', descuento);
        } else {
            console.log('❌ No se puede aplicar descuento - carrito vacío o subtotal 0');
        }
    }, [carrito.subtotal, carrito.estaVacio]);

    const quitarDescuentoRetiro = useCallback(() => {
        console.log('❌ Quitando descuento retiro');
        setDescuentoRetiroLocal(0);
        setTieneDescuentoRetiroLocal(false);
    }, []);

    // ✅ Auto-aplicar descuento cuando cambia tipo de envío
    useEffect(() => {
        console.log('🔄 Efecto tipo envío:', carrito.datosEntrega.tipoEnvio);
        
        if (carrito.datosEntrega.tipoEnvio === 'TAKE_AWAY') {
            aplicarDescuentoRetiro();
        } else {
            quitarDescuentoRetiro();
        }
    }, [carrito.datosEntrega.tipoEnvio, aplicarDescuentoRetiro, quitarDescuentoRetiro]);

    // ✅ Re-calcular descuento cuando cambia el subtotal
    useEffect(() => {
        if (carrito.datosEntrega.tipoEnvio === 'TAKE_AWAY' && tieneDescuentoRetiroLocal) {
            aplicarDescuentoRetiro(); // Recalcular con nuevo subtotal
        }
    }, [carrito.subtotal, carrito.datosEntrega.tipoEnvio, tieneDescuentoRetiroLocal, aplicarDescuentoRetiro]);

    // ==================== UTILIDADES PARA PROMOCIONES ====================

    const getPromocionesDisponibles = useCallback((idArticulo: number): PromocionResponseDTO[] => {
        return promociones.get(idArticulo) || [];
    }, [promociones]);

    const itemTienePromocion = useCallback((idArticulo: number): boolean => {
        return promocionesSeleccionadas.has(idArticulo);
    }, [promocionesSeleccionadas]);

    const getInfoPromocionItem = useCallback((idArticulo: number): ItemCarrito['infoPromocion'] | null => {
        const idPromocion = promocionesSeleccionadas.get(idArticulo);
        if (!idPromocion) return null;

        const promocionesItem = promociones.get(idArticulo) || [];
        const promocion = promocionesItem.find(p => p.idPromocion === idPromocion);
        if (!promocion) return null;

        const item = carrito.items.find(i => i.id === idArticulo);
        if (!item) return null;

        // Calcular descuento
        const descuento = promocion.tipoDescuento === 'PORCENTUAL'
            ? (item.precio * item.cantidad * promocion.valorDescuento) / 100
            : Math.min(promocion.valorDescuento * item.cantidad, item.precio * item.cantidad);

        return {
            id: promocion.idPromocion,
            nombre: promocion.denominacion,
            descripcion: promocion.descripcionDescuento,
            tipoDescuento: promocion.tipoDescuento,
            valorDescuento: promocion.valorDescuento,
            resumenDescuento: `${promocion.denominacion} - Ahorro: $${descuento.toFixed(0)}`
        };
    }, [promocionesSeleccionadas, promociones, carrito.items]);

    const getTotalDescuentosPromociones = useCallback((): number => {
        return previewConPromociones?.descuentoTotal || 0;
    }, [previewConPromociones]);

    const getResumenPromociones = useCallback((): string => {
        return previewConPromociones?.resumenPromociones || '';
    }, [previewConPromociones]);

    const tienePromociones = useCallback((): boolean => {
        return promocionesSeleccionadas.size > 0;
    }, [promocionesSeleccionadas]);

    // ==================== AUTO-CARGAR PROMOCIONES PARA NUEVOS ITEMS ====================

    useEffect(() => {
        // Cargar promociones para items que no las tengan cargadas
        carrito.items.forEach(item => {
            if (!promociones.has(item.id) && !cargandoPromociones.has(item.id)) {
                cargarPromocionesParaItem(item.id);
            }
        });
    }, [carrito.items, promociones, cargandoPromociones, cargarPromocionesParaItem]);

    // ==================== AUTO-RECALCULAR PREVIEW CON PROMOCIONES ====================

    useEffect(() => {
        if (!carrito.estaVacio) {
            const timer = setTimeout(() => {
                calcularPreviewConPromociones();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [carrito.items, carrito.datosEntrega.tipoEnvio, promocionesSeleccionadas, calcularPreviewConPromociones, carrito.estaVacio]);

    // ==================== AUTO-RECALCULAR TOTALES ORIGINALES ====================

    useEffect(() => {
        console.log('🔄 Trigger recálculo - Items:', carrito.items.length, 'Tipo:', carrito.datosEntrega.tipoEnvio);

        const timer = setTimeout(() => {
            if (!isCalculandoRef.current && !carrito.estaVacio && carrito.items.length > 0) {
                recalcularTotales();
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [carrito.items, carrito.datosEntrega.tipoEnvio, carrito.estaVacio, recalcularTotales]);

    // ==================== TOTALES FORMATEADOS (MEJORADOS CON PROMOCIONES) ====================

    const totalesFormateados = useMemo(() => {
        console.log('🧮 Calculando totales formateados...');
        console.log('Descuento retiro local:', descuentoRetiroLocal);
        console.log('Tiene descuento retiro:', tieneDescuentoRetiroLocal);

        // ✅ NUEVO: Calcular descuento de promoción agrupada
        const descuentoPromocionAgrupada = getDescuentoPromocionAgrupada();
        console.log('Descuento promoción agrupada:', descuentoPromocionAgrupada);

        // Priorizar totales del preview con promociones si están disponibles
        if (previewConPromociones) {
            const subtotalBase = previewConPromociones.subtotalOriginal;
            const descuentoPromociones = previewConPromociones.descuentoTotal;
            const descuentoRetiro = tieneDescuentoRetiroLocal ? descuentoRetiroLocal : 0;
            const descuentoTotal = descuentoPromociones + descuentoRetiro + descuentoPromocionAgrupada;
            const totalFinal = subtotalBase - descuentoTotal + previewConPromociones.gastosEnvio;

            return {
                subtotal: subtotalBase,
                descuento: descuentoTotal,
                costoEnvio: previewConPromociones.gastosEnvio,
                total: Math.max(0, totalFinal),
                tieneDescuento: descuentoTotal > 0,
                resumenDescuento: tieneDescuentoRetiroLocal 
                    ? '10% descuento por retiro en local' + (previewConPromociones.resumenPromociones ? ' + promociones' : '')
                    : previewConPromociones.resumenPromociones || ''
            };
        }

        // Fallback a totales de MercadoPago
        if (totalesBackend) {
            const formateo = MercadoPagoService.formatearTotales(totalesBackend);
            const descuentoRetiro = tieneDescuentoRetiroLocal ? descuentoRetiroLocal : 0;
            const descuentoTotal = formateo.descuento + descuentoRetiro + descuentoPromocionAgrupada;
            const totalFinal = formateo.subtotal - descuentoTotal + formateo.costoEnvio;

            return {
                subtotal: formateo.subtotal,
                descuento: descuentoTotal,
                costoEnvio: formateo.costoEnvio,
                total: Math.max(0, totalFinal),
                tieneDescuento: descuentoTotal > 0,
                resumenDescuento: tieneDescuentoRetiroLocal
                    ? '10% descuento por retiro en local'
                    : formateo.tieneDescuento ? `${formateo.porcentajeDescuento}% de descuento por retiro en local` : ''
            };
        }

        // ✅ Fallback final con AMBOS descuentos
        const subtotalBase = carrito.subtotal;
        const descuentoRetiro = tieneDescuentoRetiroLocal ? descuentoRetiroLocal : 0;
        const descuentoTotal = descuentoRetiro + descuentoPromocionAgrupada;
        const totalFinal = subtotalBase - descuentoTotal + carrito.costoEnvio;

        console.log('📊 Cálculo final:', {
            subtotalBase,
            descuentoRetiro,
            descuentoPromocionAgrupada,
            descuentoTotal,
            costoEnvio: carrito.costoEnvio,
            totalFinal: Math.max(0, totalFinal)
        });

        return {
            subtotal: subtotalBase,
            descuento: descuentoTotal,
            costoEnvio: carrito.costoEnvio,
            total: Math.max(0, totalFinal),
            tieneDescuento: descuentoTotal > 0,
            resumenDescuento: tieneDescuentoRetiroLocal ? '10% descuento por retiro en local' : ''
        };
    }, [previewConPromociones, totalesBackend, carrito.subtotal, carrito.costoEnvio, tieneDescuentoRetiroLocal, descuentoRetiroLocal, getDescuentoPromocionAgrupada]);

    // ==================== WRAPPER PARA SETDATOSENTREGA ====================

    const setDatosEntregaConRecalculo = (datos: any) => {
        console.log('📦 Cambiando datos de entrega:', datos);
        carrito.setDatosEntrega(datos);
    };

    // ==================== FUNCIÓN AUXILIAR PARA OBTENER TOTALES ====================

    const obtenerTotalesFormateados = () => {
        return {
            ...totalesFormateados,
            backend: totalesBackend,
            preview: previewConPromociones,
            cargando: isCalculandoTotales,
            cargandoPreview,
            error: errorTotales,
            errorPreview,
            tiempoEstimado: carrito.tiempoEstimadoTotal,
            promociones: {
                total: getTotalDescuentosPromociones(),
                resumen: getResumenPromociones(),
                tienePromociones: tienePromociones()
            }
        };
    };

    return {
        // ==================== ESTADOS BÁSICOS DEL CARRITO ====================
        items: carrito.items,
        cantidadTotal: carrito.cantidadTotal,
        estaVacio: carrito.estaVacio,
        tiempoEstimadoTotal: carrito.tiempoEstimadoTotal,

        // ==================== TOTALES CALCULADOS POR EL BACKEND ====================
        totalesBackend,
        cargandoTotales: isCalculandoTotales,
        errorTotales,

        // ==================== TOTALES FORMATEADOS PARA LA UI ====================
        subtotal: totalesFormateados.subtotal,
        descuento: totalesFormateados.descuento,
        costoEnvio: totalesFormateados.costoEnvio,
        total: totalesFormateados.total,
        tieneDescuento: totalesFormateados.tieneDescuento,
        resumenDescuento: totalesFormateados.resumenDescuento,

        // ✅ NUEVAS PROPIEDADES PARA DESCUENTO RETIRO
        tieneDescuentoRetiro: tieneDescuentoRetiroLocal,
        descuentoRetiro: descuentoRetiroLocal,
        aplicarDescuentoRetiro,
        quitarDescuentoRetiro,

        // ==================== DATOS DE ENTREGA ====================
        datosEntrega: carrito.datosEntrega,
        setDatosEntrega: setDatosEntregaConRecalculo,

        // ==================== ACCIONES DEL CARRITO ORIGINAL ====================
        agregarItem: carrito.agregarItem,
        removerItem: carrito.removerItem,
        actualizarCantidad: carrito.actualizarCantidad,
        incrementarCantidad: carrito.incrementarCantidad,
        decrementarCantidad: carrito.decrementarCantidad,
        limpiarCarrito: carrito.limpiarCarrito,
        obtenerItem: carrito.obtenerItem,

        // ==================== FUNCIONES DE PROMOCIONES ====================
        cargarPromocionesParaItem,
        seleccionarPromocion,
        getPromocionesDisponibles,
        itemTienePromocion,
        getInfoPromocionItem,

        // ==================== PREVIEW CON PROMOCIONES ====================
        previewConPromociones,
        cargandoPreview,
        errorPreview,
        calcularPreviewConPromociones,

        // ==================== UTILIDADES MEJORADAS ====================
        recalcularTotales,
        obtenerTotalesFormateados,
        getTotalDescuentosPromociones,
        getResumenPromociones,
        tienePromociones,

        // ✅ PROMOCIONES AGRUPADAS - CON TRIPLE BACKUP
        promocionAgrupada: promocionAgrupadaActual || promocionAgrupadaRef.current || PROMOCION_AGRUPADA_GLOBAL,
        tienePromocionAgrupada,
        aplicarPromocionAgrupada,
        quitarPromocionAgrupada,
        getDescuentoPromocionAgrupada,
        descuentoPromocionAgrupada: getDescuentoPromocionAgrupada(),
    };
};