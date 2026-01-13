import { useState, useEffect, useCallback } from "react";
import { promocionService } from "../services/PromocionService";
import type {
  PromocionRequest,
  PromocionResponse,
} from "../types/promociones/promocion.types";

/**
 * Hook personalizado para gestionar el estado y las operaciones CRUD de las promociones.
 */
export const usePromociones = () => {
  const [promociones, setPromociones] = useState<PromocionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==================== OBTENCIÓN DE DATOS ====================

  /**
   * Carga todas las promociones desde el backend y actualiza el estado.
   */
  const fetchPromociones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await promocionService.getAll();
      setPromociones(data);
      setError(null);
      return data;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error desconocido al cargar promociones";
      setError(message);
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ==================== OPERACIONES CRUD (CON OPTIMIZACIÓN DE UI) ====================

  /**
   * Crea una nueva promoción, la añade al estado local y devuelve la nueva entidad.
   */
  const createPromocion = async (
    data: PromocionRequest
  ): Promise<PromocionResponse> => {
    setLoading(true);
    try {
      const nuevaPromocion = await promocionService.create(data);
      setPromociones((prev) => [...prev, nuevaPromocion]);
      setError(null);
      return nuevaPromocion; // ✅ Devolver la nueva promoción
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al crear la promoción";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualiza una promoción, modifica el estado local y devuelve la entidad actualizada.
   */
  const updatePromocion = async (
    id: number,
    data: PromocionRequest
  ): Promise<PromocionResponse> => {
    setLoading(true);
    try {
      const promocionActualizada = await promocionService.update(id, data);
      setPromociones((prev) =>
        prev.map((p) => (p.id === id ? promocionActualizada : p))
      );
      setError(null);
      return promocionActualizada; // ✅ Devolver la promoción actualizada
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al actualizar la promoción";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Realiza una baja física y elimina la promoción del estado local.
   */
  const deletePromocion = async (id: number) => {
    setLoading(true);
    try {
      await promocionService.delete(id);
      setPromociones((prev) => prev.filter((p) => p.id !== id));
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al eliminar la promoción";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ==================== GESTIÓN DE ESTADOS ====================

  /**
   * Activa una promoción (revierte baja lógica) y actualiza el estado local.
   */
  const activatePromocion = async (id: number) => {
    setLoading(true);
    try {
      await promocionService.activate(id);
      // ✅ Actualización optimista del estado local
      setPromociones((prev) =>
        prev.map((p) => (p.id === id ? { ...p, eliminado: false } : p))
      );
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al activar la promoción";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Desactiva una promoción (baja lógica) y actualiza el estado local.
   */
  const deactivatePromocion = async (id: number) => {
    setLoading(true);
    try {
      await promocionService.deactivate(id);
      // ✅ Actualización optimista del estado local
      setPromociones((prev) =>
        prev.map((p) => (p.id === id ? { ...p, eliminado: true } : p))
      );
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al desactivar la promoción";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cambia el estado 'activo' de una promoción y actualiza el estado local.
   */
  const toggleActivoPromocion = async (id: number) => {
    setLoading(true);
    try {
      const promocionActualizada = await promocionService.toggleActivo(id);
      setPromociones((prev) =>
        prev.map((p) => (p.id === id ? promocionActualizada : p))
      );
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al cambiar el estado de la promoción";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ==================== BÚSQUEDAS ====================

  /**
   * Busca promociones por denominación y actualiza el estado con los resultados.
   */
  const searchByDenominacion = async (denominacion: string) => {
    setLoading(true);
    try {
      const data = await promocionService.searchByDenominacion(denominacion);
      setPromociones(data);
      setError(null);
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al buscar por denominación";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ==================== INICIALIZACIÓN Y RETORNO ====================

  // Carga inicial de promociones al montar el componente que usa el hook.
  useEffect(() => {
    fetchPromociones();
  }, [fetchPromociones]);

  return {
    // Estado
    promociones,
    loading,
    error,
    // Operaciones
    createPromocion,
    updatePromocion,
    deletePromocion,
    fetchPromociones,
    searchByDenominacion,
    // Gestión de estados
    activatePromocion,
    deactivatePromocion,
    toggleActivoPromocion,
    // Alias
    refresh: fetchPromociones,
  };
};
