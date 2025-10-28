import { useState, useEffect, useCallback } from 'react';
import { PedidoService } from '../services/PedidoServices';
import { PromocionService } from '../services/PromocionService';
import type { 
  CarritoPreviewDTO, 
  PromocionResponseDTO 
} from '../types/promociones';
import type { PedidoRequestDTO } from '../types/pedidos';

interface ItemCarritoConPromocion {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  observaciones?: string;
  promocionSeleccionada?: number;
  promocionesDisponibles?: PromocionResponseDTO[];
}

interface DatosEntrega {
  tipoEnvio: 'DELIVERY' | 'TAKE_AWAY';
  observaciones?: string;
}

interface UseCarritoConPromocionesReturn {
  // Estado del carrito
  items: ItemCarritoConPromocion[];
  estaVacio: boolean;
  cantidadItems: number;
  
  // Datos de entrega
  datosEntrega: DatosEntrega;
  setDatosEntrega: (datos: DatosEntrega) => void;
  
  // Preview con cálculos del backend
  preview: CarritoPreviewDTO | null;
  cargandoPreview: boolean;
  errorPreview: string | null;
  
  // Acciones del carrito
  agregarItem: (item: Omit<ItemCarritoConPromocion, 'promocionesDisponibles'>) => void;
  removerItem: (id: number) => void;
  actualizarCantidad: (id: number, cantidad: number) => void;
  actualizarObservaciones: (id: number, observaciones: string) => void;
  seleccionarPromocion: (id: number, idPromocion: number | undefined) => Promise<void>;
  limpiarCarrito: () => void;
  
  // Funciones de promociones
  cargarPromocionesParaItem: (id: number) => Promise<void>;
  calcularPreview: () => Promise<void>;
  
  // Utilidades calculadas
  subtotalOriginal: number;
  descuentoTotal: number;
  costoEnvio: number;
  total: number;
  tieneDescuentos: boolean;
  resumenDescuentos: string;
}

export const useCarritoConPromociones = (
  idCliente?: number,
  idSucursal: number = 1
): UseCarritoConPromocionesReturn => {
  
  const [items, setItems] = useState<ItemCarritoConPromocion[]>([]);
  const [datosEntrega, setDatosEntrega] = useState<DatosEntrega>({
    tipoEnvio: 'TAKE_AWAY'
  });
  
  const [preview, setPreview] = useState<CarritoPreviewDTO | null>(null);
  const [cargandoPreview, setCargandoPreview] = useState(false);
  const [errorPreview, setErrorPreview] = useState<string | null>(null);
  
  const pedidoService = new PedidoService();
  const promocionService = new PromocionService();

  // ==================== ACCIONES DEL CARRITO ====================
  
  const agregarItem = useCallback((nuevoItem: Omit<ItemCarritoConPromocion, 'promocionesDisponibles'>) => {
    setItems(prev => {
      const itemExistente = prev.find(item => item.id === nuevoItem.id);
      
      if (itemExistente) {
        // Actualizar cantidad del item existente
        return prev.map(item => 
          item.id === nuevoItem.id 
            ? { ...item, cantidad: item.cantidad + nuevoItem.cantidad }
            : item
        );
      } else {
        // Agregar nuevo item
        return [...prev, { ...nuevoItem, promocionesDisponibles: [] }];
      }
    });
  }, []);

  const removerItem = useCallback((id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const actualizarCantidad = useCallback((id: number, cantidad: number) => {
    if (cantidad <= 0) {
      removerItem(id);
      return;
    }
    
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, cantidad } : item
    ));
  }, [removerItem]);

  const actualizarObservaciones = useCallback((id: number, observaciones: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, observaciones } : item
    ));
  }, []);

  const seleccionarPromocion = useCallback(async (id: number, idPromocion: number | undefined) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, promocionSeleccionada: idPromocion }
        : item
    ));
    
    // Recalcular preview después de cambiar promoción
    await calcularPreview();
  }, []);

  const limpiarCarrito = useCallback(() => {
    setItems([]);
    setPreview(null);
    setErrorPreview(null);
  }, []);

  // ==================== FUNCIONES DE PROMOCIONES ====================
  
  const cargarPromocionesParaItem = useCallback(async (id: number) => {
    try {
      const promociones = await promocionService.getPromocionesParaArticulo(id);
      
      setItems(prev => prev.map(item => 
        item.id === id 
          ? { ...item, promocionesDisponibles: promociones }
          : item
      ));
      
    } catch (error) {
      console.error(`Error cargando promociones para item ${id}:`, error);
    }
  }, []);

  const calcularPreview = useCallback(async () => {
    if (!idCliente || items.length === 0) {
      setPreview(null);
      return;
    }

    try {
      setCargandoPreview(true);
      setErrorPreview(null);
      
      const pedidoRequest: PedidoRequestDTO = PedidoService.crearRequestConPromociones(
        items.map(item => ({
          id: item.id,
          cantidad: item.cantidad,
          observaciones: item.observaciones,
          promocionSeleccionada: item.promocionSeleccionada
        })),
        idCliente,
        datosEntrega.tipoEnvio,
        idSucursal,
        undefined, // idDomicilio se manejará en el checkout
        datosEntrega.observaciones
      );
      
      const nuevoPreview = await pedidoService.previewCarrito(pedidoRequest);
      setPreview(nuevoPreview);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al calcular preview';
      setErrorPreview(errorMessage);
      console.error('Error calculando preview:', error);
    } finally {
      setCargandoPreview(false);
    }
  }, [items, datosEntrega, idCliente, idSucursal]);

  // ==================== EFECTOS ====================
  
  // Recalcular preview cuando cambia el carrito o datos de entrega
  useEffect(() => {
    if (idCliente) {
      calcularPreview();
    }
  }, [calcularPreview, idCliente]);

  // Cargar promociones para nuevos items
  useEffect(() => {
    items.forEach(item => {
      if (!item.promocionesDisponibles || item.promocionesDisponibles.length === 0) {
        cargarPromocionesParaItem(item.id);
      }
    });
  }, [items, cargarPromocionesParaItem]);

  // ==================== PROPIEDADES CALCULADAS ====================
  
  const estaVacio = items.length === 0;
  const cantidadItems = items.reduce((total, item) => total + item.cantidad, 0);
  
  // Usar valores del preview si están disponibles, sino calcular básico
  const subtotalOriginal = preview?.subtotalOriginal ?? 
    items.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    
  const descuentoTotal = preview?.descuentoTotal ?? 0;
  const costoEnvio = preview?.gastosEnvio ?? (datosEntrega.tipoEnvio === 'DELIVERY' ? 200 : 0);
  const total = preview?.totalFinal ?? (subtotalOriginal - descuentoTotal + costoEnvio);
  
  const tieneDescuentos = descuentoTotal > 0;
  const resumenDescuentos = preview?.resumenPromociones ?? '';

  return {
    // Estado del carrito
    items,
    estaVacio,
    cantidadItems,
    
    // Datos de entrega
    datosEntrega,
    setDatosEntrega,
    
    // Preview con cálculos del backend
    preview,
    cargandoPreview,
    errorPreview,
    
    // Acciones del carrito
    agregarItem,
    removerItem,
    actualizarCantidad,
    actualizarObservaciones,
    seleccionarPromocion,
    limpiarCarrito,
    
    // Funciones de promociones
    cargarPromocionesParaItem,
    calcularPreview,
    
    // Utilidades calculadas
    subtotalOriginal,
    descuentoTotal,
    costoEnvio,
    total,
    tieneDescuentos,
    resumenDescuentos,
  };
};