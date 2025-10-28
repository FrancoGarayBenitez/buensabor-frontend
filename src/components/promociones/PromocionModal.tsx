import React from 'react';
import { X } from 'lucide-react';

interface PromocionModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: React.ReactNode;
  ancho?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const PromocionModal: React.FC<PromocionModalProps> = ({
  abierto,
  onCerrar,
  titulo,
  children,
  ancho = 'xl'
}) => {
  if (!abierto) return null;

  const anchoClases = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  const handleClickOverlay = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCerrar();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClickOverlay}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full ${anchoClases[ancho]} bg-white rounded-lg shadow-xl`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {titulo}
            </h3>
            <button
              onClick={onCerrar}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};