import { apiClienteService } from "./ApiClienteService";
import type { UsuarioGridDTO } from "../types/usuario/UsuarioGridDTO";

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
 * Servicio para manejar **operaciones de usuarios administrativas**
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
};

export default UsuarioService;
