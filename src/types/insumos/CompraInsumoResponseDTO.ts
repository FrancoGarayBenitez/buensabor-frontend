export interface CompraInsumoResponseDTO {
  id: number;
  idArticuloInsumo: number;
  denominacionInsumo: string;
  cantidad: number;
  precioUnitario: number;
  fechaCompra: string; // formato ISO
}
