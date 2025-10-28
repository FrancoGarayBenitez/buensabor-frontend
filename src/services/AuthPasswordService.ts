import { type LoginRequestDTO, type LoginResponseDTO } from "../types/auth";
import { type ClienteRegisterDTO } from "../types/clientes/ClienteRegisterDTO";
import { apiClienteService } from "./ApiClienteService";

const BASE_URL = "/api/auth";

/**
 * Servicio para manejar el login y registro de usuarios
 */
const AuthPasswordService = {
  /**
   * Llama al endpoint de registro.
   * @param data Datos de registro del cliente.
   */
  register: async (data: ClienteRegisterDTO): Promise<void> => {
    // El endpoint ahora usa el nuevo DTO y ruta local
    await apiClienteService.post(`${BASE_URL}/register`, data);
  },

  /**
   * Llama al endpoint de login, almacena el JWT y retorna la respuesta.
   * @param data Credenciales del usuario.
   * @returns LoginResponseDTO que contiene el JWT.
   */
  login: async (data: LoginRequestDTO): Promise<LoginResponseDTO> => {
    const response: LoginResponseDTO = await apiClienteService.post(
      `${BASE_URL}/login`,
      data
    );

    // 🔑 ALMACENAR EL TOKEN: Este paso es CRÍTICO.
    localStorage.setItem("jwt_token", response.token);
    localStorage.setItem("user_email", response.email); // Opcional, pero útil

    return response;
  },

  /**
   * Limpia la sesión local (logout).
   */
  logout: () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_email");
    // Asegúrate de limpiar cualquier estado de Auth0 si existía
  },

  /**
   * Obtiene el token JWT almacenado.
   */
  getToken: (): string | null => {
    return localStorage.getItem("jwt_token");
  },

  /**
   * Llama al endpoint para solicitar un email de restablecimiento de contraseña.
   * Se asume que la identidad del usuario se obtiene del JWT en el header.
   * @returns Un objeto con el resultado del proceso.
   */
  requestPasswordReset: async (): Promise<{
    success: boolean;
    message: string;
    email?: string;
  }> => {
    try {
      // Deberá estar protegido por JWT
      await apiClienteService.post(`${BASE_URL}/request-password-reset`, {});

      // Asumimos éxito y recuperamos el email del almacenamiento local para el mensaje
      const email = localStorage.getItem("user_email") || undefined;

      // El backend debe ser el que envíe el email real.
      return {
        success: true,
        message: "Instrucciones de cambio de contraseña enviadas a tu email.",
        email: email,
      };
    } catch (error) {
      // Manejo de errores
      console.error("Error al solicitar reseteo:", error);
      return {
        success: false,
        message:
          "Error al solicitar el cambio de contraseña. Por favor, intenta más tarde.",
      };
    }
  },

  /**
   * Llama al endpoint de eliminación de cuenta.
   * El backend identifica al usuario por el JWT.
   */
  deleteAccount: async (): Promise<void> => {
    // Llamada al endpoint de seguridad
    await apiClienteService.deleteRequest(`${BASE_URL}/delete-account`);
  },
};

export default AuthPasswordService;
