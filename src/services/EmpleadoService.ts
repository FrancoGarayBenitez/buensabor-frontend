import type { EmpleadoRegisterDTO } from "../types/empleados/EmpleadoDTO";
import { apiClienteService } from "./ApiClienteService";

const BASE_URL = "/empleados";

/**
 * Servicio para manejar operaciones de empleados (solo accesible por ADMIN)
 */
const EmpleadoService = {
  /**
   * Registra un nuevo empleado.
   * @param data Datos del empleado a registrar.
   */
  registrarEmpleado: async (data: EmpleadoRegisterDTO): Promise<void> => {
    await apiClienteService.post(`${BASE_URL}/registrar`, data);
  },
};

export default EmpleadoService;
