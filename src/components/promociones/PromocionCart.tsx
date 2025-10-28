import React from 'react';
import { 
  Edit, 
  Trash2, 
  Power, 
  PowerOff, 
  Calendar, 
  Clock, 
  Percent, 
  DollarSign,
  Tag,
  Users,
  Eye
} from 'lucide-react';
import type { PromocionResponseDTO } from '../../types/promociones';

interface PromocionCardProps {
  promocion: PromocionResponseDTO;
  onEditar: () => void;
  onEliminar: () => void;
  onToggleEstado: () => void;
  procesando?: boolean;
}

export const PromocionCard: React.FC<PromocionCardProps> = ({
  promocion,
  onEditar,
  onEliminar,
  onToggleEstado,
  procesando = false
}) => {

  const getEstadoColor = () => {
    if (!promocion.activo) return 'bg-gray-100 text-gray-600 border-gray-200';
    if (promocion.estaVigente) return 'bg-green-100 text-green-700 border-green-200';
    if (promocion.estadoDescripcion.includes('inicia')) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getTipoIcon = () => {
    return promocion.tipoDescuento === 'PORCENTUAL' ? (
      <Percent className="w-4 h-4" />
    ) : (
      <DollarSign className="w-4 h-4" />
    );
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatearHora = (hora: string) => {
    return hora.slice(0, 5); // "HH:mm:ss" -> "HH:mm"
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Header de la card */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {promocion.denominacion}
            </h3>
            {promocion.descripcionDescuento && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {promocion.descripcionDescuento}
              </p>
            )}
          </div>
          
          {/* Estado */}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColor()}`}>
            {promocion.estadoDescripcion}
          </span>
        </div>
      </div>

      {/* Información principal */}
      <div className="p-4 space-y-3">
        
        {/* Tipo y valor del descuento */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${
              promocion.tipoDescuento === 'PORCENTUAL' 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-green-100 text-green-600'
            }`}>
              {getTipoIcon()}
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {promocion.tipoDescuento === 'PORCENTUAL' ? 'Descuento' : 'Descuento fijo'}
              </p>
              <p className="font-semibold text-gray-900">
                {promocion.tipoDescuento === 'PORCENTUAL' 
                  ? `${promocion.valorDescuento}%`
                  : `$${promocion.valorDescuento}`
                }
              </p>
            </div>
          </div>

          {/* Cantidad mínima */}
          {promocion.cantidadMinima > 1 && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Mín. cantidad</p>
              <p className="text-sm font-medium text-gray-700">
                {promocion.cantidadMinima}
              </p>
            </div>
          )}
        </div>

        {/* Período de validez */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>
              Del {formatearFecha(promocion.fechaDesde)} al {formatearFecha(promocion.fechaHasta)}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              De {formatearHora(promocion.horaDesde)} a {formatearHora(promocion.horaHasta)}
            </span>
          </div>
        </div>

        {/* Productos incluidos */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Tag className="w-4 h-4" />
          <span>
            {promocion.articulos.length} producto{promocion.articulos.length !== 1 ? 's' : ''} incluido{promocion.articulos.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Lista de productos (máximo 3 visibles) */}
        {promocion.articulos.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="space-y-1">
              {promocion.articulos.slice(0, 3).map((articulo, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate flex-1">
                    {articulo.denominacion}
                  </span>
                  <span className="text-gray-500 ml-2">
                    ${articulo.precioVenta}
                  </span>
                </div>
              ))}
              {promocion.articulos.length > 3 && (
                <p className="text-xs text-gray-500 italic">
                  +{promocion.articulos.length - 3} producto{promocion.articulos.length - 3 !== 1 ? 's' : ''} más
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={onEditar}
            disabled={procesando}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <Edit className="w-3 h-3 mr-1" />
            Editar
          </button>
          
          <button
            onClick={onToggleEstado}
            disabled={procesando}
            className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
              promocion.activo
                ? 'text-red-700 bg-red-100 hover:bg-red-200'
                : 'text-green-700 bg-green-100 hover:bg-green-200'
            }`}
          >
            {procesando ? (
              <div className="animate-spin w-3 h-3 mr-1 border border-current border-t-transparent rounded-full" />
            ) : promocion.activo ? (
              <PowerOff className="w-3 h-3 mr-1" />
            ) : (
              <Power className="w-3 h-3 mr-1" />
            )}
            {promocion.activo ? 'Desactivar' : 'Activar'}
          </button>
        </div>

        <button
          onClick={onEliminar}
          disabled={procesando}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Eliminar
        </button>
      </div>
    </div>
  );
};