// src/services/PerfilService.ts
import { apiClienteService } from "./ApiClienteService";
import type { AuthenticatedUser } from "../types/usuario/UserTypes";
import type {
  ClienteResponseDTO,
  ClientePerfilDTO,
  ClienteEstadisticasDTO,
} from "../types/clientes";

// La nueva ruta base es /perfil, no /usuarios/perfil
const BASE_URL = "/perfil";

/**
 * Servicio dedicado a manejar operaciones relacionadas con el perfil del usuario autenticado.
 */
const PerfilService = {
  // ==================== ENDPOINTS DE CONSULTA Y ACTUALIZACIÓN ====================

  /**
   * Obtiene el perfil completo del usuario autenticado.
   * Retorna ClienteResponseDTO para clientes o EmpleadoResponseDTO para empleados.
   * GET /api/perfil
   */
  getMyProfile: async (): Promise<AuthenticatedUser> => {
    console.log(
      "🔍 PerfilService - Obteniendo perfil completo del usuario autenticado"
    );
    return apiClienteService.get<AuthenticatedUser>(`${BASE_URL}`);
  },

  /**
   * Obtiene solo la información personal del usuario autenticado (DTO para edición).
   * GET /api/perfil/info
   */
  getMyProfileInfo: async (): Promise<ClientePerfilDTO> => {
    console.log(
      "🔍 PerfilService - Obteniendo información personal del perfil"
    );
    return apiClienteService.get<ClientePerfilDTO>(`${BASE_URL}/info`);
  },

  /**
   * Actualiza solo la información personal del cliente autenticado.
   * PUT /api/perfil/info
   */
  updateMyProfileInfo: async (
    perfilData: ClientePerfilDTO
  ): Promise<ClienteResponseDTO> => {
    console.log(
      "✏️ PerfilService - Actualizando información personal del cliente"
    );
    return apiClienteService.put<ClienteResponseDTO>(
      `${BASE_URL}/info`,
      perfilData
    );
  },

  /**
   * Obtiene estadísticas del perfil del cliente autenticado.
   * GET /api/perfil/estadisticas
   */
  getMyProfileStats: async (): Promise<ClienteEstadisticasDTO> => {
    console.log(
      "📊 PerfilService - Obteniendo estadísticas del perfil del cliente"
    );
    return apiClienteService.get<ClienteEstadisticasDTO>(
      `${BASE_URL}/estadisticas`
    );
  },

  /**
   * Elimina la cuenta del usuario autenticado (Solo CLIENTE).
   * DELETE /api/perfil
   */
  deleteMyAccount: async (): Promise<void> => {
    console.log("🗑️ PerfilService - Eliminando cuenta del usuario autenticado");
    return apiClienteService.deleteRequest(`${BASE_URL}`);
  },
};

export default PerfilService;
