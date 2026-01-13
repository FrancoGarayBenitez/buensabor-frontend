import React, { useEffect, useMemo, useRef } from "react"; // Añadir useRef
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "../common/Button";
import { FormField } from "../common/FormFieldProps";
import { Select } from "../common/Select";
import { CategoriaSelector } from "../common/CategoriaSelector";
import { ImageUpload } from "../common/ImageUpload";
import { IngredientesSelector } from "./IngredientesSelector";
import { Alert } from "../common/Alert";

import { useInsumos } from "../../hooks/useInsumos";
import ImageService from "../../services/ImageService"; // Importar servicio de imágenes
import { extractFilenameFromUrl } from "../../config/imageConfig"; // Importar utilidad
import type { ArticuloManufacturadoRequestDTO } from "../../types/productos/ArticuloManufacturadoRequestDTO";
import type { ArticuloManufacturadoResponseDTO } from "../../types/productos/ArticuloManufacturadoResponseDTO";
import type { CategoriaResponseDTO } from "../../types/categorias/CategoriaResponseDTO";
import type { DetalleManufacturadoRequestDTO } from "../../types/productos/DetalleManufacturadoRequestDTO";
import type { UnidadMedidaDTO } from "../../services";

// ==================== ESQUEMA DE VALIDACIÓN ====================

const schema = z.object({
  denominacion: z.string().min(1, "La denominación es requerida"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  idCategoria: z.number().min(1, "La categoría es requerida"),
  idUnidadMedida: z.number().min(1, "La unidad de medida es requerida"),
  tiempoEstimadoEnMinutos: z.number().min(1, "El tiempo debe ser mayor a 0"),
  preparacion: z.string().min(1, "La preparación es requerida"),
  margenGananciaPorcentaje: z
    .number()
    .min(0, "El margen no puede ser negativo"),
  precioVenta: z.number().optional(),
  detalles: z
    .array(
      z.object({
        idArticuloInsumo: z.number(),
        cantidad: z.number(),
      })
    )
    .min(1, "La receta debe tener al menos un ingrediente"),
  imagenes: z.array(z.any()).optional(),
});

// ==================== PROPS DEL COMPONENTE ====================

interface ProductoFormProps {
  producto?: ArticuloManufacturadoResponseDTO;
  categorias: CategoriaResponseDTO[];
  unidadesMedida: UnidadMedidaDTO[];
  onSubmit: (data: ArticuloManufacturadoRequestDTO) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  serverErrorMessage?: string;
}

// ==================== COMPONENTE PRINCIPAL ====================

export const ProductoForm: React.FC<ProductoFormProps> = ({
  producto,
  categorias,
  unidadesMedida,
  onSubmit,
  onCancel,
  loading = false,
  serverErrorMessage,
}) => {
  const isCreating = !producto;
  const { insumos, loading: loadingInsumos } = useInsumos();

  // ✅ Referencia para rastrear imágenes subidas en esta sesión.
  const newlyUploadedUrls = useRef<string[]>([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    // ✅ CORRECCIÓN: Desestructurar 'dirtyFields' desde formState
    formState: { errors, dirtyFields },
    setError, // ✅ para marcar el campo con error de servidor
  } = useForm<ArticuloManufacturadoRequestDTO>({
    resolver: zodResolver(schema),
    defaultValues: {
      denominacion: "",
      descripcion: "",
      idCategoria: 0,
      idUnidadMedida: 0,
      tiempoEstimadoEnMinutos: 0,
      preparacion: "",
      margenGananciaPorcentaje: 30, // Default 30%
      precioVenta: 0,
      detalles: [],
      imagenes: [],
    },
  });

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (producto) {
      setValue("denominacion", producto.denominacion);
      setValue("descripcion", producto.descripcion);
      setValue("idCategoria", producto.idCategoria);
      setValue("idUnidadMedida", producto.idUnidadMedida);
      setValue("tiempoEstimadoEnMinutos", producto.tiempoEstimadoEnMinutos);
      setValue("preparacion", producto.preparacion);
      setValue("margenGananciaPorcentaje", producto.margenGananciaPorcentaje);
      setValue("precioVenta", producto.precioVenta);
      setValue(
        "detalles",
        producto.detalles.map((d) => ({
          idArticuloInsumo: d.idArticuloInsumo,
          cantidad: d.cantidad,
        }))
      );
      setValue("imagenes", producto.imagenes);
    }
  }, [producto, setValue]);

  // ✅ marcar el campo 'denominacion' y mostrar alerta si hay error del backend
  useEffect(() => {
    if (serverErrorMessage && serverErrorMessage.trim().length > 0) {
      setError("denominacion", { type: "server", message: serverErrorMessage });
    }
  }, [serverErrorMessage, setError]);

  // ==================== CÁLCULOS DE COSTO Y PRECIO ====================

  const detalles = watch("detalles");
  const margen = watch("margenGananciaPorcentaje");

  const costoProduccion = useMemo(() => {
    // ✅ CORRECCIÓN: Tipos explícitos para los parámetros de reduce
    return detalles.reduce(
      (total: number, detalle: DetalleManufacturadoRequestDTO) => {
        const insumo = insumos.find(
          (i) => i.idArticulo === detalle.idArticuloInsumo
        );
        return total + (insumo ? insumo.precioCompra * detalle.cantidad : 0);
      },
      0
    );
  }, [detalles, insumos]);

  const precioSugerido = useMemo(() => {
    return costoProduccion * (1 + margen / 100);
  }, [costoProduccion, margen]);

  const ganancia = useMemo(() => {
    const precioVentaActual = watch("precioVenta") || precioSugerido;
    return precioVentaActual - costoProduccion;
    // ✅ CORRECCIÓN: 'watch' no es una dependencia, sus valores sí.
  }, [watch("precioVenta"), precioSugerido, costoProduccion]);

  // ==================== MANEJADORES ====================

  const handleFormSubmit = (data: ArticuloManufacturadoRequestDTO) => {
    // Si el formulario se envía, las imágenes se van a usar. Limpiamos el tracker.
    newlyUploadedUrls.current = [];

    const filteredDetalles =
      data.detalles?.filter(
        (detalle) => detalle.idArticuloInsumo && detalle.cantidad > 0
      ) || [];

    const payload = {
      ...data,
      detalles: filteredDetalles, // ✅ CORRECCIÓN: El backend espera 'detalles', no 'detallesManufacturados'
    };

    // ✅ CORRECCIÓN: Usar 'dirtyFields.precioVenta' para verificar si el campo fue modificado
    if (!dirtyFields.precioVenta) {
      payload.precioVenta = parseFloat(precioSugerido.toFixed(2));
    }

    // ✅ LOGGING: Añadido para depurar el payload final que se envía
    console.log("📦 Payload final enviado al backend:", payload);

    onSubmit(payload);
  };

  /**
   * Limpia los archivos físicos que se subieron pero no se utilizaron
   * porque el usuario canceló la operación.
   */
  const cleanupUnusedImages = () => {
    if (newlyUploadedUrls.current.length > 0) {
      newlyUploadedUrls.current.forEach(async (url) => {
        const filename = extractFilenameFromUrl(url);
        if (filename) {
          try {
            await ImageService.deletePhysicalFile(filename);
          } catch (error) {
            console.error(
              `Error al limpiar el archivo huérfano ${filename}:`,
              error
            );
          }
        }
      });
      newlyUploadedUrls.current = [];
    }
  };

  const handleCancelClick = () => {
    cleanupUnusedImages();
    onCancel();
  };

  /**
   * Callback que se ejecuta cuando ImageUpload sube un nuevo archivo.
   * Registra la URL para una posible limpieza posterior.
   */
  const handleNewImageUploaded = (url: string) => {
    newlyUploadedUrls.current.push(url);
  };

  // ==================== RENDER ====================

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* ✅ Notificación clara del backend */}
      {serverErrorMessage && (
        <Alert type="error" message={serverErrorMessage} />
      )}

      {/* SECCIÓN 1: INFORMACIÓN GENERAL */}
      <div className="p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">
          1. Información General
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Controller
            name="denominacion"
            control={control}
            render={({ field }) => (
              <FormField
                {...field}
                label="Denominación"
                required
                error={errors.denominacion?.message}
              />
            )}
          />
          <Controller
            name="idUnidadMedida"
            control={control}
            render={({ field }) => {
              // Unidades habilitadas para productos manufacturados
              const allowed = new Set([
                "unidad",
                "docena",
                "media docena",
                "docena y media",
                "porción",
                "entero",
                "combo",
              ]);
              const opciones = unidadesMedida
                .filter((u) => allowed.has(u.denominacion.toLowerCase()))
                .map((u) => ({
                  value: u.idUnidadMedida,
                  label: u.denominacion,
                }));

              return (
                <Select
                  {...field}
                  label="Unidad de Medida"
                  options={opciones}
                  required
                  error={errors.idUnidadMedida?.message}
                />
              );
            }}
          />
          <div className="md:col-span-2">
            <Controller
              name="descripcion"
              control={control}
              render={({ field }) => (
                <FormField
                  {...field}
                  label="Descripción"
                  type="textarea"
                  required
                  error={errors.descripcion?.message}
                />
              )}
            />
          </div>
          <Controller
            name="idCategoria"
            control={control}
            render={({ field }) => (
              <CategoriaSelector
                {...field}
                categorias={categorias}
                required
                error={errors.idCategoria?.message}
              />
            )}
          />
        </div>
      </div>

      {/* SECCIÓN 2: RECETA */}
      <div className="p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">
          2. Receta y Preparación
        </h2>
        {loadingInsumos ? (
          <p>Cargando ingredientes...</p>
        ) : (
          <Controller
            name="detalles"
            control={control}
            render={({ field }) => (
              <IngredientesSelector
                ingredientes={insumos}
                detalles={field.value}
                onDetallesChange={field.onChange}
              />
            )}
          />
        )}
        {errors.detalles && (
          <p className="text-sm text-red-600 mt-2">{errors.detalles.message}</p>
        )}

        <div className="mt-6">
          <Controller
            name="preparacion"
            control={control}
            render={({ field }) => (
              <FormField
                {...field}
                label="Instrucciones de Preparación"
                type="textarea"
                rows={5}
                required
                error={errors.preparacion?.message}
              />
            )}
          />
        </div>
      </div>

      {/* SECCIÓN 3: COSTOS Y PRECIOS */}
      <div className="p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">
          3. Costos y Precios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          {/* Costo de Producción */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Costo de Producción
            </label>
            <div className="mt-1 p-3 bg-gray-100 rounded-md text-lg font-bold text-gray-800">
              {costoProduccion.toFixed(2)} $
            </div>
          </div>

          {/* Margen de Ganancia */}
          <Controller
            name="margenGananciaPorcentaje"
            control={control}
            render={({ field }) => (
              <FormField
                {...field}
                onChange={(v) => field.onChange(Number(v))}
                label="Margen de Ganancia (%)"
                type="number"
                min={0}
                required
                error={errors.margenGananciaPorcentaje?.message}
              />
            )}
          />

          {/* Precio de Venta Sugerido */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Precio Sugerido
            </label>
            <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-md text-lg font-bold text-green-700">
              {precioSugerido.toFixed(2)} $
            </div>
          </div>

          {/* Ganancia Estimada */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ganancia Estimada
            </label>
            <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-md text-lg font-bold text-blue-700">
              {ganancia.toFixed(2)} $
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Controller
            name="precioVenta"
            control={control}
            render={({ field }) => (
              <FormField
                {...field}
                onChange={(v) => field.onChange(Number(v))}
                label="Precio de Venta Final (opcional)"
                type="number"
                min={0}
                step={0.01}
                helperText="Si se deja en 0, se usará el precio sugerido."
                error={errors.precioVenta?.message}
              />
            )}
          />
        </div>
      </div>

      {/* SECCIÓN 4: TIEMPO DE PREPARACIÓN */}
      <div className="p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">
          4. Tiempo de Preparación
        </h2>
        <Controller
          name="tiempoEstimadoEnMinutos"
          control={control}
          render={({ field }) => (
            <FormField
              {...field}
              onChange={(v) => field.onChange(Number(v))}
              label="⏱️ Tiempo Estimado (minutos)"
              type="number"
              min={1}
              required
              error={errors.tiempoEstimadoEnMinutos?.message}
              helperText="Tiempo aproximado para preparar este producto"
            />
          )}
        />
      </div>

      {/* SECCIÓN 5: FOTOS DEL PRODUCTO */}
      <div className="p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">
          5. Fotos del Producto
        </h2>
        <Controller
          name="imagenes"
          control={control}
          render={({ field }) => (
            <ImageUpload
              entityType="MANUFACTURADO"
              currentImages={field.value || []}
              onImagesChange={field.onChange}
              // ✅ Pasar los nuevos manejadores para la limpieza
              onNewImageUploaded={handleNewImageUploaded}
              multiple
            />
          )}
        />
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          // ✅ Usar el nuevo manejador de cancelación
          onClick={handleCancelClick}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={loading} disabled={loading}>
          {isCreating ? "Crear Producto" : "Actualizar Producto"}
        </Button>
      </div>
    </form>
  );
};

export default ProductoForm;
