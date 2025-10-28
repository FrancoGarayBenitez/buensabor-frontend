import { useState, useCallback, useEffect } from "react";
import UsuarioService from "../services/UsuarioService";
import { useAuth } from "./useAuth";
import type {
  ClientePerfilDTO,
  ClienteEstadisticasDTO,
  ClienteResponseDTO,
} from "../types/clientes";
import AuthPasswordService from "../services/AuthPasswordService";
import { isCliente } from "../types/usuario/UserTypes";

interface UseClientePerfilState {
  perfil: ClienteResponseDTO | null;
  perfilInfo: ClientePerfilDTO | null;
  estadisticas: ClienteEstadisticasDTO | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para gestión del perfil del cliente autenticado
 */
export const useClientePerfil = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [state, setState] = useState<UseClientePerfilState>({
    perfil: null,
    perfilInfo: null,
    estadisticas: null,
    isLoading: false,
    error: null,
  });

  /**
   * Obtiene el perfil completo (incluye domicilios)
   */
  const getPerfilCompleto = useCallback(async () => {
    if (!isAuthenticated) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const user = await UsuarioService.getMyProfile();
      // Verificar que sea un cliente antes de asignar
      if (isCliente(user)) {
        setState((prev) => ({ ...prev, perfil: user, isLoading: false }));
        return user;
      } else {
        throw new Error("El usuario no es un cliente");
      }
    } catch (error: any) {
      const errorMessage = error.message || "Error al obtener perfil";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      throw error;
    }
  }, [isAuthenticated]);

  /**
   * Obtiene solo la información personal (sin domicilios)
   */
  const getPerfilInfo = useCallback(async () => {
    if (!isAuthenticated) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const perfilInfo = await UsuarioService.getMyProfileInfo();
      setState((prev) => ({ ...prev, perfilInfo, isLoading: false }));
      return perfilInfo;
    } catch (error: any) {
      const errorMessage =
        error.message || "Error al obtener información del perfil";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      throw error;
    }
  }, [isAuthenticated]);

  /**
   * Actualiza la información personal del perfil
   */
  const actualizarPerfilInfo = useCallback(
    async (perfilData: ClientePerfilDTO) => {
      if (!isAuthenticated) throw new Error("No autenticado");

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const perfilActualizado = await UsuarioService.updateMyProfileInfo(
          perfilData
        );

        // Actualizar estado local
        setState((prev) => ({
          ...prev,
          perfil: perfilActualizado,
          perfilInfo: {
            nombre: perfilActualizado.nombre,
            apellido: perfilActualizado.apellido,
            telefono: perfilActualizado.telefono,
            fechaNacimiento: perfilActualizado.fechaNacimiento,
            imagen: perfilActualizado.imagen,
          },
          isLoading: false,
        }));

        // Notificar actualización
        window.dispatchEvent(new Event("userProfileUpdated"));

        return perfilActualizado;
      } catch (error: any) {
        const errorMessage = error.message || "Error al actualizar perfil";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        throw error;
      }
    },
    [isAuthenticated]
  );

  /**
   * Obtiene estadísticas del perfil
   */
  const getEstadisticas = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const estadisticas = await UsuarioService.getMyProfileStats();
      setState((prev) => ({ ...prev, estadisticas }));
      return estadisticas;
    } catch (error: any) {
      // ✅ Log silencioso para estadísticas (no es crítico)
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "Error al obtener estadísticas del perfil:",
          error.message
        );
      }
      throw error;
    }
  }, [isAuthenticated]);

  /**
   * Elimina la cuenta del usuario
   */
  const eliminarCuenta = useCallback(async () => {
    if (!isAuthenticated) throw new Error("No autenticado");

    const confirmacion = window.confirm(
      "¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer."
    );

    if (!confirmacion) return false;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await AuthPasswordService.deleteAccount();

      // Limpiar estado
      setState({
        perfil: null,
        perfilInfo: null,
        estadisticas: null,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error: any) {
      const errorMessage = error.message || "Error al eliminar cuenta";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      throw error;
    }
  }, [isAuthenticated]);

  /**
   * Refresca todos los datos del perfil
   */
  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const [perfil, estadisticas] = await Promise.allSettled([
        getPerfilCompleto(),
        getEstadisticas(),
      ]);

      // Manejar resultados de Promise.allSettled
      const perfilResult = perfil.status === "fulfilled" ? perfil.value : null;
      const estadisticasResult =
        estadisticas.status === "fulfilled" ? estadisticas.value : null;

      return {
        perfil: perfilResult,
        estadisticas: estadisticasResult,
      };
    } catch (error: any) {
      // ✅ Error handling más suave para refresh
      if (process.env.NODE_ENV === "development") {
        console.warn("Error parcial al refrescar perfil:", error.message);
      }
      // No lanzar error para permitir refresh parcial
      return { perfil: null, estadisticas: null };
    }
  }, [isAuthenticated, getPerfilCompleto, getEstadisticas]);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * ✅ Nuevo: Maneja errores de forma centralizada
   */
  const handleError = useCallback((error: any, context: string) => {
    const errorMessage = error.message || `Error en ${context}`;

    setState((prev) => ({
      ...prev,
      error: errorMessage,
      isLoading: false,
    }));

    // Log solo en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.warn(`Error en ${context}:`, error);
    }
  }, []);

  // ✅ Cargar perfil automáticamente cuando se autentica (con error handling mejorado)
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      Promise.allSettled([getPerfilCompleto(), getEstadisticas()]).then(
        (results) => {
          // Solo mostrar errores críticos (perfil), no de estadísticas
          const perfilResult = results[0];
          if (perfilResult.status === "rejected") {
            handleError(perfilResult.reason, "carga inicial del perfil");
          }
        }
      );
    }
  }, [
    isAuthenticated,
    authLoading,
    getPerfilCompleto,
    getEstadisticas,
    handleError,
  ]);

  // ✅ Escuchar cambios en domicilios para actualizar estadísticas
  useEffect(() => {
    const handleDomiciliosUpdated = () => {
      if (isAuthenticated) {
        // Actualizar estadísticas y perfil de forma silenciosa
        Promise.allSettled([getEstadisticas(), getPerfilCompleto()]).catch(
          () => {
            // Error silencioso para actualizaciones automáticas
            if (process.env.NODE_ENV === "development") {
              console.warn(
                "Error actualizando perfil tras cambio de domicilios"
              );
            }
          }
        );
      }
    };

    window.addEventListener("domiciliosUpdated", handleDomiciliosUpdated);
    return () =>
      window.removeEventListener("domiciliosUpdated", handleDomiciliosUpdated);
  }, [isAuthenticated, getEstadisticas, getPerfilCompleto]);

  return {
    // Estado
    perfil: state.perfil,
    perfilInfo: state.perfilInfo,
    estadisticas: state.estadisticas,
    isLoading: state.isLoading || authLoading,
    error: state.error,

    // Métodos principales
    getPerfilCompleto,
    getPerfilInfo,
    actualizarPerfilInfo,
    getEstadisticas,
    eliminarCuenta,
    refresh,
    clearError,
    handleError,
  };
};
