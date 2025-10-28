import React, { useState } from 'react';
import { FacturaService } from '../../services/FacturaService';
import type { FacturaDownloadStatus } from '../../types/facturas/FacturaTypes';

interface BotonDescargarFacturaProps {
  /** ID de la factura (opcional si se proporciona pedidoId) */
  facturaId?: number;
  /** ID del pedido (opcional si se proporciona facturaId) */
  pedidoId?: number;
  /** Texto del botón (por defecto: "Descargar PDF") */
  texto?: string;
  /** Tamaño del botón */
  size?: 'sm' | 'md' | 'lg';
  /** Variante del botón */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Si es true, abre preview en lugar de descargar */
  preview?: boolean;
  /** Clase CSS adicional */
  className?: string;
  /** Callback cuando descarga exitosa */
  onSuccess?: () => void;
  /** Callback cuando hay error */
  onError?: (error: string) => void;
}

export const BotonDescargarFactura: React.FC<BotonDescargarFacturaProps> = ({
  facturaId,
  pedidoId,
  texto = 'Descargar PDF',
  size = 'md',
  variant = 'primary',
  preview = false,
  className = '',
  onSuccess,
  onError
}) => {
  const [status, setStatus] = useState<FacturaDownloadStatus>('idle');

  // Validación de props
  if (!facturaId && !pedidoId) {
    console.error('BotonDescargarFactura: Se requiere facturaId o pedidoId');
    return null;
  }

  const handleDescargar = async () => {
    if (status === 'downloading') return;

    setStatus('downloading');

    try {
      if (facturaId) {
        await FacturaService.descargarFacturaPdf(facturaId, { preview });
      } else if (pedidoId) {
        await FacturaService.descargarFacturaPdfByPedido(pedidoId, { preview });
      }

      setStatus('success');
      onSuccess?.();

      // Reset status después de 2 segundos
      setTimeout(() => setStatus('idle'), 2000);

    } catch (error) {
      console.error('Error en descarga:', error);
      setStatus('error');
      onError?.(error instanceof Error ? error.message : 'Error desconocido');

      // Reset status después de 3 segundos
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  // Estilos base
  const baseClasses = [
    'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ];

  // Estilos por tamaño
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  // Estilos por variante y estado
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        if (status === 'success') return 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500';
        if (status === 'error') return 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
        return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
      
      case 'secondary':
        if (status === 'success') return 'bg-green-100 hover:bg-green-200 text-green-800 focus:ring-green-500';
        if (status === 'error') return 'bg-red-100 hover:bg-red-200 text-red-800 focus:ring-red-500';
        return 'bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-500';
      
      case 'outline':
        if (status === 'success') return 'border border-green-300 text-green-700 hover:bg-green-50 focus:ring-green-500';
        if (status === 'error') return 'border border-red-300 text-red-700 hover:bg-red-50 focus:ring-red-500';
        return 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500';
      
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
    }
  };

  // Texto e íconos según estado
  const getContent = () => {
    switch (status) {
      case 'downloading':
        return (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {preview ? 'Abriendo...' : 'Descargando...'}
          </>
        );
      
      case 'success':
        return (
          <>
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            ¡Listo!
          </>
        );
      
      case 'error':
        return (
          <>
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Error
          </>
        );
      
      default:
        return (
          <>
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {texto}
          </>
        );
    }
  };

  const buttonClasses = [
    ...baseClasses,
    sizeClasses[size],
    getVariantClasses(),
    className
  ].join(' ');

  return (
    <button
      type="button"
      onClick={handleDescargar}
      disabled={status === 'downloading'}
      className={buttonClasses}
      title={preview ? 'Ver factura PDF' : 'Descargar factura PDF'}
    >
      {getContent()}
    </button>
  );
};

// Componente específico para descargar (sin preview)
export const BotonDescargarFacturaPdf: React.FC<Omit<BotonDescargarFacturaProps, 'preview'>> = (props) => (
  <BotonDescargarFactura {...props} preview={false} />
);

// Componente específico para preview
export const BotonPreviewFacturaPdf: React.FC<Omit<BotonDescargarFacturaProps, 'preview' | 'texto'>> = (props) => (
  <BotonDescargarFactura {...props} preview={true} texto="Ver PDF" />
);

export default BotonDescargarFactura;