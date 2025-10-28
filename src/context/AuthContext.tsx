import { createContext, useContext, type ReactNode } from "react";
import { type LoginRequestDTO } from "../types/auth";
import type { Rol } from "../types/common/Rol";
import type { AuthenticatedUser } from "../types/usuario/UserTypes";
// Importamos el hook de lógica que contiene todo el estado y los métodos
import { useAuthLogic } from "../hooks/useAuthLogic";

// ===================================
// 1. INTERFAZ DE CONTEXTO
// Define las propiedades y métodos expuestos por el contexto.
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

// Valores por defecto del contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===================================
// 2. PROVEEDOR DE CONTEXTO
// ===================================
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Componente Proveedor que envuelve la aplicación y gestiona la lógica de autenticación (JWT).
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Toda la lógica, estado y efectos viven en el hook separado
  const auth = useAuthLogic();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

// ===================================
// 3. HOOK CONSUMIDOR (para uso interno del contexto)
// Exportamos el hook para que sea accesible desde otros hooks y componentes.
// ===================================
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext debe ser usado dentro de un AuthProvider");
  }
  return context;
};
