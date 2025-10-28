import type { ImagenDTO } from "../common";
import type { DomicilioRequestDTO } from "./DomicilioDTO";

export interface ClienteRegisterDTO {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  fechaNacimiento: string; // ISO date string (YYYY-MM-DD)
  domicilio: DomicilioRequestDTO;
  imagen?: ImagenDTO;
  password: string;
  confirmPassword: string;
}
