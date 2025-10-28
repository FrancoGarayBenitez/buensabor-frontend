import { useState, useEffect, useCallback } from 'react';
import { PedidoService } from '../services/PedidoServices';
import { ProductoService } from '../services/ProductoService';
import type { PedidoResponseDTO } from '../types/pedidos';
import type { ArticuloManufacturadoResponseDTO } from '../types/productos/ArticuloManufacturadoResponseDTO';

interface UseCocinaReturn {
  // Estados de los pedidos por columna
  pedidosPendientes: PedidoResponseDTO[];
  pedidosEnPreparacion: PedidoResponseDTO[];
  pedidosListos: PedidoResponseDTO[];
  
  // Estados de carga
  loading: boolean;
  error: string | null;
  
  // Acciones principales
  refreshPedidos: () => Promise<void>;
  moverPedidoASiguienteEstado: (id: number, estadoActual: string) => Promise<void>;
  extenderTiempo: (id: number, minutosExtension: number) => Promise<void>;
  
  // Información adicional
  totalPedidos: number;
  pedidoSeleccionado: PedidoResponseDTO | null;
  setPedidoSeleccionado: (pedido: PedidoResponseDTO | null) => void;
  
  // Cache de productos para recetas
  productosCache: Map<number, ArticuloManufacturadoResponseDTO>;
  obtenerProducto: (idArticulo: number) => Promise<ArticuloManufacturadoResponseDTO | null>;
}

export const useCocina = (): UseCocinaReturn => {
  // Estados principales
  const [pedidosPendientes, setPedidosPendientes] = useState<PedidoResponseDTO[]>([]);
  const [pedidosEnPreparacion, setPedidosEnPreparacion] = useState<PedidoResponseDTO[]>([]);
  const [pedidosListos, setPedidosListos] = useState<PedidoResponseDTO[]>([]);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoResponseDTO | null>(null);
  
  // Cache para productos (para evitar llamadas repetidas)
  const [productosCache, setProductosCache] = useState<Map<number, ArticuloManufacturadoResponseDTO>>(new Map());
  
  const pedidoService = new PedidoService();
  const productoService = new ProductoService();

  // Cargar pedidos por estado
  const loadPedidosPorEstado = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar en paralelo todos los estados relevantes para cocina
      const [pendientes, enPreparacion, listos] = await Promise.all([
        pedidoService.getPedidosPendientes(),
        pedidoService.getPedidosEnPreparacion(),
        pedidoService.getPedidosListos(),
      ]);

      setPedidosPendientes(pendientes);
      setPedidosEnPreparacion(enPreparacion);
      setPedidosListos(listos);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar pedidos';
      setError(errorMessage);
      console.error('Error cargando pedidos de cocina:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh manual
  const refreshPedidos = useCallback(async () => {
    await loadPedidosPorEstado();
  }, [loadPedidosPorEstado]);

  // Obtener información de producto (con cache)
  const obtenerProducto = useCallback(async (idArticulo: number): Promise<ArticuloManufacturadoResponseDTO | null> => {
    try {
      // Verificar cache primero
      if (productosCache.has(idArticulo)) {
        return productosCache.get(idArticulo)!;
      }

      // Si no está en cache, obtener del servicio
      const producto = await productoService.getById(idArticulo);
      
      // Guardar en cache
      setProductosCache(prev => new Map(prev.set(idArticulo, producto)));
      
      return producto;
    } catch (err) {
      console.error(`Error al obtener producto ${idArticulo}:`, err);
      return null;
    }
  }, [productosCache]);

  // Mover pedido al siguiente estado
  const moverPedidoASiguienteEstado = useCallback(async (id: number, estadoActual: string) => {
    try {
      setError(null);
      let pedidoActualizado: PedidoResponseDTO;

      switch (estadoActual) {
        case 'PENDIENTE':
          // De PENDIENTE → EN_PREPARACION
          pedidoActualizado = await pedidoService.marcarEnPreparacion(id);
          
          // Actualizar listas localmente
          setPedidosPendientes(prev => prev.filter(p => p.idPedido !== id));
          setPedidosEnPreparacion(prev => [...prev, pedidoActualizado]);
          break;

        case 'PREPARACION':
          // De PREPARACION → LISTO
          pedidoActualizado = await pedidoService.marcarListo(id);
          
          // Actualizar listas localmente
          setPedidosEnPreparacion(prev => prev.filter(p => p.idPedido !== id));
          setPedidosListos(prev => [...prev, pedidoActualizado]);
          break;

        default:
          throw new Error(`Estado ${estadoActual} no válido para cocina`);
      }

      // Si el pedido seleccionado es el que se movió, actualizarlo
      if (pedidoSeleccionado?.idPedido === id) {
        setPedidoSeleccionado(pedidoActualizado);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cambiar estado';
      setError(errorMessage);
      throw err;
    }
  }, [pedidoSeleccionado]);

  // Extender tiempo de preparación (simulación - en el futuro se podría implementar en backend)
  const extenderTiempo = useCallback(async (id: number, minutosExtension: number) => {
    try {
      setError(null);
      
      // Por ahora simulamos la extensión modificando localmente
      // En el futuro se podría agregar un endpoint específico para esto
      
      const actualizarTiempoEnLista = (lista: PedidoResponseDTO[], setter: React.Dispatch<React.SetStateAction<PedidoResponseDTO[]>>) => {
        setter(prev => prev.map(pedido => {
          if (pedido.idPedido === id) {
            // Calcular nueva hora estimada
            const horaActual = new Date();
            const nuevaHoraEstimada = new Date(horaActual.getTime() + minutosExtension * 60000);
            const nuevaHoraString = nuevaHoraEstimada.toTimeString().slice(0, 8);
            
            const pedidoActualizado = {
              ...pedido,
              horaEstimadaFinalizacion: nuevaHoraString,
              tiempoEstimadoTotal: pedido.tiempoEstimadoTotal + minutosExtension
            };

            // Actualizar pedido seleccionado si es el mismo
            if (pedidoSeleccionado?.idPedido === id) {
              setPedidoSeleccionado(pedidoActualizado);
            }

            return pedidoActualizado;
          }
          return pedido;
        }));
      };

      // Buscar en qué lista está el pedido y actualizarlo
      const pedidoEnPendientes = pedidosPendientes.find(p => p.idPedido === id);
      const pedidoEnPreparacion = pedidosEnPreparacion.find(p => p.idPedido === id);
      const pedidoEnListos = pedidosListos.find(p => p.idPedido === id);

      if (pedidoEnPendientes) {
        actualizarTiempoEnLista(pedidosPendientes, setPedidosPendientes);
      } else if (pedidoEnPreparacion) {
        actualizarTiempoEnLista(pedidosEnPreparacion, setPedidosEnPreparacion);
      } else if (pedidoEnListos) {
        actualizarTiempoEnLista(pedidosListos, setPedidosListos);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al extender tiempo';
      setError(errorMessage);
      throw err;
    }
  }, [pedidosPendientes, pedidosEnPreparacion, pedidosListos, pedidoSeleccionado]);

  // Calcular total de pedidos
  const totalPedidos = pedidosPendientes.length + pedidosEnPreparacion.length + pedidosListos.length;

  // Cargar pedidos al montar el componente
  useEffect(() => {
    loadPedidosPorEstado();
  }, [loadPedidosPorEstado]);

  // Auto-refresh cada 30 segundos para mantener actualizada la vista
  useEffect(() => {
    const interval = setInterval(() => {
      loadPedidosPorEstado();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [loadPedidosPorEstado]);

  return {
    // Estados de los pedidos
    pedidosPendientes,
    pedidosEnPreparacion, 
    pedidosListos,
    
    // Estados de carga
    loading,
    error,
    
    // Acciones
    refreshPedidos,
    moverPedidoASiguienteEstado,
    extenderTiempo,
    
    // Información adicional
    totalPedidos,
    pedidoSeleccionado,
    setPedidoSeleccionado,
    
    // Cache y utilidades para recetas
    productosCache,
    obtenerProducto,
  };
};