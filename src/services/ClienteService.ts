import { apiClienteService } from "./ApiClienteService";
import type { ClienteResponseDTO } from "../types/clientes";

const BASE_URL = "/clientes";

/**
 * Servicio para operaciones CRUD de clientes (solo funciones administrativas)
 */
const ClienteService = {
  // ==================== ENDPOINTS ADMINISTRATIVOS ====================

  /**
   * Obtiene todos los clientes (requiere rol ADMIN)
   */
  getAll: async (): Promise<ClienteResponseDTO[]> => {
    try {
      console.log("🔍 ClienteService - obteniendo todos los clientes");
      return await apiClienteService.get<ClienteResponseDTO[]>(BASE_URL);
    } catch (error: any) {
      console.error("❌ Error obteniendo clientes:", error);
      throw error instanceof Error
        ? error
        : new Error("Error en el servicio de clientes");
    }
  },

  /**
   * Obtiene un cliente por ID
   */
  getById: async (id: number): Promise<ClienteResponseDTO> => {
    try {
      console.log(`🔍 ClienteService - obteniendo cliente ${id}`);
      return await apiClienteService.get<ClienteResponseDTO>(
        `${BASE_URL}/${id}`
      );
    } catch (error: any) {
      console.error(`❌ Error obteniendo cliente ${id}:`, error);
      throw error instanceof Error
        ? error
        : new Error("Error en el servicio de clientes");
    }
  },

  /**
   * Actualiza un cliente específico (requiere permisos)
   */
  update: async (
    id: number,
    clienteData: ClienteResponseDTO
  ): Promise<ClienteResponseDTO> => {
    try {
      console.log(`✏️ ClienteService - actualizando cliente ${id}`);
      return await apiClienteService.put<ClienteResponseDTO>(
        `${BASE_URL}/${id}`,
        clienteData
      );
    } catch (error: any) {
      console.error(`❌ Error actualizando cliente ${id}:`, error);
      throw error instanceof Error
        ? error
        : new Error("Error en el servicio de clientes");
    }
  },

  /**
   * Elimina un cliente (requiere rol ADMIN)
   */
  delete: async (id: number): Promise<void> => {
    try {
      console.log(`🗑️ ClienteService - eliminando cliente ${id}`);
      await apiClienteService.deleteRequest<void>(`${BASE_URL}/${id}`);
    } catch (error: any) {
      console.error(`❌ Error eliminando cliente ${id}:`, error);
      throw error instanceof Error
        ? error
        : new Error("Error en el servicio de clientes");
    }
  },
};

export default ClienteService;
