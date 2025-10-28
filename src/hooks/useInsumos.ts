import { useState, useEffect } from "react";
import { insumoService, type CompraInsumoDTO } from "../services";
import type { ArticuloInsumoResponseDTO } from "../types/insumos/ArticuloInsumoResponseDTO";
import type { ArticuloInsumoRequestDTO } from "../types/insumos/ArticuloInsumoRequestDTO";

export const useInsumos = () => {
  const [insumos, setInsumos] = useState<ArticuloInsumoResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsumos = async () => {
    setLoading(true);
    try {
      const data = await insumoService.getAll();
      setInsumos(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const createInsumo = async (data: ArticuloInsumoRequestDTO) => {
    try {
      await insumoService.create(data);
      await fetchInsumos();
    } catch (err) {
      throw err;
    }
  };

  const updateInsumo = async (id: number, data: ArticuloInsumoRequestDTO) => {
    try {
      await insumoService.update(id, data);
      await fetchInsumos();
    } catch (err) {
      throw err;
    }
  };

  const deleteInsumo = async (id: number) => {
    try {
      await insumoService.delete(id);
      await fetchInsumos();
    } catch (err) {
      throw err;
    }
  };

  const getInsumosStockBajo = async () => {
    try {
      return await insumoService.getInsumosStockBajo();
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  return {
    insumos,
    loading,
    error,
    createInsumo,
    updateInsumo,
    deleteInsumo,
    getInsumosStockBajo,
    refresh: fetchInsumos,
  };
};
