// services/DomicilioService.ts

import { apiClienteService } from "./ApiClienteService";
import type {
  DomicilioResponseDTO,
  DomicilioRequestDTO,
} from "../types/clientes";

/**
 * Servicio para gestión de domicilios desde el perfil del usuario
 * Todas las operaciones están restringidas al usuario autenticado
 */
export class DomicilioService {
  private static readonly BASE_URL = "/perfil/domicilios";

  /**
   * Obtiene todos los domicilios del usuario autenticado
   * Ordenados por principal primero
   */
  static async getMisDomicilios(): Promise<DomicilioResponseDTO[]> {
    try {
      return await apiClienteService.get<DomicilioResponseDTO[]>(this.BASE_URL);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtiene el domicilio principal del usuario autenticado
   */
  static async getMiDomicilioPrincipal(): Promise<DomicilioResponseDTO | null> {
    try {
      const response = await apiClienteService.get<DomicilioResponseDTO>(
        `${this.BASE_URL}/principal`
      );
      return response;
    } catch (error: any) {
      // Si retorna 204 (No Content), no hay domicilio principal
      if (error.message.includes("204")) {
        return null;
      }
      throw this.handleError(error);
    }
  }

  /**
   * Obtiene un domicilio específico del usuario autenticado
   */
  static async getMiDomicilio(id: number): Promise<DomicilioResponseDTO> {
    try {
      return await apiClienteService.get<DomicilioResponseDTO>(
        `${this.BASE_URL}/${id}`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Crea un nuevo domicilio para el usuario autenticado
   */
  static async crearMiDomicilio(
    domicilioData: DomicilioRequestDTO
  ): Promise<DomicilioResponseDTO> {
    try {
      return await apiClienteService.post<DomicilioResponseDTO>(
        this.BASE_URL,
        domicilioData
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Actualiza un domicilio del usuario autenticado
   */
  static async actualizarMiDomicilio(
    id: number,
    domicilioData: DomicilioRequestDTO
  ): Promise<DomicilioResponseDTO> {
    try {
      return await apiClienteService.put<DomicilioResponseDTO>(
        `${this.BASE_URL}/${id}`,
        domicilioData
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Elimina un domicilio del usuario autenticado
   */
  static async eliminarMiDomicilio(id: number): Promise<void> {
    try {
      await apiClienteService.deleteRequest<void>(`${this.BASE_URL}/${id}`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Marca un domicilio específico como principal
   */
  static async marcarComoPrincipal(id: number): Promise<DomicilioResponseDTO> {
    try {
      return await apiClienteService.patch<DomicilioResponseDTO>(
        `${this.BASE_URL}/${id}/principal`,
        {} // Body vacío para operación de marcado
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtiene estadísticas de domicilios del usuario
   */
  static async getEstadisticasDomicilios(): Promise<{
    cantidadTotal: number;
    tienePrincipal: boolean;
    domicilioPrincipal: DomicilioResponseDTO | null;
  }> {
    try {
      return await apiClienteService.get<{
        cantidadTotal: number;
        tienePrincipal: boolean;
        domicilioPrincipal: DomicilioResponseDTO | null;
      }>(`${this.BASE_URL}/estadisticas`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Manejo centralizado de errores
   */
  private static handleError(error: any): Error {
    return error instanceof Error
      ? error
      : new Error("Error en el servicio de domicilios");
  }
}
