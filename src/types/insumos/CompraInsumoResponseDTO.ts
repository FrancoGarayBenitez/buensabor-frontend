export interface CompraInsumoResponseDTO {
  // Identificadores
  id: number;
  idArticuloInsumo: number;
  denominacionInsumo: string;

  // Normalizado (unidad técnica: g/ml/unidad)
  cantidad: number; // ej: 1500 (g/ml/unidad)
  precioUnitario: number; // ej: 2 ($/g)
  fechaCompra: string; // ISO

  imagenUrl?: string; // opcional

  // Datos de la operación por paquete (si el backend los envía en response)
  paquetes?: number; // ej: 3
  precioPorPaquete?: number; // ej: 1000
  contenidoPorPaquete?: number; // ej: 500
  unidadContenido?: "g" | "kg" | "ml" | "l" | "unidad";
}
