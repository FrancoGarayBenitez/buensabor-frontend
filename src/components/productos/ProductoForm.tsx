import React, { useState, useEffect } from "react";
import type { ArticuloManufacturadoRequestDTO } from "../../types/productos/ArticuloManufacturadoRequestDTO";
import type { ArticuloManufacturadoResponseDTO } from "../../types/productos/ArticuloManufacturadoResponseDTO";
import type { ArticuloInsumoResponseDTO } from "../../types/insumos/ArticuloInsumoResponseDTO";
import type { CategoriaResponseDTO } from "../../types/categorias/CategoriaResponseDTO";
import type { ImagenDTO } from "../../types/common/ImagenDTO";
import { FormField } from "../common/FormFieldProps";
import { Select } from "../common/Select";
import { Button } from "../common/Button";
import { ArticleImageUpload } from "../common/ArticleImageUpload"; // ✅ NUEVO IMPORT
import { IngredientesSelector } from "./IngredientesSelector";
import type { UnidadMedidaDTO } from "../../services";
import { CategoriaSelector } from "../common/CategoriaSelector";
import { ProductoService } from "../../services/ProductoService"; // ✅ NUEVO IMPORT

interface ProductoFormProps {
  producto?: ArticuloManufacturadoResponseDTO;
  categorias: CategoriaResponseDTO[];
  unidadesMedida: UnidadMedidaDTO[];
  ingredientes: ArticuloInsumoResponseDTO[];
  onSubmit: (data: ArticuloManufacturadoRequestDTO) => Promise<ArticuloManufacturadoResponseDTO | void>;
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
    imagen: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usarMargenAutomatico, setUsarMargenAutomatico] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null); // ✅ NUEVO ESTADO

  // Cargar datos si es edición
  useEffect(() => {
    if (producto) {
      setFormData({
        denominacion: producto.denominacion,
        idUnidadMedida: producto.idUnidadMedida,
        idCategoria: producto.categoria.idCategoria,
        descripcion: producto.descripcion || "",
        tiempoEstimadoEnMinutos: producto.tiempoEstimadoEnMinutos,
        preparacion: producto.preparacion || "",
        precioVenta: producto.precioVenta,
        margenGanancia: producto.margenGanancia || 2.5,
        detalles: producto.detalles || [],
        imagen: producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes[0] : undefined,
      });
      setUsarMargenAutomatico(false);
    }
  }, [producto]);

  // Calcular precio automático cuando cambian ingredientes o margen
  useEffect(() => {
    if (usarMargenAutomatico) {
      const costoTotal = formData.detalles.reduce(
        (total, detalle) => total + (detalle.subtotal || 0),
        0
      );
      const precioCalculado = costoTotal * formData.margenGanancia;
      setFormData((prev) => ({ ...prev, precioVenta: precioCalculado }));
    }
  }, [formData.detalles, formData.margenGanancia, usarMargenAutomatico]);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ NUEVA LÓGICA DE SUBMIT CON MANEJO DE IMÁGENES
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImageError(null);

    if (!validateForm()) return;

    try {
      // 1. Preparar datos sin imagen para el backend
      const dataWithoutImage = { ...formData };
      delete dataWithoutImage.imagen;

      // 2. Crear/actualizar producto
      const result = await onSubmit(dataWithoutImage);
      
      // 3. Manejar imagen por separado si es necesario
      if (!producto && formData.imagen && result && 'idArticulo' in result) {
        // Caso: Creación de producto con imagen
        // La imagen se manejará automáticamente por ArticleImageUpload en modo 'deferred'
        // o puedes manejarla manualmente aquí si prefieres
        console.log('Producto creado exitosamente con ID:', result.idArticulo);
      }

    } catch (error) {
      console.error("Error al guardar producto:", error);
      if (error instanceof Error) {
        setImageError(`Error al guardar: ${error.message}`);
      }
    }
  };

  const updateField = (
    field: keyof ArticuloManufacturadoRequestDTO,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ NUEVO MANEJADOR DE CAMBIO DE IMAGEN
  const handleImageChange = (imagen: ImagenDTO | null) => {
    updateField("imagen", imagen || undefined);
    setImageError(null); // Limpiar error al cambiar imagen
    if (errors.imagen) {
      setErrors(prev => ({ ...prev, imagen: '' }));
    }
  };

  // ✅ NUEVO CALLBACK PARA CUANDO SE SUBE IMAGEN
  const handleImageUploaded = (result: any) => {
    console.log('Imagen subida exitosamente:', result);
    // Puedes mostrar una notificación de éxito aquí
  };

  const costoTotal = formData.detalles.reduce(
    (total, detalle) => total + (detalle.subtotal || 0),
    0
  );

  return (
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
            helperText="¿Cómo se vende? (Ej: Unidades, Porciones)"
          />

          <FormField
            label="Tiempo de Preparación"
            name="tiempoEstimadoEnMinutos"
            type="number"
            value={formData.tiempoEstimadoEnMinutos}
            onChange={(value) => updateField("tiempoEstimadoEnMinutos", value)}
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

      {/* ✅ IMAGEN DEL PRODUCTO - COMPONENTE ACTUALIZADO */}
      <div className="border-b pb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Imagen del Producto
        </h2>
        
        <div className="max-w-md">
          <ArticleImageUpload
            idArticulo={producto?.idArticulo} // undefined para creación, number para edición
            currentImage={formData.imagen}
            onImageChange={handleImageChange}
            onImageUploaded={handleImageUploaded}
            placeholder="Selecciona una imagen atractiva del producto"
            maxSize={5}
            disabled={loading}
            mode={producto ? "immediate" : "deferred"} // Inmediato para edición, diferido para creación
          />
          
          {/* Mostrar errores de imagen */}
          {(errors.imagen || imageError) && (
            <p className="mt-2 text-sm text-red-600">
              {errors.imagen || imageError}
            </p>
          )}
          
          <p className="mt-2 text-sm text-gray-500">
            Una buena imagen ayuda a las ventas. Se recomienda una foto del producto terminado.
            {!producto && (
              <span className="block text-blue-600 mt-1">
                💡 La imagen se subirá automáticamente al guardar el producto.
              </span>
            )}
          </p>
        </div>
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

      {/* Preparación */}
      <div className="border-b pb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Preparación</h2>

        <FormField
          label="Instrucciones de Preparación"
          name="preparacion"
          type="textarea"
          value={formData.preparacion || ""}
          onChange={(value) => updateField("preparacion", value)}
          placeholder="1. Preparar la masa...&#10;2. Agregar ingredientes...&#10;3. Cocinar por..."
          rows={6}
          helperText="Instrucciones paso a paso para la cocina"
        />
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
              <span className="font-medium">${costoTotal.toFixed(2)}</span>
            </div>
            {costoTotal > 0 && formData.precioVenta > 0 && (
              <div>
                Margen Real:{" "}
                <span className="font-medium">
                  {(formData.precioVenta / costoTotal).toFixed(1)}x
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
                className="mr-2"
                disabled={loading}
              />
              Calcular precio automáticamente con margen
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="tipoPrecio"
                checked={!usarMargenAutomatico}
                onChange={() => setUsarMargenAutomatico(false)}
                className="mr-2"
                disabled={loading}
              />
              Establecer precio manualmente
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {usarMargenAutomatico && (
              <FormField
                label="Margen de Ganancia"
                name="margenGanancia"
                type="number"
                value={formData.margenGanancia}
                onChange={(value) => updateField("margenGanancia", value)}
                placeholder="2.5"
                min={1}
                step={0.1}
                required
                disabled={loading}
                error={errors.margenGanancia}
                helperText="2.5 = 250% sobre el costo"
              />
            )}

            <FormField
              label="Precio de Venta"
              name="precioVenta"
              type="number"
              value={formData.precioVenta}
              onChange={(value) => updateField("precioVenta", value)}
              placeholder="0.00"
              min={0}
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
      <div className="flex justify-end space-x-3 pt-4">
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
  );
};