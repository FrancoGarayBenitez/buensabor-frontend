import React, { useState, useEffect } from 'react';
import type { DetallePedidoResponseDTO } from '../../types/pedidos';
import { Modal } from '../common/Modal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { RecetaService, type RecetaDetalle } from '../../services/RecetaServices';

interface RecetaModalProps {
  producto: DetallePedidoResponseDTO | null;
  isOpen: boolean;
  onClose: () => void;
}

const getDificultadColor = (tiempoPreparacion: number) => {
  if (tiempoPreparacion <= 10) return 'text-green-700 bg-green-100';
  if (tiempoPreparacion <= 20) return 'text-yellow-700 bg-yellow-100';
  return 'text-red-700 bg-red-100';
};

const getDificultadTexto = (tiempoPreparacion: number) => {
  if (tiempoPreparacion <= 10) return 'Fácil';
  if (tiempoPreparacion <= 20) return 'Medio';
  return 'Complejo';
};

export const RecetaModal: React.FC<RecetaModalProps> = ({
  producto,
  isOpen,
  onClose
}) => {
  const [receta, setReceta] = useState<RecetaDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recetaService = new RecetaService();

  // Cargar receta cuando se abre el modal
  useEffect(() => {
    if (isOpen && producto) {
      cargarReceta(producto);
    }
  }, [isOpen, producto]);

  const cargarReceta = async (producto: DetallePedidoResponseDTO) => {
    setLoading(true);
    setError(null);
    try {
      const recetaObtenida = await recetaService.obtenerRecetaPorDetallePedido(producto);
      setReceta(recetaObtenida);
    } catch (err) {
      setError('Error al cargar la receta');
      console.error('Error cargando receta:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!producto) return null;

  const tiempoTotal = receta ? RecetaService.calcularTiempoTotal(receta, producto.cantidad) : producto.tiempoPreparacion;
  const esCompleja = receta ? RecetaService.esRecetaCompleja(receta) : false;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
            <span className="ml-3 text-gray-600">Cargando receta...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-500 text-lg mb-4">❌ {error}</div>
            <button
              onClick={() => cargarReceta(producto)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Reintentar
            </button>
          </div>
        ) : receta ? (
          <>
            {/* Header de la receta */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">
                {receta.imagen.startsWith('http') ? (
                  <img 
                    src={receta.imagen} 
                    alt={receta.denominacion}
                    className="w-24 h-24 mx-auto rounded-full object-cover"
                  />
                ) : (
                  <span>{receta.imagen}</span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {receta.denominacion}
              </h2>
              <p className="text-gray-600 mb-4">{receta.descripcion}</p>
              
              <div className="flex justify-center gap-4 text-sm flex-wrap">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  ⏱️ {tiempoTotal} min
                </span>
                <span className={`px-3 py-1 rounded-full ${getDificultadColor(receta.tiempoPreparacion)}`}>
                  📊 {getDificultadTexto(receta.tiempoPreparacion)}
                </span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                  🔢 Cantidad: {producto.cantidad}
                </span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  🏷️ {receta.categoria}
                </span>
                {esCompleja && (
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                    ⚠️ Receta Compleja
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ingredientes */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  🧄 Ingredientes
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm">
                    {receta.ingredientes.length} items
                  </span>
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <ul className="space-y-3">
                    {receta.ingredientes.map((ingrediente, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <span className="text-gray-700 flex-1">
                          {ingrediente.nombre}
                        </span>
                        <div className="text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded ml-2">
                          {producto.cantidad > 1 ? (
                            <div className="text-center">
                              <div className="text-xs text-gray-500">
                                {ingrediente.cantidad} {ingrediente.unidadMedida} × {producto.cantidad}
                              </div>
                              <div className="font-bold text-blue-600">
                                = {ingrediente.cantidadRequerida} {ingrediente.unidadMedida}
                              </div>
                            </div>
                          ) : (
                            `${ingrediente.cantidad} ${ingrediente.unidadMedida}`
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Instrucciones */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  📋 Instrucciones
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm">
                    {receta.instrucciones.length} pasos
                  </span>
                </h3>
                
                <div className="space-y-3">
                  {receta.instrucciones.map((paso, index) => (
                    <div key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <p className="text-gray-700 text-sm leading-relaxed pt-0.5">
                        {paso}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Preparación completa (si está disponible) */}
            {receta.preparacion && receta.preparacion !== 'No hay instrucciones específicas disponibles.' && (
              <div className="mt-6 bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <h3 className="font-medium text-amber-800 mb-2">📝 Instrucciones Detalladas</h3>
                <p className="text-sm text-amber-700 whitespace-pre-line">
                  {receta.preparacion}
                </p>
              </div>
            )}

            {/* Información adicional para múltiples cantidades */}
            {producto.cantidad > 1 && (
              <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">📏 Preparación para {producto.cantidad} unidades</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Tiempo base por unidad: <strong>{receta.tiempoPreparacion} min</strong></p>
                  <p>• Tiempo total estimado: <strong>{tiempoTotal} min</strong></p>
                  <p>• Las cantidades de ingredientes ya están calculadas para {producto.cantidad} unidades</p>
                  {esCompleja && (
                    <p className="text-orange-700">• ⚠️ Receta compleja: requiere atención especial para múltiples unidades</p>
                  )}
                </div>
              </div>
            )}

            {/* Botón para volver */}
            <div className="flex justify-center mt-8">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors flex items-center gap-2"
              >
                ← Volver al Pedido
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No se pudo cargar la receta</p>
          </div>
        )}
      </div>
    </Modal>
  );
};        