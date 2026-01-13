import React, { useEffect, useState, useMemo } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import {
  type PromocionResponse,
  TIPO_DESCUENTO,
} from "../../types/promociones/promocion.types";

interface PromocionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  promocion?: PromocionResponse;
  onEdit?: (promocion: PromocionResponse) => void;
}

export const PromocionPreviewModal: React.FC<PromocionPreviewModalProps> = ({
  isOpen,
  onClose,
  promocion,
  onEdit,
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => setIndex(0), [promocion, isOpen]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value);

  // ✅ REFACTORIZACIÓN: Calcular el precio total del combo/promoción
  const { precioOriginal, precioConDescuento, ahorro } = useMemo(() => {
    if (!promocion?.detalles.length) {
      return { precioOriginal: 0, precioConDescuento: 0, ahorro: 0 };
    }

    // Calcular el precio original sumando todos los artículos multiplicados por su cantidad
    const original = promocion.detalles.reduce(
      (acc, detalle) => acc + detalle.articulo.precioVenta * detalle.cantidad,
      0
    );

    let conDescuento = original;

    if (promocion.tipoDescuento === TIPO_DESCUENTO.PORCENTUAL) {
      conDescuento = original * (1 - promocion.valorDescuento / 100);
    } else {
      conDescuento = Math.max(0, original - promocion.valorDescuento);
    }

    return {
      precioOriginal: original,
      precioConDescuento: conDescuento,
      ahorro: original - conDescuento,
    };
  }, [promocion]);

  if (!promocion) return null;

  const images = promocion.imagenes ?? [];
  const imgUrl =
    images[index]?.url ??
    "https://via.placeholder.com/600x400/f3f4f6/6b7280?text=Promo";

  const next = () =>
    setIndex((i) => (images.length ? (i + 1) % images.length : 0));
  const prev = () =>
    setIndex((i) =>
      images.length ? (i - 1 + images.length) % images.length : 0
    );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vista previa de la Promoción"
      size="xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Imagen principal + carrusel */}
        <div className="relative">
          <img
            src={imgUrl}
            alt={promocion.denominacion}
            className="w-full h-64 md:h-80 object-cover rounded-lg shadow"
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/600x400/f3f4f6/6b7280?text=Promo";
            }}
          />
          {images.length > 1 && (
            <>
              <button
                aria-label="Anterior"
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-9 h-9 grid place-items-center shadow"
              >
                ‹
              </button>
              <button
                aria-label="Siguiente"
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-9 h-9 grid place-items-center shadow"
              >
                ›
              </button>
            </>
          )}
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <img
                  key={img.idImagen ?? i}
                  src={img.url}
                  alt={`thumb-${i}`}
                  onClick={() => setIndex(i)}
                  className={`w-14 h-14 object-cover rounded-md border cursor-pointer ${
                    i === index ? "border-blue-500" : "border-transparent"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Vista tipo catálogo */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">
            {promocion.denominacion}
          </h3>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-blue-700">
              {formatCurrency(precioConDescuento)}
            </span>
            <del className="text-xl text-gray-500">
              {formatCurrency(precioOriginal)}
            </del>
            <span className="px-2 py-1 rounded text-sm font-semibold bg-green-100 text-green-700">
              Ahorrás {formatCurrency(ahorro)}
            </span>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed">
            {promocion.descripcionDescuento}
          </p>

          {/* Condiciones */}
          <div className="mt-3 bg-gray-50 border rounded-lg p-3">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              Condiciones de la oferta
            </h4>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              {promocion.cantidadMinima > 1 && (
                <li>
                  Válido al comprar <strong>{promocion.cantidadMinima}</strong>{" "}
                  o más artículos de esta promoción.
                </li>
              )}
              <li>
                Vigente desde el{" "}
                {new Date(promocion.fechaDesde).toLocaleDateString()} hasta el{" "}
                {new Date(promocion.fechaHasta).toLocaleDateString()}.
              </li>
            </ul>
          </div>

          {/* ✅ REFACTORIZACIÓN: Artículos Incluidos con sus cantidades */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              Artículos incluidos en la promoción
            </h4>
            <ul className="text-sm text-gray-700 space-y-1 max-h-40 overflow-auto pr-1">
              {promocion.detalles.map((detalle) => (
                <li key={detalle.articulo.id} className="flex justify-between">
                  <span>
                    • {detalle.articulo.denominacion}
                    {detalle.cantidad > 1 && (
                      <span className="font-semibold ml-1">
                        x{detalle.cantidad}
                      </span>
                    )}
                  </span>
                  <span className="text-gray-500">
                    {formatCurrency(
                      detalle.articulo.precioVenta * detalle.cantidad
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Acciones */}
          {onEdit && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onEdit(promocion)}
                title="Editar esta promoción"
              >
                ✏️ Editar Promoción
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
