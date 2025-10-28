import React from "react";
import { Table, type TableColumn } from "../common/Table";
import { Button } from "../common/Button";
import type { ArticuloManufacturadoResponseDTO } from "../../types/productos/ArticuloManufacturadoResponseDTO";

interface ProductosListProps {
  productos: ArticuloManufacturadoResponseDTO[];
  loading?: boolean;
  onEdit: (producto: ArticuloManufacturadoResponseDTO) => void;
  desactivarProducto: (id: number) => void;
  activarProducto: (id: number) => void;
  onViewDetails: (producto: ArticuloManufacturadoResponseDTO) => void;
  idProductoEnAccion?: number | null;
}

export const ProductosList: React.FC<ProductosListProps> = ({
  productos,
  loading = false,
  onEdit,
  desactivarProducto,
  activarProducto,
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
              className="w-12 h-12 object-cover rounded-lg shadow-sm"
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
      key: "categoria.denominacion",
      title: "Categoría",
      width: "15%",
      render: (_, record) => (
        <span>
          {record.categoria.denominacionCategoriaPadre
            ? `${record.categoria.denominacionCategoriaPadre} > ${record.categoria.denominacion}`
            : record.categoria.denominacion}
        </span>
      ),
    },
    {
      key: "tiempoEstimadoEnMinutos",
      title: "Tiempo",
      width: "8%",
      align: "center",
      render: (value) => (
        <span className="text-sm font-medium text-blue-600">{value} min</span>
      ),
    },
    {
      key: "costoTotal",
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
      render: (value: number) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value >= 3
              ? "bg-green-100 text-green-800"
              : value >= 2
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {value.toFixed(1)}x
        </span>
      ),
    },
    {
      key: "stockSuficiente",
      title: "Stock",
      width: "8%",
      align: "center",
      render: (value: boolean, record) => (
        <div className="flex flex-col items-center">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {value ? "OK" : "Falta"}
          </span>
          <span className="text-xs text-gray-500 mt-1">
            Max: {record.cantidadMaximaPreparable}
          </span>
        </div>
      ),
    },
    {
      key: "acciones",
      title: "Acciones",
      width: "11%",
      align: "center",
      render: (_, record) => (
        <div className="flex justify-center space-x-1">
          {record.eliminado ? (
            <Button
              size="sm"
              className="bg-blue-100 text-blue-800 hover:bg-blue-200"
              onClick={() => activarProducto(record.idArticulo)}
              title="Activar producto"
              disabled={idProductoEnAccion === record.idArticulo}
            >
              {idProductoEnAccion === record.idArticulo ? "..." : "Activar"}
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onViewDetails(record)}
                title="Ver detalles"
              >
                Ver
              </Button>
              <Button size="sm" variant="outline" onClick={() => onEdit(record)}>
                Editar
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => desactivarProducto(record.idArticulo)}
                disabled={idProductoEnAccion === record.idArticulo}
              >
                {idProductoEnAccion === record.idArticulo ? "..." : "Eliminar"}
              </Button>
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
        if (record.eliminado) return "bg-gray-400 ";
        if (!record.stockSuficiente) return "bg-red-50";
        return "";
      }}
    />
  );
};
