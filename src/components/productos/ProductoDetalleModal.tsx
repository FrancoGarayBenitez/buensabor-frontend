import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Star, Clock, Package, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import type { ProductoCatalogo } from "../../hooks/useCatalogoProductos";

interface ProductoDetalleModalProps {
  producto: ProductoCatalogo | null;
  abierto: boolean;
  onCerrar: () => void;
  onAgregarCarrito: (producto: ProductoCatalogo) => void;
}

export const ProductoDetalleModal: React.FC<ProductoDetalleModalProps> = ({
  producto,
  abierto,
  onCerrar,
  onAgregarCarrito,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!producto) return null;

  const hasImages = producto.imagenes && producto.imagenes.length > 0;
  const currentImage = hasImages ? producto.imagenes[selectedImageIndex] : null;

  const getRating = () => {
    if (producto.tipo === 'insumo') return 4.5;
    
    const cantidadVendida = producto.cantidadVendida;
    if (cantidadVendida >= 100) return 4.9;
    if (cantidadVendida >= 50) return 4.7;
    if (cantidadVendida >= 20) return 4.5;
    if (cantidadVendida >= 10) return 4.3;
    return 4.0;
  };

  const handleAgregarCarrito = () => {
    onAgregarCarrito(producto);
    onCerrar();
  };

  const getStockColor = (estado?: string) => {
    switch (estado) {
      case 'CRITICO': return 'bg-red-50 text-red-600';
      case 'BAJO': return 'bg-yellow-50 text-yellow-600';
      case 'NORMAL': return 'bg-green-50 text-green-600';
      case 'ALTO': return 'bg-blue-50 text-blue-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const rating = getRating();

  return (
    <Modal
      isOpen={abierto}
      onClose={onCerrar}
      title={producto.denominacion}
      size="xl"
    >
      <div className="space-y-6">
        {/* Badge de tipo de producto */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
            producto.tipo === 'manufacturado'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-purple-100 text-purple-800'
          }`}>
            {producto.tipo === 'manufacturado' ? '🍽️ Comida Preparada' : '🛒 Producto Premium'}
          </span>
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
            producto.stockSuficiente 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {producto.stockSuficiente ? 'Disponible' : 'Agotado'}
          </span>
        </div>

        {/* Sección de Imágenes */}
        {hasImages && (
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Imágenes del Producto
            </h3>
            <div className="space-y-4">
              {/* Imagen principal */}
              <div className="flex justify-center">
                <img
                  src={currentImage?.url}
                  alt={currentImage?.denominacion || producto.denominacion}
                  className="max-h-80 rounded-lg shadow-md object-cover"
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
                      className={`w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
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
                          target.src = "https://via.placeholder.com/80x80/f3f4f6/6b7280?text=Error";
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
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Información General
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-sm font-medium text-gray-500">Categoría:</span>
              <p className="text-gray-900">
                {producto.categoria.denominacionCategoriaPadre
                  ? `${producto.categoria.denominacionCategoriaPadre} → ${producto.categoria.denominacion}`
                  : producto.categoria.denominacion}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Precio:</span>
              <p className="text-2xl font-bold text-[#CD6C50]">
                ${producto.precioVenta.toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Valoración:</span>
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                <span className="text-lg font-medium">{rating}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({producto.tipo === 'manufacturado' ? 'Basado en ventas' : 'Calidad premium'})
                </span>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Disponibilidad:</span>
              <div className="flex items-center">
                {producto.stockSuficiente ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                )}
                <span className={`font-medium ${
                  producto.stockSuficiente ? 'text-green-700' : 'text-red-700'
                }`}>
                  {producto.stockSuficiente ? 'En stock' : 'Agotado'}
                </span>
              </div>
            </div>
          </div>

          {producto.descripcion && (
            <div className="mt-6">
              <span className="text-sm font-medium text-gray-500">Descripción:</span>
              <p className="text-gray-900 mt-2">{producto.descripcion}</p>
            </div>
          )}
        </div>

        {/* Información específica según tipo */}
        {producto.tipo === 'manufacturado' ? (
          /* Información para productos manufacturados */
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Detalles de Preparación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {producto.tiempoEstimadoEnMinutos && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Clock className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-600">Tiempo de Preparación</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {producto.tiempoEstimadoEnMinutos} min
                  </p>
                </div>
              )}
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-600">Popularidad</span>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {producto.cantidadVendida}
                </p>
                <p className="text-sm text-green-600">unidades vendidas</p>
              </div>

              {producto.cantidadMaximaPreparable !== undefined && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Package className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-purple-600">Disponible</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {producto.cantidadMaximaPreparable}
                  </p>
                  <p className="text-sm text-purple-600">máximo preparable</p>
                </div>
              )}
            </div>

            {producto.costoTotal !== undefined && producto.margenGanancia !== undefined && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Información de Costos</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Costo de ingredientes:</span>
                    <p className="font-medium">${producto.costoTotal.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Margen de ganancia:</span>
                    <p className="font-medium">{producto.margenGanancia.toFixed(1)}x</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Ganancia por unidad:</span>
                    <p className="font-medium text-green-600">
                      ${(producto.precioVenta - producto.costoTotal).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Información para insumos */
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Información de Stock
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Package className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-600">Stock Actual</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {producto.stockActual || 0}
                </p>
                <p className="text-sm text-blue-600">
                  de {producto.stockMaximo || 0} máximo
                </p>
              </div>

              <div className={`p-4 rounded-lg ${getStockColor(producto.estadoStock)}`}>
                <div className="flex items-center mb-2">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Estado de Stock</span>
                </div>
                <p className="text-2xl font-bold">
                  {producto.estadoStock || 'NORMAL'}
                </p>
                {producto.stockActual !== undefined && producto.stockMaximo && (
                  <p className="text-sm">
                    {Math.round((producto.stockActual / producto.stockMaximo) * 100)}% disponible
                  </p>
                )}
              </div>
            </div>

            {producto.stockActual !== undefined && producto.stockMaximo && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Nivel de Stock</span>
                  <span>{Math.round((producto.stockActual / producto.stockMaximo) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      producto.stockActual / producto.stockMaximo < 0.25
                        ? 'bg-red-500'
                        : producto.stockActual / producto.stockMaximo < 0.5
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min((producto.stockActual / producto.stockMaximo) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Características del producto */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Características
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">
                {producto.tipo === 'manufacturado' ? '🍽️' : '🥇'}
              </div>
              <p className="text-sm font-medium text-gray-700">
                {producto.tipo === 'manufacturado' ? 'Recién Preparado' : 'Calidad Premium'}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">⭐</div>
              <p className="text-sm font-medium text-gray-700">
                Valoración {rating}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">
                {producto.stockSuficiente ? '✅' : '❌'}
              </div>
              <p className="text-sm font-medium text-gray-700">
                {producto.stockSuficiente ? 'Disponible' : 'Sin Stock'}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">📦</div>
              <p className="text-sm font-medium text-gray-700">
                {producto.categoria.denominacion}
              </p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCerrar}
            className="flex-1"
          >
            Cerrar
          </Button>
          <Button
            type="button"
            onClick={handleAgregarCarrito}
            disabled={!producto.stockSuficiente}
            className={`flex-1 ${
              producto.stockSuficiente
                ? 'bg-[#CD6C50] hover:bg-[#b85a42] text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {producto.stockSuficiente ? '🛒 Agregar al Carrito' : 'Sin Stock'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
export default ProductoDetalleModal;