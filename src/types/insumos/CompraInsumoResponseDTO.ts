export interface CompraInsumoResponseDTO {
  id: number;
  idArticulo: number;
  denominacionInsumo: string;
  cantidad: number;
  precioUnitario: number;
  fechaCompra: string; // formato ISO
}
