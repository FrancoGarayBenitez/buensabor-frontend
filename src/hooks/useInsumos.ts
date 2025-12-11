import { useState, useEffect } from "react";
import { insumoService } from "../services";
import type { ArticuloInsumoResponseDTO } from "../types/insumos/ArticuloInsumoResponseDTO";
import type { ArticuloInsumoRequestDTO } from "../types/insumos/ArticuloInsumoRequestDTO";

export const useInsumos = () => {
  const [insumos, setInsumos] = useState<ArticuloInsumoResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==================== CRUD ====================

  const fetchInsumos = async () => {
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
  };

  const createInsumo = async (data: ArticuloInsumoRequestDTO) => {
    setLoading(true);
    try {
      await insumoService.create(data);
      setError(null);
      // ✅ Refresh automático
      await fetchInsumos();
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
      await insumoService.update(id, data);
      setError(null);
      // ✅ Refresh automático
      await fetchInsumos();
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
      setError(null);
      // ✅ Refresh automático
      await fetchInsumos();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al eliminar insumo";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ==================== BÚSQUEDAS ====================

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

  // ==================== FILTROS DE STOCK ====================

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

  // ==================== IMÁGENES ====================

  const uploadImagen = async (
    idInsumo: number,
    file: File,
    denominacion?: string
  ) => {
    try {
      const result = await insumoService.uploadImagen(
        idInsumo,
        file,
        denominacion
      );
      setError(null);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al subir imagen";
      setError(message);
      throw err;
    }
  };

  const uploadImagenes = async (idInsumo: number, files: File[]) => {
    try {
      const results = await insumoService.uploadImagenes(idInsumo, files);
      setError(null);
      return results;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al subir imágenes";
      setError(message);
      throw err;
    }
  };

  const deleteImagen = async (idImagen: number) => {
    try {
      const result = await insumoService.deleteImagen(idImagen);
      setError(null);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al eliminar imagen";
      setError(message);
      throw err;
    }
  };

  const getImagenes = async (idInsumo: number) => {
    try {
      const data = await insumoService.getImagenes(idInsumo);
      setError(null);
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al obtener imágenes";
      setError(message);
      throw err;
    }
  };

  // ==================== INICIALIZACIÓN ====================

  // ✅ Cargar insumos al montar el componente
  useEffect(() => {
    fetchInsumos();
  }, []);

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
    // ✅ Estado
    insumos,
    loading,
    error,

    // ✅ CRUD
    createInsumo,
    updateInsumo,
    deleteInsumo,
    fetchInsumos,

    // ✅ Búsquedas
    getByCategoria,
    searchByDenominacion,

    // ✅ Filtros de stock
    getByCriticoStock,
    getByBajoStock,
    getByAltoStock,

    // ✅ Imágenes
    uploadImagen,
    uploadImagenes,
    deleteImagen,
    getImagenes,

    // ✅ Alias para compatibilidad
    refresh: fetchInsumos,
    refreshInsumoById,
  };
};
