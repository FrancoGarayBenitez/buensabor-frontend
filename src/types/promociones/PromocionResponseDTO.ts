export interface PromocionResponseDTO {
  idPromocion: number;
  denominacion: string;
  fechaDesde: string;
  fechaHasta: string;
  horaDesde: string;
  horaHasta: string;
  descripcionDescuento?: string;
  tipoDescuento: 'PORCENTUAL' | 'MONTO_FIJO';
  valorDescuento: number;
  precioPromocional?: number;
  cantidadMinima: number;
  activo: boolean;
  
  // Información de artículos incluidos
  articulos: ArticuloSimpleDTO[];
  
  // Estado calculado
  estaVigente: boolean;
  estadoDescripcion: string;
  
  // Información de imágenes
  urlsImagenes: string[];
}

export interface ArticuloSimpleDTO {
  idArticulo: number;
  denominacion: string;
  precioVenta: number;
  urlImagen?: string;
}