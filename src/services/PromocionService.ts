import type {
  PromocionRequest,
  PromocionResponse,
} from "../types/promociones/promocion.types";
import { apiClienteService } from "./ApiClienteService";

/**
 * Servicio para realizar operaciones CRUD y de gestión en promociones.
 */
export class PromocionService {
  private readonly endpoint = "/promociones";

  // Helper para extraer el mensaje de error del backend
  private extractErrorMessage(err: unknown, fallback: string): string {
    const anyErr = err as any;
    return (
      anyErr?.response?.data?.message ||
      anyErr?.data?.message ||
      anyErr?.message ||
      fallback
    );
  }

  // ==================== CRUD ====================

  /**
   * Obtiene todas las promociones.
   */
  async getAll(): Promise<PromocionResponse[]> {
    return apiClienteService.get<PromocionResponse[]>(this.endpoint);
  }

  /**
   * Obtiene una promoción por su ID.
   * @param id - El ID de la promoción.
   */
  async getById(id: number): Promise<PromocionResponse> {
    return apiClienteService.get<PromocionResponse>(`${this.endpoint}/${id}`);
  }

  /**
   * Crea una nueva promoción.
   * @param data - DTO con los datos de la promoción.
   */
  async create(data: PromocionRequest): Promise<PromocionResponse> {
    try {
      return await apiClienteService.post<PromocionResponse>(
        this.endpoint,
        data
      );
    } catch (err) {
      const msg = this.extractErrorMessage(
        err,
        "No se pudo crear la promoción. Verifique la denominación."
      );
      throw new Error(msg);
    }
  }

  /**
   * Actualiza una promoción existente.
   * @param id - El ID de la promoción a actualizar.
   * @param data - DTO con los nuevos datos de la promoción.
   */
  async update(id: number, data: PromocionRequest): Promise<PromocionResponse> {
    try {
      return await apiClienteService.put<PromocionResponse>(
        `${this.endpoint}/${id}`,
        data
      );
    } catch (err) {
      const msg = this.extractErrorMessage(
        err,
        "No se pudo actualizar la promoción. Verifique la denominación."
      );
      throw new Error(msg);
    }
  }

  /**
   * Realiza una baja lógica de una promoción.
   * @param id - El ID de la promoción a eliminar.
   */
  async delete(id: number): Promise<void> {
    return apiClienteService.deleteRequest<void>(`${this.endpoint}/${id}`);
  }

  // ==================== GESTIÓN DE ESTADOS ====================

  /**
   * Activa una promoción que fue dada de baja lógicamente.
   * @param id - El ID de la promoción a activar.
   */
  async activate(id: number): Promise<void> {
    return apiClienteService.patch<void>(`${this.endpoint}/${id}/activate`);
  }

  /**
   * Desactiva una promoción (baja lógica).
   * @param id - El ID de la promoción a desactivar.
   */
  async deactivate(id: number): Promise<void> {
    return apiClienteService.patch<void>(`${this.endpoint}/${id}/deactivate`);
  }

  /**
   * Cambia el estado 'activo' de una promoción (la habilita o deshabilita manualmente).
   * @param id - El ID de la promoción.
   */
  async toggleActivo(id: number): Promise<PromocionResponse> {
    return apiClienteService.patch<PromocionResponse>(
      `${this.endpoint}/${id}/toggle-activo`
    );
  }

  // ==================== BÚSQUEDAS ====================

  /**
   * Busca promociones por su denominación.
   * @param denominacion - El término de búsqueda.
   */
  async searchByDenominacion(
    denominacion: string
  ): Promise<PromocionResponse[]> {
    return apiClienteService.get<PromocionResponse[]>(
      `${this.endpoint}/buscar?denominacion=${encodeURIComponent(denominacion)}`
    );
  }
}

/**
 * Instancia única del servicio de promociones.
 */
export const promocionService = new PromocionService();
