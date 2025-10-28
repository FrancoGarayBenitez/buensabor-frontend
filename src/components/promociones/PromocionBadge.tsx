// src/components/promociones/PromocionBadge.tsx - COMPONENTE REUTILIZABLE
import React from 'react';
import { Tag, Percent, DollarSign, Star, Clock, Flame } from 'lucide-react';
import type { PromocionResponseDTO } from '../../types/promociones';

interface PromocionBadgeProps {
  promocion: PromocionResponseDTO;
  precioOriginal: number;
  cantidad?: number;
  variant?: 'small' | 'medium' | 'large' | 'floating';
  showDetails?: boolean;
  className?: string;
  onClick?: () => void;
}

export const PromocionBadge: React.FC<PromocionBadgeProps> = ({
  promocion,
  precioOriginal,
  cantidad = 1,
  variant = 'medium',
  showDetails = false,
  className = '',
  onClick
}) => {

  // ==================== CÁLCULOS ====================
  
  const calcularDescuento = () => {
    const total = precioOriginal * cantidad;
    
    if (promocion.tipoDescuento === 'PORCENTUAL') {
      return total * (promocion.valorDescuento / 100);
    } else {
      return Math.min(promocion.valorDescuento * cantidad, total);
    }
  };

  const calcularPrecioFinal = () => {
    return precioOriginal - (calcularDescuento() / cantidad);
  };

  const obtenerPorcentajeDescuento = () => {
    if (promocion.tipoDescuento === 'PORCENTUAL') {
      return promocion.valorDescuento;
    } else {
      return (promocion.valorDescuento / precioOriginal) * 100;
    }
  };

  // ==================== CONFIGURACIONES POR VARIANTE ====================
  
  const getVariantConfig = () => {
    switch (variant) {
      case 'small':
        return {
          containerClass: 'px-2 py-1 text-xs',
          iconSize: 'w-3 h-3',
          textSize: 'text-xs',
          showIcon: false
        };
      case 'medium':
        return {
          containerClass: 'px-3 py-1.5 text-sm',
          iconSize: 'w-4 h-4',
          textSize: 'text-sm',
          showIcon: true
        };
      case 'large':
        return {
          containerClass: 'px-4 py-2 text-base',
          iconSize: 'w-5 h-5',
          textSize: 'text-base',
          showIcon: true
        };
      case 'floating':
        return {
          containerClass: 'px-3 py-2 text-sm shadow-lg',
          iconSize: 'w-4 h-4',
          textSize: 'text-sm',
          showIcon: true
        };
      default:
        return {
          containerClass: 'px-3 py-1.5 text-sm',
          iconSize: 'w-4 h-4',
          textSize: 'text-sm',
          showIcon: true
        };
    }
  };

  const getColorConfig = () => {
    const porcentaje = obtenerPorcentajeDescuento();
    
    if (porcentaje >= 30) {
      return {
        bg: 'bg-red-500',
        text: 'text-white',
        border: 'border-red-600',
        icon: Flame
      };
    } else if (porcentaje >= 15) {
      return {
        bg: 'bg-orange-500',
        text: 'text-white',
        border: 'border-orange-600',
        icon: Star
      };
    } else {
      return {
        bg: 'bg-green-500',
        text: 'text-white',
        border: 'border-green-600',
        icon: Tag
      };
    }
  };

  // ==================== CONFIGURACIÓN FINAL ====================
  
  const variantConfig = getVariantConfig();
  const colorConfig = getColorConfig();
  const IconComponent = promocion.tipoDescuento === 'PORCENTUAL' ? Percent : DollarSign;
  const SpecialIcon = colorConfig.icon;
  
  const descuento = calcularDescuento();
  const precioFinal = calcularPrecioFinal();
  const porcentajeDescuento = obtenerPorcentajeDescuento();

  // ==================== TEXTOS ====================
  
  const getTextoDescuento = () => {
    if (promocion.tipoDescuento === 'PORCENTUAL') {
      return `${promocion.valorDescuento}% OFF`;
    } else {
      return `$${promocion.valorDescuento} OFF`;
    }
  };

  const getTextoAhorro = () => {
    return `Ahorras $${descuento.toFixed(0)}`;
  };

  // ==================== COMPONENTE BÁSICO ====================
  
  if (!showDetails) {
    return (
      <div 
        className={`
          inline-flex items-center rounded-full font-bold border-2 cursor-pointer
          transition-all duration-200 hover:scale-105 transform
          ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}
          ${variantConfig.containerClass}
          ${className}
        `}
        onClick={onClick}
        title={promocion.denominacion}
      >
        {variantConfig.showIcon && (
          <IconComponent className={`${variantConfig.iconSize} mr-1`} />
        )}
        <span className={`font-bold ${variantConfig.textSize}`}>
          {getTextoDescuento()}
        </span>
      </div>
    );
  }

  // ==================== COMPONENTE DETALLADO ====================
  
  return (
    <div 
      className={`
        bg-white rounded-lg border-2 shadow-md overflow-hidden cursor-pointer
        transition-all duration-200 hover:shadow-lg hover:scale-105 transform
        ${colorConfig.border}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header con descuento */}
      <div className={`${colorConfig.bg} ${colorConfig.text} p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SpecialIcon className="w-5 h-5" />
            <span className="font-bold text-lg">
              {getTextoDescuento()}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-90">Ahorras</div>
            <div className="font-bold">${descuento.toFixed(0)}</div>
          </div>
        </div>
      </div>

      {/* Cuerpo con detalles */}
      <div className="p-3">
        <h4 className="font-semibold text-gray-800 mb-2 truncate">
          {promocion.denominacion}
        </h4>
        
        {promocion.descripcionDescuento && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {promocion.descripcionDescuento}
          </p>
        )}

        {/* Precios */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Precio original:</span>
            <span className="line-through text-gray-400">
              ${precioOriginal.toFixed(0)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">Precio final:</span>
            <span className="text-lg font-bold text-[#CD6C50]">
              ${precioFinal.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Información adicional */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            {promocion.tipoDescuento === 'PORCENTUAL' ? (
              <Percent className="w-3 h-3 mr-1" />
            ) : (
              <DollarSign className="w-3 h-3 mr-1" />
            )}
            <span>
              {promocion.tipoDescuento === 'PORCENTUAL' ? 'Porcentual' : 'Fijo'}
            </span>
          </div>
          
          {promocion.cantidadMinima > 1 && (
            <div className="flex items-center">
              <span>Mín. {promocion.cantidadMinima}</span>
            </div>
          )}
        </div>

        {/* Estado de vigencia */}
        <div className="mt-2 flex items-center text-xs">
          <div className={`w-2 h-2 rounded-full mr-1 ${
            promocion.estaVigente ? 'bg-green-400' : 'bg-yellow-400'
          }`}></div>
          <span className={promocion.estaVigente ? 'text-green-600' : 'text-yellow-600'}>
            {promocion.estaVigente ? 'Vigente ahora' : promocion.estadoDescripcion}
          </span>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPONENTE LISTA DE BADGES ====================

interface PromocionBadgeListProps {
  promociones: PromocionResponseDTO[];
  precioOriginal: number;
  cantidad?: number;
  maxVisible?: number;
  variant?: 'small' | 'medium' | 'large' | 'floating';
  onBadgeClick?: (promocion: PromocionResponseDTO) => void;
  className?: string;
}

export const PromocionBadgeList: React.FC<PromocionBadgeListProps> = ({
  promociones,
  precioOriginal,
  cantidad = 1,
  maxVisible = 3,
  variant = 'medium',
  onBadgeClick,
  className = ''
}) => {
  if (!promociones || promociones.length === 0) {
    return null;
  }

  // Ordenar por mejor descuento
  const promocionesOrdenadas = [...promociones].sort((a, b) => {
    const getDescuentoValue = (promo: PromocionResponseDTO) => {
      if (promo.tipoDescuento === 'PORCENTUAL') {
        return promo.valorDescuento;
      } else {
        return (promo.valorDescuento / precioOriginal) * 100;
      }
    };
    
    return getDescuentoValue(b) - getDescuentoValue(a);
  });

  const promocionesVisibles = promocionesOrdenadas.slice(0, maxVisible);
  const promocionesOcultas = promocionesOrdenadas.length - maxVisible;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {promocionesVisibles.map((promocion) => (
        <PromocionBadge
          key={promocion.idPromocion}
          promocion={promocion}
          precioOriginal={precioOriginal}
          cantidad={cantidad}
          variant={variant}
          onClick={() => onBadgeClick?.(promocion)}
        />
      ))}
      
      {promocionesOcultas > 0 && (
        <div className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
          +{promocionesOcultas} más
        </div>
      )}
    </div>
  );
};

// ==================== COMPONENTE PROMOCIÓN DESTACADA ====================

interface PromocionDestacadaProps {
  promocion: PromocionResponseDTO;
  precioOriginal: number;
  onAplicar: () => void;
  className?: string;
}

export const PromocionDestacada: React.FC<PromocionDestacadaProps> = ({
  promocion,
  precioOriginal,
  onAplicar,
  className = ''
}) => {
  const descuento = promocion.tipoDescuento === 'PORCENTUAL'
    ? (precioOriginal * promocion.valorDescuento) / 100
    : Math.min(promocion.valorDescuento, precioOriginal);

  const precioFinal = precioOriginal - descuento;
  const porcentajeDescuento = (descuento / precioOriginal) * 100;

  return (
    <div className={`
      bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl p-4 shadow-xl
      transform hover:scale-105 transition-all duration-200 cursor-pointer
      ${className}
    `} onClick={onAplicar}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Flame className="w-6 h-6" />
          <span className="font-bold text-lg">¡OFERTA ESPECIAL!</span>
        </div>
        <div className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-sm font-bold">
          {porcentajeDescuento.toFixed(0)}% OFF
        </div>
      </div>

      {/* Contenido */}
      <div className="mb-3">
        <h3 className="font-bold text-xl mb-1">{promocion.denominacion}</h3>
        {promocion.descripcionDescuento && (
          <p className="text-white text-opacity-90 text-sm">
            {promocion.descripcionDescuento}
          </p>
        )}
      </div>

      {/* Precios */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-white text-opacity-75 text-sm line-through">
            Antes: ${precioOriginal.toFixed(0)}
          </div>
          <div className="text-2xl font-bold">
            Ahora: ${precioFinal.toFixed(0)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-white text-opacity-75 text-sm">Ahorras</div>
          <div className="text-xl font-bold">${descuento.toFixed(0)}</div>
        </div>
      </div>

      {/* Call to action */}
      <div className="mt-3 bg-white bg-opacity-20 rounded-lg p-2 text-center">
        <span className="font-medium text-sm">¡Toca para aplicar esta oferta!</span>
      </div>
    </div>
  );
};

export default PromocionBadge;