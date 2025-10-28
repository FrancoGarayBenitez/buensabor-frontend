import React, { useState } from "react";
import type { ClienteRegisterDTO } from "../../types/clientes";

interface RegistroFormProps {
  onSubmit: (data: ClienteRegisterDTO) => Promise<void>;
  onSwitchToLogin: () => void;
  loading?: boolean;
  error?: string;
}

interface FormState extends ClienteRegisterDTO {}

export const RegistroForm: React.FC<RegistroFormProps> = ({
  onSubmit,
  onSwitchToLogin,
  loading = false,
  error,
}) => {
  const [formData, setFormData] = useState<FormState>({
    email: "",
    password: "",
    confirmPassword: "",
    nombre: "",
    apellido: "",
    telefono: "",
    fechaNacimiento: "",
    domicilio: {
      calle: "",
      numero: 0,
      cp: 0,
      localidad: "",
    },
  });

  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // VALIDACIONES DE EMAIL Y CONTRASEÑA
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Debe ingresar un email válido";
    }
    if (!formData.password || formData.password.length < 8) {
      errors.password = "La contraseña debe tener al menos 8 caracteres";
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden";
    }

    if (!formData.nombre.trim()) errors.nombre = "El nombre es obligatorio";
    if (!formData.apellido.trim())
      errors.apellido = "El apellido es obligatorio";
    if (!formData.domicilio.calle.trim())
      errors.direccion = "La dirección es obligatoria";
    if (!formData.domicilio.localidad.trim())
      errors.departamento = "El departamento es obligatorio";

    // Validar número de domicilio
    if (!formData.domicilio.numero || formData.domicilio.numero <= 0) {
      errors.numero = "El número es obligatorio y debe ser mayor a 0";
    }

    // Validar fecha de nacimiento
    if (!formData.fechaNacimiento) {
      errors.fechaNacimiento = "La fecha de nacimiento es obligatoria";
    } else {
      const seleccionada = new Date(formData.fechaNacimiento);
      const hoy = new Date();
      if (seleccionada >= hoy) {
        errors.fechaNacimiento = "La fecha debe estar en el pasado";
      }
    }

    // Validar código postal
    if (
      !formData.domicilio.cp ||
      formData.domicilio.cp < 1000 ||
      formData.domicilio.cp > 9999
    ) {
      errors.cp = "Código postal inválido (debe estar entre 1000 y 9999)";
    }

    if (!formData.telefono.trim()) {
      errors.telefono = "El teléfono es obligatorio";
    } else if (!/^[0-9+\-\s()]{10,20}$/.test(formData.telefono)) {
      errors.telefono = "Teléfono inválido (10-20 caracteres)";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      console.log("Datos a enviar:", formData);
      await onSubmit(formData);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");

      // Convertir a número si es numero o cp
      let processedValue = value;
      if (child === "numero" || child === "cp") {
        processedValue = value === "" ? 0 : parseInt(value) || 0;
      }

      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: processedValue,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Formulario de datos adicionales (cuando ya está autenticado con Auth0)
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-800 text-center mb-4">
        Crea tu cuenta y perfil
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
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
        {/* Nombre */}
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
        {/* Apellido */}
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
        {/* Fecha de nacimiento */}
        <div>
          <input
            type="date"
            placeholder="Fecha de nacimiento"
            value={formData.fechaNacimiento}
            max={new Date().toISOString().split("T")[0]}
            min="1900-01-01"
            onChange={(e) =>
              handleInputChange("fechaNacimiento", e.target.value)
            }
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent transition-all duration-200 placeholder-gray-400 ${
              validationErrors.fechaNacimiento
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />
          {validationErrors.fechaNacimiento && (
            <p className="mt-1 text-xs text-red-600">
              {validationErrors.fechaNacimiento}
            </p>
          )}
        </div>
        {/* Dirección */}
        <div>
          <input
            type="text"
            placeholder="Dirección (Calle)"
            value={formData.domicilio.calle}
            onChange={(e) =>
              handleInputChange("domicilio.calle", e.target.value)
            }
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent transition-all duration-200 placeholder-gray-400 ${
              validationErrors.direccion ? "border-red-500" : "border-gray-300"
            }`}
          />
          {validationErrors.direccion && (
            <p className="mt-1 text-xs text-red-600">
              {validationErrors.direccion}
            </p>
          )}
        </div>
        {/* Número y Código Postal en una fila */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="number"
              placeholder="Número"
              value={formData.domicilio.numero || ""}
              onChange={(e) =>
                handleInputChange("domicilio.numero", e.target.value)
              }
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent transition-all duration-200 placeholder-gray-400 ${
                validationErrors.numero ? "border-red-500" : "border-gray-300"
              }`}
            />
            {validationErrors.numero && (
              <p className="mt-1 text-xs text-red-600">
                {validationErrors.numero}
              </p>
            )}
          </div>

          <div>
            <input
              type="number"
              placeholder="C.P."
              value={formData.domicilio.cp || ""}
              onChange={(e) =>
                handleInputChange("domicilio.cp", e.target.value)
              }
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent transition-all duration-200 placeholder-gray-400 ${
                validationErrors.cp ? "border-red-500" : "border-gray-300"
              }`}
            />
            {validationErrors.cp && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.cp}</p>
            )}
          </div>
        </div>
        {/* Localidad */}
        <div>
          <input
            type="text"
            placeholder="Localidad"
            value={formData.domicilio.localidad}
            onChange={(e) =>
              handleInputChange("domicilio.localidad", e.target.value)
            }
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent transition-all duration-200 placeholder-gray-400 ${
              validationErrors.departamento
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />
          {validationErrors.departamento && (
            <p className="mt-1 text-xs text-red-600">
              {validationErrors.departamento}
            </p>
          )}
        </div>
        {/* Teléfono */}
        <div>
          <input
            type="tel"
            placeholder="Teléfono"
            value={formData.telefono}
            onChange={(e) => handleInputChange("telefono", e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent transition-all duration-200 placeholder-gray-400 ${
              validationErrors.telefono ? "border-red-500" : "border-gray-300"
            }`}
          />
          {validationErrors.telefono && (
            <p className="mt-1 text-xs text-red-600">
              {validationErrors.telefono}
            </p>
          )}
        </div>
        {/* Botón Completar Registro */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#CD6C50] hover:bg-[#b85a42] disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-[#CD6C50] focus:ring-offset-2"
        >
          {loading ? "Registrando usuario..." : "Registrar y Crear Perfil"}
        </button>
        {/* Link a Login */}
        <div className="text-center mt-6">
          <span className="text-gray-600 text-sm">¿Ya tienes cuenta? </span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[#CD6C50] hover:text-[#b85a42] font-medium transition-colors duration-200 text-sm"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
};
