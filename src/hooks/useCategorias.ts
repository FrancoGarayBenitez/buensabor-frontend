import { useState, useEffect } from "react";
import { categoriaService } from "../services";
import type { CategoriaResponseDTO } from "../types/categorias/CategoriaResponseDTO";
import type { CategoriaRequestDTO } from "../types/categorias/CategoriaRequestDTO";

export const useCategorias = () => {
  const [categorias, setCategorias] = useState<CategoriaResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const data = await categoriaService.getAll();
      setCategorias(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const createCategoria = async (data: CategoriaRequestDTO) => {
    try {
      await categoriaService.create(data);
      await fetchCategorias();
    } catch (err) {
      throw err;
    }
  };

  const updateCategoria = async (id: number, data: CategoriaRequestDTO) => {
    try {
      await categoriaService.update(id, data);
      await fetchCategorias();
    } catch (err) {
      throw err;
    }
  };

  const deleteCategoria = async (id: number) => {
    try {
      await categoriaService.delete(id);
      await fetchCategorias();
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  return {
    categorias,
    loading,
    error,
    createCategoria,
    updateCategoria,
    deleteCategoria,
    refresh: fetchCategorias,
  };
};
