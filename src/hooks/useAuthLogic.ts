import { useEffect, useState, useCallback } from "react";
import { type LoginRequestDTO, type UserInfo } from "../types/auth";
import AuthPasswordService from "../services/AuthPasswordService";
import PerfilService from "../services/PerfilService";
import type { Rol } from "../types/common/Rol";
import { useNavigate } from "react-router-dom";
import {
  isCliente,
  isEmpleado,
  type AuthenticatedUser,
} from "../types/usuario/UserTypes";
import { toast } from "react-toastify";
import type { ClienteRegisterDTO, ClienteResponseDTO } from "../types/clientes";
import type { EmpleadoResponseDTO } from "../types/empleados/EmpleadoDTO";

// ===================================
// 1. INTERFACES Y TIPOS AUXILIARES
// ===================================
interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthenticatedUser | null;
  role: Rol | null;
  login: (credentials: LoginRequestDTO) => Promise<void>;
  register: (data: ClienteRegisterDTO) => Promise<void>;
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
    const paddedPayload = base64Payload.padEnd(
      base64Payload.length + ((4 - (base64Payload.length % 4)) % 4),
      "="
    );
    const payload: Partial<JwtPayloadContent> = JSON.parse(atob(paddedPayload));

    if (!payload.email || !payload.role || !payload.exp || !payload.id) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp < now;

    return {
      email: payload.email,
      rol: payload.role.toUpperCase() as Rol,
      id: payload.id,
      isExpired,
    };
  } catch (error) {
    console.error("Error decodificando JWT:", error);
    return null;
  }
};

/**
 * Retorna la ruta del dashboard basada en el rol.
 */
const getRoleDashboard = (role: Rol) => {
  switch (role) {
    case "ADMIN":
      return "/";
    case "COCINERO":
      return "/cocina";
    case "CAJERO":
      return "/gestion-pedidos";
    case "DELIVERY":
      return "/delivery";
    case "CLIENTE":
      return "/catalogo";
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
    console.log("🚪 Cerrando sesión...");
    AuthPasswordService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    navigate("/login");
  }, [navigate]);

  const fetchBackendProfile = useCallback(async () => {
    try {
      console.log("🔍 Obteniendo perfil completo del backend...");

      // DEBUG: Verificar token antes de la llamada
      const currentToken = AuthPasswordService.getToken();
      if (!currentToken) {
        console.log("❌ No hay token disponible para obtener perfil");
        throw new Error("No hay token de autenticación");
      }

      console.log("🎫 Usando token:", currentToken.substring(0, 30) + "...");

      const profileData = await PerfilService.getMyProfile();
      console.log("📦 Datos del perfil recibidos:", profileData);

      // Detectar correctamente el tipo de usuario
      if (isEmpleado(profileData)) {
        console.log("👨‍💼 Usuario identificado como EMPLEADO");
        const empleado = profileData as EmpleadoResponseDTO;

        setUser(empleado);
        setRole(empleado.rol as Rol);
        setIsAuthenticated(true);

        console.log("✅ Estado actualizado - Empleado:", {
          email: empleado.email,
          rol: empleado.rol,
          activo: empleado.activo,
        });
      } else if (isCliente(profileData)) {
        console.log("👤 Usuario identificado como CLIENTE");
        const cliente = profileData as ClienteResponseDTO;

        setUser(cliente);
        setRole("CLIENTE");
        setIsAuthenticated(true);

        console.log("✅ Estado actualizado - Cliente:", {
          email: cliente.email,
          idCliente: cliente.idCliente,
        });
      } else {
        console.error("❌ Tipo de usuario no reconocido:", profileData);
        throw new Error("Tipo de usuario no válido");
      }
    } catch (error: any) {
      console.error("❌ Error obteniendo perfil:", error);

      // Solo cerrar sesión si es realmente un error de autenticación
      if (error.message.includes("401") || error.message.includes("403")) {
        console.log("🔐 Token inválido o expirado, cerrando sesión");
        logout();
      } else {
        console.log("⚠️ Error de conexión, manteniendo estado actual");
        throw error;
      }
    }
  }, [logout]);

  // Efecto para verificar el JWT al inicio o recarga
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      console.log("🔄 Inicializando autenticación...");

      const token = AuthPasswordService.getToken();
      if (!token) {
        console.log("❌ No hay token almacenado");
        setIsLoading(false);
        return;
      }

      const userInfo = decodeJwt(token);
      if (!userInfo) {
        console.log("❌ Token inválido");
        AuthPasswordService.logout();
        setIsLoading(false);
        return;
      }

      console.log("🔑 Token válido, obteniendo perfil completo...");
      try {
        await fetchBackendProfile();
      } catch (error) {
        console.log("❌ Error obteniendo perfil durante inicialización");
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [logout, fetchBackendProfile]);

  const login = async (credentials: LoginRequestDTO) => {
    setIsLoading(true);

    try {
      // Paso 1: Login y obtener token
      await AuthPasswordService.login(credentials);

      // Paso 2: Obtener perfil completo ANTES de navegar
      await fetchBackendProfile();

      // Paso 3: Navegar solo después de cargar el perfil exitosamente
      const savedToken = AuthPasswordService.getToken();
      if (savedToken) {
        const userInfo = decodeJwt(savedToken);
        if (userInfo) {
          const dashboard = getRoleDashboard(userInfo.rol);
          navigate(dashboard);
        }
      }
    } catch (error: any) {
      console.error("❌ Error completo en login:", error);

      if (error.message.includes("403") || error.message.includes("401")) {
        AuthPasswordService.logout();
        setIsAuthenticated(false);
        setUser(null);
        setRole(null);
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Método de registro
  const register = async (data: ClienteRegisterDTO) => {
    setIsLoading(true);
    try {
      // Llamar al servicio de registro
      await AuthPasswordService.register(data);

      // Después del registro exitoso, hacer login automático
      const loginCredentials: LoginRequestDTO = {
        email: data.email,
        password: data.password,
      };

      // Login automático después del registro
      await login(loginCredentials);

      toast.success("¡Registro exitoso! Bienvenido a El Buen Sabor.");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error al registrar usuario";
      toast.error(errorMessage);
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
    register,
    logout,
    isLoading,
    refreshProfile,
  };
};
