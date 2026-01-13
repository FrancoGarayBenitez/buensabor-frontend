import { apiClienteService } from "./ApiClienteService";

export interface UnidadMedidaDTO {
  idUnidadMedida: number;
  denominacion: string;
}

/**
 * Servicio para operaciones de unidades de medida
 * Usa apiClienteService que maneja automáticamente los tokens de Auth0
 */
export class UnidadMedidaService {
  private readonly endpoint = "/unidades-medida";

  async getAll(): Promise<UnidadMedidaDTO[]> {
    try {
      return await apiClienteService.get<UnidadMedidaDTO[]>(this.endpoint);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getById(id: number): Promise<UnidadMedidaDTO> {
    try {
      return await apiClienteService.get<UnidadMedidaDTO>(
        `${this.endpoint}/${id}`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: any): Error {
    return error instanceof Error
      ? error
      : new Error("Error en el servicio de unidades de medida");
  }
}

export const unidadMedidaService = new UnidadMedidaService();
