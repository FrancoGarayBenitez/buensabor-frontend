import type { CategoriaSimpleDTO } from "../common/CategoriaSimple";

export interface CategoriaResponseDTO {
  idCategoria: number;
  denominacion: string;
  esSubcategoria: boolean;

  idCategoriaPadre?: number; // Opcional, puede no existir si no es subcategoría
  denominacionCategoriaPadre?: string; // Opcional, puede no existir

  subcategorias: CategoriaSimpleDTO[];

  cantidadArticulos: number;
  cantidadSubcategorias?: number;
}
