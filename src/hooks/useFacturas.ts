import { useState, useEffect, useCallback } from 'react';
import { FacturaService } from '../services/FacturaService';
import type { FacturaResponseDTO, FacturaDownloadState } from '../types/facturas/FacturaTypes';

interface UseFacturasState {
  facturas: FacturaResponseDTO[];
  loading: boolean;
  error: string | null;
}

interface UseFacturasOptions {
  autoLoad?: boolean;
  clienteId?: number;
}

export const useFacturas = (options: UseFacturasOptions = {}) => {
  const { autoLoad = false, clienteId } = options;
  
  const [state, setState] = useState<UseFacturasState>({
    facturas: [],
    loading: false,
    error: null
  });

  // Cargar todas las facturas
  const loadFacturas = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      let facturas: FacturaResponseDTO[];
      
      if (clienteId) {
        facturas = await FacturaService.getFacturasByClienteId(clienteId);
      } else {
        facturas = await FacturaService.getAllFacturas();
      }
      
      setState({
        facturas,
        loading: false,
        error: null
      });
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error cargando facturas'
      }));
    }
  }, [clienteId]);

  // Obtener factura por ID
  const getFacturaById = useCallback(async (id: number): Promise<FacturaResponseDTO | null> => {
    try {
      return await FacturaService.getFacturaById(id);
    } catch (error) {
      console.error('Error obteniendo factura:', error);
      return null;
    }
  }, []);

  // Obtener factura por pedido ID
  const getFacturaByPedidoId = useCallback(async (pedidoId: number): Promise<FacturaResponseDTO | null> => {
    try {
      return await FacturaService.getFacturaByPedidoId(pedidoId);
    } catch (error) {
      console.error('Error obteniendo factura por pedido:', error);
      return null;
    }
  }, []);

  // Verificar si existe factura para pedido
  const checkFacturaExists = useCallback(async (pedidoId: number): Promise<boolean> => {
    return await FacturaService.existeFacturaParaPedido(pedidoId);
  }, []);

  // Refrescar facturas
  const refresh = useCallback(() => {
    loadFacturas();
  }, [loadFacturas]);

  // Auto-cargar al montar si está habilitado
  useEffect(() => {
    if (autoLoad) {
      loadFacturas();
    }
  }, [autoLoad, loadFacturas]);

  return {
    // Estado
    facturas: state.facturas,
    loading: state.loading,
    error: state.error,
    
    // Acciones
    loadFacturas,
    getFacturaById,
    getFacturaByPedidoId,
    checkFacturaExists,
    refresh,
    
    // Utilidades
    hasFacturas: state.facturas.length > 0,
    totalFacturas: state.facturas.length
  };
};

// Hook específico para facturas de un cliente
export const useFacturasCliente = (clienteId: number | null, autoLoad = true) => {
  return useFacturas({ 
    autoLoad: autoLoad && clienteId !== null, 
    clienteId: clienteId || undefined 
  });
};

// Hook para manejo de descargas PDF
export const useFacturaDownload = () => {
  const [downloadState, setDownloadState] = useState<FacturaDownloadState>({
    status: 'idle'
  });

  const downloadPdf = useCallback(async (facturaId: number, preview = false) => {
    setDownloadState({ status: 'downloading' });
    
    try {
      await FacturaService.descargarFacturaPdf(facturaId, { preview });
      
      setDownloadState({ 
        status: 'success',
        filename: `factura_${facturaId}.pdf`
      });
      
      // Reset después de 2 segundos
      setTimeout(() => {
        setDownloadState({ status: 'idle' });
      }, 2000);
      
    } catch (error) {
      setDownloadState({ 
        status: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      
      // Reset después de 3 segundos
      setTimeout(() => {
        setDownloadState({ status: 'idle' });
      }, 3000);
    }
  }, []);

  const downloadPdfByPedido = useCallback(async (pedidoId: number) => {
    setDownloadState({ status: 'downloading' });
    
    try {
      await FacturaService.descargarFacturaPdfByPedido(pedidoId);
      
      setDownloadState({ 
        status: 'success',
        filename: `factura_pedido_${pedidoId}.pdf`
      });
      
      // Reset después de 2 segundos
      setTimeout(() => {
        setDownloadState({ status: 'idle' });
      }, 2000);
      
    } catch (error) {
      setDownloadState({ 
        status: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      
      // Reset después de 3 segundos
      setTimeout(() => {
        setDownloadState({ status: 'idle' });
      }, 3000);
    }
  }, []);

  const resetDownloadState = useCallback(() => {
    setDownloadState({ status: 'idle' });
  }, []);

  return {
    downloadState,
    downloadPdf,
    downloadPdfByPedido,
    resetDownloadState,
    isDownloading: downloadState.status === 'downloading',
    isSuccess: downloadState.status === 'success',
    isError: downloadState.status === 'error'
  };
};