import type { TipoCategoria } from "./TipoCategoria";

export interface CategoriaRequestDTO {
  denominacion: string;
  esSubcategoria: boolean;
  tipoCategoria: TipoCategoria;
  idCategoriaPadre?: number;
}
