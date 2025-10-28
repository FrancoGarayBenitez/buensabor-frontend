import React, { useState, useEffect } from 'react';
import { Tag, Percent, DollarSign, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { PromocionResponseDTO } from '../../types/promociones';

interface PromocionSelectorProps {
  idArticulo: number;
  cantidad: number;
  promocionesDisponibles: PromocionResponseDTO[];
  promocionSeleccionada?: number;
  onSeleccionarPromocion: (idPromocion: number | undefined) => void;
  disabled?: boolean;
}

export const PromocionSelector: React.FC<PromocionSelectorProps> = ({
  idArticulo,
  cantidad,
  promocionesDisponibles,
  promocionSeleccionada,
  onSeleccionarPromocion,
  disabled = false
}) => {
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  // Filtrar promociones aplicables según la cantidad
  const promocionesAplicables = promocionesDisponibles.filter(
    promo => promo.estaVigente && promo.activo && cantidad >= promo.cantidadMinima
  );

  // Encontrar la promoción seleccionada
  const promocionActual = promocionesAplicables.find(p => p.idPromocion === promocionSeleccionada);

  // Calcular el descuento estimado
  const calcularDescuentoEstimado = (promocion: PromocionResponseDTO, precio: number): number => {
    if (promocion.tipoDescuento === 'PORCENTUAL') {
      return (precio * cantidad * promocion.valorDescuento) / 100;
    } else {
      return Math.min(promocion.valorDescuento * cantidad, precio * cantidad);
    }
  };

  // Formatear información de la promoción
  const formatearPromocion = (promocion: PromocionResponseDTO) => {
    const textoDescuento = promocion.tipoDescuento === 'PORCENTUAL' 
      ? `${promocion.valorDescuento}% de descuento`
      : `$${promocion.valorDescuento} de descuento`;
    
    return {
      texto: textoDescuento,
      icono: promocion.tipoDescuento === 'PORCENTUAL' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />
    };
  };

  if (promocionesAplicables.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No hay promociones disponibles para este producto
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selector principal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Tag className="w-4 h-4 inline mr-1" />
          Promociones disponibles
        </label>
        
        <select
          value={promocionSeleccionada || ''}
          onChange={(e) => onSeleccionarPromocion(e.target.value ? parseInt(e.target.value) : undefined)}
          disabled={disabled}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Sin promoción</option>
          {promocionesAplicables.map(promocion => {
            const { texto } = formatearPromocion(promocion);
            return (
              <option key={promocion.idPromocion} value={promocion.idPromocion}>
                {promocion.denominacion} - {texto}
              </option>
            );
          })}
        </select>
      </div>

      {/* Información de la promoción seleccionada */}
      {promocionActual && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-green-700">
                {formatearPromocion(promocionActual).icono}
                <span className="font-medium">{promocionActual.denominacion}</span>
              </div>
              {promocionActual.cantidadMinima > 1 && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  Mín. {promocionActual.cantidadMinima}
                </span>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => setMostrarDetalles(!mostrarDetalles)}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              {mostrarDetalles ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Descripción breve */}
          {promocionActual.descripcionDescuento && (
            <p className="text-sm text-green-600 mt-1">
              {promocionActual.descripcionDescuento}
            </p>
          )}

          {/* Estimación de ahorro */}
          <div className="text-sm font-medium text-green-700 mt-2">
            Ahorro estimado: $
            {calcularDescuentoEstimado(promocionActual, 100).toFixed(0)}
            {promocionActual.tipoDescuento === 'PORCENTUAL' && ' aprox.'}
          </div>

          {/* Detalles expandidos */}
          {mostrarDetalles && (
            <div className="mt-3 pt-3 border-t border-green-200 space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    Vigencia
                  </div>
                  <div className="text-gray-800">
                    {new Date(promocionActual.fechaDesde).toLocaleDateString('es-AR')} - {' '}
                    {new Date(promocionActual.fechaHasta).toLocaleDateString('es-AR')}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <Clock className="w-3 h-3 mr-1" />
                    Horario
                  </div>
                  <div className="text-gray-800">
                    {promocionActual.horaDesde.slice(0, 5)} - {promocionActual.horaHasta.slice(0, 5)}
                  </div>
                </div>
              </div>

              {promocionActual.cantidadMinima > 1 && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Cantidad mínima:</span>
                  <span className="ml-1 text-gray-600">{promocionActual.cantidadMinima} unidades</span>
                </div>
              )}

              <div className="text-xs text-gray-500">
                Estado: {promocionActual.estadoDescripcion}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de otras promociones disponibles */}
      {promocionesAplicables.length > 1 && !mostrarDetalles && (
        <div className="text-xs text-gray-500">
          {promocionesAplicables.length - (promocionActual ? 1 : 0)} promoción{promocionesAplicables.length - (promocionActual ? 1 : 0) !== 1 ? 'es' : ''} más disponible{promocionesAplicables.length - (promocionActual ? 1 : 0) !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};