import React, { useState } from 'react';
import { X, CheckCircle, DollarSign, AlertCircle, CreditCard } from 'lucide-react';
import { MercadoPagoService } from '../../services/MercadoPagoService';
import type { MetodoPago } from '../../types/mercadopago/MercadoPagoTypes';

const mercadoPagoService = new MercadoPagoService();

interface ConfirmarPagoModalProps {
    abierto: boolean;
    onCerrar: () => void;
    onExito: () => void;
    facturaId: number;
    montoTotal: number;
    metodoPagoPredeterminado?: MetodoPago;
}

const ConfirmarPagoModal: React.FC<ConfirmarPagoModalProps> = ({
    abierto,
    onCerrar,
    onExito,
    facturaId,
    montoTotal,
    metodoPagoPredeterminado = 'EFECTIVO'
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exito, setExito] = useState<string | null>(null);

    // Estados del formulario
    const [metodoPago, setMetodoPago] = useState<MetodoPago>(metodoPagoPredeterminado);
    const [montoRecibido, setMontoRecibido] = useState<string>(montoTotal.toString());
    const [referenciaPago, setReferenciaPago] = useState<string>('');
    const [observaciones, setObservaciones] = useState<string>('');

    if (!abierto) return null;

    const handleConfirmarPago = async () => {
        try {
            setLoading(true);
            setError(null);

            // Validaciones
            const monto = parseFloat(montoRecibido);
            if (isNaN(monto) || monto <= 0) {
                setError('El monto debe ser un número válido mayor a 0');
                return;
            }

            if (monto < montoTotal) {
                setError(`El monto recibido ($${monto}) es menor al total ($${montoTotal})`);
                return;
            }

            // Crear request de confirmación
            const request = {
                idFactura: facturaId,
                metodoPago,
                montoRecibido: monto,
                referenciaPago: referenciaPago.trim() || undefined,
                observaciones: observaciones.trim() || undefined
            };

            console.log('✅ Confirmando pago:', request);
            const response = await mercadoPagoService.confirmarPagoManual(request);

            if (!response.exito) {
                setError(response.mensaje || 'Error al confirmar el pago');
                return;
            }

            setExito('¡Pago confirmado exitosamente!');

            // Cerrar modal y notificar éxito después de un breve delay
            setTimeout(() => {
                onExito();
                onCerrar();
            }, 1500);

        } catch (err: any) {
            console.error('❌ Error al confirmar pago:', err);
            setError(err.message || 'Error al confirmar el pago');
        } finally {
            setLoading(false);
        }
    };

    const calcularVuelto = () => {
        const monto = parseFloat(montoRecibido);
        if (isNaN(monto)) return 0;
        return Math.max(0, monto - montoTotal);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <h2 className="text-xl font-bold text-gray-800">Confirmar Pago</h2>
                    </div>
                    <button
                        onClick={onCerrar}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Contenido */}
                <div className="p-6 space-y-6">

                    {/* Estado de Éxito */}
                    {exito && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-green-800">¡Pago Confirmado!</h4>
                                <p className="text-green-600 text-sm">{exito}</p>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-red-800">Error</h4>
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Información de la factura */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-800 mb-2">Información del pago</h3>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Factura #:</span>
                                <span className="font-medium">{facturaId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total a pagar:</span>
                                <span className="font-bold text-[#CD6C50]">${montoTotal.toFixed(0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Método de pago */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Método de pago
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Efectivo */}
                            <button
                                onClick={() => setMetodoPago('EFECTIVO')}
                                disabled={loading || !!exito}
                                className={`p-3 rounded-lg border-2 transition-all ${metodoPago === 'EFECTIVO'
                                        ? 'border-[#CD6C50] bg-[#CD6C50]/10'
                                        : 'border-gray-200 hover:border-gray-300'
                                    } ${(loading || exito) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <DollarSign className={`w-6 h-6 mx-auto mb-2 ${metodoPago === 'EFECTIVO' ? 'text-[#CD6C50]' : 'text-gray-400'
                                    }`} />
                                <p className={`text-sm font-medium ${metodoPago === 'EFECTIVO' ? 'text-[#CD6C50]' : 'text-gray-600'
                                    }`}>
                                    Efectivo
                                </p>
                            </button>

                            {/* MercadoPago */}
                            <button
                                onClick={() => setMetodoPago('MERCADO_PAGO')}
                                disabled={loading || !!exito}
                                className={`p-3 rounded-lg border-2 transition-all ${metodoPago === 'MERCADO_PAGO'
                                        ? 'border-[#CD6C50] bg-[#CD6C50]/10'
                                        : 'border-gray-200 hover:border-gray-300'
                                    } ${(loading || exito) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <CreditCard className={`w-6 h-6 mx-auto mb-2 ${metodoPago === 'MERCADO_PAGO' ? 'text-[#CD6C50]' : 'text-gray-400'
                                    }`} />
                                <p className={`text-sm font-medium ${metodoPago === 'MERCADO_PAGO' ? 'text-[#CD6C50]' : 'text-gray-600'
                                    }`}>
                                    MercadoPago
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Monto recibido */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Monto recibido
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                value={montoRecibido}
                                onChange={(e) => setMontoRecibido(e.target.value)}
                                disabled={loading || !!exito}
                                min="0"
                                step="0.01"
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="0.00"
                            />
                        </div>

                        {/* Mostrar vuelto si aplica */}
                        {metodoPago === 'EFECTIVO' && calcularVuelto() > 0 && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                                <span className="text-blue-700">
                                    💰 <strong>Vuelto:</strong> ${calcularVuelto().toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Referencia de pago (opcional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Referencia de pago (opcional)
                        </label>
                        <input
                            type="text"
                            value={referenciaPago}
                            onChange={(e) => setReferenciaPago(e.target.value)}
                            disabled={loading || !!exito}
                            placeholder="Ej: ID de transacción, número de comprobante..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Observaciones */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Observaciones (opcional)
                        </label>
                        <textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            disabled={loading || !!exito}
                            placeholder="Notas adicionales sobre el pago..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="flex space-x-3">
                        <button
                            onClick={onCerrar}
                            disabled={loading}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmarPago}
                            disabled={loading || !!exito || !montoRecibido}
                            className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Confirmando...' : exito ? '¡Confirmado!' : 'Confirmar Pago'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmarPagoModal;