import React, { useState, useEffect } from 'react';
import type { PedidoResponseDTO } from '../../types/pedidos';
import { PedidoService } from '../../services/PedidoServices';
import { PagoService } from '../../services/PagoService'; // ✅ NUEVO
import { apiClienteService } from '../../services/ApiClienteService'; // ✅ NUEVO
import { PedidoDetalleModal } from './PedidoDetalleModal';

interface PedidosGestionTableProps {
  pedidos: PedidoResponseDTO[];
  loading: boolean;
  onCambiarEstado: (id: number, nuevoEstado: string) => Promise<void>;
  onPagoConfirmado?: () => void; // ✅ NUEVO: Callback para refrescar datos
}

export const PedidosGestionTable: React.FC<PedidosGestionTableProps> = ({
  pedidos,
  loading,
  onCambiarEstado,
  onPagoConfirmado
}) => {
  const [selectedPedido, setSelectedPedido] = useState<PedidoResponseDTO | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // ✅ NUEVO: Estados para manejo de pagos
  const [pagosPendientes, setPagosPendientes] = useState<{[pedidoId: number]: boolean}>({});
  const [confirmandoPago, setConfirmandoPago] = useState<number | null>(null);
  const pagoService = new PagoService();

  // ✅ NUEVO: Verificar pagos pendientes cuando cambian los pedidos
  useEffect(() => {
    verificarPagosPendientes();
  }, [pedidos]);

  // ✅ NUEVO: Función para verificar pagos pendientes en efectivo
  const verificarPagosPendientes = async () => {
    console.log('🔍 === INICIANDO VERIFICACIÓN DE PAGOS PENDIENTES ===');
    console.log('📋 Total de pedidos a verificar:', pedidos.length);
    console.log('📋 IDs de pedidos:', pedidos.map(p => p.idPedido));
    
    const pendientes: {[pedidoId: number]: boolean} = {};
    
    for (const pedido of pedidos) {
      console.log(`\n🎯 === VERIFICANDO PEDIDO #${pedido.idPedido} ===`);
      
      try {
        // Obtener factura del pedido
        console.log(`📄 Paso 1: Obteniendo factura para pedido ${pedido.idPedido}...`);
        const factura = await pagoService.getFacturaPedido(pedido.idPedido);
        console.log(`✅ Paso 1 completado. Factura obtenida:`, factura);
        
        // Verificar pagos pendientes
        console.log(`💳 Paso 2: Verificando pagos pendientes para factura ${factura.idFactura}...`);
        const tienePendientes = await pagoService.tienePagosPendientesEfectivo(factura.idFactura);
        console.log(`✅ Paso 2 completado. ¿Tiene pagos pendientes?: ${tienePendientes}`);
        
        if (tienePendientes) {
          pendientes[pedido.idPedido] = true;
          console.log(`🟡 MARCADO COMO PENDIENTE: Pedido #${pedido.idPedido}`);
        } else {
          console.log(`🟢 SIN PAGOS PENDIENTES: Pedido #${pedido.idPedido}`);
        }
        
      } catch (error: any) {
        console.error(`❌ ERROR en pedido #${pedido.idPedido}:`, error);
        
        if (error?.response) {
          console.error(`📡 Status: ${error.response.status}`);
          console.error(`📡 Data:`, error.response.data);
          
          if (error.response.status === 404) {
            console.error(`🚨 ENDPOINT NO ENCONTRADO para pedido ${pedido.idPedido}`);
          }
        }
      }
    }
    
    console.log('\n📊 === RESUMEN FINAL ===');
    console.log('🟡 Pedidos con pagos pendientes:', Object.keys(pendientes).length);
    console.log('📋 Lista detallada:', pendientes);
    console.log('🔍 Si no ves pagos pendientes, revisa:');
    console.log('   1. ¿Se crearon pagos en efectivo en la BD?');
    console.log('   2. ¿Los pagos tienen el ID de factura correcto?');
    console.log('   3. ¿Los pagos están en estado PENDIENTE?');
    console.log('   4. ¿El endpoint /pagos/factura/{id} funciona?');
    
    setPagosPendientes(pendientes);
  };

  // ✅ NUEVO: Función para confirmar pago en efectivo
  const confirmarPagoEfectivo = async (pedido: PedidoResponseDTO) => {
    try {
      setConfirmandoPago(pedido.idPedido);
      
      // Obtener factura del pedido
      const factura = await pagoService.getFacturaPedido(pedido.idPedido);
      
      // Obtener pagos pendientes en efectivo
      const pagosPendientesEfectivo = await pagoService.getPagosPendientesEfectivo(factura.idFactura);
      
      if (pagosPendientesEfectivo.length === 0) {
        alert('No hay pagos en efectivo pendientes para este pedido');
        return;
      }

      // Confirmar cada pago pendiente en efectivo
      for (const pago of pagosPendientesEfectivo) {
        await pagoService.confirmarPagoEfectivo(pago.idPago);
        console.log(`✅ Pago ${pago.idPago} confirmado`);
      }

      // Actualizar estado local
      setPagosPendientes(prev => {
        const updated = { ...prev };
        delete updated[pedido.idPedido];
        return updated;
      });

      // Notificar al componente padre para refrescar datos
      if (onPagoConfirmado) {
        onPagoConfirmado();
      }

      alert(`¡Pago en efectivo confirmado! Total: ${pagosPendientesEfectivo.reduce((total, p) => total + p.monto, 0)}`);
      
    } catch (error: any) {
      console.error('❌ Error al confirmar pago:', error);
      alert('Error al confirmar el pago. Intenta de nuevo.');
    } finally {
      setConfirmandoPago(null);
    }
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(precio);
  };

  const formatearFechaHora = (fecha: string) => {
    const fechaObj = new Date(fecha);
    return {
      fecha: fechaObj.toLocaleDateString('es-AR'),
      hora: fechaObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleCambiarEstado = async (pedido: PedidoResponseDTO, nuevoEstado: string) => {
    try {
      setProcessingId(pedido.idPedido);
      await onCambiarEstado(pedido.idPedido, nuevoEstado);
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado del pedido');
    } finally {
      setProcessingId(null);
    }
  };

  const getEstadoStyle = (estado: string) => {
    const estadoInfo = PedidoService.formatearEstado(estado);
    const colorClasses = {
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return `${colorClasses[estadoInfo.color as keyof typeof colorClasses]} px-2 py-1 rounded-full text-xs font-medium`;
  };

  const getAccionesDisponibles = (pedido: PedidoResponseDTO) => {
    const acciones = [];

    switch (pedido.estado) {
      case 'PENDIENTE':
        acciones.push({
          texto: 'Cocina',
          estado: 'PREPARACION',
          color: 'bg-blue-500 hover:bg-blue-600',
          icono: '👨‍🍳'
        });
        acciones.push({
          texto: 'Anular',
          estado: 'CANCELADO',
          color: 'bg-red-500 hover:bg-red-600',
          icono: '❌'
        });
        break;

      case 'PREPARACION':
        acciones.push({
          texto: 'Listo',
          estado: 'LISTO',
          color: 'bg-green-500 hover:bg-green-600',
          icono: '🍽️'
        });
        acciones.push({
          texto: 'Anular',
          estado: 'CANCELADO',
          color: 'bg-red-500 hover:bg-red-600',
          icono: '❌'
        });
        break;

      case 'LISTO':
        if (pedido.tipoEnvio === 'DELIVERY') {
          acciones.push({
            texto: 'Delivery',
            estado: 'ENTREGADO',
            color: 'bg-purple-500 hover:bg-purple-600',
            icono: '🚚'
          });
        } else {
          acciones.push({
            texto: 'Entregar',
            estado: 'ENTREGADO',
            color: 'bg-green-500 hover:bg-green-600',
            icono: '📦'
          });
        }
        break;
    }

    return acciones;
  };

  const handleVerDetalle = (pedido: PedidoResponseDTO) => {
    setSelectedPedido(pedido);
    setModalOpen(true);
  };

  // ✅ NUEVO: Función de debug manual
  const debugPedidoEspecifico = async (pedidoId: number) => {
    console.log(`\n🔧 === DEBUG MANUAL PEDIDO #${pedidoId} ===`);
    
    try {
      // 1. Verificar factura
      console.log('1️⃣ Obteniendo factura...');
      const factura = await pagoService.getFacturaPedido(pedidoId);
      console.log('✅ Factura obtenida:', factura);
      
      // 2. Verificar pagos de la factura
      console.log('2️⃣ Obteniendo pagos de la factura...');
      const pagos = await pagoService.getPagosByFactura(factura.idFactura);
      console.log('✅ Pagos obtenidos:', pagos);
      
      // 3. Verificar si alguno es efectivo y pendiente
      console.log('3️⃣ Analizando pagos...');
      const efectivoPendientes = pagos.filter(p => p.formaPago === 'EFECTIVO' && p.estado === 'PENDIENTE');
      console.log('💵 Pagos en efectivo pendientes:', efectivoPendientes);
      
      // 4. Verificar todos los pagos del sistema
      console.log('4️⃣ Verificando todos los pagos del sistema...');
      const todosPagos = await apiClienteService.get('/pagos/debug/todos-los-pagos');
      console.log('📊 Todos los pagos del sistema:', todosPagos);
      
      alert(`Debug completado para pedido #${pedidoId}. Revisa la consola para detalles.`);
      
    } catch (error: any) {
      console.error('❌ Error en debug:', error);
      alert(`Error en debug del pedido #${pedidoId}. Revisa la consola.`);
    }
  };

  // ✅ NUEVO: Función para verificar si debe mostrar botón de pago
  const debeMostrarBotonPago = (pedido: PedidoResponseDTO): boolean => {
    return pagosPendientes[pedido.idPedido] === true;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha/Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entrega
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pedidos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No hay pedidos para mostrar
                </td>
              </tr>
            ) : (
              pedidos.map((pedido) => {
                const fechaHora = formatearFechaHora(pedido.fecha);
                const acciones = getAccionesDisponibles(pedido);
                const isProcessing = processingId === pedido.idPedido;
                const isConfirmandoPago = confirmandoPago === pedido.idPedido;
                const tienePagoPendiente = debeMostrarBotonPago(pedido);

                return (
                  <tr key={pedido.idPedido} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          #{pedido.idPedido}
                        </div>
                        {/* ✅ NUEVO: Indicador de pago pendiente */}
                        {tienePagoPendiente && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            💵 Pago pendiente
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{fechaHora.fecha}</div>
                      <div className="text-sm text-gray-500">{fechaHora.hora}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {pedido.nombreCliente} {pedido.apellidoCliente}
                      </div>
                      <div className="text-sm text-gray-500">{pedido.telefonoCliente}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        pedido.tipoEnvio === 'DELIVERY' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {pedido.tipoEnvio === 'DELIVERY' ? '🚚 Delivery' : '📦 Take Away'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatearPrecio(pedido.total)}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getEstadoStyle(pedido.estado)}>
                        {PedidoService.formatearEstado(pedido.estado).icono}{' '}
                        {PedidoService.formatearEstado(pedido.estado).texto}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleVerDetalle(pedido)}
                        className="text-blue-600 hover:text-blue-900 px-3 py-1 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        Ver detalle
                      </button>

                      {/* ✅ NUEVO: Botón de debug temporal */}
                      <button
                        onClick={() => debugPedidoEspecifico(pedido.idPedido)}
                        className="text-purple-600 hover:text-purple-900 px-3 py-1 border border-purple-600 rounded-md hover:bg-purple-50 transition-colors"
                        title="Debug: Ver información detallada de pagos"
                      >
                        🔧 Debug
                      </button>

                      {/* ✅ NUEVO: Botón para confirmar pago en efectivo */}
                      {tienePagoPendiente && (
                        <button
                          onClick={() => confirmarPagoEfectivo(pedido)}
                          disabled={isConfirmandoPago}
                          className="text-white px-3 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600"
                        >
                          {isConfirmandoPago ? (
                            <span className="animate-spin">⏳</span>
                          ) : (
                            <>💵 Confirmar Pago</>
                          )}
                        </button>
                      )}

                      {acciones.map((accion, index) => (
                        <button
                          key={index}
                          onClick={() => handleCambiarEstado(pedido, accion.estado)}
                          disabled={isProcessing}
                          className={`text-white px-3 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${accion.color}`}
                        >
                          {isProcessing ? (
                            <span className="animate-spin">⏳</span>
                          ) : (
                            <>
                              {accion.icono} {accion.texto}
                            </>
                          )}
                        </button>
                      ))}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PedidoDetalleModal
        pedido={selectedPedido}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPedido(null);
        }}
      />
    </>
  );
};