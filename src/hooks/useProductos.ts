import { useState, useEffect } from "react";
import type { ArticuloManufacturadoResponseDTO } from "../types/productos/ArticuloManufacturadoResponseDTO";
import type { ArticuloManufacturadoRequestDTO } from "../types/productos/ArticuloManufacturadoRequestDTO";
import { productoService } from "../services";

export const useProductos = () => {
  const [productos, setProductos] = useState<
    ArticuloManufacturadoResponseDTO[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const data = await productoService.getAll();
      setProductos(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const createProducto = async (data: ArticuloManufacturadoRequestDTO) => {
    try {
      const nuevoProducto = await productoService.create(data);
      await fetchProductos(); // Refrescar la lista
      return nuevoProducto;
    } catch (err) {
      throw err;
    }
  };

  const updateProducto = async (
    id: number,
    data: ArticuloManufacturadoRequestDTO
  ) => {
    try {
      const productoActualizado = await productoService.update(id, data);
      await fetchProductos(); // Refrescar la lista
      return productoActualizado;
    } catch (err) {
      throw err;
    }
  };

  const deleteProducto = async (id: number) => {
    try {
      await productoService.delete(id);
      await fetchProductos(); // Refrescar la lista
    } catch (err) {
      throw err;
    }
  };

    const desactivarProducto = async (id: number) => {
    try {
      await productoService.desactivar(id);
      await fetchProductos();
    } catch (err) {
      throw err;
    }
  };

  const activarProducto = async (id: number) => {
    try {
      await productoService.activar(id);
      await fetchProductos();
    } catch (err) {
      throw err;
    }
  };

  const getProductoById = async (id: number) => {
    try {
      return await productoService.getById(id);
    } catch (err) {
      throw err;
  }
  };

  const getProductosByCategoria = async (idCategoria: number) => {
    try {
      return await productoService.getByCategoria(idCategoria);
    } catch (err) {
      throw err;
    }
  };

  const getProductosDisponibles = async () => {
    try {
      return await productoService.getProductosDisponibles();
    } catch (err) {
      throw err;
    }
  };

  const calcularCosto = async (id: number) => {
    try {
      return await productoService.calcularCosto(id);
    } catch (err) {
      throw err;
    }
  };

  const verificarStock = async (id: number) => {
    try {
      return await productoService.verificarStock(id);
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  return {
    // Estado
    productos,
    loading,
    error,

    // Operaciones CRUD
    createProducto,
    updateProducto,
    deleteProducto,
    getProductoById,
    desactivarProducto,
    activarProducto,
    
    // Operaciones específicas
    getProductosByCategoria,
    getProductosDisponibles,
    calcularCosto,
    verificarStock,

    // Utilidades
    refresh: fetchProductos,
  };
};
