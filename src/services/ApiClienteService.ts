import AuthPasswordService from "./AuthPasswordService";

export class ApiClienteService {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:8080/api") {
    this.baseUrl = baseUrl;
  }

  get baseURL(): string {
    return this.baseUrl;
  }

  /**
   * ✅ ADAPTADO: Ahora obtiene el JWT directamente de la sesión local
   * usando AuthPasswordService.
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // 🔑 OBTENER EL TOKEN LOCALMENTE
    const token = AuthPasswordService.getToken(); // Llama a la función que lee 'jwt_token' del localStorage

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    // Si no hay token, simplemente retornamos los headers sin Authorization (para endpoints públicos)
    return headers;
  }

  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const authHeaders = await this.getAuthHeaders();

    const response = await fetch(`${this.baseUrl}${url}`, {
      headers: {
        ...authHeaders,
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      if (response.status === 401) {
      }

      const errorBody = await response.text();
      let errorMessage = `Error ${response.status}: ${response.statusText}`;

      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage =
          errorJson.error ||
          errorJson.message ||
          errorJson.mensaje ||
          errorMessage;
      } catch (parseError) {
        errorMessage = errorBody || errorMessage;
      }

      throw new Error(errorMessage);
    }

    // Si no hay contenido (ej: DELETE), retornar objeto vacío
    if (
      response.status === 204 ||
      response.headers.get("content-length") === "0"
    ) {
      return {} as T;
    }

    return response.json();
  }

  public async get<T = any>(url: string): Promise<T> {
    return this.request<T>(url, { method: "GET" });
  }

  public async post<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async put<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async patch<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async deleteRequest<T = any>(url: string): Promise<T> {
    return this.request<T>(url, { method: "DELETE" });
  }
}

export const apiClienteService = new ApiClienteService();
