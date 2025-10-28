// Importamos el hook consumidor del contexto definido en src/context/AuthContext.tsx
import { useAuthContext } from "../context/AuthContext";

/**
 * Hook personalizado para acceder al estado y métodos de autenticación.
 * Es la forma preferida de consumir el AuthContext.
 */
export const useAuth = () => {
  return useAuthContext();
};
