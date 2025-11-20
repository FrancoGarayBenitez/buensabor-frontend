import React, { useState, useEffect } from "react";
import type { ArticuloInsumoRequestDTO } from "../../types/insumos/ArticuloInsumoRequestDTO";
import type { ArticuloInsumoResponseDTO } from "../../types/insumos/ArticuloInsumoResponseDTO";
import type { CategoriaResponseDTO } from "../../types/categorias/CategoriaResponseDTO";
import type { ImagenDTO } from "../../types/common/ImagenDTO";
import { Button } from "../common/Button";
import { FormField } from "../common/FormFieldProps";
import { Select } from "../common/Select";
import type { UnidadMedidaDTO } from "../../services";
import { CategoriaSelector } from "../common/CategoriaSelector";
import { ImageUpload } from "../common/ImageUpload";
import { IMAGE_CONFIG } from "../../config/imageConfig";
import { Alert } from "../common/Alert";

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
  // Determinar si es creación o edición
  const isCreating = !insumo;

  // Incluye TODOS los campos requeridos por el backend
  const [formData, setFormData] = useState<ArticuloInsumoRequestDTO>({
    denominacion: "",
    precioVenta: 0,
    idUnidadMedida: 0,
    idCategoria: 0,
    precioCompra: 1,
    stockActual: 0,
    stockMaximo: 0,
    esParaElaborar: true,
    imagen: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (insumo) {
      setFormData({
        denominacion: insumo.denominacion,
        precioVenta: insumo.precioVenta || 1,
        idUnidadMedida: insumo.idUnidadMedida,
        idCategoria: insumo.idCategoria,
        precioCompra: insumo.precioCompra || 0,
        stockActual: insumo.stockActual || 0,
        stockMaximo: insumo.stockMaximo,
        esParaElaborar: insumo.esParaElaborar,
        imagen:
          insumo.imagenes && insumo.imagenes.length > 0
            ? insumo.imagenes[0]
            : undefined,
      });
    }
  }, [insumo]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.denominacion.trim())
      newErrors.denominacion = "La denominación es obligatoria";
    if (!formData.idUnidadMedida)
      newErrors.idUnidadMedida = "Debe seleccionar una unidad de medida";
    if (!formData.idCategoria)
      newErrors.idCategoria = "Debe seleccionar una categoría";
    if (formData.stockMaximo <= 0)
      newErrors.stockMaximo = "El stock máximo debe ser mayor a 0";
    if (!isCreating && !formData.esParaElaborar && formData.precioVenta <= 0) {
      newErrors.precioVenta = "El precio de venta debe ser mayor a 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isCreating) {
      formData.precioVenta = 0;
      formData.stockActual = 0;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error al guardar insumo:", error);
    }
  };

  const updateField = (field: keyof ArticuloInsumoRequestDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (imagen: ImagenDTO | null) => {
    updateField("imagen", imagen || undefined);
    if (errors.imagen) setErrors((prev) => ({ ...prev, imagen: "" }));
  };

  const handleEsParaElaborarChange = (esParaElaborar: boolean) => {
    updateField("esParaElaborar", esParaElaborar);
    if (esParaElaborar && formData.imagen) {
      updateField("imagen", undefined);
    }
    // Si pasa a venta directa y es edición, podés resetear el precioVenta a 1 si está en 0
    if (
      !isCreating &&
      !esParaElaborar &&
      (!formData.precioVenta || formData.precioVenta <= 0)
    ) {
      updateField("precioVenta", 1);
    }
  };

  return (
    <>
      {/* Mostrar alerts */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {isCreating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-sm">
          <p style={{ color: "#0066cc" }}>
            <strong>ℹ️ Creación de nuevo ingrediente:</strong> El precio de
            venta y la imagen se podrán agregar después de registrar la primera
            compra.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Denominación"
            name="denominacion"
            value={formData.denominacion}
            onChange={(value) => updateField("denominacion", value)}
            placeholder="Ej: Harina 000"
            required
            error={errors.denominacion}
          />

          <CategoriaSelector
            categorias={categorias}
            value={formData.idCategoria}
            onChange={(value) => updateField("idCategoria", value)}
            label="Categoría"
            required
            error={errors.idCategoria}
          />

          <Select
            label="Unidad de Medida"
            name="idUnidadMedida"
            value={formData.idUnidadMedida}
            onChange={(value) => updateField("idUnidadMedida", value)}
            options={unidadesMedida.map((um) => ({
              value: um.idUnidadMedida,
              label: um.denominacion,
            }))}
            placeholder="Seleccione unidad"
            required
            error={errors.idUnidadMedida}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Uso del Ingrediente
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="esParaElaborar"
                  checked={formData.esParaElaborar}
                  onChange={() => handleEsParaElaborarChange(true)}
                  className="mr-2"
                  disabled={loading}
                />
                <span>Para Elaborar (se usa en recetas)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="esParaElaborar"
                  checked={!formData.esParaElaborar}
                  onChange={() => handleEsParaElaborarChange(false)}
                  className="mr-2"
                  disabled={loading}
                />
                <span>Para Venta Directa</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.esParaElaborar
                ? "Este ingrediente se usará en recetas"
                : "Este ingrediente se venderá directamente al cliente"}
            </p>
          </div>

          {/* SOLO mostrar "Precio de Venta" si es para venta directa */}
          {!isCreating && !formData.esParaElaborar && (
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
              placeholder="Ej: 200"
              error={errors.precioVenta}
            />
          )}
        </div>

        {/* Imagen */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Imagen del Ingrediente
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {formData.esParaElaborar
              ? "📸 Agrega una foto de la marca/envase para identificarlo fácilmente"
              : "📸 Foto del producto que se verá en el catálogo"}
          </p>
          <div className="max-w-md">
            <ImageUpload
              entityType={IMAGE_CONFIG.ENTITY_TYPES.INSUMO}
              entityId={insumo?.idArticulo}
              currentImage={formData.imagen}
              onImageChange={handleImageChange}
              onError={(error) => setAlert({ type: "error", message: error })}
              label="Imagen del Producto"
              disabled={loading}
            />
          </div>
        </div>

        {/* SOLO MOSTRÁ este campo de stock máximo */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Stock Máximo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            />
          </div>
        </div>

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
