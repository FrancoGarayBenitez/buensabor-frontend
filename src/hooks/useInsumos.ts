import { useState, useEffect, useCallback } from "react";
import { insumoService } from "../services";
import type { ArticuloInsumoResponseDTO } from "../types/insumos/ArticuloInsumoResponseDTO";
import type { ArticuloInsumoRequestDTO } from "../types/insumos/ArticuloInsumoRequestDTO";

export const useInsumos = () => {
  const [insumos, setInsumos] = useState<ArticuloInsumoResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==================== OBTENCIÓN DE DATOS ====================

  const fetchInsumos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await insumoService.getAll();
      setInsumos(data);
      setError(null);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ==================== CRUD (CON OPTIMIZACIÓN DE UI) ====================

  const createInsumo = async (data: ArticuloInsumoRequestDTO) => {
    setLoading(true);
    try {
      const nuevoInsumo = await insumoService.create(data);
      setInsumos((prev) => [...prev, nuevoInsumo]);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al crear insumo";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateInsumo = async (id: number, data: ArticuloInsumoRequestDTO) => {
    setLoading(true);
    try {
      const insumoActualizado = await insumoService.update(id, data);
      setInsumos((prev) =>
        prev.map((i) => (i.idArticulo === id ? insumoActualizado : i))
      );
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al actualizar insumo";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteInsumo = async (id: number) => {
    setLoading(true);
    try {
      await insumoService.delete(id);
      setInsumos((prev) =>
        prev.map((i) => (i.idArticulo === id ? { ...i, eliminado: true } : i))
      );
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al eliminar insumo";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ==================== BÚSQUEDAS Y FILTROS (reemplazan el estado) ====================

  const getByCategoria = async (idCategoria: number) => {
    setLoading(true);
    try {
      const data = await insumoService.getByCategoria(idCategoria);
      setInsumos(data);
      setError(null);
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al buscar por categoría";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchByDenominacion = async (denominacion: string) => {
    setLoading(true);
    try {
      const data = await insumoService.searchByDenominacion(denominacion);
      setInsumos(data);
      setError(null);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al buscar";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getByCriticoStock = async () => {
    setLoading(true);
    try {
      const data = await insumoService.getByCriticoStock();
      setInsumos(data);
      setError(null);
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al obtener stock crítico";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getByBajoStock = async () => {
    setLoading(true);
    try {
      const data = await insumoService.getByBajoStock();
      setInsumos(data);
      setError(null);
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al obtener stock bajo";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getByAltoStock = async () => {
    setLoading(true);
    try {
      const data = await insumoService.getByAltoStock();
      setInsumos(data);
      setError(null);
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al obtener stock alto";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ==================== INICIALIZACIÓN Y RECARGA ====================

  useEffect(() => {
    fetchInsumos();
  }, [fetchInsumos]);

  const refreshInsumoById = async (id: number) => {
    try {
      const insumo = await insumoService.getById(id);
      setInsumos((prev) => prev.map((i) => (i.idArticulo === id ? insumo : i)));
      return insumo;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al refrescar insumo";
      setError(message);
      throw err;
    }
  };

  // ==================== RETORNO ====================

  return {
    // Estado
    insumos,
    loading,
    error,

    // CRUD
    createInsumo,
    updateInsumo,
    deleteInsumo,
    fetchInsumos,

    // Búsquedas y Filtros
    getByCategoria,
    searchByDenominacion,
    getByCriticoStock,
    getByBajoStock,
    getByAltoStock,

    // Recargas
    refresh: fetchInsumos,
    refreshInsumoById,
  };
};
