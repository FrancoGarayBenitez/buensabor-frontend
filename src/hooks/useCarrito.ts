// src/hooks/useCarrito.ts
import { useState, useCallback, useMemo } from 'react';
import type { DatosEntrega } from '../types/auxiliares/DatosEntrega';
import type { ArticuloManufacturadoResponseDTO } from '../types/productos/ArticuloManufacturadoResponseDTO';
import type { ItemCarrito } from '../types/auxiliares/ItemCarrito';

export interface UseCarritoReturn {
  // Estado del carrito
  items: ItemCarrito[];
  cantidadTotal: number;
  subtotal: number;
  costoEnvio: number;
  total: number;
  
  // Datos de entrega
  datosEntrega: DatosEntrega;
  setDatosEntrega: (datos: DatosEntrega) => void;
  
  // Acciones del carrito
  agregarItem: (producto: ArticuloManufacturadoResponseDTO, cantidad?: number) => void;
  removerItem: (idProducto: number) => void;
  actualizarCantidad: (idProducto: number, nuevaCantidad: number) => void;
  incrementarCantidad: (idProducto: number) => void;
  decrementarCantidad: (idProducto: number) => void;
  limpiarCarrito: () => void;
  
  // Utilidades
  obtenerItem: (idProducto: number) => ItemCarrito | undefined;
  estaVacio: boolean;
  tiempoEstimadoTotal: number;
}

export const useCarrito = (): UseCarritoReturn => {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [datosEntrega, setDatosEntrega] = useState<DatosEntrega>({
    tipoEnvio: 'TAKE_AWAY',
    observaciones: ''
  });

  // ==================== CÁLCULOS AUTOMÁTICOS ====================
  const cantidadTotal = useMemo(() => {
    return items.reduce((total, item) => total + item.cantidad, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }, [items]);

  const costoEnvio = useMemo(() => {
    return datosEntrega.tipoEnvio === 'DELIVERY' ? 200 : 0;
  }, [datosEntrega.tipoEnvio]);

  const total = useMemo(() => {
    return subtotal + costoEnvio;
  }, [subtotal, costoEnvio]);

  const estaVacio = useMemo(() => {
    return items.length === 0;
  }, [items]);

  const tiempoEstimadoTotal = useMemo(() => {
    if (items.length === 0) return 0;
    
    const tiempoMaximo = Math.max(
      ...items.map(item => item.tiempoPreparacion || 0)
    );
    
    // Agregar tiempo de delivery si corresponde
    return datosEntrega.tipoEnvio === 'DELIVERY' 
      ? tiempoMaximo + 15 
      : tiempoMaximo;
  }, [items, datosEntrega.tipoEnvio]);

  // ==================== ACCIONES DEL CARRITO ====================
  const agregarItem = useCallback((producto: ArticuloManufacturadoResponseDTO, cantidad: number = 1) => {
    if (!producto.stockSuficiente) {
      console.warn('⚠️ Producto sin stock:', producto.denominacion);
      return;
    }

    setItems(prevItems => {
      const itemExistente = prevItems.find(item => item.id === producto.idArticulo);
      
      if (itemExistente) {
        // Si ya existe, incrementar cantidad
        return prevItems.map(item =>
          item.id === producto.idArticulo
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      } else {
        // Si no existe, agregar nuevo item
        const nuevoItem: ItemCarrito = {
          id: producto.idArticulo,
          nombre: producto.denominacion,
          cantidad,
          precio: producto.precioVenta,
          imagen: producto.imagenes?.[0]?.url,
          tiempoPreparacion: producto.tiempoEstimadoEnMinutos
        };
        
        return [...prevItems, nuevoItem];
      }
    });

    console.log(`✅ Agregado al carrito: ${producto.denominacion} (x${cantidad})`);
  }, []);

  const removerItem = useCallback((idProducto: number) => {
    setItems(prevItems => {
      const itemRemovido = prevItems.find(item => item.id === idProducto);
      if (itemRemovido) {
        console.log(`🗑️ Removido del carrito: ${itemRemovido.nombre}`);
      }
      
      return prevItems.filter(item => item.id !== idProducto);
    });
  }, []);

  const actualizarCantidad = useCallback((idProducto: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      removerItem(idProducto);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === idProducto
          ? { ...item, cantidad: nuevaCantidad }
          : item
      )
    );

    console.log(`🔄 Cantidad actualizada: Producto ${idProducto} = ${nuevaCantidad}`);
  }, [removerItem]);

  const incrementarCantidad = useCallback((idProducto: number) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === idProducto
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      )
    );
  }, []);

  const decrementarCantidad = useCallback((idProducto: number) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === idProducto) {
          const nuevaCantidad = item.cantidad - 1;
          return nuevaCantidad > 0 
            ? { ...item, cantidad: nuevaCantidad }
            : item; // Si llega a 0, lo mantenemos para que se pueda remover explícitamente
        }
        return item;
      }).filter(item => item.cantidad > 0); // Filtrar items con cantidad 0
    });
  }, []);

  const limpiarCarrito = useCallback(() => {
    setItems([]);
    setDatosEntrega({ tipoEnvio: 'TAKE_AWAY', observaciones: '' });

    console.log('🧹 Carrito limpiado');
  }, []);

  // ==================== UTILIDADES ====================
  const obtenerItem = useCallback((idProducto: number) => {
    return items.find(item => item.id === idProducto);
  }, [items]);

  return {
    // Estado del carrito
    items,
    cantidadTotal,
    subtotal,
    costoEnvio,
    total,
    
    // Datos de entrega
    datosEntrega,
    setDatosEntrega,
    
    // Acciones del carrito
    agregarItem,
    removerItem,
    actualizarCantidad,
    incrementarCantidad,
    decrementarCantidad,
    limpiarCarrito,
    
    // Utilidades
    obtenerItem,
    estaVacio,
    tiempoEstimadoTotal
  };
};