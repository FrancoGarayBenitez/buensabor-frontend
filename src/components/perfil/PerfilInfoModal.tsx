// components/perfil/PerfilInfoModal.tsx

import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Alert } from "../common/Alert";
import { useClientePerfil } from "../../hooks/useClientePerfil";
import type { ClientePerfilDTO } from "../../types/clientes";

interface PerfilInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const INITIAL_FORM_DATA: ClientePerfilDTO = {
  nombre: "",
  apellido: "",
  telefono: "",
  fechaNacimiento: "",
  imagen: undefined,
};

export const PerfilInfoModal: React.FC<PerfilInfoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { perfil, actualizarPerfilInfo, isLoading } = useClientePerfil();
  const [formData, setFormData] = useState<ClientePerfilDTO>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");

  // Cargar datos actuales cuando se abre el modal
  useEffect(() => {
    if (isOpen && perfil) {
      setFormData({
        nombre: perfil.nombre,
        apellido: perfil.apellido,
        telefono: perfil.telefono,
        fechaNacimiento: perfil.fechaNacimiento,
        imagen: perfil.imagen,
      });
      setErrors({});
      setSubmitError("");
    }
  }, [isOpen, perfil]);

  /**
   * Valida el formulario
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
    } else if (formData.nombre.trim().length > 50) {
      newErrors.nombre = "El nombre no puede exceder 50 caracteres";
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = "El apellido es obligatorio";
    } else if (formData.apellido.trim().length < 2) {
      newErrors.apellido = "El apellido debe tener al menos 2 caracteres";
    } else if (formData.apellido.trim().length > 50) {
      newErrors.apellido = "El apellido no puede exceder 50 caracteres";
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es obligatorio";
    } else if (!/^[0-9+\-\s()]{10,20}$/.test(formData.telefono)) {
      newErrors.telefono = "Formato de teléfono inválido";
    }

    if (!formData.fechaNacimiento) {
      newErrors.fechaNacimiento = "La fecha de nacimiento es obligatoria";
    } else {
      const fechaNac = new Date(formData.fechaNacimiento);
      const hoy = new Date();
      if (fechaNac >= hoy) {
        newErrors.fechaNacimiento =
          "La fecha de nacimiento debe ser en el pasado";
      }
      const edad = hoy.getFullYear() - fechaNac.getFullYear();
      if (edad < 13) {
        newErrors.fechaNacimiento = "Debes tener al menos 13 años";
      }
      if (edad > 120) {
        newErrors.fechaNacimiento = "Fecha de nacimiento inválida";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Maneja los cambios en los inputs
   */
  const handleInputChange = (field: keyof ClientePerfilDTO, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitError("");
      await actualizarPerfilInfo(formData);

      onSuccess?.();
      onClose();

      // Mostrar notificación de éxito (puedes usar una librería de toast)
      alert("Información personal actualizada correctamente");
    } catch (error: any) {
      setSubmitError(error.message || "Error al actualizar la información");
    }
  };

  /**
   * Maneja el cierre del modal
   */
  const handleClose = () => {
    if (!isLoading) {
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
      setSubmitError("");
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Información Personal"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error general */}
        {submitError && <Alert type="error" message={submitError} />}

        {/* Nombre */}
        <div>
          <label
            htmlFor="nombre"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nombre *
          </label>
          <input
            type="text"
            id="nombre"
            value={formData.nombre}
            onChange={(e) => handleInputChange("nombre", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.nombre ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Ingresa tu nombre"
            disabled={isLoading}
          />
          {errors.nombre && (
            <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
          )}
        </div>

        {/* Apellido */}
        <div>
          <label
            htmlFor="apellido"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Apellido *
          </label>
          <input
            type="text"
            id="apellido"
            value={formData.apellido}
            onChange={(e) => handleInputChange("apellido", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.apellido ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Ingresa tu apellido"
            disabled={isLoading}
          />
          {errors.apellido && (
            <p className="mt-1 text-sm text-red-600">{errors.apellido}</p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label
            htmlFor="telefono"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Teléfono *
          </label>
          <input
            type="tel"
            id="telefono"
            value={formData.telefono}
            onChange={(e) => handleInputChange("telefono", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.telefono ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Ej: +54 261 123-4567"
            disabled={isLoading}
          />
          {errors.telefono && (
            <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
          )}
        </div>

        {/* Fecha de Nacimiento */}
        <div>
          <label
            htmlFor="fechaNacimiento"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Fecha de Nacimiento *
          </label>
          <input
            type="date"
            id="fechaNacimiento"
            value={
              formData.fechaNacimiento
                ? formData.fechaNacimiento.split("T")[0]
                : ""
            }
            onChange={(e) =>
              handleInputChange("fechaNacimiento", e.target.value)
            }
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.fechaNacimiento ? "border-red-500" : "border-gray-300"
            }`}
            disabled={isLoading}
            max={new Date().toISOString().split("T")[0]} // No permitir fechas futuras
          />
          {errors.fechaNacimiento && (
            <p className="mt-1 text-sm text-red-600">
              {errors.fechaNacimiento}
            </p>
          )}
        </div>

        {/* Imagen (por ahora solo mostrar si existe) */}
        {formData.imagen && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Foto de Perfil Actual
            </label>
            <div className="flex items-center space-x-4">
              <img
                src={formData.imagen.url}
                alt="Foto de perfil"
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="text-sm text-gray-500">
                <p>{formData.imagen.denominacion}</p>
                <p className="text-xs">
                  Para cambiar la foto, usa la configuración de Auth0
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? "⏳ Guardando..." : "💾 Guardar Cambios"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
