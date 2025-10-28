export interface DatosEntrega {
  tipoEnvio: 'DELIVERY' | 'TAKE_AWAY';
  idDomicilio?: number;
  observaciones?: string;
}