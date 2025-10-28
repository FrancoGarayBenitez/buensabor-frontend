import type { ImagenDTO } from "../common";

/**
 * DTO específico para editar información personal del perfil
 * No incluye domicilios (se manejan por separado)
 */
export interface ClientePerfilDTO {
  nombre: string;
  apellido: string;
  telefono: string;
  fechaNacimiento: string; // ISO date string
  imagen?: ImagenDTO;
}

/**
 * DTO para estadísticas del perfil
 */
export interface ClienteEstadisticasDTO {
  idCliente: number;
  nombreCompleto: string;
  email: string;
  cantidadDomicilios: number;
  tieneImagen: boolean;
  fechaNacimiento: string;
}
