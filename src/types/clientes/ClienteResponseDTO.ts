import type { ImagenDTO } from "../common";
import type { Rol } from "../common/Rol";
import type { DomicilioResponseDTO } from "./DomicilioDTO";

export interface ClienteResponseDTO {
  idCliente: number;
  idUsuario: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaNacimiento: string; // ISO date string
  domicilios: DomicilioResponseDTO[];
  imagen?: ImagenDTO;
  rol: Rol;
}
