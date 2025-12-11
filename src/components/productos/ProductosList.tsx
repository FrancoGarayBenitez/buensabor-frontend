import React from "react";
import { Table, type TableColumn } from "../common/Table";
import { Eye, Pencil, Trash2, AlertCircle } from "lucide-react";
import type { ArticuloManufacturadoResponseDTO } from "../../types/productos/ArticuloManufacturadoResponseDTO";

interface ProductosListProps {
  productos: ArticuloManufacturadoResponseDTO[];
  loading?: boolean;
  onEdit: (producto: ArticuloManufacturadoResponseDTO) => void;
  onDelete: (id: number) => void;
  onViewDetails: (producto: ArticuloManufacturadoResponseDTO) => void;
  idProductoEnAccion?: number | null;
}

export const ProductosList: React.FC<ProductosListProps> = ({
  productos,
  loading = false,
  onEdit,
  onDelete,
  onViewDetails,
  idProductoEnAccion,
}) => {
  const columns: TableColumn<ArticuloManufacturadoResponseDTO>[] = [
    {
      key: "imagen",
      title: "Imagen",
      width: "8%",
      align: "center",
      render: (_, record) => (
        <div className="flex justify-center">
          {record.imagenes && record.imagenes.length > 0 ? (
            <img
              src={record.imagenes[0].url}
              alt={record.imagenes[0].denominacion}
              className="w-12 h-12 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  "https://via.placeholder.com/48x48/f3f4f6/6b7280?text=Sin+Imagen";
              }}
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs">📷</span>
            </div>
          )}
        </div>
      ),
    },

    {
      key: "denominacion",
      title: "Producto",
      width: "22%",
      render: (value, record) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          {record.descripcion && (
            <p className="text-sm text-gray-500 truncate max-w-xs">
              {record.descripcion}
            </p>
          )}
        </div>
      ),
    },

    {
      key: "denominacionCategoria",
      title: "Categoría",
      width: "15%",
      render: (_, record) => (
        <span className="text-sm text-gray-700">
          {record.esSubcategoria && record.denominacionCategoriaPadre
            ? `${record.denominacionCategoriaPadre} > ${record.denominacionCategoria}`
            : record.denominacionCategoria}
        </span>
      ),
    },

    {
      key: "tiempoEstimadoEnMinutos",
      title: "Tiempo",
      width: "8%",
      align: "center",
      render: (value) => (
        <span className="text-sm font-medium text-blue-600">⏱ {value} min</span>
      ),
    },

    {
      key: "costoProduccion",
      title: "Costo",
      width: "10%",
      align: "right",
      render: (value: number) => (
        <span className="text-sm font-medium text-gray-700">
          ${value.toFixed(2)}
        </span>
      ),
    },

    {
      key: "precioVenta",
      title: "Precio",
      width: "10%",
      align: "right",
      render: (value: number) => (
        <span className="text-sm font-bold text-green-600">
          ${value.toFixed(2)}
        </span>
      ),
    },

    {
      key: "margenGanancia",
      title: "Margen",
      width: "8%",
      align: "center",
      render: (value: number) => {
        const margenPorcentaje = value * 100;
        return (
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              value >= 3
                ? "bg-green-100 text-green-800"
                : value >= 2
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {margenPorcentaje.toFixed(0)}%
          </span>
        );
      },
    },

    {
      key: "stockSuficiente",
      title: "Stock",
      width: "10%",
      align: "center",
      render: (value: boolean, record) => (
        <div className="flex flex-col items-center gap-1">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
              value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {value ? "✅ OK" : "❌ Falta"}
          </span>
          <span className="text-xs text-gray-500">
            Max: {record.cantidadMaximaPreparable}
          </span>
        </div>
      ),
    },

    {
      key: "acciones",
      title: "Acciones",
      width: "13%",
      align: "center",
      render: (_, record) => (
        <div className="flex justify-center gap-2">
          {record.eliminado ? (
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <AlertCircle className="w-4 h-4" />
              <span>Inactivo</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => onViewDetails(record)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Ver detalles"
              >
                <Eye className="w-4 h-4" />
              </button>

              <button
                onClick={() => onEdit(record)}
                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title="Editar producto"
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button
                onClick={() => onDelete(record.idArticulo)}
                disabled={idProductoEnAccion === record.idArticulo}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Desactivar producto"
              >
                {idProductoEnAccion === record.idArticulo ? (
                  <span className="text-xs">⏳</span>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={productos}
      loading={loading}
      emptyText="No hay productos registrados"
      rowClassName={(record) => {
        if (record.eliminado) return "bg-gray-100 opacity-50";
        if (!record.stockSuficiente) return "bg-red-50";
        return "";
      }}
    />
  );
};
