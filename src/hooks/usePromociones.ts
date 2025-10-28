import { useState, useEffect, useCallback } from 'react';
import { PromocionService } from '../services/PromocionService';
import type { 
  PromocionRequestDTO, 
  PromocionResponseDTO,
  PromocionAplicacionDTO
} from '../types/promociones';
import type { PromocionCompletaDTO } from '../types/promociones';

export const usePromociones = (cargarTodas = false, cargarVigentes = false) => {
  // Estados principales
  const [promociones, setPromociones] = useState<PromocionResponseDTO[]>([]);
  const [promocionesVigentes, setPromocionesVigentes] = useState<PromocionResponseDTO[]>([]);

  const [promocionesCompletas, setPromocionesCompletas] = useState<PromocionCompletaDTO[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Instancia del servicio
  const promocionService = new PromocionService();

  // Limpiar error
  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  // ==================== MÉTODOS PARA OBTENER DATOS ====================

  // Cargar todas las promociones (admin)
  const cargarPromociones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await promocionService.getAll();
      setPromociones(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar promociones');
      console.error('Error cargando promociones:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar promociones vigentes (cliente)
  const cargarPromocionesVigentes = useCallback(async () => {
    try {
      const data = await promocionService.getPromocionesVigentes();
      setPromocionesVigentes(data);
    } catch (err: any) {
      console.error('Error cargando promociones vigentes:', err);
    }
  }, []);

// Cargar promociones vigentes completas (cliente)
const cargarPromocionesVigentesCompletas = useCallback(async () => {
  try {
    const data = await promocionService.getPromocionesVigentesCompletas();
    setPromocionesCompletas(data);
  } catch (err: any) {
    console.error('Error cargando promociones vigentes completas:', err);
  }
}, []);

  // Obtener promoción por ID
  const obtenerPromocion = useCallback(async (id: number): Promise<PromocionResponseDTO | null> => {
    try {
      setError(null);
      return await promocionService.getById(id);
    } catch (err: any) {
      setError(err.message || 'Error al obtener promoción');
      console.error('Error obteniendo promoción:', err);
      return null;
    }
  }, []);

  // Obtener promociones para un artículo
  const obtenerPromocionesParaArticulo = useCallback(async (idArticulo: number): Promise<PromocionResponseDTO[]> => {
    try {
      return await promocionService.getPromocionesParaArticulo(idArticulo);
    } catch (err: any) {
      console.error('Error obteniendo promociones para artículo:', err);
      return [];
    }
  }, []);

  // Obtener promociones aplicables
  const obtenerPromocionesAplicables = useCallback(async (
    idArticulo: number, 
    idSucursal: number = 1
  ): Promise<PromocionResponseDTO[]> => {
    try {
      return await promocionService.getPromocionesAplicables(idArticulo, idSucursal);
    } catch (err: any) {
      console.error('Error obteniendo promociones aplicables:', err);
      return [];
    }
  }, []);

  // Calcular descuentos
  const calcularDescuentos = useCallback(async (
    idSucursal: number = 1,
    aplicaciones: PromocionAplicacionDTO[]
  ) => {
    try {
      return await promocionService.calcularDescuentos(idSucursal, aplicaciones);
    } catch (err: any) {
      console.error('Error calculando descuentos:', err);
      throw err;
    }
  }, []);

  // ==================== MÉTODOS CRUD (ADMIN) ====================

  // Crear promoción
  const crearPromocion = useCallback(async (data: PromocionRequestDTO): Promise<PromocionResponseDTO | null> => {
    try {
      setLoading(true);
      setError(null);
      const nuevaPromocion = await promocionService.create(data);
      
      // Actualizar la lista local
      setPromociones(prev => [...prev, nuevaPromocion]);
      
      // Si está vigente, agregar a vigentes también
      if (nuevaPromocion.estaVigente) {
        setPromocionesVigentes(prev => [...prev, nuevaPromocion]);
      }
      
      return nuevaPromocion;
    } catch (err: any) {
      setError(err.message || 'Error al crear promoción');
      console.error('Error creando promoción:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar promoción
  const actualizarPromocion = useCallback(async (
    id: number, 
    data: PromocionRequestDTO
  ): Promise<PromocionResponseDTO | null> => {
    try {
      setLoading(true);
      setError(null);
      const promocionActualizada = await promocionService.update(id, data);
      
      // Actualizar en la lista local
      setPromociones(prev => 
        prev.map(p => p.idPromocion === id ? promocionActualizada : p)
      );
      
      // Actualizar en vigentes si corresponde
      setPromocionesVigentes(prev => {
        const filtradas = prev.filter(p => p.idPromocion !== id);
        return promocionActualizada.estaVigente 
          ? [...filtradas, promocionActualizada]
          : filtradas;
      });
      
      return promocionActualizada;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar promoción');
      console.error('Error actualizando promoción:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar promoción
  const eliminarPromocion = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await promocionService.delete(id);
      
      // Eliminar de ambas listas
      setPromociones(prev => prev.filter(p => p.idPromocion !== id));
      setPromocionesVigentes(prev => prev.filter(p => p.idPromocion !== id));
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al eliminar promoción');
      console.error('Error eliminando promoción:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Activar promoción
  const activarPromocion = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await promocionService.activar(id);
      
      // Recargar promociones para obtener estado actualizado
      if (cargarTodas) {
        await cargarPromociones();
      }
      if (cargarVigentes) {
        await cargarPromocionesVigentes();
      }
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al activar promoción');
      console.error('Error activando promoción:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [cargarTodas, cargarVigentes, cargarPromociones, cargarPromocionesVigentes]);

  // Desactivar promoción
  const desactivarPromocion = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await promocionService.desactivar(id);
      
      // Recargar promociones para obtener estado actualizado
      if (cargarTodas) {
        await cargarPromociones();
      }
      if (cargarVigentes) {
        await cargarPromocionesVigentes();
      }
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al desactivar promoción');
      console.error('Error desactivando promoción:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [cargarTodas, cargarVigentes, cargarPromociones, cargarPromocionesVigentes]);

  // Refrescar datos
  const refreshPromociones = useCallback(async () => {
    const promises = [];
    if (cargarTodas) promises.push(cargarPromociones());
    if (cargarVigentes) promises.push(cargarPromocionesVigentes());
    
    await Promise.all(promises);
  }, [cargarTodas, cargarVigentes, cargarPromociones, cargarPromocionesVigentes]);

  // ==================== UTILIDADES ====================

  // Filtrar promociones por estado
  const filtrarPorEstado = useCallback((estado: 'vigentes' | 'programadas' | 'expiradas' | 'inactivas') => {
    return promociones.filter(p => {
      switch (estado) {
        case 'vigentes':
          return p.estaVigente && p.activo;
        case 'programadas':
          return p.activo && !p.estaVigente && p.estadoDescripcion.includes('inicia');
        case 'expiradas':
          return p.estadoDescripcion.includes('Expirada');
        case 'inactivas':
          return !p.activo;
        default:
          return true;
      }
    });
  }, [promociones]);

  // Buscar promociones por texto
  const buscarPromociones = useCallback((texto: string) => {
    if (!texto.trim()) return promociones;
    
    const busquedaLower = texto.toLowerCase();
    return promociones.filter(p => 
      p.denominacion.toLowerCase().includes(busquedaLower) ||
      p.descripcionDescuento?.toLowerCase().includes(busquedaLower)
    );
  }, [promociones]);

  // ==================== EFECTOS ====================
  
  useEffect(() => {
  if (cargarTodas) {
    cargarPromociones();
  }
  if (cargarVigentes) {
    cargarPromocionesVigentes();
    cargarPromocionesVigentesCompletas(); // ✅ AGREGAR ESTA LÍNEA
  }
}, [cargarTodas, cargarVigentes, cargarPromociones, cargarPromocionesVigentes, cargarPromocionesVigentesCompletas]);

  return {
    // Estados
    promociones,
    promocionesVigentes,
    promocionesCompletas,
    loading,
    error,
    
    // Métodos para obtener datos
    obtenerPromocion,
    obtenerPromocionesParaArticulo,
    obtenerPromocionesAplicables,
    calcularDescuentos,
    
    // Métodos CRUD
    crearPromocion,
    actualizarPromocion,
    eliminarPromocion,
    activarPromocion,
    desactivarPromocion,
    
    // Utilidades
    refreshPromociones,
    filtrarPorEstado,
    buscarPromociones,
    limpiarError
  };
};