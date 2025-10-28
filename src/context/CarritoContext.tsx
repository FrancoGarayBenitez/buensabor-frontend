// src/contexts/CarritoContext.tsx
import React, { createContext, useContext, type ReactNode } from 'react';
import { useCarrito, type UseCarritoReturn } from '../hooks/useCarrito';

// Crear el contexto
const CarritoContext = createContext<UseCarritoReturn | undefined>(undefined);

// Provider del contexto
export const CarritoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const carritoData = useCarrito();

  return (
    <CarritoContext.Provider value={carritoData}>
      {children}
    </CarritoContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useCarritoContext = (): UseCarritoReturn => {
  const context = useContext(CarritoContext);
  
  if (context === undefined) {
    throw new Error('useCarritoContext debe ser usado dentro de un CarritoProvider');
  }
  
  return context;
};