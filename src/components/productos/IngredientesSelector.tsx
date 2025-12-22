import React, { useState } from "react";
import { Select } from "../common/Select";
import { FormField } from "../common/FormFieldProps";
import { Button } from "../common/Button";
import { Trash2, Plus, AlertCircle, ChefHat } from "lucide-react";
import type { DetalleManufacturadoRequestDTO } from "../../types/productos/DetalleManufacturadoRequestDTO";
import type { ArticuloInsumoResponseDTO } from "../../types/insumos/ArticuloInsumoResponseDTO";

interface IngredientesSelectorProps {
  ingredientes: ArticuloInsumoResponseDTO[];
  detalles: DetalleManufacturadoRequestDTO[];
  onDetallesChange: (detalles: DetalleManufacturadoRequestDTO[]) => void;
  disabled?: boolean;
}

export const IngredientesSelector: React.FC<IngredientesSelectorProps> = ({
  ingredientes,
  detalles,
  onDetallesChange,
  disabled = false,
}) => {
  const [selectedIngredienteId, setSelectedIngredienteId] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number | "">(0);
  const [error, setError] = useState<string | null>(null);

  // Filtrar solo ingredientes para elaborar y que no estén ya agregados
  const ingredientesDisponibles = ingredientes.filter(
    (ing) =>
      ing.esParaElaborar &&
      !ing.eliminado &&
      !detalles.some((det) => det.idArticuloInsumo === ing.idArticulo) &&
      ing.stockActual > 0
  );

  const ingredienteSeleccionado = ingredientes.find(
    (ing) => ing.idArticulo === selectedIngredienteId
  );

  const handleAgregarIngrediente = () => {
    setError(null);

    if (!selectedIngredienteId) {
      setError("Debe seleccionar un ingrediente");
      return;
    }

    if (!ingredienteSeleccionado) {
      setError("Ingrediente no encontrado");
      return;
    }

    const cantidadNum = typeof cantidad === "string" ? 0 : cantidad;

    if (cantidadNum <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    if (cantidadNum > ingredienteSeleccionado.stockActual) {
      setError(
        `Stock insuficiente. Disponible: ${ingredienteSeleccionado.stockActual} ${ingredienteSeleccionado.denominacionUnidadMedida}`
      );
      return;
    }

    const nuevoDetalle: DetalleManufacturadoRequestDTO = {
      idArticuloInsumo: ingredienteSeleccionado.idArticulo,
      cantidad: cantidadNum,
    };

    onDetallesChange([...detalles, nuevoDetalle]);

    setSelectedIngredienteId(0);
    setCantidad(0);
    setError(null);
  };

  const handleEliminarIngrediente = (index: number) => {
    const nuevosDetalles = detalles.filter((_, i) => i !== index);
    onDetallesChange(nuevosDetalles);
  };

  const handleCantidadChange = (nuevaCantidad: number | "") => {
    setCantidad(nuevaCantidad);
    setError(null);
  };

  const costoTotal = detalles.reduce((total, detalle) => {
    const insumo = ingredientes.find(
      (ing) => ing.idArticulo === detalle.idArticuloInsumo
    );
    if (insumo) {
      return total + detalle.cantidad * insumo.precioCompra;
    }
    return total;
  }, 0);

  const cantidadNum = typeof cantidad === "string" ? 0 : cantidad;
  const costoEstimado =
    ingredienteSeleccionado && cantidadNum > 0
      ? cantidadNum * ingredienteSeleccionado.precioCompra
      : 0;

  return (
    <div className="space-y-6">
      {/* CARD DE AGREGACIÓN CON MEJOR UI */}
      <div className="border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <ChefHat className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">
            Agregar Ingrediente a la Receta
          </h3>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700 font-medium">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Select de ingredientes */}
          <div className="md:col-span-2">
            <Select
              label="🥘 Selecciona el ingrediente"
              name="ingrediente"
              value={selectedIngredienteId}
              onChange={(value) => {
                setSelectedIngredienteId(value as number);
                setError(null);
              }}
              options={[
                { value: 0, label: "-- Selecciona un ingrediente --" },
                ...ingredientesDisponibles.map((ing) => ({
                  value: ing.idArticulo,
                  label: `${ing.denominacion} (${ing.stockActual} ${ing.denominacionUnidadMedida})`,
                })),
              ]}
              disabled={disabled || ingredientesDisponibles.length === 0}
            />
          </div>

          {/* Input de cantidad */}
          <div>
            <FormField
              label="📏 Cantidad"
              name="cantidad"
              type="number"
              value={cantidad}
              onChange={(value) =>
                handleCantidadChange(value === "" ? "" : Number(value))
              }
              placeholder="0.00"
              min={0}
              step={0.01}
              disabled={disabled || !ingredienteSeleccionado}
            />
          </div>

          {/* Botón agregar alineado al fondo del grid */}
          <div className="self-end w-full">
            <Button
              type="button"
              onClick={handleAgregarIngrediente}
              disabled={
                disabled ||
                !ingredienteSeleccionado ||
                cantidadNum <= 0 ||
                ingredientesDisponibles.length === 0
              }
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 w-full"
            >
              <Plus className="w-5 h-5" />
              Agregar
            </Button>
          </div>
        </div>

        {/* Fila de ayudas debajo del grid para no afectar la alineación */}
        <div className="mt-2 flex justify-between text-xs text-gray-600">
          <span>
            {ingredientesDisponibles.length === 0
              ? "❌ No hay ingredientes disponibles"
              : `✅ ${ingredientesDisponibles.length} disponibles`}
          </span>
          <span>
            {ingredienteSeleccionado
              ? ingredienteSeleccionado.denominacionUnidadMedida
              : "Selecciona"}
          </span>
        </div>

        {/* Costo estimado - se muestra debajo si hay selección */}
        {ingredienteSeleccionado && cantidadNum > 0 && (
          <div className="md:col-span-4">
            <div className="text-center text-sm font-bold text-green-700 bg-green-50 p-2 rounded-lg border-2 border-green-300">
              💰 Costo estimado: ${costoEstimado.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* LISTA DE INGREDIENTES AGREGADOS - MEJOR UI */}
      {detalles.length > 0 ? (
        <div className="border-2 border-orange-200 rounded-xl overflow-hidden shadow-md bg-white">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              📋 Receta
              <span className="bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-semibold">
                {detalles.length}
              </span>
            </h3>
          </div>

          {/* Tabla mejorada */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-orange-50 border-b-2 border-orange-200">
                <tr className="text-sm font-semibold text-orange-900">
                  <th className="px-4 py-4 text-left">🥕 Ingrediente</th>
                  <th className="px-4 py-4 text-center">📊 Cantidad</th>
                  <th className="px-4 py-4 text-center">💲 Precio Unit.</th>
                  <th className="px-4 py-4 text-right">💰 Subtotal</th>
                  <th className="px-4 py-4 text-center">🗑️</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {detalles.map((detalle, index) => {
                  const insumo = ingredientes.find(
                    (ing) => ing.idArticulo === detalle.idArticuloInsumo
                  );

                  if (!insumo) return null;

                  const subtotal = detalle.cantidad * insumo.precioCompra;

                  return (
                    <tr
                      key={`${detalle.idArticuloInsumo}-${index}`}
                      className="hover:bg-orange-50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900">
                          {insumo.denominacion}
                        </div>
                        <div className="text-xs text-gray-500">
                          {insumo.denominacionUnidadMedida}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <input
                          type="number"
                          value={detalle.cantidad}
                          onChange={(e) => {
                            const newDetalles = [...detalles];
                            newDetalles[index] = {
                              ...newDetalles[index],
                              cantidad: Number(e.target.value),
                            };
                            onDetallesChange(newDetalles);
                          }}
                          min={0.01}
                          step={0.01}
                          disabled={disabled}
                          className="w-24 px-3 py-2 border-2 border-orange-200 rounded-lg text-center text-sm font-semibold focus:border-orange-500 focus:outline-none"
                        />
                      </td>

                      <td className="px-4 py-4 text-center text-sm font-medium text-gray-700">
                        ${insumo.precioCompra.toFixed(2)}
                      </td>

                      <td className="px-4 py-4 text-right text-lg font-bold text-green-600">
                        ${subtotal.toFixed(2)}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleEliminarIngrediente(index)}
                          disabled={disabled}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 hover:scale-110"
                          title="Eliminar ingrediente"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Pie de tabla con totales - mejorado */}
              <tfoot>
                <tr className="bg-orange-100 border-t-2 border-orange-300 font-bold text-orange-900">
                  <td colSpan={3} className="px-4 py-4 text-right text-lg">
                    💰 Costo Total de Ingredientes:
                  </td>
                  <td className="px-4 py-4 text-right text-2xl text-green-600">
                    ${costoTotal.toFixed(2)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        /* Estado vacío mejorado */
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center bg-gray-50">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-xl font-semibold text-gray-800">
            Tu receta está vacía
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Comienza agregando ingredientes usando el selector de arriba
          </p>
        </div>
      )}

      {/* Información complementaria */}
      {ingredientesDisponibles.length === 0 && detalles.length > 0 && (
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg text-sm text-blue-700 font-medium">
          ℹ️ Todos los ingredientes disponibles han sido agregados a la receta.
        </div>
      )}
    </div>
  );
};
