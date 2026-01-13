import React, { useState, useMemo } from "react";
import type {
  ArticuloShort,
  PromocionDetalleRequest,
} from "../../types/promociones/promocion.types";
import { Button } from "../common/Button";
import { Select } from "../common/Select";
import { TrashIcon } from "@heroicons/react/24/outline";

// ==================== PROPS DEL COMPONENTE ====================

interface PromocionDetalleEditorProps {
  articulosDisponibles: ArticuloShort[];
  detalles: Array<{ idArticulo: number; cantidad: number }>;
  onDetallesChange: (
    detalles: Array<{ idArticulo: number; cantidad: number }>
  ) => void;
  disableCantidadEdicion?: boolean; // ✅ NUEVA PROP
}

// ==================== COMPONENTE PRINCIPAL ====================

export const PromocionDetalleEditor: React.FC<PromocionDetalleEditorProps> = ({
  articulosDisponibles,
  detalles,
  onDetallesChange,
  disableCantidadEdicion = false,
}) => {
  // Estado para el ID del artículo seleccionado en el dropdown
  const [articuloToAddId, setArticuloToAddId] = useState<string>("");

  // Memoizar un mapa de artículos por ID para un acceso rápido al nombre
  const articulosMap = useMemo(() => {
    return new Map(articulosDisponibles.map((a) => [a.id, a]));
  }, [articulosDisponibles]);

  // Memoizar la lista de artículos que se pueden añadir (excluyendo los ya seleccionados)
  const articulosParaAgregar = useMemo(() => {
    const idsSeleccionados = new Set(detalles.map((d) => d.idArticulo));
    return articulosDisponibles.filter((a) => !idsSeleccionados.has(a.id));
  }, [articulosDisponibles, detalles]);

  // ==================== MANEJADORES ====================

  const handleAddArticulo = () => {
    const id = parseInt(articuloToAddId, 10);
    if (!id || isNaN(id)) return;

    const yaExiste = detalles.some((d) => d.idArticulo === id);
    if (yaExiste) return;

    const nuevoDetalle: PromocionDetalleRequest = {
      idArticulo: id,
      cantidad: 1, // Cantidad por defecto
    };

    onDetallesChange([...detalles, nuevoDetalle]);
    setArticuloToAddId(""); // Resetear el dropdown
  };

  const handleRemoveArticulo = (idArticulo: number) => {
    const nuevosDetalles = detalles.filter((d) => d.idArticulo !== idArticulo);
    onDetallesChange(nuevosDetalles);
  };

  const handleCantidadChange = (idArticulo: number, cantidad: number) => {
    const nuevaCantidad = Math.max(1, cantidad); // Asegurar que la cantidad sea al menos 1
    const nuevosDetalles = detalles.map((d) =>
      d.idArticulo === idArticulo ? { ...d, cantidad: nuevaCantidad } : d
    );
    onDetallesChange(nuevosDetalles);
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* SECCIÓN PARA AÑADIR ARTÍCULOS */}
      <div className="flex items-end space-x-4">
        <div className="flex-grow">
          <Select
            label="Seleccionar Artículo"
            name="articulo-selector"
            value={articuloToAddId}
            onChange={(value) => setArticuloToAddId(String(value))}
            options={articulosParaAgregar.map((a) => ({
              value: a.id.toString(),
              label: `${a.denominacion} ($${a.precioVenta})`,
            }))}
            placeholder="-- Elija un artículo para añadir --"
          />
        </div>
        <Button
          type="button"
          onClick={handleAddArticulo}
          disabled={!articuloToAddId}
        >
          Añadir
        </Button>
      </div>

      {/* LISTA DE ARTÍCULOS SELECCIONADOS */}
      <div className="mt-4 space-y-3">
        {detalles.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            No hay artículos en la promoción.
          </p>
        ) : (
          detalles.map((detalle) => {
            const articulo = articulosMap.get(detalle.idArticulo);
            if (!articulo) return null;

            return (
              <div
                key={detalle.idArticulo}
                className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
              >
                <span className="font-medium text-gray-800 flex-shrink-0 mr-4">
                  {articulo.denominacion}
                </span>
                <div className="flex items-center gap-3 flex-1 ml-auto">
                  <label className="text-sm font-medium text-gray-700 min-w-[80px]">
                    Cantidad:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={detalle.cantidad}
                    onChange={(e) =>
                      handleCantidadChange(
                        detalle.idArticulo,
                        Number(e.target.value)
                      )
                    }
                    // ✅ DESHABILITAR SI ES PROMOCIÓN FLEXIBLE
                    disabled={disableCantidadEdicion}
                    className={`w-20 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      disableCantidadEdicion
                        ? "bg-gray-100 cursor-not-allowed"
                        : "bg-white"
                    }`}
                  />
                  {disableCantidadEdicion && (
                    <span className="text-xs text-gray-500 italic">
                      (Fijo en 1 para promociones flexibles)
                    </span>
                  )}
                </div>
                <div className="flex items-center ml-4">
                  <button
                    type="button"
                    onClick={() => handleRemoveArticulo(detalle.idArticulo)}
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                    title="Eliminar artículo"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
