import React from "react";
import type { ArticuloShort } from "../../../types/promociones/promocion.types";

interface ArticuloMultiSelectorProps {
  articulosDisponibles: ArticuloShort[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
}

export const ArticuloMultiSelector: React.FC<ArticuloMultiSelectorProps> = ({
  articulosDisponibles,
  selectedIds,
  onSelectionChange,
}) => {
  const handleCheckboxChange = (articuloId: number) => {
    const newSelectedIds = selectedIds.includes(articuloId)
      ? selectedIds.filter((id) => id !== articuloId)
      : [...selectedIds, articuloId];
    onSelectionChange(newSelectedIds);
  };

  return (
    <div className="max-h-60 overflow-y-auto rounded-md border p-4 space-y-2">
      {articulosDisponibles.length > 0 ? (
        articulosDisponibles.map((articulo) => (
          <div key={articulo.id} className="flex items-center">
            <input
              type="checkbox"
              id={`articulo-${articulo.id}`}
              checked={selectedIds.includes(articulo.id)}
              onChange={() => handleCheckboxChange(articulo.id)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label
              htmlFor={`articulo-${articulo.id}`}
              className="ml-3 block text-sm"
              style={{ color: "#443639" }}
            >
              {articulo.denominacion} (${articulo.precioVenta})
            </label>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-500">No hay artículos disponibles.</p>
      )}
    </div>
  );
};
