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

  // ==================== OPERACIONES CRUD ====================

  const fetchProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productoService.getAll();
      setProductos(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar productos"
      );
    } finally {
      setLoading(false);
    }
  };

  const createProducto = async (data: ArticuloManufacturadoRequestDTO) => {
    try {
      const nuevoProducto = await productoService.create(data);
      await fetchProductos();
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
      await fetchProductos();
      return productoActualizado;
    } catch (err) {
      throw err;
    }
  };

  const deleteProducto = async (id: number) => {
    try {
      await productoService.bajaLogica(id);
      await fetchProductos();
    } catch (err) {
      throw err;
    }
  };

  // ==================== BÚSQUEDAS ESPECÍFICAS ====================

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

  const searchProductos = async (denominacion: string) => {
    try {
      return await productoService.searchByDenominacion(denominacion);
    } catch (err) {
      throw err;
    }
  };

  // ==================== GESTIÓN DE IMÁGENES ====================

  const uploadImagenes = async (
    idProducto: number,
    files: File[]
  ): Promise<any[]> => {
    try {
      return await productoService.uploadImagenes(idProducto, files);
    } catch (err) {
      throw err;
    }
  };

  const updateImagen = async (
    idProducto: number,
    file: File,
    denominacion?: string
  ): Promise<any> => {
    try {
      return await productoService.updateImagen(
        idProducto,
        file,
        denominacion || "Imagen del producto"
      );
    } catch (err) {
      throw err;
    }
  };

  const deleteImagen = async (idImagen: number): Promise<boolean> => {
    try {
      return await productoService.deleteImagen(idImagen);
    } catch (err) {
      throw err;
    }
  };

  const getImagenes = async (idProducto: number): Promise<any[]> => {
    try {
      return await productoService.getImagenes(idProducto);
    } catch (err) {
      throw err;
    }
  };

  // ==================== CICLO DE VIDA ====================

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

    // Búsquedas específicas
    getProductosByCategoria,
    searchProductos,

    // Gestión de imágenes
    uploadImagenes,
    updateImagen,
    deleteImagen,
    getImagenes,

    // Utilidades
    refresh: fetchProductos,
  };
};
