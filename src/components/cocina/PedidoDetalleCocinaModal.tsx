import React, { useState } from 'react';
import type { PedidoResponseDTO, DetallePedidoResponseDTO } from '../../types/pedidos';
import { PedidoService } from '../../services/PedidoServices';
import { Modal } from '../common/Modal';

interface PedidoDetalleCocinaModalProps {
  pedido: PedidoResponseDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onMarcarListo: (id: number) => void;
  onVerReceta: (producto: DetallePedidoResponseDTO) => void;
}

interface ProductoItemProps {
  detalle: DetallePedidoResponseDTO;
  onVerReceta: (detalle: DetallePedidoResponseDTO) => void;
  producto?: any; // Información adicional del producto si está disponible
}

const ProductoItem: React.FC<ProductoItemProps> = ({ detalle, onVerReceta, producto }) => {
  // Obtener imagen del producto
  const obtenerImagenProducto = () => {
    if (producto?.imagenes && producto.imagenes.length > 0) {
      return producto.imagenes[0].url;
    }
    
    // Fallback a emoji por categoría o genérico
    const categoria = producto?.categoria?.denominacion?.toLowerCase() || '';
    if (categoria.includes('hamburguesa')) return '🍔';
    if (categoria.includes('pizza')) return '🍕';
    if (categoria.includes('empanada')) return '🥟';
    if (categoria.includes('pasta')) return '🍝';
    if (categoria.includes('sandwich')) return '🥪';
    if (categoria.includes('ensalada')) return '🥗';
    if (categoria.includes('bebida')) return '🥤';
    if (categoria.includes('postre')) return '🍰';
    
    return '🍽️';
  };

  const imagenProducto = obtenerImagenProducto();
  const esUrl = imagenProducto.startsWith('http');

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
      {/* Imagen del producto */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
          {esUrl ? (
            <img 
              src={imagenProducto} 
              alt={detalle.denominacionArticulo}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Si la imagen falla, mostrar emoji
                (e.target as HTMLImageElement).style.display = 'none';
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent) {
                  parent.innerHTML = '<span class="text-2xl">🍽️</span>';
                }
              }}
            />
          ) : (
            <span className="text-2xl">{imagenProducto}</span>
          )}
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">
            {detalle.denominacionArticulo}
          </h4>
          <p className="text-sm text-gray-600">
            Cantidad: {detalle.cantidad} {detalle.unidadMedida}
          </p>
          <p className="text-sm text-gray-500">
            Tiempo: {detalle.tiempoPreparacion} min
          </p>
          {producto?.descripcion && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
              {producto.descripcion}
            </p>
          )}
        </div>
      </div>

      {/* Botón ver receta */}
      <button
        onClick={() => onVerReceta(detalle)}
        className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Ver Receta
      </button>
    </div>
  );
};

export const PedidoDetalleCocinaModal: React.FC<PedidoDetalleCocinaModalProps> = ({
  pedido,
  isOpen,
  onClose,
  onMarcarListo,
  onVerReceta
}) => {
  const [marcandoListo, setMarcandoListo] = useState(false);

  if (!pedido) return null;

  const handleMarcarListo = async () => {
    setMarcandoListo(true);
    try {
      await onMarcarListo(pedido.idPedido);
      onClose();
    } catch (error) {
      console.error('Error al marcar como listo:', error);
    } finally {
      setMarcandoListo(false);
    }
  };

  // Formatear tiempos
  const { fecha, hora, horaEstimada } = PedidoService.formatearTiempos(
    pedido.fecha,
    pedido.horaEstimadaFinalizacion
  );

  // Calcular tiempo total de preparación
  const tiempoTotalProductos = pedido.detalles.reduce(
    (total, detalle) => total + (detalle.tiempoPreparacion * detalle.cantidad),
    0
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" >
      <div className="p-6">
        {/* Header del pedido */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Pedido #{pedido.idPedido}
              </h2>
              <p className="text-gray-600 mt-1">
                {pedido.nombreCliente} {pedido.apellidoCliente}
              </p>
              <p className="text-sm text-gray-500">
                📞 {pedido.telefonoCliente}
              </p>
            </div>
            
            <div className="text-right">
              <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                👨‍🍳 En Preparación
              </span>
              <p className="text-sm text-gray-500 mt-1">
                {pedido.tipoEnvio === 'DELIVERY' ? '🚚 Delivery' : '📦 Take Away'}
              </p>
            </div>
          </div>
        </div>

        {/* Información de timing */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">📅 Información del Pedido</h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-600">Fecha:</span> {fecha}</p>
              <p><span className="text-gray-600">Hora del pedido:</span> {hora}</p>
              <p><span className="text-gray-600">Estado actual:</span> En Preparación</p>
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-medium text-orange-800 mb-2">⏰ Tiempo Estimado</h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-600">Finalización:</span> {horaEstimada}</p>
              <p><span className="text-gray-600">Total estimado:</span> {pedido.tiempoEstimadoTotal} min</p>
              <p><span className="text-gray-600">Tiempo productos:</span> {tiempoTotalProductos} min</p>
            </div>
          </div>
        </div>

        {/* Dirección de entrega (si es delivery) */}
        {pedido.tipoEnvio === 'DELIVERY' && pedido.domicilio && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-yellow-800 mb-2">🏠 Dirección de Entrega</h3>
            <p className="text-sm text-yellow-700">
              {pedido.domicilio.calle} {pedido.domicilio.numero}, {pedido.domicilio.localidad}
              {pedido.domicilio.cp && ` (CP: ${pedido.domicilio.cp})`}
            </p>
          </div>
        )}

        {/* Observaciones del pedido */}
        {pedido.observaciones && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-amber-800 mb-2">📝 Observaciones</h3>
            <p className="text-sm text-amber-700">{pedido.observaciones}</p>
          </div>
        )}

        {/* Lista de productos */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            🍽️ Productos a Preparar
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm">
              {pedido.detalles.length} item{pedido.detalles.length !== 1 ? 's' : ''}
            </span>
          </h3>
          
          <div className="space-y-3">
            {pedido.detalles.map((detalle) => (
              <ProductoItem
                key={detalle.idDetallePedido}
                detalle={detalle}
                onVerReceta={onVerReceta}
              />
            ))}
          </div>
        </div>

        {/* Resumen financiero */}
        <div className="border-t border-gray-200 pt-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-3">💰 Resumen del Pedido</h3>
            <div className="space-y-2">
              {pedido.detalles.map((detalle) => (
                <div key={detalle.idDetallePedido} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {detalle.cantidad}x {detalle.denominacionArticulo}
                  </span>
                  <span className="text-gray-800">
                    ${detalle.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
              <hr className="my-2" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>${pedido.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Volver
          </button>
          
          <button
            onClick={handleMarcarListo}
            disabled={marcandoListo}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {marcandoListo ? (
              <>
                <span className="animate-spin">⏳</span>
                Marcando...
              </>
            ) : (
              <>
                ✅ Marcar como Listo
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};