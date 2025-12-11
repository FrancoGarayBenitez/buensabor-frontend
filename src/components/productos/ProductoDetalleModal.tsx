import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import {
  Star,
  Clock,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import type { ArticuloManufacturadoResponseDTO } from "../../types/productos/ArticuloManufacturadoResponseDTO";

interface ProductoDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto?: ArticuloManufacturadoResponseDTO;
  onAgregarCarrito?: (producto: ArticuloManufacturadoResponseDTO) => void;
}

export const ProductoDetalleModal: React.FC<ProductoDetalleModalProps> = ({
  isOpen,
  onClose,
  producto,
  onAgregarCarrito,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!producto) return null;

  const handleAgregarCarrito = () => {
    onAgregarCarrito?.(producto);
    onClose();
  };

  // Validación explícita de imágenes
  const imagenes = producto.imagenes ?? [];
  const hasImages = imagenes.length > 0;
  const currentImage = hasImages ? imagenes[selectedImageIndex] : null;

  const getRating = () => {
    // Rating basado en cantidad máxima preparable (disponibilidad)
    if (producto.cantidadMaximaPreparable >= 100) return 4.9;
    if (producto.cantidadMaximaPreparable >= 50) return 4.7;
    if (producto.cantidadMaximaPreparable >= 20) return 4.5;
    if (producto.cantidadMaximaPreparable >= 10) return 4.3;
    return 4.0;
  };

  const rating = getRating();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={producto.denominacion}
      size="xl"
    >
      <div className="space-y-6">
        {/* Badges: Tipo y Disponibilidad */}
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
            🍽️ Comida Preparada
          </span>
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              producto.stockSuficiente
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {producto.stockSuficiente ? "✅ Disponible" : "❌ Agotado"}
          </span>
        </div>

        {/* SECCIÓN DE IMÁGENES */}
        {hasImages && currentImage && (
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Imágenes del Producto
            </h3>
            <div className="space-y-4">
              {/* Imagen principal */}
              <div className="flex justify-center bg-gray-50 rounded-lg p-4">
                <img
                  src={currentImage.url}
                  alt={currentImage.denominacion || producto.denominacion}
                  className="max-h-80 rounded-lg shadow-md object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "https://via.placeholder.com/400x300/f3f4f6/6b7280?text=Error+al+cargar";
                  }}
                />
              </div>

              {/* Miniaturas si hay múltiples imágenes */}
              {producto.imagenes && producto.imagenes.length > 1 && (
                <div className="flex justify-center gap-2 overflow-x-auto pb-2">
                  {producto.imagenes.map((imagen, index) => (
                    <button
                      key={imagen.idImagen || index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                        index === selectedImageIndex
                          ? "border-[#CD6C50] ring-2 ring-[#CD6C50] ring-opacity-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={imagen.url}
                        alt={imagen.denominacion}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "https://via.placeholder.com/80x80/f3f4f6/6b7280?text=Error";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Indicador de imagen */}
              {producto.imagenes && producto.imagenes.length > 1 && (
                <div className="text-center text-sm text-gray-500">
                  {selectedImageIndex + 1} de {producto.imagenes.length}
                </div>
              )}
            </div>
          </div>
        )}

        {/* INFORMACIÓN GENERAL */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Información General
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <span className="text-sm font-medium text-gray-500">
                Categoría:
              </span>
              <p className="text-gray-900 font-medium">
                {producto.esSubcategoria && producto.denominacionCategoriaPadre
                  ? `${producto.denominacionCategoriaPadre} → ${producto.denominacionCategoria}`
                  : producto.denominacionCategoria}
              </p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500">Precio:</span>
              <p className="text-2xl font-bold text-[#CD6C50]">
                ${producto.precioVenta.toFixed(2)}
              </p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500">Unidad:</span>
              <p className="text-gray-900">
                {producto.denominacionUnidadMedida}
              </p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500">
                Valoración:
              </span>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="text-lg font-medium">{rating.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {producto.descripcion && (
            <div>
              <span className="text-sm font-medium text-gray-500">
                Descripción:
              </span>
              <p className="text-gray-900 mt-2">{producto.descripcion}</p>
            </div>
          )}
        </div>

        {/* DETALLES DE PREPARACIÓN */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Detalles de Preparación
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">
                  Tiempo de Prep.
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {producto.tiempoEstimadoEnMinutos}
              </p>
              <p className="text-xs text-blue-600">minutos</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">
                  Disponible
                </span>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {producto.cantidadMaximaPreparable}
              </p>
              <p className="text-xs text-purple-600">máx. preparable</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  Margen
                </span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {(producto.margenGanancia * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-green-600">margen de ganancia</p>
            </div>
          </div>
        </div>

        {/* INGREDIENTES */}
        {producto.detalles && producto.detalles.length > 0 && (
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Ingredientes ({producto.detalles.length})
            </h3>

            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-100 border-b grid grid-cols-3 gap-4 text-sm font-medium text-gray-600">
                <span>Ingrediente</span>
                <span className="text-center">Cantidad</span>
                <span className="text-right">Costo Unit.</span>
              </div>

              <div className="divide-y divide-gray-200">
                {producto.detalles.map((detalle, index) => (
                  <div
                    key={detalle.idDetalleManufacturado || index}
                    className="px-4 py-3 grid grid-cols-3 gap-4 items-center text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {detalle.denominacionInsumo}
                      </p>
                      <p className="text-xs text-gray-500">
                        {detalle.unidadMedidaInsumo}
                      </p>
                    </div>
                    <div className="text-center">
                      <span className="font-medium">{detalle.cantidad}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-900">
                        ${detalle.costoInsumo?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 py-3 bg-gray-100 border-t flex justify-between items-center">
                <span className="font-medium text-gray-900">Costo Total:</span>
                <span className="text-lg font-bold text-blue-600">
                  ${producto.costoProduccion.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* INSTRUCCIONES DE PREPARACIÓN */}
        {producto.preparacion && (
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Instrucciones de Preparación
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                {producto.preparacion}
              </pre>
            </div>
          </div>
        )}

        {/* ESTADO DE DISPONIBILIDAD */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Estado de Disponibilidad
          </h3>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
            {producto.stockSuficiente ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900">Stock Disponible</p>
                  <p className="text-sm text-green-700">
                    Hasta {producto.cantidadMaximaPreparable} unidades
                    preparables
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900">
                    Sin Stock Suficiente
                  </p>
                  <p className="text-sm text-red-700">
                    Faltan ingredientes para preparar este producto
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* CARACTERÍSTICAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl mb-1">🍽️</div>
            <p className="text-xs font-medium text-gray-700">
              Recién Preparado
            </p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl mb-1">⭐</div>
            <p className="text-xs font-medium text-gray-700">
              {rating.toFixed(1)} estrellas
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl mb-1">
              {producto.stockSuficiente ? "✅" : "❌"}
            </div>
            <p className="text-xs font-medium text-gray-700">
              {producto.stockSuficiente ? "Disponible" : "No disponible"}
            </p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl mb-1">📦</div>
            <p className="text-xs font-medium text-gray-700">
              {producto.denominacionUnidadMedida}
            </p>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cerrar
          </Button>
          {onAgregarCarrito && (
            <Button
              type="button"
              onClick={handleAgregarCarrito}
              disabled={!producto.stockSuficiente}
              className={`flex-1 ${
                producto.stockSuficiente
                  ? "bg-[#CD6C50] hover:bg-[#b85a42] text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {producto.stockSuficiente ? "🛒 Agregar al Carrito" : "Sin Stock"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProductoDetalleModal;
