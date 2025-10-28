import { useState } from "react";
import { ClienteService } from "../services/ClienteService";
import type { ClienteResponseDTO } from "../types/clientes/ClienteResponseDTO";

export const useClientes = () => {
  const [clientes, setClientes] = useState<ClienteResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ClienteService.getAll();
      setClientes(data);
    } catch (err: any) {
      // El error ya viene procesado desde ClienteService
      setError(err.message || "Error al cargar los clientes");
    } finally {
      setLoading(false);
    }
  };

  const updateCliente = async (
    id: number,
    clienteData: ClienteResponseDTO
  ): Promise<ClienteResponseDTO> => {
    setLoading(true);
    setError(null);
    try {
      const clienteActualizado = await ClienteService.update(id, clienteData);
      setClientes((prev) =>
        prev.map((c) => (c.idCliente === id ? clienteActualizado : c))
      );
      return clienteActualizado;
    } catch (err: any) {
      const errorMessage = err.message || "Error al actualizar el cliente";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCliente = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await ClienteService.delete(id);
      setClientes((prev) => prev.filter((c) => c.idCliente !== id));
    } catch (err: any) {
      const errorMessage = err.message || "Error al eliminar el cliente";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getClienteById = async (id: number): Promise<ClienteResponseDTO> => {
    setLoading(true);
    setError(null);
    try {
      return await ClienteService.getById(id);
    } catch (err: any) {
      const errorMessage = err.message || "Error al obtener el cliente";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    clientes,
    loading,
    error,
    fetchClientes,
    updateCliente,
    deleteCliente,
    getClienteById,
  };
};
