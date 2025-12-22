import React, { useState, useEffect } from "react";
import type { ArticuloInsumoRequestDTO } from "../../types/insumos/ArticuloInsumoRequestDTO";
import type { ArticuloInsumoResponseDTO } from "../../types/insumos/ArticuloInsumoResponseDTO";
import type { CategoriaResponseDTO } from "../../types/categorias/CategoriaResponseDTO";
import type { ImagenDTO } from "../../types/common/ImagenDTO";
import { Button } from "../common/Button";
import { FormField } from "../common/FormFieldProps";
import { Select } from "../common/Select";
import { CategoriaSelector } from "../common/CategoriaSelector";
import { ImageUpload } from "../common/ImageUpload";
import { Alert } from "../common/Alert";
import type { UnidadMedidaDTO } from "../../services";

interface InsumoFormProps {
  insumo?: ArticuloInsumoResponseDTO;
  categorias: CategoriaResponseDTO[];
  unidadesMedida: UnidadMedidaDTO[];
  onSubmit: (data: ArticuloInsumoRequestDTO) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const InsumoForm: React.FC<InsumoFormProps> = ({
  insumo,
  categorias,
  unidadesMedida,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const isCreating = !insumo;

  // ==================== ESTADO ====================

  type FormState = Omit<
    ArticuloInsumoRequestDTO,
    "precioVenta" | "precioCompra" | "stockActual" | "stockMaximo"
  > & {
    precioVenta: string;
    precioCompra: string;
    stockActual: string;
    stockMaximo: string;
  };

  const [formData, setFormData] = useState<FormState>({
    denominacion: "",
    precioVenta: "",
    idUnidadMedida: 0,
    idCategoria: 0,
    precioCompra: "",
    stockActual: "",
    stockMaximo: "",
    esParaElaborar: true,
    imagenes: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (insumo) {
      setFormData({
        denominacion: insumo.denominacion,
        precioVenta:
          insumo.precioVenta != null ? String(insumo.precioVenta) : "",
        idUnidadMedida: insumo.idUnidadMedida,
        idCategoria: insumo.idCategoria,
        precioCompra:
          insumo.precioCompra != null ? String(insumo.precioCompra) : "",
        stockActual:
          insumo.stockActual != null ? String(insumo.stockActual) : "",
        stockMaximo:
          insumo.stockMaximo != null ? String(insumo.stockMaximo) : "",
        esParaElaborar: insumo.esParaElaborar,
        imagenes: insumo.imagenes || [],
      });
    }
  }, [insumo]);

  // ==================== VALIDACIÓN ====================

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!String(formData.denominacion).trim()) {
      newErrors.denominacion = "Requerido";
    }

    if (!formData.idUnidadMedida) {
      newErrors.idUnidadMedida = "Requerido";
    }

    if (!formData.idCategoria) {
      newErrors.idCategoria = "Requerido";
    }

    const stockMaximoNum = Number(formData.stockMaximo);
    if (isNaN(stockMaximoNum) || stockMaximoNum <= 0) {
      newErrors.stockMaximo = "Debe ser > 0";
    }

    if (!isCreating && !formData.esParaElaborar) {
      const precioVentaNum = Number(formData.precioVenta);
      if (isNaN(precioVentaNum) || precioVentaNum <= 0) {
        newErrors.precioVenta = "Requerido para venta directa";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==================== MANEJADORES ====================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload: ArticuloInsumoRequestDTO = {
        denominacion: String(formData.denominacion),
        precioVenta: Number(formData.precioVenta) || 0,
        idUnidadMedida: Number(formData.idUnidadMedida),
        idCategoria: Number(formData.idCategoria),
        precioCompra: Number(formData.precioCompra) || 0,
        stockActual: Number(formData.stockActual) || 0,
        stockMaximo: Number(formData.stockMaximo) || 0,
        esParaElaborar: Boolean(formData.esParaElaborar),
        imagenes: formData.imagenes || [],
      };

      const dataToSubmit = { ...payload };
      delete (dataToSubmit as any).imagenes;

      await onSubmit(dataToSubmit as ArticuloInsumoRequestDTO);

      setAlert({
        type: "success",
        message: `Ingrediente ${
          isCreating ? "creado" : "actualizado"
        } correctamente`,
      });

      if (isCreating) {
        setTimeout(() => {
          setFormData({
            denominacion: "",
            precioVenta: "",
            idUnidadMedida: 0,
            idCategoria: 0,
            precioCompra: "",
            stockActual: "",
            stockMaximo: "",
            esParaElaborar: true,
            imagenes: [],
          });
        }, 1000);
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Error al guardar";
      setAlert({ type: "error", message: errorMsg });
    }
  };

  const updateField = (field: keyof FormState | string, value: any) => {
    setFormData((prev) => ({ ...(prev as any), [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImagesChange = (imagenes: ImagenDTO[]) => {
    updateField("imagenes", imagenes);
  };

  const handleEsParaElaborarChange = (esParaElaborar: boolean) => {
    updateField("esParaElaborar", esParaElaborar);

    // Si pasa a venta directa y precioVenta está en 0, ponerlo en 1
    if (
      !isCreating &&
      !esParaElaborar &&
      (!formData.precioVenta || Number(formData.precioVenta) <= 0)
    ) {
      updateField("precioVenta", "1");
    }
  };

  // ==================== RENDER ====================

  return (
    <>
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {isCreating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-sm">
          <p className="text-blue-700">
            <strong>ℹ️ Nota:</strong> Las imágenes se pueden agregar después de
            crear el ingrediente.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Denominación"
            name="denominacion"
            value={formData.denominacion}
            onChange={(value) => updateField("denominacion", value)}
            placeholder="Ej: Harina 000"
            required
            error={errors.denominacion}
            disabled={loading}
          />

          <CategoriaSelector
            categorias={categorias}
            value={formData.idCategoria}
            onChange={(value) => updateField("idCategoria", value)}
            label="Categoría"
            required
            error={errors.idCategoria}
            disabled={loading}
          />

          <Select
            label="Unidad de Medida"
            name="idUnidadMedida"
            value={formData.idUnidadMedida}
            onChange={(value) => updateField("idUnidadMedida", value)}
            // ✅ Solo unidades válidas para Insumos
            options={(() => {
              const allowedInsumo = new Set(["g", "ml", "unidad"]);
              return unidadesMedida
                .filter((um) =>
                  allowedInsumo.has(um.denominacion.toLowerCase())
                )
                .map((um) => ({
                  value: um.idUnidadMedida,
                  label: um.denominacion,
                }));
            })()}
            placeholder="Seleccione"
            required
            error={errors.idUnidadMedida}
            disabled={loading}
          />

          {/* Uso del Ingrediente */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Uso <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="esParaElaborar"
                  checked={formData.esParaElaborar}
                  onChange={() => handleEsParaElaborarChange(true)}
                  disabled={loading}
                  className="mr-2"
                />
                <span>Para Elaborar (recetas)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="esParaElaborar"
                  checked={!formData.esParaElaborar}
                  onChange={() => handleEsParaElaborarChange(false)}
                  disabled={loading}
                  className="mr-2"
                />
                <span>Venta Directa</span>
              </label>
            </div>
          </div>
        </div>

        {/* Precio de Venta - Solo para venta directa */}
        {!isCreating && !formData.esParaElaborar && (
          <div className="border-t pt-6">
            <FormField
              label="Precio de Venta"
              name="precioVenta"
              type="number"
              value={formData.precioVenta}
              onChange={(value) => updateField("precioVenta", value)}
              min={0.01}
              step={0.01}
              required
              disabled={loading}
              error={errors.precioVenta}
            />
          </div>
        )}

        {/* Stock Máximo */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Configuración de Stock
          </h3>
          <FormField
            label="Stock Máximo"
            name="stockMaximo"
            type="number"
            value={formData.stockMaximo}
            onChange={(value) => updateField("stockMaximo", value)}
            placeholder="100"
            min={1}
            required
            disabled={loading}
            error={errors.stockMaximo}
            helperText="Cantidad máxima a mantener en inventario"
          />
        </div>

        {/* Imágenes */}
        {!isCreating && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Imágenes</h3>
            <p className="text-sm text-gray-600 mb-4">
              📸{" "}
              {formData.esParaElaborar
                ? "Fotos del envase para identificarlo"
                : "Fotos que se verán en el catálogo"}
            </p>
            <div className="max-w-md">
              <ImageUpload
                entityType="INSUMO"
                entityId={insumo?.idArticulo}
                currentImages={formData.imagenes || []}
                onImagesChange={handleImagesChange}
                disabled={loading}
                multiple={true}
              />
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={loading} disabled={loading}>
            {insumo ? "Actualizar" : "Crear"} Ingrediente
          </Button>
        </div>
      </form>
    </>
  );
};

export default InsumoForm;
