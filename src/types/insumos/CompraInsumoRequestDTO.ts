export interface CompraInsumoRequestDTO {
  insumoId: number;               // CAMBIA EL NOMBRE DEL CAMPO
  cantidad: number;
  precioUnitario: number;
  fechaCompra: string;            // AGREGA LA FECHA
}
