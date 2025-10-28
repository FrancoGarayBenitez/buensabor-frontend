// src/components/productos/ProductoDetallesModal.tsx
import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import type { ArticuloManufacturadoResponseDTO } from "../../types/productos/ArticuloManufacturadoResponseDTO";

interface ProductoDetallesModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto?: ArticuloManufacturadoResponseDTO;
  onEdit?: (producto: ArticuloManufacturadoResponseDTO) => void;
}

export const ProductoDetallesModal: React.FC<ProductoDetallesModalProps> = ({
  isOpen,
  onClose,
  producto,
  onEdit,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!producto) return null;

  const handleEdit = () => {
    onEdit?.(producto);
    onClose();
  };

  const hasImages = producto.imagenes && producto.imagenes.length > 0;
  const currentImage = hasImages ? producto.imagenes[selectedImageIndex] : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={producto.denominacion}
      size="lg"
    >
      <div className="space-y-6">
        {/* Sección de Imágenes */}
        {hasImages && (
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Imágenes del Producto
            </h3>
            <div className="space-y-4">
              {/* Imagen principal */}
              <div className="flex justify-center">
                <img
                  src={currentImage?.url}
                  alt={currentImage?.denominacion || producto.denominacion}
                  className="max-h-64 rounded-lg shadow-md object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/300x200/f3f4f6/6b7280?text=Error+al+cargar";
                  }}
                />
              </div>

              {/* Miniaturas si hay múltiples imágenes */}
              {producto.imagenes.length > 1 && (
                <div className="flex justify-center space-x-2">
                  {producto.imagenes.map((imagen, index) => (
                    <button
                      key={imagen.idImagen || index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                        index === selectedImageIndex
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={imagen.url}
                        alt={imagen.denominacion}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://via.placeholder.com/64x64/f3f4f6/6b7280?text=Error";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Información de la imagen actual */}
              <div className="text-center text-sm text-gray-500">
                {currentImage?.denominacion}
                {producto.imagenes.length > 1 && (
                  <span className="ml-2">
                    ({selectedImageIndex + 1} de {producto.imagenes.length})
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Información básica */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Información General
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">
                Categoría:
              </span>
              <p className="text-gray-900">
                {producto.categoria.denominacionCategoriaPadre
                  ? `${producto.categoria.denominacionCategoriaPadre} → ${producto.categoria.denominacion}`
                  : producto.categoria.denominacion}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">
                Unidad de Venta:
              </span>
              <p className="text-gray-900">
                {producto.denominacionUnidadMedida}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">
                Tiempo de Preparación:
              </span>
              <p className="text-gray-900">
                {producto.tiempoEstimadoEnMinutos} minutos
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">
                Precio de Venta:
              </span>
              <p className="text-xl font-bold text-green-600">
                ${producto.precioVenta.toFixed(2)}
              </p>
            </div>
          </div>

          {producto.descripcion && (
            <div className="mt-4">
              <span className="text-sm font-medium text-gray-500">
                Descripción:
              </span>
              <p className="text-gray-900 mt-1">{producto.descripcion}</p>
            </div>
          )}
        </div>

        {/* Receta e Ingredientes */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Receta ({producto.cantidadIngredientes} ingredientes)
          </h3>

          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-100 border-b">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-600">
                <span>Ingrediente</span>
                <span className="text-center">Cantidad</span>
                <span className="text-right">Precio Unit.</span>
                <span className="text-right">Subtotal</span>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {producto.detalles.map((detalle, index) => (
                <div key={index} className="px-4 py-3">
                  <div className="grid grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="font-medium text-gray-900">
                        {detalle.denominacionInsumo}
                      </p>
                      <p className="text-sm text-gray-500">
                        {detalle.unidadMedida}
                      </p>
                    </div>
                    <div className="text-center">
                      <span className="font-medium">{detalle.cantidad}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-900">
                        ${detalle.precioCompraUnitario?.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-gray-900">
                        ${detalle.subtotal?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 bg-gray-100 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">
                  Costo Total de Ingredientes:
                </span>
                <span className="text-lg font-bold text-blue-600">
                  ${producto.costoTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Análisis de Costos */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Análisis de Rentabilidad
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-600">
                Costo de Ingredientes
              </p>
              <p className="text-2xl font-bold text-blue-900">
                ${producto.costoTotal.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-600">
                Precio de Venta
              </p>
              <p className="text-2xl font-bold text-green-900">
                ${producto.precioVenta.toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-purple-600">
                Margen de Ganancia
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {producto.margenGanancia.toFixed(1)}x
              </p>
              <p className="text-sm text-purple-600">
                {((producto.margenGanancia - 1) * 100).toFixed(0)}% ganancia
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Ganancia por unidad:</span>
              <span className="font-medium text-gray-900">
                ${(producto.precioVenta - producto.costoTotal).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Instrucciones de Preparación */}
        {producto.preparacion && (
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Instrucciones de Preparación
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {producto.preparacion}
              </pre>
            </div>
          </div>
        )}

        {/* Estado de Stock */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Estado de Disponibilidad
          </h3>

          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center px-3 py-2 rounded-lg ${
                producto.stockSuficiente
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <span className="text-lg mr-2">
                {producto.stockSuficiente ? "✅" : "❌"}
              </span>
              <span className="font-medium">
                {producto.stockSuficiente
                  ? "Stock Disponible"
                  : "Sin Stock Suficiente"}
              </span>
            </div>

            <div className="bg-gray-100 px-3 py-2 rounded-lg">
              <span className="text-sm text-gray-600">Máximo preparable: </span>
              <span className="font-medium">
                {producto.cantidadMaximaPreparable} unidades
              </span>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Estadísticas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-sm text-gray-600">Total Vendido:</span>
              <p className="text-lg font-medium text-gray-900">
                {producto.cantidadVendida} unidades
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-sm text-gray-600">
                Ingredientes Utilizados:
              </span>
              <p className="text-lg font-medium text-gray-900">
                {producto.cantidadIngredientes}
              </p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {onEdit && (
            <Button type="button" onClick={handleEdit}>
              Editar Producto
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};