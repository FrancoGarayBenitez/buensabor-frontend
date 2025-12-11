import React, { useState, useEffect } from "react";
import type { ArticuloManufacturadoRequestDTO } from "../../types/productos/ArticuloManufacturadoRequestDTO";
import type { ArticuloManufacturadoResponseDTO } from "../../types/productos/ArticuloManufacturadoResponseDTO";
import type { ArticuloInsumoResponseDTO } from "../../types/insumos/ArticuloInsumoResponseDTO";
import type { CategoriaResponseDTO } from "../../types/categorias/CategoriaResponseDTO";
import type { ImagenDTO } from "../../types/common/ImagenDTO";
import { FormField } from "../common/FormFieldProps";
import { Select } from "../common/Select";
import { Button } from "../common/Button";
import { ImageUpload } from "../common/ImageUpload";
import { Alert } from "../common/Alert";
import { IngredientesSelector } from "./IngredientesSelector";
import type { UnidadMedidaDTO } from "../../services";
import { CategoriaSelector } from "../common/CategoriaSelector";
import { IMAGE_CONFIG } from "../../config/imageConfig";

interface ProductoFormProps {
  producto?: ArticuloManufacturadoResponseDTO;
  categorias: CategoriaResponseDTO[];
  unidadesMedida: UnidadMedidaDTO[];
  ingredientes: ArticuloInsumoResponseDTO[];
  onSubmit: (
    data: ArticuloManufacturadoRequestDTO
  ) => Promise<ArticuloManufacturadoResponseDTO | void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ProductoForm: React.FC<ProductoFormProps> = ({
  producto,
  categorias,
  unidadesMedida,
  ingredientes,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<ArticuloManufacturadoRequestDTO>({
    denominacion: "",
    idUnidadMedida: 0,
    idCategoria: 0,
    descripcion: "",
    tiempoEstimadoEnMinutos: 0,
    preparacion: "",
    precioVenta: 0,
    margenGanancia: 2.5,
    detalles: [],
    imagenes: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usarMargenAutomatico, setUsarMargenAutomatico] = useState(true);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning" | "info";
    message: string;
  } | null>(null);

  // Cargar datos si es edición
  useEffect(() => {
    if (producto) {
      setFormData({
        denominacion: producto.denominacion,
        idUnidadMedida: producto.idUnidadMedida,
        idCategoria: producto.idCategoria,
        descripcion: producto.descripcion || "",
        tiempoEstimadoEnMinutos: producto.tiempoEstimadoEnMinutos,
        preparacion: producto.preparacion || "",
        precioVenta: producto.precioVenta,
        margenGanancia: producto.margenGanancia || 2.5,
        detalles: producto.detalles || [],
        imagenes: producto.imagenes || [],
      });
      setUsarMargenAutomatico(false);
    }
  }, [producto]);

  // Calcular precio automático cuando cambian ingredientes o margen
  useEffect(() => {
    if (usarMargenAutomatico && formData.detalles.length > 0) {
      const costoTotal = formData.detalles.reduce((total, detalle) => {
        const insumo = ingredientes.find(
          (ing) => ing.idArticulo === detalle.idArticuloInsumo
        );
        return total + (insumo ? detalle.cantidad * insumo.precioCompra : 0);
      }, 0);
      const precioCalculado = costoTotal * formData.margenGanancia;
      setFormData((prev) => ({ ...prev, precioVenta: precioCalculado }));
    }
  }, [
    formData.detalles,
    formData.margenGanancia,
    usarMargenAutomatico,
    ingredientes,
  ]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.denominacion.trim()) {
      newErrors.denominacion = "La denominación es obligatoria";
    }

    if (!formData.idUnidadMedida) {
      newErrors.idUnidadMedida = "Debe seleccionar una unidad de medida";
    }

    if (!formData.idCategoria) {
      newErrors.idCategoria = "Debe seleccionar una categoría";
    }

    if (formData.tiempoEstimadoEnMinutos <= 0) {
      newErrors.tiempoEstimadoEnMinutos =
        "El tiempo estimado debe ser mayor a 0";
    }

    if (formData.precioVenta <= 0) {
      newErrors.precioVenta = "El precio de venta debe ser mayor a 0";
    }

    if (formData.detalles.length === 0) {
      newErrors.detalles = "Debe agregar al menos un ingrediente";
    }

    if (usarMargenAutomatico && formData.margenGanancia <= 1) {
      newErrors.margenGanancia = "El margen debe ser mayor a 1 (100%)";
    }

    if (!formData.preparacion.trim()) {
      newErrors.preparacion =
        "Las instrucciones de preparación son obligatorias";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Preparar datos sin imágenes para el backend
      // Las imágenes se suben por separado a través de ProductoService.uploadImagenes
      const dataWithoutImages = { ...formData };
      delete (dataWithoutImages as any).imagenes;

      // Crear/actualizar producto
      await onSubmit(dataWithoutImages as ArticuloManufacturadoRequestDTO);

      setAlert({
        type: "success",
        message: `Producto ${
          producto ? "actualizado" : "creado"
        } correctamente`,
      });

      // Limpiar si es creación
      if (!producto) {
        setTimeout(() => {
          setFormData({
            denominacion: "",
            idUnidadMedida: 0,
            idCategoria: 0,
            descripcion: "",
            tiempoEstimadoEnMinutos: 0,
            preparacion: "",
            precioVenta: 0,
            margenGanancia: 2.5,
            detalles: [],
            imagenes: [],
          });
        }, 1000);
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Error al guardar producto";
      setAlert({
        type: "error",
        message: errorMsg,
      });
      console.error("❌ Error al guardar producto:", error);
    }
  };

  const updateField = (
    field: keyof ArticuloManufacturadoRequestDTO,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (imagenes: ImagenDTO[]) => {
    updateField("imagenes", imagenes);
    if (errors.imagenes) {
      setErrors((prev) => ({ ...prev, imagenes: "" }));
    }
  };

  // Calcular costo total de ingredientes
  const costoTotal = formData.detalles.reduce((total, detalle) => {
    const insumo = ingredientes.find(
      (ing) => ing.idArticulo === detalle.idArticuloInsumo
    );
    return total + (insumo ? detalle.cantidad * insumo.precioCompra : 0);
  }, 0);

  // Filtrar solo categorías para comidas (no ingredientes)
  const categoriasParaComidas = categorias.filter(
    (cat) => !cat.esParaIngredientes && !cat.eliminado
  );

  return (
    <>
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información básica */}
        <div className="border-b pb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Información Básica
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Nombre del Producto"
              name="denominacion"
              value={formData.denominacion}
              onChange={(value) => updateField("denominacion", value)}
              placeholder="Ej: Pizza Margherita"
              required
              error={errors.denominacion}
            />

            <CategoriaSelector
              categorias={categoriasParaComidas}
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
              helperText="¿Cómo se vende? (Ej: Unidades, Porciones)"
            />

            <FormField
              label="Tiempo de Preparación"
              name="tiempoEstimadoEnMinutos"
              type="number"
              value={formData.tiempoEstimadoEnMinutos}
              onChange={(value) =>
                updateField("tiempoEstimadoEnMinutos", Number(value))
              }
              placeholder="30"
              min={1}
              required
              error={errors.tiempoEstimadoEnMinutos}
              helperText="En minutos"
            />
          </div>

          <div className="mt-4">
            <FormField
              label="Descripción"
              name="descripcion"
              type="textarea"
              value={formData.descripcion || ""}
              onChange={(value) => updateField("descripcion", value)}
              placeholder="Descripción del producto para los clientes..."
              rows={3}
            />
          </div>
        </div>

        {/* IMAGEN DEL PRODUCTO */}
        <div className="border-b pb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Imágenes del Producto
          </h2>

          <div className="max-w-md">
            <ImageUpload
              entityType={IMAGE_CONFIG.ENTITY_TYPES.MANUFACTURADO}
              entityId={producto?.idArticulo}
              currentImages={formData.imagenes || []}
              onImagesChange={handleImageChange}
              onError={(error) =>
                setAlert({
                  type: "error",
                  message: `Error en imágenes: ${error}`,
                })
              }
              label="Imágenes del Producto"
              disabled={loading}
              multiple={true}
            />

            <p className="mt-4 text-sm text-gray-600 space-y-1">
              <span className="block">
                🖼️ Buenas imágenes ayudan a las ventas.
              </span>
              <span className="block">
                Se recomienda una foto clara del producto terminado.
              </span>
              {!producto && (
                <span className="block text-blue-600 font-medium">
                  💡 Las imágenes se subirán automáticamente al guardar el
                  producto.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Preparación */}
        <div className="border-b pb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Preparación
          </h2>

          <FormField
            label="Instrucciones de Preparación"
            name="preparacion"
            type="textarea"
            value={formData.preparacion || ""}
            onChange={(value) => updateField("preparacion", value)}
            placeholder="1. Preparar la masa...&#10;2. Agregar ingredientes...&#10;3. Cocinar por..."
            rows={6}
            required
            error={errors.preparacion}
            helperText="Instrucciones paso a paso para la cocina"
          />
        </div>

        {/* Ingredientes */}
        <div className="border-b pb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Receta e Ingredientes
          </h2>

          <IngredientesSelector
            ingredientes={ingredientes}
            detalles={formData.detalles}
            onDetallesChange={(detalles) => updateField("detalles", detalles)}
          />

          {errors.detalles && (
            <p className="mt-2 text-sm text-red-600">{errors.detalles}</p>
          )}
        </div>

        {/* Precios */}
        <div className="border-b pb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Precio de Venta
          </h2>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                Costo de Ingredientes:{" "}
                <span className="font-medium text-gray-900">
                  ${costoTotal.toFixed(2)}
                </span>
              </div>
              {costoTotal > 0 && formData.precioVenta > 0 && (
                <div>
                  Margen Real:{" "}
                  <span
                    className={`font-medium ${
                      formData.precioVenta / costoTotal >=
                      formData.margenGanancia
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {(formData.precioVenta / costoTotal).toFixed(2)}x
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tipoPrecio"
                  checked={usarMargenAutomatico}
                  onChange={() => setUsarMargenAutomatico(true)}
                  className="mr-2 cursor-pointer"
                  disabled={loading}
                />
                <span className="cursor-pointer">
                  Calcular precio automáticamente con margen
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tipoPrecio"
                  checked={!usarMargenAutomatico}
                  onChange={() => setUsarMargenAutomatico(false)}
                  className="mr-2 cursor-pointer"
                  disabled={loading}
                />
                <span className="cursor-pointer">
                  Establecer precio manualmente
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {usarMargenAutomatico && (
                <FormField
                  label="Margen de Ganancia"
                  name="margenGanancia"
                  type="number"
                  value={formData.margenGanancia}
                  onChange={(value) =>
                    updateField("margenGanancia", Number(value))
                  }
                  placeholder="2.5"
                  min={1.1}
                  step={0.1}
                  required
                  disabled={loading}
                  error={errors.margenGanancia}
                  helperText="Ej: 2.5 = 250% sobre el costo"
                />
              )}

              <FormField
                label="Precio de Venta"
                name="precioVenta"
                type="number"
                value={formData.precioVenta}
                onChange={(value) => updateField("precioVenta", Number(value))}
                placeholder="0.00"
                min={0.01}
                step={0.01}
                required
                disabled={usarMargenAutomatico || loading}
                error={errors.precioVenta}
                helperText={
                  usarMargenAutomatico
                    ? "Calculado automáticamente"
                    : "Precio final al cliente"
                }
              />
            </div>
          </div>
        </div>

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
            {producto ? "Actualizar" : "Crear"} Producto
          </Button>
        </div>
      </form>
    </>
  );
};

export default ProductoForm;
