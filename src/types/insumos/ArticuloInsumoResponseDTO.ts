import type { ImagenDTO } from "../common/ImagenDTO";

export interface ArticuloInsumoResponseDTO {
  // ==================== INFORMACIÓN BÁSICA ====================
  idArticulo: number;
  denominacion: string;
  precioVenta: number;
  eliminado: boolean;

  // ==================== UNIDAD DE MEDIDA ====================
  idUnidadMedida: number;
  denominacionUnidadMedida: string;

  // ==================== CATEGORÍA ====================
  idCategoria: number;
  denominacionCategoria: string;
  esSubcategoria: boolean;
  denominacionCategoriaPadre?: string;

  // ==================== DATOS DE INSUMO ====================
  precioCompra: number;
  stockActual: number;
  stockMaximo: number;
  esParaElaborar: boolean;

  // ==================== INFORMACIÓN CALCULADA ====================
  estadoStock: "CRITICO" | "BAJO" | "NORMAL" | "ALTO";
  porcentajeStock: number; // (stockActual / stockMaximo) * 100
  stockDisponible: number; // Alias de stockActual
  costoTotalInventario: number; // precioCompra * stockActual
  margenGanancia: number; // % de ganancia

  // ==================== RELACIONES ====================
  imagenes: ImagenDTO[];
  cantidadProductosQueLoUsan?: number;
}
