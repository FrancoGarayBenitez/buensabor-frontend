import React from 'react';
import { Tag, TrendingDown, Gift } from 'lucide-react';
import type { CarritoPreviewDTO } from '../../types/promociones';

interface PromocionResumenProps {
  preview: CarritoPreviewDTO;
  className?: string;
}

export const PromocionResumen: React.FC<PromocionResumenProps> = ({
  preview,
  className = ''
}) => {
  const tieneDescuentos = preview.descuentoTotal > 0;

  if (!tieneDescuentos) {
    return null;
  }

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Gift className="w-4 h-4 text-green-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-green-800">
              Promociones aplicadas
            </h3>
            <div className="flex items-center text-green-700">
              <TrendingDown className="w-4 h-4 mr-1" />
              <span className="font-semibold">
                -${preview.descuentoTotal.toFixed(2)}
              </span>
            </div>
          </div>
          
          {preview.resumenPromociones && (
            <p className="mt-1 text-sm text-green-600">
              {preview.resumenPromociones}
            </p>
          )}
          
          <div className="mt-2 flex flex-wrap gap-1">
            {preview.detalles
              .filter(detalle => detalle.tienePromocion)
              .map((detalle, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {detalle.nombrePromocion || 'Promoción'}
                </span>
              ))
            }
          </div>
        </div>
      </div>
      
      {/* Detalles expandidos */}
      <div className="mt-3 pt-3 border-t border-green-200">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal original:</span>
            <span>${preview.subtotalOriginal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-green-600 font-medium">
            <span>Descuentos aplicados:</span>
            <span>-${preview.descuentoTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-900 font-medium pt-1 border-t border-green-200">
            <span>Subtotal con descuentos:</span>
            <span>${preview.subtotalConDescuentos.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};