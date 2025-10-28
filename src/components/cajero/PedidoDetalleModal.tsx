import React from 'react';
import { X, Package, Clock, MapPin, Phone } from 'lucide-react';
import type { PedidoResponseDTO } from '../../types/pedidos';

interface PedidoDetalleModalProps {
  pedido: PedidoResponseDTO | null;  // 🆕 Permitir null
  isOpen: boolean;
  onClose: () => void;
}

const PedidoDetalleModal: React.FC<PedidoDetalleModalProps> = ({ 
  pedido, 
  isOpen, 
  onClose 
}) => {
  // 🔥 DEBUG MANUAL - Agrega esta línea
  console.log('🚀 Modal ejecutándose:', { isOpen, pedido: pedido?.idPedido });

  // 🛡️ DEFENSA: No renderizar si el modal está cerrado o no hay pedido
  if (!isOpen || !pedido) return null;

  const formatearPrecio = (precio: number) => `${precio.toLocaleString()}`;
  
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadgeColor = (estado: string) => {
    const colores = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      PREPARACION: 'bg-blue-100 text-blue-800', 
      LISTO: 'bg-green-100 text-green-800',
      ENTREGADO: 'bg-green-100 text-green-800',
      CANCELADO: 'bg-red-100 text-red-800'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              🔥 MODAL NUEVO - Pedido #{pedido.idPedido}
            </h2>
            <p className="text-gray-600">
              {formatearFecha(pedido.fecha)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoBadgeColor(pedido.estado)}`}>
              {pedido.estado}
            </span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Info General */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <MapPin className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-medium">{pedido.tipoEnvio}</p>
                <p className="text-sm text-gray-600">Tipo de entrega</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium">{pedido.tiempoEstimadoTotal} min</p>
                <p className="text-sm text-gray-600">Tiempo estimado</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium">{pedido.telefonoCliente}</p>
                <p className="text-sm text-gray-600">{pedido.nombreCliente} {pedido.apellidoCliente}</p>
              </div>
            </div>
          </div>

          {/* Productos */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-semibold">Productos</h3>
            </div>
            
            <div className="space-y-4">
              {pedido.detalles.map((detalle, index) => {
                // 🛡️ DEFENSA: Verificar que detalle existe
                if (!detalle) {
                  console.warn('⚠️ Detalle undefined en índice:', index);
                  return null;
                }

                // 🛡️ DEFENSA: Usar valores seguros de los tipos reales del backend
                const tienePromocion = Boolean(detalle.tienePromocion && detalle.promocionAplicada);
                const precioOriginal = detalle.precioUnitarioOriginal;
                const precioFinal = detalle.precioUnitarioFinal;
                const descuentoPromocion = detalle.descuentoPromocion || 0;
                
                // 🛡️ DEFENSA: Calcular precio por unidad seguro
                const precioUnitario = detalle.cantidad > 0 ? detalle.subtotal / detalle.cantidad : 0;

                console.log('🔍 Debug detalle:', {
                  producto: detalle.denominacionArticulo,
                  tienePromocion,
                  precioOriginal,
                  precioFinal,
                  descuentoPromocion,
                  subtotal: detalle.subtotal,
                  cantidad: detalle.cantidad,
                  promocionAplicada: detalle.promocionAplicada
                });

                return (
                  <div key={detalle.idDetallePedido || index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {detalle.denominacionArticulo || 'Producto sin nombre'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Cantidad: {detalle.cantidad || 0}
                            </p>
                          </div>
                        </div>
                        
                        {/* 🆕 Mostrar promoción SOLO si existe y es válida */}
                        {tienePromocion && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-red-800">
                                  🎁 {detalle.promocionAplicada?.denominacion || 'Promoción'}
                                </p>
                                <p className="text-sm text-red-600">
                                  {detalle.promocionAplicada?.resumenDescuento || 'Descuento aplicado'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-red-600 font-medium">
                                  Ahorro: {formatearPrecio(descuentoPromocion)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {detalle.observaciones && (
                          <p className="text-sm text-gray-600 italic">
                            Obs: {detalle.observaciones}
                          </p>
                        )}
                      </div>
                      
                      {/* 🆕 Precios con descuento visible */}
                      <div className="text-right ml-4">
                        {tienePromocion && precioOriginal && precioFinal ? (
                          <div>
                            {/* CON promoción */}
                            <p className="text-sm text-gray-500 line-through">
                              {formatearPrecio(precioOriginal)} c/u
                            </p>
                            <p className="font-medium text-gray-900">
                              {formatearPrecio(precioFinal)} c/u
                            </p>
                            <div className="border-t pt-1 mt-1">
                              <p className="text-sm text-gray-500 line-through">
                                {formatearPrecio(precioOriginal * detalle.cantidad)}
                              </p>
                              <p className="font-bold text-lg text-gray-900">
                                {formatearPrecio(detalle.subtotal || 0)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {/* SIN promoción - Fallback seguro */}
                            <p className="font-medium text-gray-900">
                              {formatearPrecio(precioUnitario)} c/u
                            </p>
                            <div className="border-t pt-1 mt-1">
                              <p className="font-bold text-lg text-gray-900">
                                {formatearPrecio(detalle.subtotal || 0)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold">Total del Pedido:</span>
              <span className="text-2xl font-bold text-orange-600">
                {formatearPrecio(pedido.total)}
              </span>
            </div>
            
            {pedido.observaciones && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">Observaciones:</p>
                <p className="text-sm text-yellow-700">{pedido.observaciones}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { PedidoDetalleModal };