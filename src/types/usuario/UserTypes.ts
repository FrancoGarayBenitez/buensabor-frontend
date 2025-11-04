import type { ClienteResponseDTO } from "../clientes/ClienteResponseDTO";
import type { Rol } from "../common";
import type { EmpleadoResponseDTO } from "../empleados/EmpleadoDTO";

// Tipo unión que representa cualquier usuario autenticado
export type AuthenticatedUser = ClienteResponseDTO | EmpleadoResponseDTO;

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
): user is EmpleadoResponseDTO => {
  return "activo" in user && !("idCliente" in user);
};

/**
 * Type guard específico para roles de empleado
 */
export const isRolEmpleado = (rol: Rol): boolean => {
  return ["ADMIN", "COCINERO", "CAJERO", "DELIVERY"].includes(rol);
};
