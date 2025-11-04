import type { ImagenDTO, Rol } from "../common";

export type RolEmpleado = Exclude<Rol, "CLIENTE">;

export interface EmpleadoRegisterDTO {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  confirmPassword?: string;
  rol: RolEmpleado;
}

export interface EmpleadoResponseDTO {
  idUsuario: number;
  email: string;
  rol: string;
  nombre: string;
  apellido: string;
  activo: boolean;
  imagen?: ImagenDTO;
}
