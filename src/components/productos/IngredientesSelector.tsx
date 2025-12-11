import React, { useState } from "react";
import { Select } from "../common/Select";
import { FormField } from "../common/FormFieldProps";
import { Button } from "../common/Button";
import { Trash2, Plus, AlertCircle } from "lucide-react";
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

    // Validaciones
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

    // Limpiar formulario
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

  // Calcular costo total de ingredientes agregados
  const costoTotal = detalles.reduce((total, detalle) => {
    const insumo = ingredientes.find(
      (ing) => ing.idArticulo === detalle.idArticuloInsumo
    );
    if (insumo) {
      return total + detalle.cantidad * insumo.precioCompra;
    }
    return total;
  }, 0);

  // Información del ingrediente seleccionado
  const cantidadNum = typeof cantidad === "string" ? 0 : cantidad;
  const costoEstimado =
    ingredienteSeleccionado && cantidadNum > 0
      ? cantidadNum * ingredienteSeleccionado.precioCompra
      : 0;

  return (
    <div className="space-y-6">
      {/* FORMULARIO DE AGREGACIÓN */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          ➕ Agregar Ingrediente
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Select de ingredientes */}
          <div>
            <Select
              label="Ingrediente"
              name="ingrediente"
              value={selectedIngredienteId}
              onChange={(value) => {
                setSelectedIngredienteId(value as number);
                setError(null);
              }}
              options={[
                { value: 0, label: "Seleccione un ingrediente" },
                ...ingredientesDisponibles.map((ing) => ({
                  value: ing.idArticulo,
                  label: `${ing.denominacion} (Stock: ${ing.stockActual} ${ing.denominacionUnidadMedida})`,
                })),
              ]}
              placeholder="Seleccione un ingrediente"
              disabled={disabled || ingredientesDisponibles.length === 0}
              helperText={
                ingredientesDisponibles.length === 0
                  ? "No hay ingredientes disponibles"
                  : undefined
              }
            />
          </div>

          {/* Input de cantidad */}
          <div>
            <FormField
              label="Cantidad"
              name="cantidad"
              type="number"
              value={cantidad}
              onChange={(value) =>
                handleCantidadChange(value === "" ? "" : Number(value))
              }
              placeholder="0"
              min={0}
              step={0.01}
              disabled={disabled || !ingredienteSeleccionado}
              helperText={
                ingredienteSeleccionado
                  ? `en ${ingredienteSeleccionado.denominacionUnidadMedida}`
                  : "Seleccione ingrediente"
              }
            />
          </div>

          {/* Botón agregar */}
          <div className="flex flex-col items-stretch justify-end gap-2">
            <Button
              type="button"
              onClick={handleAgregarIngrediente}
              disabled={
                disabled ||
                !ingredienteSeleccionado ||
                cantidadNum <= 0 ||
                ingredientesDisponibles.length === 0
              }
              className="flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </Button>

            {/* Información de costo */}
            {ingredienteSeleccionado && cantidadNum > 0 && (
              <div className="text-center text-sm font-medium text-blue-700 bg-white p-2 rounded border border-blue-200">
                💰 ${costoEstimado.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LISTA DE INGREDIENTES AGREGADOS */}
      {detalles.length > 0 ? (
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <div className="bg-gray-100 px-4 py-3 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              📋 Receta ({detalles.length} ingrediente
              {detalles.length !== 1 ? "s" : ""})
            </h3>
          </div>

          {/* Tabla de ingredientes */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr className="text-sm font-medium text-gray-700">
                  <th className="px-4 py-3 text-left">Ingrediente</th>
                  <th className="px-4 py-3 text-center">Cantidad</th>
                  <th className="px-4 py-3 text-center">Precio Unit.</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {detalles.map((detalle, index) => {
                  const insumo = ingredientes.find(
                    (ing) => ing.idArticulo === detalle.idArticuloInsumo
                  );

                  if (!insumo) return null;

                  const subtotal = detalle.cantidad * insumo.precioCompra;

                  return (
                    <tr
                      key={`${detalle.idArticuloInsumo}-${index}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {insumo.denominacion}
                        </div>
                        <div className="text-xs text-gray-500">
                          {insumo.denominacionUnidadMedida}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
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
                            className="w-20 px-2 py-1 border rounded text-center text-sm"
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        ${insumo.precioCompra.toFixed(2)}
                      </td>

                      <td className="px-4 py-3 text-right font-medium text-green-600">
                        ${subtotal.toFixed(2)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleEliminarIngrediente(index)}
                          disabled={disabled}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar ingrediente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Pie de tabla con totales */}
              <tfoot>
                <tr className="bg-gray-100 border-t-2 font-semibold text-gray-900">
                  <td colSpan={3} className="px-4 py-3 text-right">
                    💰 Costo Total:
                  </td>
                  <td className="px-4 py-3 text-right text-xl text-green-600">
                    ${costoTotal.toFixed(2)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        /* Estado vacío */
        <div className="border rounded-lg p-8 text-center bg-gray-50">
          <div className="text-5xl mb-3">🥘</div>
          <p className="text-lg font-medium text-gray-700">
            No se han agregado ingredientes
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Agregue al menos un ingrediente para crear la receta del producto
          </p>
        </div>
      )}

      {/* Informacion de ingredientes disponibles */}
      {ingredientesDisponibles.length === 0 && detalles.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          ℹ️ Todos los ingredientes disponibles han sido agregados a la receta.
        </div>
      )}
    </div>
  );
};
