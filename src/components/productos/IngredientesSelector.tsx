import React, { useState } from 'react';
import { Select } from '../common/Select';
import { FormField } from '../common/FormFieldProps';
import { Button } from '../common/Button';
import type { ManufacturadoDetalleDTO } from '../../types/productos/ManufacturadoDetalleDTO';
import type { ArticuloInsumoResponseDTO } from '../../types/insumos/ArticuloInsumoResponseDTO';

interface IngredientesSelectorProps {
  ingredientes: ArticuloInsumoResponseDTO[];
  detalles: ManufacturadoDetalleDTO[];
  onDetallesChange: (detalles: ManufacturadoDetalleDTO[]) => void;
  disabled?: boolean;
}

export const IngredientesSelector: React.FC<IngredientesSelectorProps> = ({
  ingredientes,
  detalles,
  onDetallesChange,
  disabled = false,
}) => {
  const [selectedIngredienteId, setSelectedIngredienteId] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(0);

  // Filtrar solo ingredientes para elaborar y que estén activos
  const ingredientesDisponibles = ingredientes.filter(ing => 
    ing.esParaElaborar && !detalles.some(det => det.idArticuloInsumo === ing.idArticulo)
  );

  const ingredienteSeleccionado = ingredientes.find(ing => ing.idArticulo === selectedIngredienteId);

  const handleAgregarIngrediente = () => {
    if (!ingredienteSeleccionado || cantidad <= 0) return;

    const nuevoDetalle: ManufacturadoDetalleDTO = {
      idArticuloInsumo: ingredienteSeleccionado.idArticulo,
      denominacionInsumo: ingredienteSeleccionado.denominacion,
      unidadMedida: ingredienteSeleccionado.denominacionUnidadMedida,
      precioCompraUnitario: ingredienteSeleccionado.precioCompra,
      cantidad: cantidad,
      subtotal: cantidad * ingredienteSeleccionado.precioCompra,
    };

    onDetallesChange([...detalles, nuevoDetalle]);
    setSelectedIngredienteId(0);
    setCantidad(0);
  };

  const handleEliminarIngrediente = (index: number) => {
    const nuevosDetalles = detalles.filter((_, i) => i !== index);
    onDetallesChange(nuevosDetalles);
  };

  const handleCantidadChange = (index: number, nuevaCantidad: number) => {
    if (nuevaCantidad < 0) return;
    
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index] = {
      ...nuevosDetalles[index],
      cantidad: nuevaCantidad,
      subtotal: nuevaCantidad * (nuevosDetalles[index].precioCompraUnitario || 0),
    };
    onDetallesChange(nuevosDetalles);
  };

  const costoTotal = detalles.reduce((total, detalle) => total + (detalle.subtotal || 0), 0);

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Agregar Ingrediente</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            name="ingrediente"
            value={selectedIngredienteId}
            onChange={(value) => setSelectedIngredienteId(value as number)}
            options={ingredientesDisponibles.map(ing => ({
              value: ing.idArticulo,
              label: `${ing.denominacion} (${ing.stockActual} ${ing.denominacionUnidadMedida})`,
              disabled: ing.stockActual <= 0,
            }))}
            placeholder="Seleccione un ingrediente"
            disabled={disabled}
          />

          <div>
            <FormField
              label="Cantidad"
              name="cantidad"
              type="number"
              value={cantidad}
              onChange={(value) => setCantidad(value as number)}
              placeholder="0"
              min={0}
              step={0.01}
              disabled={disabled || !ingredienteSeleccionado}
              helperText={ingredienteSeleccionado ? `En ${ingredienteSeleccionado.denominacionUnidadMedida}` : ''}
            />
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleAgregarIngrediente}
              disabled={disabled || !ingredienteSeleccionado || cantidad <= 0}
              className="w-full"
            >
              Agregar
            </Button>
          </div>
        </div>

        {ingredienteSeleccionado && cantidad > 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-md text-sm">
            <strong>Costo:</strong> ${(cantidad * ingredienteSeleccionado.precioCompra).toFixed(2)}
          </div>
        )}
      </div>

      {/* Lista de ingredientes agregados */}
      {detalles.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="text-lg font-medium text-gray-900">Ingredientes de la Receta</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {detalles.map((detalle, index) => (
              <div key={`${detalle.idArticuloInsumo}-${index}`} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <div className="font-medium text-gray-900">{detalle.denominacionInsumo}</div>
                      <div className="text-sm text-gray-500">${detalle.precioCompraUnitario?.toFixed(2)} por {detalle.unidadMedida}</div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <FormField
                        label=""
                        name={`cantidad-${index}`}
                        type="number"
                        value={detalle.cantidad}
                        onChange={(value) => handleCantidadChange(index, value as number)}
                        min={0}
                        step={0.01}
                        disabled={disabled}
                        className="w-24"
                      />
                      <span className="text-sm text-gray-500">{detalle.unidadMedida}</span>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium">${detalle.subtotal?.toFixed(2)}</div>
                    </div>
                    
                    <div className="text-right">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleEliminarIngrediente(index)}
                        disabled={disabled}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 px-4 py-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">Costo Total de Ingredientes:</span>
              <span className="text-xl font-bold text-green-600">${costoTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {detalles.length === 0 && (
        <div className="border rounded-lg p-8 text-center text-gray-500">
          <div className="text-4xl mb-2">🍳</div>
          <p>No se han agregado ingredientes</p>
          <p className="text-sm">Agregue al menos un ingrediente para crear el producto</p>
        </div>
      )}
    </div>
  );
};