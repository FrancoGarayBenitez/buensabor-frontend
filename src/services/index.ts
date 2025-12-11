import { CategoriaService } from "./CategoriaService";
import { InsumoService } from "./InsumoService";
import { ProductoService } from "./ProductoService";
import { UnidadMedidaService } from "./UnidadMedidaService";
import { CompraService } from "./CompraService";
import { HistoricoPrecioService } from "./HistoricoPrecioService";

// Crear instancias únicas de cada servicio
export const categoriaService = new CategoriaService();
export const insumoService = new InsumoService();
export const productoService = new ProductoService();
export const unidadMedidaService = new UnidadMedidaService();
export const compraService = new CompraService();
export const historicoPrecioService = new HistoricoPrecioService();

// Exportar también las clases por si se necesitan múltiples instancias
export { CategoriaService } from "./CategoriaService";
export { InsumoService } from "./InsumoService";
export { ProductoService } from "./ProductoService";
export { UnidadMedidaService } from "./UnidadMedidaService";
export { DomicilioService } from "./DomicilioService";
export { CompraService } from "./CompraService";

// Exportar tipos relacionados
export type { UnidadMedidaDTO } from "./UnidadMedidaService";
export { FacturaService } from "./FacturaService";
export { PagoService } from "./PagoService";
