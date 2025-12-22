import React, { useEffect, useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import type { ArticuloManufacturadoResponseDTO } from "../../types/productos/ArticuloManufacturadoResponseDTO";

interface ProductoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto?: ArticuloManufacturadoResponseDTO;
  // Mostrar sección de negocio solo para admins
  isAdmin?: boolean;
  // Permite abrir el modal de edición desde la vista previa
  onEdit?: (producto: ArticuloManufacturadoResponseDTO) => void;
}

export const ProductoPreviewModal: React.FC<ProductoPreviewModalProps> = ({
  isOpen,
  onClose,
  producto,
  isAdmin = false,
  onEdit,
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => setIndex(0), [producto, isOpen]);

  if (!producto) return null;

  const images = producto.imagenes ?? [];
  const imgUrl =
    images[index]?.url ??
    "https://via.placeholder.com/600x400/f3f4f6/6b7280?text=Sin+Imagen";

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
      title="Vista previa del producto"
      size="xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Imagen principal + carrusel */}
        <div className="relative">
          <img
            src={imgUrl}
            alt={producto.denominacion}
            className="w-full h-64 md:h-80 object-cover rounded-lg shadow"
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/600x400/f3f4f6/6b7280?text=Sin+Imagen";
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
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-bold text-gray-900">
              {producto.denominacion}
            </h3>
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${
                producto.stockSuficiente
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {producto.stockSuficiente ? "Disponible" : "Sin stock"}
            </span>
          </div>

          <div className="text-2xl font-extrabold text-blue-700">
            ${producto.precioVenta.toFixed(2)}
          </div>

          <div className="text-sm text-gray-600 space-x-2">
            <span className="inline-block px-2 py-1 bg-gray-100 rounded">
              {producto.denominacionCategoria}
            </span>
            <span className="inline-block px-2 py-1 bg-gray-100 rounded">
              {producto.denominacionUnidadMedida}
            </span>
            <span className="inline-block px-2 py-1 bg-gray-100 rounded">
              ⏱ {producto.tiempoEstimadoEnMinutos} min
            </span>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed">
            {producto.descripcion}
          </p>

          {/* Instrucciones de elaboración */}
          <div className="mt-3">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              Instrucciones de elaboración
            </h4>
            <div className="text-sm text-gray-700 bg-gray-50 border rounded p-3 max-h-40 overflow-auto whitespace-pre-line">
              {producto.preparacion || "Sin instrucciones disponibles."}
            </div>
          </div>

          {/* Ingredientes */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              Ingredientes
            </h4>
            <ul className="text-sm text-gray-700 space-y-1 max-h-40 overflow-auto pr-1">
              {producto.detalles.map((d) => (
                <li key={d.idDetalleManufacturado}>
                  • {d.denominacionInsumo} — {d.cantidad} {d.unidadMedidaInsumo}
                </li>
              ))}
            </ul>
          </div>

          {/* Sección de negocio (solo admins) */}
          {isAdmin && (
            <details className="mt-2 bg-white border rounded-lg">
              <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-gray-800">
                Detalles de negocio
              </summary>
              <div className="px-3 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded p-3">
                  <div className="text-gray-500">Costo de producción</div>
                  <div className="text-lg font-bold text-gray-900">
                    ${producto.costoProduccion.toFixed(2)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <div className="text-gray-500">Margen de ganancia</div>
                  <div className="text-lg font-bold text-gray-900">
                    {producto.margenGananciaPorcentaje.toFixed(1)}%
                  </div>
                </div>
              </div>
            </details>
          )}

          {/* Acciones */}
          {onEdit && (
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => onEdit(producto)}
                title="Editar este producto"
              >
                ✏️ Editar
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProductoPreviewModal;
