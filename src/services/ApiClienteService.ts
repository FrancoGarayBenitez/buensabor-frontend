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
   * Obtiene headers con token siempre actualizado
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // SIEMPRE obtener token fresco desde localStorage (no usar cache)
    const token = AuthPasswordService.getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log(
        "🔐 Token agregado a headers:",
        token.substring(0, 20) + "..."
      );
    } else {
      console.log("⚠️ No hay token disponible para la petición");
    }

    return headers;
  }

  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    console.log(`📡 ${options?.method || "GET"} ${this.baseUrl}${url}`);

    const authHeaders = await this.getAuthHeaders();

    const response = await fetch(`${this.baseUrl}${url}`, {
      headers: {
        ...authHeaders,
        ...options?.headers,
      },
      ...options,
    });

    console.log(`📨 Respuesta: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      if (response.status === 401) {
        console.log("🚫 Error 401 - Token inválido o expirado");
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

      console.error(`❌ Error completo:`, errorMessage);
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
