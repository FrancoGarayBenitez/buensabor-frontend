import type { ImagenDTO } from "../common/ImagenDTO";

export interface ArticuloInsumoResponseDTO {
  idArticulo: number;
  denominacion: string;
  precioVenta: number;
  eliminado: boolean;   // <- agregar este campo

  idUnidadMedida: number;
  denominacionUnidadMedida: string;

  idCategoria: number;
  denominacionCategoria: string;
  esSubcategoria: boolean;
  denominacionCategoriaPadre?: string;

  precioCompra: number;
  stockActual: number;
  stockMaximo: number;
  esParaElaborar: boolean;

  porcentajeStock: number;
  estadoStock: "CRITICO" | "BAJO" | "NORMAL" | "ALTO";
  stockDisponible: number;

  imagenes: ImagenDTO[];

  cantidadProductosQueLoUsan: number;
}
