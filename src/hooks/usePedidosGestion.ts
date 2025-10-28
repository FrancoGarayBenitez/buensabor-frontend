import { useState, useEffect, useCallback, useMemo } from 'react';
import { PedidoService } from '../services/PedidoServices';
import type { PedidoResponseDTO } from '../types/pedidos';

export type EstadoFiltro = 'TODOS' | 'PENDIENTE' | 'PREPARACION' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';

interface UsePedidosGestionReturn {
  pedidos: PedidoResponseDTO[];
  loading: boolean;
  error: string | null;
  filtroEstado: EstadoFiltro;
  busquedaCodigo: string;
  setFiltroEstado: (estado: EstadoFiltro) => void;
  setBusquedaCodigo: (codigo: string) => void;
  refreshPedidos: () => Promise<void>;
  cambiarEstadoPedido: (id: number, nuevoEstado: string) => Promise<void>;
  pedidosFiltrados: PedidoResponseDTO[];
}

export const usePedidosGestion = (): UsePedidosGestionReturn => {
  const [pedidos, setPedidos] = useState<PedidoResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>('TODOS');
  const [busquedaCodigo, setBusquedaCodigo] = useState('');

  const pedidoService = new PedidoService();

  // Cargar todos los pedidos
  const loadPedidos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pedidoService.getAllPedidos();
      setPedidos(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos');
      console.error('Error cargando pedidos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh manual
  const refreshPedidos = useCallback(async () => {
    await loadPedidos();
  }, [loadPedidos]);

  // Cambiar estado de un pedido
  const cambiarEstadoPedido = useCallback(async (id: number, nuevoEstado: string) => {
    try {
      setError(null);
      let pedidoActualizado: PedidoResponseDTO;

      switch (nuevoEstado) {
        case 'PREPARACION':
          pedidoActualizado = await pedidoService.marcarEnPreparacion(id);
          break;
        case 'LISTO':
          pedidoActualizado = await pedidoService.marcarListo(id);
          break;
        case 'ENTREGADO':
          pedidoActualizado = await pedidoService.marcarEntregado(id);
          break;
        case 'CANCELADO':
          pedidoActualizado = await pedidoService.cancelarPedido(id);
          break;
        default:
          throw new Error('Estado no válido');
      }

      // Actualizar el pedido en la lista local
      setPedidos(prev => 
        prev.map(p => p.idPedido === id ? pedidoActualizado : p)
      );

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
      throw err;
    }
  }, []);

  // Filtrar pedidos según criterios
  const pedidosFiltrados = useMemo(() => {
    let resultado = pedidos;

    // Filtro por estado
    if (filtroEstado !== 'TODOS') {
      resultado = resultado.filter(p => p.estado === filtroEstado);
    }

    // Filtro por código de pedido
    if (busquedaCodigo.trim()) {
      const codigoBusqueda = busquedaCodigo.trim().toLowerCase();
      resultado = resultado.filter(p => 
        p.idPedido.toString().includes(codigoBusqueda)
      );
    }

    // Ordenar por fecha descendente (más recientes primero)
    return resultado.sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }, [pedidos, filtroEstado, busquedaCodigo]);

  // Cargar pedidos al montar el componente
  useEffect(() => {
    loadPedidos();
  }, [loadPedidos]);

  return {
    pedidos,
    loading,
    error,
    filtroEstado,
    busquedaCodigo,
    setFiltroEstado,
    setBusquedaCodigo,
    refreshPedidos,
    cambiarEstadoPedido,
    pedidosFiltrados
  };
};