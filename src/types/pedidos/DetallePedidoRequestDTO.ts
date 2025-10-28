export interface DetallePedidoRequestDTO {
  idArticulo: number;
  cantidad: number;
   observaciones?: string;
  
  // ✅ NUEVO: Promoción seleccionada por el cliente
  idPromocionSeleccionada?: number;
}
