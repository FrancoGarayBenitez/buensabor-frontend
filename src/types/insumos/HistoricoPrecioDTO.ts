export interface HistoricoPrecioDTO {
  idHistoricoPrecio: number;
  idArticulo: number;
  precioUnitario: number;
  fecha: string;
  cantidad?: number;
}
