import React, { useState } from "react";
import type {
  EmpleadoRegisterDTO,
  RolEmpleado,
} from "../../types/empleados/EmpleadoDTO";

interface EmpleadoFormProps {
  onSubmit: (data: EmpleadoRegisterDTO) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
}

interface FormState extends EmpleadoRegisterDTO {
  confirmPassword: string;
}

export const EmpleadoForm: React.FC<EmpleadoFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
  error,
}) => {
  const [formData, setFormData] = useState<FormState>({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: "",
    rol: "COCINERO" as RolEmpleado,
  });

  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  const roleOptions = [
    { value: "ADMIN", label: "Administrador" },
    { value: "COCINERO", label: "Cocinero" },
    { value: "CAJERO", label: "Cajero" },
    { value: "DELIVERY", label: "Delivery" },
  ];

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Validaciones básicas
    if (!formData.nombre.trim()) {
      errors.nombre = "El nombre es obligatorio";
    }
    if (!formData.apellido.trim()) {
      errors.apellido = "El apellido es obligatorio";
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Debe ingresar un email válido";
    }
    if (!formData.password || formData.password.length < 8) {
      errors.password = "La contraseña debe tener al menos 8 caracteres";
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden";
    }
    if (!formData.rol) {
      errors.rol = "Debe seleccionar un rol";
    }

    // Validación de contraseña segura
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (formData.password && !passwordRegex.test(formData.password)) {
      errors.password =
        "La contraseña debe tener mayúscula, minúscula, número y símbolo especial";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      const { confirmPassword, ...dataToSubmit } = formData;
      console.log("Datos de empleado a enviar:", dataToSubmit);
      await onSubmit(dataToSubmit);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-800 text-center mb-4">
        Registrar Nuevo Empleado
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Nombre y Apellido en una fila */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={(e) => handleInputChange("nombre", e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent transition-all duration-200 placeholder-gray-400 ${
                validationErrors.nombre ? "border-red-500" : "border-gray-300"
              }`}
            />
            {validationErrors.nombre && (
              <p className="mt-1 text-xs text-red-600">
                {validationErrors.nombre}
              </p>
            )}
          </div>

          <div>
            <input
              type="text"
              placeholder="Apellido"
              value={formData.apellido}
              onChange={(e) => handleInputChange("apellido", e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent transition-all duration-200 placeholder-gray-400 ${
                validationErrors.apellido ? "border-red-500" : "border-gray-300"
              }`}
            />
            {validationErrors.apellido && (
              <p className="mt-1 text-xs text-red-600">
                {validationErrors.apellido}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent transition-all duration-200 placeholder-gray-400 ${
              validationErrors.email ? "border-red-500" : "border-gray-300"
            }`}
          />
          {validationErrors.email && (
            <p className="mt-1 text-xs text-red-600">
              {validationErrors.email}
            </p>
          )}
        </div>

        {/* Rol */}
        <div>
          <select
            value={formData.rol}
            onChange={(e) =>
              handleInputChange("rol", e.target.value as RolEmpleado)
            }
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent transition-all duration-200 bg-white ${
              validationErrors.rol ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">Seleccionar rol</option>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {validationErrors.rol && (
            <p className="mt-1 text-xs text-red-600">{validationErrors.rol}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <input
            type="password"
            placeholder="Contraseña (mín. 8 caracteres)"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent transition-all duration-200 placeholder-gray-400 ${
              validationErrors.password ? "border-red-500" : "border-gray-300"
            }`}
          />
          {validationErrors.password && (
            <p className="mt-1 text-xs text-red-600">
              {validationErrors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <input
            type="password"
            placeholder="Confirmar Contraseña"
            value={formData.confirmPassword}
            onChange={(e) =>
              handleInputChange("confirmPassword", e.target.value)
            }
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent transition-all duration-200 placeholder-gray-400 ${
              validationErrors.confirmPassword
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />
          {validationErrors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">
              {validationErrors.confirmPassword}
            </p>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-[#CD6C50] hover:bg-[#b85a42] disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-[#CD6C50] focus:ring-offset-2"
          >
            {loading ? "Registrando..." : "Registrar Empleado"}
          </button>
        </div>
      </div>
    </div>
  );
};
