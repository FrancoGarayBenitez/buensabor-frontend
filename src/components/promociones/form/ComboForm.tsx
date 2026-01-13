import React, { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PromocionFormBase } from "./PromocionFormBase";
import { PromocionDetalleEditor } from "../PromocionDetalleEditor";
import {
  type PromocionRequest,
  type PromocionResponse,
  type ArticuloShort,
  TIPO_DESCUENTO,
  TIPO_PROMOCION,
} from "../../../types/promociones/promocion.types";
import { Button } from "../../common/Button";
import { FormField } from "../../common/FormFieldProps";
import { Select } from "../../common/Select";
import ImageService from "../../../services/ImageService";
import { extractFilenameFromUrl } from "../../../config/imageConfig";
import { Alert } from "../../common/Alert";

// Esquema de Zod específico para Combos
const comboSchema = z
  .object({
    denominacion: z
      .string()
      .min(3, "La denominación es requerida (mín. 3 caracteres)"),
    descripcionDescuento: z.string().optional(),
    fechaDesde: z
      .string()
      .refine(
        (val) => val && !isNaN(Date.parse(val)),
        "Fecha de inicio inválida"
      ),
    fechaHasta: z
      .string()
      .refine((val) => val && !isNaN(Date.parse(val)), "Fecha de fin inválida"),
    horaDesde: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora de inicio inválida (HH:MM)"),
    horaHasta: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora de fin inválida (HH:MM)"),
    tipoDescuento: z.nativeEnum(TIPO_DESCUENTO),
    tipoPromocion: z.literal(TIPO_PROMOCION.COMBO),
    valorDescuento: z.number().min(0, "El valor debe ser positivo"),
    activo: z.boolean(),
    cantidadMinima: z.number(),
    detalles: z
      .array(
        z.object({
          idArticulo: z.number(),
          cantidad: z.number().int().min(1, "La cantidad debe ser al menos 1"),
        })
      )
      .min(1, "Debe seleccionar al menos un artículo para el combo"),
    imagenes: z.array(
      z.object({
        id: z.number().optional(),
        url: z.string(),
        denominacion: z.string(),
      })
    ),
  })
  .refine(
    (data) =>
      new Date(`${data.fechaHasta}T${data.horaHasta}`) >
      new Date(`${data.fechaDesde}T${data.horaDesde}`),
    {
      message: "La fecha y hora de fin debe ser posterior a la de inicio.",
      path: ["fechaHasta"],
    }
  );

// usar el tipo inferido por Zod
type ComboFormValues = z.infer<typeof comboSchema>;

interface ComboFormProps {
  promocion?: PromocionResponse;
  articulosDisponibles: ArticuloShort[];
  onSubmit: (data: PromocionRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  serverErrorMessage?: string;
}

export const ComboForm: React.FC<ComboFormProps> = ({
  promocion,
  articulosDisponibles,
  onSubmit,
  onCancel,
  loading = false,
  serverErrorMessage,
}) => {
  const newlyUploadedUrls = useRef<string[]>([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ComboFormValues>({
    resolver: zodResolver(comboSchema),
    defaultValues: {
      denominacion: "",
      descripcionDescuento: "",
      fechaDesde: "",
      fechaHasta: "",
      horaDesde: "00:00",
      horaHasta: "23:59",
      tipoPromocion: TIPO_PROMOCION.COMBO,
      tipoDescuento: TIPO_DESCUENTO.PORCENTUAL,
      valorDescuento: 10,
      activo: true,
      cantidadMinima: 1,
      detalles: [],
      imagenes: [],
    },
  });

  // Efecto para popular el formulario al editar
  useEffect(() => {
    if (promocion) {
      reset({
        denominacion: promocion.denominacion,
        descripcionDescuento: promocion.descripcionDescuento ?? "",
        fechaDesde: promocion.fechaDesde,
        fechaHasta: promocion.fechaHasta,
        horaDesde: promocion.horaDesde,
        horaHasta: promocion.horaHasta,
        tipoPromocion: TIPO_PROMOCION.COMBO,
        tipoDescuento: promocion.tipoDescuento,
        valorDescuento: promocion.valorDescuento,
        activo: promocion.activo,
        cantidadMinima: promocion.cantidadMinima,
        detalles: promocion.detalles.map((d) => ({
          idArticulo: d.articulo.id,
          cantidad: d.cantidad,
        })),
        imagenes: promocion.imagenes.map((img) => ({
          id: img.idImagen,
          url: img.url,
          denominacion: img.denominacion,
        })),
      });
    }
  }, [promocion, reset]);

  // Efecto para calcular la cantidad mínima automáticamente
  const detalles = watch("detalles");
  useEffect(() => {
    const sumaCantidades = detalles.reduce(
      (acc, detalle) => acc + detalle.cantidad,
      0
    );
    setValue("cantidadMinima", sumaCantidades > 0 ? sumaCantidades : 1);
  }, [detalles, setValue]);

  const handleNewImageUploaded = (url: string) => {
    newlyUploadedUrls.current.push(url);
  };

  const cleanupUnusedImages = async () => {
    for (const url of newlyUploadedUrls.current) {
      try {
        // CORREGIDO: Comprobar que el filename no sea null antes de llamar al servicio
        const filename = extractFilenameFromUrl(url);
        if (filename) {
          await ImageService.deletePhysicalFile(filename);
        }
      } catch (error) {
        console.error(`Error al limpiar imagen no utilizada: ${url}`, error);
      }
    }
    newlyUploadedUrls.current = [];
  };

  const handleCancelClick = () => {
    cleanupUnusedImages();
    onCancel();
  };

  const handleFormSubmit = (data: PromocionRequest) => {
    newlyUploadedUrls.current = []; // Las imágenes se usarán, limpiar el tracker
    const finalData = { ...data, tipoPromocion: TIPO_PROMOCION.COMBO };
    onSubmit(finalData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {serverErrorMessage && (
        <Alert message={serverErrorMessage} type="error" />
      )}

      <PromocionFormBase
        control={control}
        errors={errors}
        onNewImageUploaded={handleNewImageUploaded}
      />

      <hr />
      <h3 className="text-lg font-medium" style={{ color: "#443639" }}>
        Detalles del Combo
      </h3>

      <Controller
        name="detalles"
        control={control}
        render={({ field }) => (
          <PromocionDetalleEditor
            articulosDisponibles={articulosDisponibles}
            detalles={field.value}
            onDetallesChange={field.onChange}
          />
        )}
      />
      {errors.detalles && (
        <p className="text-sm text-red-600">{errors.detalles.message}</p>
      )}

      <hr />
      <h3 className="text-lg font-medium" style={{ color: "#443639" }}>
        Descuento del Combo
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="tipoDescuento"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Tipo de Descuento"
              options={[
                { value: TIPO_DESCUENTO.PORCENTUAL, label: "Porcentual (%)" },
                { value: TIPO_DESCUENTO.MONTO_FIJO, label: "Monto Fijo ($)" },
              ]}
              error={errors.tipoDescuento?.message}
            />
          )}
        />
        <Controller
          name="valorDescuento"
          control={control}
          render={({ field }) => (
            <FormField
              {...field}
              onChange={(v) => field.onChange(Number(v))}
              label="Valor del Descuento"
              type="number"
              min={0}
              required
              error={errors.valorDescuento?.message}
            />
          )}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={handleCancelClick}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Combo"}
        </Button>
      </div>
    </form>
  );
};
