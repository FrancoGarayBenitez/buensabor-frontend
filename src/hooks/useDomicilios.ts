// hooks/useDomicilios.ts

import { useState, useCallback, useEffect } from "react";
import { DomicilioService } from "../services/DomicilioService";
import { useAuth } from "./useAuth";
import type {
  DomicilioResponseDTO,
  DomicilioRequestDTO,
} from "../types/clientes";

interface UseDomiciliosState {
  domicilios: DomicilioResponseDTO[];
  domicilioPrincipal: DomicilioResponseDTO | null;
  estadisticas: {
    cantidadTotal: number;
    tienePrincipal: boolean;
    domicilioPrincipal: DomicilioResponseDTO | null;
  } | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para gestión de domicilios del usuario autenticado
 */
export const useDomicilios = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [state, setState] = useState<UseDomiciliosState>({
    domicilios: [],
    domicilioPrincipal: null,
    estadisticas: null,
    isLoading: false,
    error: null,
  });

  /**
   * Obtiene todos los domicilios del usuario
   */
  const getDomicilios = useCallback(async () => {
    if (!isAuthenticated) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const domicilios = await DomicilioService.getMisDomicilios();
      const principal = domicilios.find((d) => d.esPrincipal) || null;

      setState((prev) => ({
        ...prev,
        domicilios,
        domicilioPrincipal: principal,
        isLoading: false,
      }));

      return domicilios;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || "Error al obtener domicilios",
        isLoading: false,
      }));
      throw error;
    }
  }, [isAuthenticated]);

  /**
   * Obtiene un domicilio específico
   */
  const getDomicilio = useCallback(
    async (id: number) => {
      if (!isAuthenticated) return;

      try {
        return await DomicilioService.getMiDomicilio(id);
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message || "Error al obtener domicilio",
        }));
        throw error;
      }
    },
    [isAuthenticated]
  );

  /**
   * Crea un nuevo domicilio
   */
  const crearDomicilio = useCallback(
    async (domicilioData: DomicilioRequestDTO) => {
      if (!isAuthenticated) throw new Error("No autenticado");

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const nuevoDomicilio = await DomicilioService.crearMiDomicilio(
          domicilioData
        );

        // Actualizar lista local
        setState((prev) => {
          const nuevosDomicilios = [...prev.domicilios, nuevoDomicilio];
          return {
            ...prev,
            domicilios: nuevosDomicilios,
            domicilioPrincipal: nuevoDomicilio.esPrincipal
              ? nuevoDomicilio
              : prev.domicilioPrincipal,
            isLoading: false,
          };
        });

        // Notificar actualización
        window.dispatchEvent(new Event("userProfileUpdated"));
        window.dispatchEvent(new Event("domiciliosUpdated")); // ✅ NUEVO EVENTO

        return nuevoDomicilio;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message || "Error al crear domicilio",
          isLoading: false,
        }));
        throw error;
      }
    },
    [isAuthenticated]
  );

  /**
   * Actualiza un domicilio existente
   */
  const actualizarDomicilio = useCallback(
    async (id: number, domicilioData: DomicilioRequestDTO) => {
      if (!isAuthenticated) throw new Error("No autenticado");

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const domicilioActualizado =
          await DomicilioService.actualizarMiDomicilio(id, domicilioData);

        // Actualizar lista local
        setState((prev) => {
          const domiciliosActualizados = prev.domicilios.map((d) =>
            d.idDomicilio === id ? domicilioActualizado : d
          );

          return {
            ...prev,
            domicilios: domiciliosActualizados,
            domicilioPrincipal: domicilioActualizado.esPrincipal
              ? domicilioActualizado
              : prev.domicilioPrincipal?.idDomicilio === id
              ? null
              : prev.domicilioPrincipal,
            isLoading: false,
          };
        });

        // Notificar actualización
        window.dispatchEvent(new Event("userProfileUpdated"));
        window.dispatchEvent(new Event("domiciliosUpdated")); // ✅ AGREGADO EVENTO

        return domicilioActualizado;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message || "Error al actualizar domicilio",
          isLoading: false,
        }));
        throw error;
      }
    },
    [isAuthenticated]
  );

  /**
   * Elimina un domicilio
   */
  const eliminarDomicilio = useCallback(
    async (id: number) => {
      if (!isAuthenticated) throw new Error("No autenticado");

      const domicilio = state.domicilios.find((d) => d.idDomicilio === id);
      if (!domicilio) throw new Error("Domicilio no encontrado");

      if (
        !window.confirm(
          `¿Estás seguro de que deseas eliminar el domicilio "${domicilio.direccionCompleta}"?`
        )
      ) {
        return false;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        await DomicilioService.eliminarMiDomicilio(id);

        // Actualizar lista local
        setState((prev) => {
          const domiciliosFiltrados = prev.domicilios.filter(
            (d) => d.idDomicilio !== id
          );
          return {
            ...prev,
            domicilios: domiciliosFiltrados,
            domicilioPrincipal:
              prev.domicilioPrincipal?.idDomicilio === id
                ? null
                : prev.domicilioPrincipal,
            isLoading: false,
          };
        });

        // Notificar actualización
        window.dispatchEvent(new Event("userProfileUpdated"));
        window.dispatchEvent(new Event("domiciliosUpdated")); // ✅ NUEVO EVENTO

        return true;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message || "Error al eliminar domicilio",
          isLoading: false,
        }));
        throw error;
      }
    },
    [isAuthenticated, state.domicilios]
  );

  /**
   * Marca un domicilio como principal
   */
  const marcarComoPrincipal = useCallback(
    async (id: number) => {
      if (!isAuthenticated) throw new Error("No autenticado");

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const domicilioPrincipal = await DomicilioService.marcarComoPrincipal(
          id
        );

        // Actualizar lista local
        setState((prev) => {
          const domiciliosActualizados = prev.domicilios.map((d) => ({
            ...d,
            esPrincipal: d.idDomicilio === id,
          }));

          return {
            ...prev,
            domicilios: domiciliosActualizados,
            domicilioPrincipal: domicilioPrincipal,
            isLoading: false,
          };
        });

        // Notificar actualización
        window.dispatchEvent(new Event("userProfileUpdated"));
        window.dispatchEvent(new Event("domiciliosUpdated")); // ✅ AGREGADO EVENTO

        return domicilioPrincipal;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message || "Error al marcar como principal",
          isLoading: false,
        }));
        throw error;
      }
    },
    [isAuthenticated]
  );

  /**
   * Obtiene estadísticas de domicilios
   */
  const getEstadisticas = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const estadisticas = await DomicilioService.getEstadisticasDomicilios();
      setState((prev) => ({ ...prev, estadisticas }));
      return estadisticas;
    } catch (error: any) {
      console.error("Error al obtener estadísticas de domicilios:", error);
      throw error;
    }
  }, [isAuthenticated]);

  /**
   * Refresca todos los domicilios
   */
  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const [domicilios, estadisticas] = await Promise.all([
        getDomicilios(),
        getEstadisticas(),
      ]);

      return { domicilios, estadisticas };
    } catch (error: any) {
      console.error("Error al refrescar domicilios:", error);
      throw error;
    }
  }, [isAuthenticated, getDomicilios, getEstadisticas]);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Cargar domicilios automáticamente cuando se autentica
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      getDomicilios();
      getEstadisticas();
    }
  }, [isAuthenticated, authLoading, getDomicilios, getEstadisticas]);

  return {
    // Estado
    domicilios: state.domicilios,
    domicilioPrincipal: state.domicilioPrincipal,
    estadisticas: state.estadisticas,
    isLoading: state.isLoading || authLoading,
    error: state.error,

    // Métodos
    getDomicilios,
    getDomicilio,
    crearDomicilio,
    actualizarDomicilio,
    eliminarDomicilio,
    marcarComoPrincipal,
    getEstadisticas,
    refresh,
    clearError,
  };
};
