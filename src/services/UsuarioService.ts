import { apiClienteService } from "./ApiClienteService";
import type { UsuarioGridDTO } from "../types/usuario/UsuarioGridDTO";
import type { AuthenticatedUser } from "../types/usuario/UserTypes";
import type {
  ClienteResponseDTO,
  ClientePerfilDTO,
  ClienteEstadisticasDTO,
} from "../types/clientes";

const BASE_URL = "/usuarios";

interface UpdateRoleResponse {
  success: boolean;
  message: string;
  data?: UsuarioGridDTO;
}

interface ToggleUserResponse {
  success: boolean;
  message: string;
  data?: UsuarioGridDTO;
}

/**
 * Servicio para manejar operaciones de usuarios y perfiles
 */
const UsuarioService = {
  // ==================== ENDPOINTS ADMINISTRATIVOS ====================

  /**
   * Obtiene la grilla de usuarios para administración.
   */
  getGrillaUsuarios: async (): Promise<UsuarioGridDTO[]> => {
    console.log("🔍 UsuarioService - obteniendo grilla de usuarios");
    return apiClienteService.get<UsuarioGridDTO[]>(`${BASE_URL}/grilla`);
  },

  /**
   * Actualiza el rol de un usuario.
   */
  updateUserRole: async (
    idUsuario: number,
    nuevoRol: string,
    rolAnterior?: string
  ): Promise<UpdateRoleResponse> => {
    console.log(`🔄 Actualizando rol de usuario ${idUsuario} a ${nuevoRol}`);
    return apiClienteService.put<UpdateRoleResponse>(`${BASE_URL}/rol`, {
      idUsuario,
      nuevoRol,
      rolAnterior: rolAnterior || "",
    });
  },

  /**
   * Activa o desactiva un usuario.
   */
  toggleUserStatus: async (
    idUsuario: number,
    activo: boolean
  ): Promise<ToggleUserResponse> => {
    console.log(
      `🔄 ${activo ? "Activando" : "Desactivando"} usuario ${idUsuario}`
    );
    return apiClienteService.put<ToggleUserResponse>(`${BASE_URL}/estado`, {
      idUsuario,
      activo,
    });
  },

  /**
   * Obtiene los detalles de un usuario específico.
   */
  getUserDetails: async (idUsuario: number): Promise<UsuarioGridDTO> => {
    console.log(`🔍 Obteniendo detalles de usuario ${idUsuario}`);
    return apiClienteService.get<UsuarioGridDTO>(`${BASE_URL}/${idUsuario}`);
  },

  // ==================== ENDPOINTS DE PERFIL ====================

  /**
   * Obtiene el perfil completo del usuario autenticado.
   * Retorna ClienteResponseDTO para clientes o UsuarioBaseResponseDTO para empleados.
   */
  getMyProfile: async (): Promise<AuthenticatedUser> => {
    console.log("🔍 Obteniendo perfil completo del usuario autenticado");
    return apiClienteService.get<AuthenticatedUser>(`${BASE_URL}/perfil`);
  },

  /**
   * Obtiene solo la información personal del cliente autenticado (sin domicilios).
   * Solo disponible para clientes.
   */
  getMyProfileInfo: async (): Promise<ClientePerfilDTO> => {
    console.log("🔍 Obteniendo información personal del cliente");
    return apiClienteService.get<ClientePerfilDTO>(`${BASE_URL}/perfil/info`);
  },

  /**
   * Actualiza solo la información personal del cliente autenticado.
   * Solo disponible para clientes.
   */
  updateMyProfileInfo: async (
    perfilData: ClientePerfilDTO
  ): Promise<ClienteResponseDTO> => {
    console.log("✏️ Actualizando información personal del cliente");
    return apiClienteService.put<ClienteResponseDTO>(
      `${BASE_URL}/perfil/info`,
      perfilData
    );
  },

  /**
   * Actualiza el perfil completo del cliente autenticado.
   * @deprecated Usar updateMyProfileInfo para información personal
   */
  updateMyProfile: async (
    clienteData: ClienteResponseDTO
  ): Promise<ClienteResponseDTO> => {
    console.log("✏️ Actualizando perfil completo del cliente");
    return apiClienteService.put<ClienteResponseDTO>(
      `${BASE_URL}/perfil`,
      clienteData
    );
  },

  /**
   * Obtiene estadísticas del perfil del cliente autenticado.
   * Solo disponible para clientes.
   */
  getMyProfileStats: async (): Promise<ClienteEstadisticasDTO> => {
    console.log("📊 Obteniendo estadísticas del perfil del cliente");
    return apiClienteService.get<ClienteEstadisticasDTO>(
      `${BASE_URL}/perfil/estadisticas`
    );
  },
};

export default UsuarioService;
