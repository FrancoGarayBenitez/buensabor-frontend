import React, { useState } from "react";
import { Table, type TableColumn } from "../common/Table";
import { Button } from "../common/Button";
import type { ArticuloManufacturadoResponseDTO } from "../../types/productos/ArticuloManufacturadoResponseDTO";

interface ProductosListProps {
  productos: ArticuloManufacturadoResponseDTO[];
  loading?: boolean;
  onEdit: (producto: ArticuloManufacturadoResponseDTO) => void;
  onRefresh: () => void;
  onView: (producto: ArticuloManufacturadoResponseDTO) => void;
  onActivate?: (id: number) => void;
  onDeactivate?: (id: number) => void;
}

export const ProductosList: React.FC<ProductosListProps> = ({
  productos,
  loading = false,
  onEdit,
  onView,
  onActivate,
  onDeactivate,
}) => {
  // ==================== ESTADO DE FILTROS ====================

  const [busqueda, setBusqueda] = useState("");
  const [filtroStock, setFiltroStock] = useState<
    "todos" | "disponible" | "insuficiente"
  >("todos");
  const [filtroEstado, setFiltroEstado] = useState<
    "todos" | "activos" | "eliminados"
  >("activos");

  // ==================== MANEJADORES ====================

  const handleLimpiarFiltros = () => {
    setBusqueda("");
    setFiltroStock("todos");
    setFiltroEstado("activos");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value);
  };

  const getStockBadge = (disponible: boolean) => {
    const baseClasses =
      "inline-flex px-3 py-1 text-xs font-semibold rounded-full";
    if (disponible) {
      return (
        <span
          className={`${baseClasses} bg-green-100 text-green-800 border border-green-300`}
        >
          Disponible
        </span>
      );
    }
    return (
      <span
        className={`${baseClasses} bg-red-100 text-red-800 border border-red-300`}
      >
        Insuficiente
      </span>
    );
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src =
      "https://via.placeholder.com/40x40/f3f4f6/6b7280?text=Sin+Imagen";
  };

  // ==================== FILTRADO DE DATOS ====================

  const productosFiltrados = productos.filter((p) => {
    const busquedaOk = busqueda
      ? p.denominacion.toLowerCase().includes(busqueda.toLowerCase())
      : true;

    const stockOk =
      filtroStock === "disponible"
        ? p.stockSuficiente
        : filtroStock === "insuficiente"
        ? !p.stockSuficiente
        : true;

    const estadoOk =
      filtroEstado === "activos"
        ? !p.eliminado
        : filtroEstado === "eliminados"
        ? p.eliminado
        : true;

    return busquedaOk && stockOk && estadoOk;
  });

  // ==================== DEFINICIÓN DE COLUMNAS ====================

  const columns: TableColumn<ArticuloManufacturadoResponseDTO>[] = [
    {
      key: "imagen",
      title: "Imagen",
      width: "8%",
      align: "center",
      render: (_, record) => (
        <img
          src={record.imagenes?.[0]?.url || "placeholder"}
          alt={record.denominacion}
          className="w-10 h-10 object-cover rounded-lg shadow-sm"
          onError={handleImageError}
        />
      ),
    },
    {
      key: "denominacion",
      title: "Producto",
      width: "22%",
      render: (value) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
        </div>
      ),
    },
    {
      key: "denominacionCategoria",
      title: "Categoría",
      width: "15%",
    },
    {
      key: "precios",
      title: "Precio / Costo",
      width: "15%",
      align: "right",
      render: (_, record) => (
        <div className="text-right">
          <p className="font-semibold text-gray-900">
            {formatCurrency(record.precioVenta)}
          </p>
          <p className="text-xs text-gray-500">
            Costo: {formatCurrency(record.costoProduccion)}
          </p>
        </div>
      ),
    },
    {
      key: "ganancia",
      title: "Ganancia",
      width: "15%",
      align: "right",
      render: (_, record) => (
        <div className="text-right">
          <p className="font-semibold text-green-700">
            {formatCurrency(record.precioVenta - record.costoProduccion)}
          </p>
          <p className="text-xs text-gray-500">
            Margen: {record.margenGananciaPorcentaje.toFixed(1)}%
          </p>
        </div>
      ),
    },
    {
      key: "disponibilidad",
      title: "Disponibilidad",
      width: "15%",
      align: "center",
      render: (_, record) => (
        <div className="text-center">
          {getStockBadge(record.stockSuficiente)}
          <p className="text-xs text-gray-500 mt-1">
            Máx: {record.cantidadMaximaPreparable} u.
          </p>
        </div>
      ),
    },
    {
      key: "acciones",
      title: "Acciones",
      width: "10%",
      align: "center",
      stickyRight: true,
      render: (_, record) => (
        <div className="flex justify-center gap-2">
          {/* Toggle estado */}
          {record.eliminado ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onActivate?.(record.idArticulo)}
              title="Activar"
            >
              ♻️
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDeactivate?.(record.idArticulo)}
              title="Desactivar"
            >
              ⛔
            </Button>
          )}
          {/* 🔎 Ver detalles */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(record)}
            title="Ver detalles"
          >
            🔍
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(record)}
            title="Editar"
          >
            ✏️
          </Button>
        </div>
      ),
    },
  ];

  // ==================== RENDER ====================

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row md:items-end gap-3 bg-gray-50 p-3 rounded-lg">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            🔍 Buscar por nombre
          </label>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej: Pizza, Hamburguesa..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            📦 Disponibilidad
          </label>
          <select
            value={filtroStock}
            onChange={(e) => setFiltroStock(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="todos">Todos</option>
            <option value="disponible">Disponible</option>
            <option value="insuficiente">Insuficiente</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            🏷️ Estado
          </label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="activos">Activos</option>
            <option value="eliminados">Desactivados</option>
            <option value="todos">Todos</option>
          </select>
        </div>
        <Button onClick={handleLimpiarFiltros} variant="outline" size="sm">
          Limpiar
        </Button>
      </div>

      {/* Info de resultados */}
      <div className="text-sm text-gray-600">
        Mostrando <strong>{productosFiltrados.length}</strong> de{" "}
        <strong>{productos.length}</strong> productos
      </div>

      {/* Tabla */}
      <Table
        columns={columns}
        data={productosFiltrados}
        loading={loading}
        emptyText="No hay productos registrados"
        rowClassName={(record) => {
          if (record.eliminado)
            return "bg-gray-200 text-gray-500 hover:bg-gray-300";
          if (!record.stockSuficiente) return "bg-red-50 hover:bg-red-100";
          return "hover:bg-gray-50";
        }}
      />
    </div>
  );
};
