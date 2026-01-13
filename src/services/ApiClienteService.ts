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
   * Obtiene los headers de autenticación, añadiendo el token si está disponible.
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = AuthPasswordService.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Maneja la respuesta de una solicitud HTTP, lanzando errores si es necesario.
   */
  private async handleResponse<T>(response: Response, url: string): Promise<T> {
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorBody = await response.json();
        errorMessage =
          errorBody.error ||
          errorBody.message ||
          errorBody.mensaje ||
          errorMessage;
      } catch (e) {
        errorMessage = (await response.text()) || errorMessage;
      }
      console.error(`Error en la petición a ${url}:`, errorMessage);
      throw new Error(errorMessage);
    }

    // Si la respuesta no tiene contenido (ej: 204 No Content), se devuelve un objeto vacío.
    if (
      response.status === 204 ||
      response.headers.get("content-length") === "0"
    ) {
      return {} as T;
    }

    return response.json();
  }

  /**
   * Método central para realizar todas las peticiones fetch.
   * Maneja la autenticación, el parseo de errores y la respuesta.
   */
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const authHeaders = await this.getAuthHeaders();

    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: {
        ...authHeaders,
        ...options?.headers,
      },
    });

    return this.handleResponse<T>(response, url);
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

  /**
   * Realiza una petición DELETE, permitiendo un cuerpo de datos opcional.
   */
  public async deleteRequest<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: "DELETE",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Método genérico para enviar FormData con soporte para POST y PUT.
   * Esto evita que el método genérico 'request' inyecte un 'Content-Type' incorrecto.
   */
  private async sendFormData<T = any>(
    url: string,
    formData: FormData,
    method: "POST" | "PUT"
  ): Promise<T> {
    // Se obtienen los headers de autenticación, pero se omite el Content-Type.
    const { ["Content-Type"]: _, ...authHeaders } = await this.getAuthHeaders();

    const response = await fetch(`${this.baseUrl}${url}`, {
      method,
      headers: authHeaders, // Solo se usan los headers de autenticación.
      body: formData,
    });

    return this.handleResponse<T>(response, url);
  }

  /**
   * Envía datos en formato FormData usando el método POST.
   */
  public async postFormData<T = any>(
    url: string,
    formData: FormData
  ): Promise<T> {
    return this.sendFormData<T>(url, formData, "POST");
  }

  /**
   * Envía datos en formato FormData usando el método PUT.
   */
  public async putFormData<T = any>(
    url: string,
    formData: FormData
  ): Promise<T> {
    return this.sendFormData<T>(url, formData, "PUT");
  }
}

export const apiClienteService = new ApiClienteService();
