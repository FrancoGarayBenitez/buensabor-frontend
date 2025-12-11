import type { ImagenDTO } from "../common/ImagenDTO";

export interface ArticuloInsumoRequestDTO {
  // ==================== CAMPOS HEREDADOS DE ARTICULO ====================
  denominacion: string;
  precioVenta: number;
  idUnidadMedida: number;
  idCategoria: number;

  // ==================== CAMPOS ESPECÍFICOS DE ARTICULOINSUMO ====================
  precioCompra: number;
  stockActual: number;
  stockMaximo: number;
  esParaElaborar: boolean;

  // ==================== RELACIONES OPCIONALES ====================
  imagenes?: ImagenDTO[];
}
