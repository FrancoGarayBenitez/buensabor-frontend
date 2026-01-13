import React, { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PromocionFormBase } from "./PromocionFormBase";
import { ArticuloMultiSelector } from "./ArticuloMultiSelector";
import {
  type PromocionRequest,
  type PromocionResponse,
  type ArticuloShort,
  TIPO_DESCUENTO,
  TIPO_PROMOCION,
} from "../../../types/promociones/promocion.types";
import { Button } from "../../common/Button";
import { FormField } from "../../common/FormFieldProps";
import ImageService from "../../../services/ImageService";
import { extractFilenameFromUrl } from "../../../config/imageConfig";
import { Alert } from "../../common/Alert";

// Interfaz para el estado interno del formulario NxM
interface NxMFormData {
  denominacion: string;
  fechaDesde: string;
  fechaHasta: string;
  horaDesde: string;
  horaHasta: string;
  activo: boolean;
  imagenes: any[];
  lleva: number;
  paga: number;
  idArticulos: number[];
}

// Esquema de Zod específico para NxM
const nxmSchema = z
  .object({
    denominacion: z.string().min(3, "La denominación es requerida"),
    fechaDesde: z
      .string()
      .refine((val) => val && !isNaN(Date.parse(val)), "Fecha inválida"),
    fechaHasta: z
      .string()
      .refine((val) => val && !isNaN(Date.parse(val)), "Fecha inválida"),
    horaDesde: z.string(),
    horaHasta: z.string(),
    activo: z.boolean(),
    imagenes: z.array(z.any()),
    lleva: z.number().int().min(2, "Debe llevar 2 o más artículos"),
    paga: z.number().int().min(1, "Debe pagar al menos 1 artículo"),
    idArticulos: z
      .array(z.number())
      .min(1, "Debe seleccionar al menos un artículo"),
  })
  .refine((data) => data.paga < data.lleva, {
    message: "La cantidad a pagar debe ser menor a la que lleva",
    path: ["paga"],
  });

interface NxMFormProps {
  promocion?: PromocionResponse;
  articulosDisponibles: ArticuloShort[];
  onSubmit: (data: PromocionRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  serverErrorMessage?: string;
}

export const NxMForm: React.FC<NxMFormProps> = ({
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
    reset,
    formState: { errors },
  } = useForm<NxMFormData>({
    resolver: zodResolver(nxmSchema),
    defaultValues: {
      denominacion: "",
      fechaDesde: "",
      fechaHasta: "",
      horaDesde: "00:00",
      horaHasta: "23:59",
      activo: true,
      imagenes: [],
      lleva: 2,
      paga: 1,
      idArticulos: [],
    },
  });

  // Efecto para popular el formulario al editar
  useEffect(() => {
    if (promocion) {
      const lleva = promocion.cantidadMinima;
      const paga = Math.round(lleva * (1 - promocion.valorDescuento / 100));
      reset({
        denominacion: promocion.denominacion,
        fechaDesde: promocion.fechaDesde,
        fechaHasta: promocion.fechaHasta,
        horaDesde: promocion.horaDesde,
        horaHasta: promocion.horaHasta,
        activo: promocion.activo,
        imagenes: promocion.imagenes,
        lleva,
        paga,
        idArticulos: promocion.detalles.map((d) => d.articulo.id),
      });
    }
  }, [promocion, reset]);

  const handleNewImageUploaded = (url: string) => {
    newlyUploadedUrls.current.push(url);
  };

  const cleanupUnusedImages = async () => {
    for (const url of newlyUploadedUrls.current) {
      const filename = extractFilenameFromUrl(url);
      if (filename) await ImageService.deletePhysicalFile(filename);
    }
    newlyUploadedUrls.current = [];
  };

  const handleCancelClick = () => {
    cleanupUnusedImages();
    onCancel();
  };

  const handleFormSubmit = (data: NxMFormData) => {
    newlyUploadedUrls.current = []; // Limpiar tracker

    const valorDescuento = Math.round(
      ((data.lleva - data.paga) / data.lleva) * 100
    );

    const transformedData: PromocionRequest = {
      denominacion: data.denominacion,
      fechaDesde: data.fechaDesde,
      fechaHasta: data.fechaHasta,
      horaDesde: data.horaDesde,
      horaHasta: data.horaHasta,
      descripcionDescuento: `Promoción ${data.lleva}x${data.paga}`,
      tipoDescuento: TIPO_DESCUENTO.PORCENTUAL,
      tipoPromocion: TIPO_PROMOCION.NXM,
      valorDescuento: valorDescuento,
      activo: data.activo,
      cantidadMinima: data.lleva,
      detalles: data.idArticulos.map((id) => ({ idArticulo: id, cantidad: 1 })),
      imagenes: data.imagenes,
    };

    onSubmit(transformedData);
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
        Configuración de la Oferta
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="lleva"
          control={control}
          render={({ field }) => (
            <FormField
              {...field}
              onChange={(v) => field.onChange(Number(v))}
              label="El cliente lleva (unidades)"
              type="number"
              min={2}
              required
              error={errors.lleva?.message}
            />
          )}
        />
        <Controller
          name="paga"
          control={control}
          render={({ field }) => (
            <FormField
              {...field}
              onChange={(v) => field.onChange(Number(v))}
              label="Y paga solo (unidades)"
              type="number"
              min={1}
              required
              error={errors.paga?.message}
            />
          )}
        />
      </div>

      <hr />
      <h3 className="text-lg font-medium" style={{ color: "#443639" }}>
        Artículos Participantes
      </h3>
      <Controller
        name="idArticulos"
        control={control}
        render={({ field }) => (
          <ArticuloMultiSelector
            articulosDisponibles={articulosDisponibles}
            selectedIds={field.value}
            onSelectionChange={field.onChange}
          />
        )}
      />
      {errors.idArticulos && (
        <p className="text-sm text-red-600">{errors.idArticulos.message}</p>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={handleCancelClick}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Oferta"}
        </Button>
      </div>
    </form>
  );
};
