import { useState, useEffect, useCallback } from "react";
import { productoService } from "../services";
import type { ArticuloManufacturadoResponseDTO } from "../types/productos/ArticuloManufacturadoResponseDTO";
import type { ArticuloManufacturadoRequestDTO } from "../types/productos/ArticuloManufacturadoRequestDTO";

/**
 * Hook personalizado para gestionar el estado y las operaciones CRUD de los productos manufacturados.
 */
export const useProductos = () => {
  const [productos, setProductos] = useState<
    ArticuloManufacturadoResponseDTO[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==================== OBTENCIÓN DE DATOS ====================

  /**
   * Carga todos los productos desde el backend y actualiza el estado.
   * Se utiliza useCallback para evitar re-creaciones innecesarias.
   */
  const fetchProductos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productoService.getAll();
      setProductos(data);
      setError(null);
      return data;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error desconocido al cargar productos";
      setError(message);
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ==================== OPERACIONES CRUD (CON OPTIMIZACIÓN DE UI) ====================

  /**
   * Crea un nuevo producto y lo añade al estado local sin recargar toda la lista.
   */
  const createProducto = async (data: ArticuloManufacturadoRequestDTO) => {
    setLoading(true);
    try {
      const nuevoProducto = await productoService.create(data);
      setProductos((prev) => [...prev, nuevoProducto]);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al crear el producto";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualiza un producto y modifica solo ese elemento en el estado local.
   */
  const updateProducto = async (
    id: number,
    data: ArticuloManufacturadoRequestDTO
  ) => {
    setLoading(true);
    try {
      const productoActualizado = await productoService.update(id, data);
      setProductos((prev) =>
        prev.map((p) => (p.idArticulo === id ? productoActualizado : p))
      );
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al actualizar el producto";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Realiza una baja lógica y actualiza el estado local marcando el producto como eliminado.
   */
  const deleteProducto = async (id: number) => {
    setLoading(true);
    try {
      await productoService.delete(id);
      setProductos((prev) =>
        prev.map((p) => (p.idArticulo === id ? { ...p, eliminado: true } : p))
      );
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al eliminar el producto";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Toggle estado
  const activateProducto = async (id: number) => {
    setLoading(true);
    try {
      await productoService.activate(id);
      setProductos((prev) =>
        prev.map((p) => (p.idArticulo === id ? { ...p, eliminado: false } : p))
      );
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al activar el producto";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deactivateProducto = async (id: number) => {
    setLoading(true);
    try {
      await productoService.deactivate(id);
      setProductos((prev) =>
        prev.map((p) => (p.idArticulo === id ? { ...p, eliminado: true } : p))
      );
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al desactivar el producto";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ==================== BÚSQUEDAS Y FILTROS ====================

  /**
   * Busca productos por categoría y actualiza el estado con los resultados.
   */
  const getByCategoria = async (idCategoria: number) => {
    setLoading(true);
    try {
      const data = await productoService.getByCategoria(idCategoria);
      setProductos(data);
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

  /**
   * Busca productos por denominación y actualiza el estado con los resultados.
   */
  const searchByDenominacion = async (denominacion: string) => {
    setLoading(true);
    try {
      const data = await productoService.searchByDenominacion(denominacion);
      setProductos(data);
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

  // Carga inicial de productos al montar el componente que usa el hook.
  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  return {
    // Estado
    productos,
    loading,
    error,
    // Operaciones
    createProducto,
    updateProducto,
    deleteProducto,
    fetchProductos,
    getByCategoria,
    searchByDenominacion,
    // Alias y toggles
    refresh: fetchProductos,
    activateProducto,
    deactivateProducto,
  };
};
