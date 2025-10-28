import { useEffect, useState, useCallback } from "react";
import { type LoginRequestDTO, type UserInfo } from "../types/auth";
import AuthPasswordService from "../services/AuthPasswordService";
import UsuarioService from "../services/UsuarioService";
import type { Rol } from "../types/common/Rol";
import { useNavigate } from "react-router-dom";
import type { AuthenticatedUser } from "../types/usuario/UserTypes";
import { toast } from "react-toastify";

// ===================================
// 1. INTERFACES Y TIPOS AUXILIARES
// ===================================
interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthenticatedUser | null;
  role: Rol | null;
  login: (credentials: LoginRequestDTO) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshProfile: () => void;
}

interface JwtPayloadContent {
  email: string;
  role: string;
  sub: string;
  exp: number;
  iat: number;
  id: number;
}

// ===================================
// 2. FUNCIONES AUXILIARES
// ===================================

/**
 * Decodifica un JWT para extraer información básica del usuario y verificar expiración.
 */
const decodeJwt = (token: string): UserInfo | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64Payload = parts[1];
    // Aseguramos el padding Base64
    const paddedPayload = base64Payload.padEnd(
      base64Payload.length + ((4 - (base64Payload.length % 4)) % 4),
      "="
    );
    const payload: Partial<JwtPayloadContent> = JSON.parse(atob(paddedPayload));

    const isString = (val: any): val is string =>
      typeof val === "string" && val.trim() !== "";

    if (!isString(payload.email) || !isString(payload.role) || !payload.id) {
      console.error("Error: JWT payload missing required fields.");
      return null;
    }

    // Comprobación de expiración
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.warn("Token JWT expirado.");
      return null;
    }

    return {
      email: payload.email,
      rol: payload.role as Rol,
      id: payload.id,
    } as UserInfo;
  } catch (error) {
    console.error("Error decodificando o parseando JWT:", error);
    return null;
  }
};

/**
 * Retorna la ruta del dashboard basada en el rol.
 */
const getRoleDashboard = (role: Rol) => {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "COCINERO":
      return "/cocina";
    case "CAJERO":
      return "/gestion-pedidos";
    case "DELIVERY":
      return "/delivery";
    case "CLIENTE":
      return "/catalogo"; // Usamos /catalogo
    default:
      return "/";
  }
};

// ===================================
// 3. HOOK DE LÓGICA CENTRAL
// ===================================

/**
 * Hook de lógica central que gestiona el estado de autenticación JWT.
 * @returns El objeto AuthContextType
 */
export const useAuthLogic = (): AuthContextType => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [role, setRole] = useState<Rol | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    AuthPasswordService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    toast.info("Sesión cerrada.");
    navigate("/"); // Redirigir al inicio
  }, [navigate]);

  const fetchBackendProfile = useCallback(
    async (token?: string) => {
      setIsLoading(true);
      try {
        // Aseguramos que el token esté disponible
        if (!token) {
          const storedToken = AuthPasswordService.getToken();
          if (!storedToken)
            throw new Error("Token no disponible para cargar perfil.");
          token = storedToken;
        }

        const profile: AuthenticatedUser = await UsuarioService.getMyProfile();

        // Comprobar si la cuenta está activa (solo para empleados)
        if ("activo" in profile && !profile.activo) {
          toast.error("Tu cuenta ha sido desactivada por un administrador.");
          logout();
          return;
        }

        setIsAuthenticated(true);
        setUser(profile);
        setRole(profile.rol);
      } catch (error) {
        console.error(
          "Error al cargar perfil completo o cuenta inactiva:",
          error
        );
        // Si falla la carga del perfil (ej: token vencido/inválido o cuenta desactivada)
        logout();
      } finally {
        setIsLoading(false);
      }
    },
    [logout]
  );

  // Efecto para verificar el JWT al inicio o recarga
  useEffect(() => {
    const token = AuthPasswordService.getToken();

    if (token) {
      const decodedUser = decodeJwt(token);

      if (decodedUser) {
        // Si el token es válido, cargar el perfil completo
        fetchBackendProfile(token);
      } else {
        // Token inválido o expirado
        logout();
      }
    } else {
      setIsLoading(false); // No hay token, terminamos la carga
    }
  }, [logout, fetchBackendProfile]);

  // Método de login
  const login = async (credentials: LoginRequestDTO) => {
    setIsLoading(true);
    try {
      const response = await AuthPasswordService.login(credentials);
      const token = response.token;

      const decodedUser = decodeJwt(token);

      if (decodedUser) {
        // Cargar el perfil completo después del login exitoso
        await fetchBackendProfile(token);

        // Redirigir usando el rol decodificado
        const finalRole = decodedUser.rol;
        navigate(getRoleDashboard(finalRole));
      } else {
        throw new Error("Respuesta de token inválida del servidor.");
      }
    } catch (error) {
      toast.error("Error de credenciales. Intenta de nuevo.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Método para refrescar el perfil
  const refreshProfile = useCallback(() => {
    if (isAuthenticated) {
      fetchBackendProfile();
    }
  }, [isAuthenticated, fetchBackendProfile]);

  return {
    isAuthenticated,
    user,
    role,
    login,
    logout,
    isLoading,
    refreshProfile,
  };
};
