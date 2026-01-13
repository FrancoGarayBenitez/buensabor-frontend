import React from "react";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import { FormField } from "../../common/FormFieldProps";
import { ImageUpload } from "../../common/ImageUpload";

interface PromocionFormBaseProps {
  control: Control<any>;
  errors: FieldErrors<any>;
  onNewImageUploaded: (url: string) => void;
}

export const PromocionFormBase: React.FC<PromocionFormBaseProps> = ({
  control,
  errors,
  onNewImageUploaded,
}) => {
  return (
    <>
      {/* Denominación */}
      <Controller
        name="denominacion"
        control={control}
        render={({ field }) => (
          <FormField
            {...field}
            label="Denominación"
            placeholder="Ej: Promo Amigos"
            required
            error={errors.denominacion?.message as string}
          />
        )}
      />

      {/* Fechas y Horas (Grid con 4 campos) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Controller
          name="fechaDesde"
          control={control}
          render={({ field }) => (
            <FormField
              {...field}
              label="Fecha de inicio"
              type="date"
              required
              error={errors.fechaDesde?.message as string}
            />
          )}
        />
        <Controller
          name="fechaHasta"
          control={control}
          render={({ field }) => (
            <FormField
              {...field}
              label="Fecha de fin"
              type="date"
              required
              error={errors.fechaHasta?.message as string}
            />
          )}
        />
        <Controller
          name="horaDesde"
          control={control}
          render={({ field }) => (
            <FormField
              {...field}
              label="Hora de inicio"
              type="time"
              required
              error={errors.horaDesde?.message as string}
            />
          )}
        />
        <Controller
          name="horaHasta"
          control={control}
          render={({ field }) => (
            <FormField
              {...field}
              label="Hora de fin"
              type="time"
              required
              error={errors.horaHasta?.message as string}
            />
          )}
        />
      </div>

      {/* Imágenes */}
      <div className="space-y-1">
        <label
          className="block text-sm font-medium"
          style={{ color: "#443639" }}
        >
          Imágenes
        </label>
        <Controller
          name="imagenes"
          control={control}
          render={({ field }) => (
            <ImageUpload
              entityType="PROMOCION"
              currentImages={field.value || []}
              onImagesChange={field.onChange}
              onNewImageUploaded={onNewImageUploaded}
              multiple={true}
            />
          )}
        />
        {errors.imagenes && (
          <p className="text-sm text-red-600" role="alert">
            {errors.imagenes.message as string}
          </p>
        )}
      </div>

      {/* Activo */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <label className="font-medium" style={{ color: "#443639" }}>
            Activar promoción
          </label>
          <p className="text-sm" style={{ color: "#9AAAB3" }}>
            La promoción será visible para los clientes.
          </p>
        </div>
        <Controller
          name="activo"
          control={control}
          render={({ field }) => (
            // CORRECCIÓN DEFINITIVA: Usar estructura de Label + Peer para un switch robusto
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only" // Oculta el checkbox real
                checked={field.value}
                onChange={field.onChange}
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500"></div>
            </label>
          )}
        />
      </div>
    </>
  );
};
