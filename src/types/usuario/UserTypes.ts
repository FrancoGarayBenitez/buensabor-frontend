import type { ClienteResponseDTO } from "../clientes/ClienteResponseDTO";
import type { ImagenDTO, Rol } from "../common";

// DTO base para empleados (equivalente a UsuarioBaseResponseDTO del backend)
export interface UsuarioBaseResponseDTO {
  idUsuario: number;
  email: string;
  rol: Rol;
  nombre: string;
  apellido: string;
  activo: boolean;
  imagen?: ImagenDTO;
}

// Tipo unión que representa cualquier usuario autenticado
export type AuthenticatedUser = ClienteResponseDTO | UsuarioBaseResponseDTO;

// ==================== TYPE GUARDS ====================

/**
 * Type guard para verificar si el usuario es un cliente
 */
export const isCliente = (
  user: AuthenticatedUser
): user is ClienteResponseDTO => {
  return (
    "idCliente" in user &&
    "telefono" in user &&
    "fechaNacimiento" in user &&
    "domicilios" in user
  );
};

/**
 * Type guard para verificar si el usuario es un empleado
 */
export const isEmpleado = (
  user: AuthenticatedUser
): user is UsuarioBaseResponseDTO => {
  return "activo" in user && !("idCliente" in user);
};
