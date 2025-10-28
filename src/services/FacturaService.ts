// src/services/FacturaService.ts

import { apiClienteService } from "./ApiClienteService";
import AuthPasswordService from "./AuthPasswordService";
import type {
  FacturaResponseDTO,
  FacturaPdfOptions,
} from "../types/facturas/FacturaTypes";

export class FacturaService {
  private static readonly BASE_URL = "/facturas";

  // ==================== OBTENER FACTURAS ====================

  /**
   * Obtener todas las facturas
   */
  static async getAllFacturas(): Promise<FacturaResponseDTO[]> {
    try {
      const response = await apiClienteService.get<FacturaResponseDTO[]>(
        this.BASE_URL
      );
      return response || [];
    } catch (error) {
      console.error("Error obteniendo facturas:", error);
      throw new Error("Error al obtener las facturas");
    }
  }

  /**
   * Obtener factura por ID
   */
  static async getFacturaById(id: number): Promise<FacturaResponseDTO> {
    try {
      const response = await apiClienteService.get<FacturaResponseDTO>(
        `${this.BASE_URL}/${id}`
      );
      return response;
    } catch (error) {
      console.error("Error obteniendo factura:", error);
      throw new Error(`Error al obtener la factura con ID ${id}`);
    }
  }

  /**
   * Obtener factura por ID de pedido
   */
  static async getFacturaByPedidoId(
    pedidoId: number
  ): Promise<FacturaResponseDTO> {
    try {
      const response = await apiClienteService.get<FacturaResponseDTO>(
        `${this.BASE_URL}/pedido/${pedidoId}`
      );
      return response;
    } catch (error) {
      console.error("Error obteniendo factura por pedido:", error);
      throw new Error(`Error al obtener la factura del pedido ${pedidoId}`);
    }
  }

  /**
   * Obtener facturas por cliente
   */
  static async getFacturasByClienteId(
    clienteId: number
  ): Promise<FacturaResponseDTO[]> {
    try {
      const response = await apiClienteService.get<FacturaResponseDTO[]>(
        `${this.BASE_URL}/cliente/${clienteId}`
      );
      return response || [];
    } catch (error) {
      console.error("Error obteniendo facturas del cliente:", error);
      throw new Error(`Error al obtener facturas del cliente ${clienteId}`);
    }
  }

  /**
   * Verificar si existe factura para un pedido
   */
  static async existeFacturaParaPedido(pedidoId: number): Promise<boolean> {
    try {
      const response = await apiClienteService.get<boolean>(
        `${this.BASE_URL}/exists/pedido/${pedidoId}`
      );
      return response || false;
    } catch (error) {
      console.error("Error verificando existencia de factura:", error);
      return false;
    }
  }

  // ==================== MÉTODOS AUXILIARES PARA AUTENTICACIÓN ====================

  /**
   * Obtener headers con autenticación JWT
   */
  private static getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/pdf",
    };

    try {
      const token = AuthPasswordService.getToken();

      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log("✅ Token JWT agregado para factura");
      } else {
        console.warn("⚠️ No hay token JWT disponible");
      }
    } catch (error) {
      console.error("❌ Error obteniendo token JWT para factura:", error);
    }

    return headers;
  }

  // ==================== DESCARGAS PDF ✅ CORREGIDO ====================

  /**
   * Descargar factura en PDF por ID de factura
   */
  static async descargarFacturaPdf(
    facturaId: number,
    options: FacturaPdfOptions = {}
  ): Promise<void> {
    try {
      console.log(`🔽 Descargando PDF factura ID: ${facturaId}`);

      const endpoint = options.preview
        ? `${this.BASE_URL}/${facturaId}/pdf/preview`
        : `${this.BASE_URL}/${facturaId}/pdf`;

      // ✅ USAR headers con JWT
      const authHeaders = this.getAuthHeaders();

      const baseUrl = "http://localhost:8080/api";
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "GET",
        headers: authHeaders,
      });

      console.log("📡 Response status para PDF factura:", response.status);

      if (!response.ok) {
        throw new Error(
          `Error HTTP: ${response.status} - ${response.statusText}`
        );
      }

      // Obtener el blob del PDF
      const blob = await response.blob();

      if (options.preview) {
        // Abrir en nueva pestaña para preview
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
        window.URL.revokeObjectURL(url);
      } else {
        // Descargar archivo
        this.downloadFile(
          blob,
          options.filename || `factura_${facturaId}.pdf`,
          response
        );
      }

      console.log(`✅ PDF procesado exitosamente`);
    } catch (error) {
      console.error("Error descargando PDF:", error);
      throw new Error(`Error al descargar PDF de factura: ${error}`);
    }
  }

  /**
   * Descargar factura en PDF por ID de pedido ✅ CORREGIDO
   */
  static async descargarFacturaPdfByPedido(
    pedidoId: number,
    options: FacturaPdfOptions = {}
  ): Promise<void> {
    try {
      console.log(`🔽 Descargando PDF para pedido ID: ${pedidoId}`);

      const endpoint = `${this.BASE_URL}/pedido/${pedidoId}/pdf`;

      // ✅ USAR headers con JWT
      const authHeaders = this.getAuthHeaders();

      const baseUrl = "http://localhost:8080/api";
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "GET",
        headers: authHeaders,
      });

      console.log("📡 Response status para PDF pedido:", response.status);

      if (!response.ok) {
        throw new Error(
          `Error HTTP: ${response.status} - ${response.statusText}`
        );
      }

      // Obtener el blob del PDF
      const blob = await response.blob();

      // Descargar archivo
      this.downloadFile(
        blob,
        options.filename || `factura_pedido_${pedidoId}.pdf`,
        response
      );

      console.log(`✅ PDF descargado exitosamente`);
    } catch (error) {
      console.error("Error descargando PDF por pedido:", error);
      throw new Error(`Error al descargar PDF del pedido: ${error}`);
    }
  }

  // ==================== MÉTODOS AUXILIARES PRIVADOS ====================

  /**
   * Descargar archivo blob
   */
  private static downloadFile(
    blob: Blob,
    defaultFilename: string,
    response: Response
  ): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Extraer nombre del archivo de la respuesta o usar por defecto
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = defaultFilename;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      );
      if (filenameMatch) {
        filename = filenameMatch[1].replace(/['"]/g, "");
      }
    }

    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log(`✅ Archivo descargado: ${filename}`);
  }

  // ==================== UTILITIES ====================

  /**
   * Formatear fecha para mostrar
   */
  static formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  /**
   * Formatear moneda para mostrar
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  }

  /**
   * Obtener color según estado de pago
   */
  static getEstadoPagoColor(completamentePagada: boolean): string {
    return completamentePagada ? "text-green-600" : "text-orange-600";
  }

  /**
   * Obtener texto según estado de pago
   */
  static getEstadoPagoTexto(completamentePagada: boolean): string {
    return completamentePagada ? "Pagado" : "Pendiente";
  }
}
