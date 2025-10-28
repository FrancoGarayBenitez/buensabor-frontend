// components/perfil/DomicilioModal.tsx

import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Alert } from "../common/Alert";
import { useDomicilios } from "../../hooks/useDomicilios";
import type {
  DomicilioRequestDTO,
  DomicilioResponseDTO,
} from "../../types/clientes";

interface DomicilioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  domicilio?: DomicilioResponseDTO; // Si existe, es edición; si no, es creación
  mode?: "create" | "edit";
}

const INITIAL_FORM_DATA: DomicilioRequestDTO = {
  calle: "",
  numero: 0,
  cp: 0,
  localidad: "",
  esPrincipal: false,
};

export const DomicilioModal: React.FC<DomicilioModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  domicilio,
  mode = domicilio ? "edit" : "create",
}) => {
  const { crearDomicilio, actualizarDomicilio, domicilios, isLoading } =
    useDomicilios();

  const [formData, setFormData] =
    useState<DomicilioRequestDTO>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");

  const isEdit = mode === "edit" && domicilio;
  const title = isEdit ? "Editar Domicilio" : "Agregar Nuevo Domicilio";

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (isEdit && domicilio) {
        setFormData({
          calle: domicilio.calle,
          numero: domicilio.numero,
          cp: domicilio.cp,
          localidad: domicilio.localidad,
          esPrincipal: domicilio.esPrincipal,
        });
      } else {
        // Para nuevo domicilio, marcarlo como principal si no hay ninguno
        const tienePrincipal = domicilios.some((d) => d.esPrincipal);
        setFormData({
          ...INITIAL_FORM_DATA,
          esPrincipal: !tienePrincipal, // Marcar como principal si no hay ninguno
        });
      }
      setErrors({});
      setSubmitError("");
    }
  }, [isOpen, domicilio, isEdit, domicilios]);

  /**
   * Valida el formulario
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.calle.trim()) {
      newErrors.calle = "La calle es obligatoria";
    } else if (formData.calle.trim().length > 100) {
      newErrors.calle = "La calle no puede exceder 100 caracteres";
    }

    if (!formData.numero || formData.numero <= 0) {
      newErrors.numero = "El número debe ser mayor a 0";
    } else if (formData.numero > 99999) {
      newErrors.numero = "El número no puede exceder 99999";
    }

    if (!formData.cp || formData.cp < 1000 || formData.cp > 9999) {
      newErrors.cp = "El código postal debe ser entre 1000 y 9999";
    }

    if (!formData.localidad.trim()) {
      newErrors.localidad = "La localidad es obligatoria";
    } else if (formData.localidad.trim().length > 100) {
      newErrors.localidad = "La localidad no puede exceder 100 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Maneja los cambios en los inputs
   */
  const handleInputChange = (
    field: keyof DomicilioRequestDTO,
    value: string | number | boolean
  ) => {
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

      if (isEdit && domicilio) {
        await actualizarDomicilio(domicilio.idDomicilio, formData);
        alert("Domicilio actualizado correctamente");
      } else {
        await crearDomicilio(formData);
        alert("Domicilio creado correctamente");
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      setSubmitError(error.message || "Error al guardar el domicilio");
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
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error general */}
        {submitError && <Alert type="error" message={submitError} />}

        {/* Calle */}
        <div>
          <label
            htmlFor="calle"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Calle *
          </label>
          <input
            type="text"
            id="calle"
            value={formData.calle}
            onChange={(e) => handleInputChange("calle", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.calle ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Ej: Av. San Martín"
            disabled={isLoading}
          />
          {errors.calle && (
            <p className="mt-1 text-sm text-red-600">{errors.calle}</p>
          )}
        </div>

        {/* Número */}
        <div>
          <label
            htmlFor="numero"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Número *
          </label>
          <input
            type="number"
            id="numero"
            value={formData.numero || ""}
            onChange={(e) =>
              handleInputChange("numero", parseInt(e.target.value) || 0)
            }
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.numero ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Ej: 1234"
            min="1"
            max="99999"
            disabled={isLoading}
          />
          {errors.numero && (
            <p className="mt-1 text-sm text-red-600">{errors.numero}</p>
          )}
        </div>

        {/* Código Postal */}
        <div>
          <label
            htmlFor="cp"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Código Postal *
          </label>
          <input
            type="number"
            id="cp"
            value={formData.cp || ""}
            onChange={(e) =>
              handleInputChange("cp", parseInt(e.target.value) || 0)
            }
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.cp ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Ej: 5500"
            min="1000"
            max="9999"
            disabled={isLoading}
          />
          {errors.cp && (
            <p className="mt-1 text-sm text-red-600">{errors.cp}</p>
          )}
        </div>

        {/* Localidad */}
        <div>
          <label
            htmlFor="localidad"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Localidad *
          </label>
          <input
            type="text"
            id="localidad"
            value={formData.localidad}
            onChange={(e) => handleInputChange("localidad", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.localidad ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Ej: Godoy Cruz"
            disabled={isLoading}
          />
          {errors.localidad && (
            <p className="mt-1 text-sm text-red-600">{errors.localidad}</p>
          )}
        </div>

        {/* Es Principal */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="esPrincipal"
            checked={formData.esPrincipal}
            onChange={(e) => handleInputChange("esPrincipal", e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isLoading}
          />
          <label
            htmlFor="esPrincipal"
            className="ml-2 block text-sm text-gray-700"
          >
            Marcar como domicilio principal
          </label>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 p-3 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                {formData.esPrincipal
                  ? "Este domicilio será tu dirección principal para entregas."
                  : "Si marcas este domicilio como principal, se quitará esa condición a otros domicilios."}
              </p>
            </div>
          </div>
        </div>

        {/* Vista previa */}
        {(formData.calle || formData.numero || formData.localidad) && (
          <div className="bg-gray-50 p-3 rounded-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vista previa:
            </label>
            <p className="text-sm text-gray-600">
              {formData.calle} {formData.numero || "[Número]"},{" "}
              {formData.localidad}
              {formData.cp ? ` (CP: ${formData.cp})` : " (CP: [Código Postal])"}
            </p>
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
            {isLoading
              ? "⏳ Guardando..."
              : isEdit
              ? "💾 Actualizar Domicilio"
              : "➕ Crear Domicilio"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
