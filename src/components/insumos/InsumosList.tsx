import React, { useState } from "react";
import { Table, type TableColumn } from "../common/Table";
import { Button } from "../common/Button";
import type { ArticuloInsumoResponseDTO } from "../../types/insumos/ArticuloInsumoResponseDTO";
import CompraForm from "./CompraForm";
import { HistorialPrecios } from "./HistorialPrecios";

interface InsumosListProps {
  insumos: ArticuloInsumoResponseDTO[];
  loading?: boolean;
  onEdit: (insumo: ArticuloInsumoResponseDTO) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}

const ESTADOS = ["CRITICO", "BAJO", "NORMAL", "ALTO"];

export const InsumosList: React.FC<InsumosListProps> = ({
  insumos,
  loading = false,
  onEdit,
  onDelete,
  onRefresh,
}) => {
  // ==================== ESTADO ====================

  const [compraInsumoId, setCompraInsumoId] = useState<number | null>(null);
  const [historialInsumoId, setHistorialInsumoId] = useState<number | null>(
    null
  );
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroUso, setFiltroUso] = useState("");

  // ==================== MANEJADORES ====================

  const handleLimpiar = () => {
    setBusqueda("");
    setFiltroEstado("");
    setFiltroUso("");
  };

  const getStockBadge = (estado: string | undefined | null) => {
    if (!estado) {
      return (
        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-300 text-gray-800">
          Sin estado
        </span>
      );
    }
    const colors: Record<string, string> = {
      CRITICO: "bg-red-100 text-red-800 border border-red-300",
      BAJO: "bg-yellow-100 text-yellow-800 border border-yellow-300",
      NORMAL: "bg-green-100 text-green-800 border border-green-300",
      ALTO: "bg-blue-100 text-blue-800 border border-blue-300",
    };
    const colorClass = colors[estado] || "bg-gray-100 text-gray-800";
    return (
      <span
        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${colorClass}`}
      >
        {estado}
      </span>
    );
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src =
      "https://via.placeholder.com/40x40/f3f4f6/6b7280?text=Sin+Imagen";
  };

  // ==================== FILTRADOS ====================

  const insumosFiltrados = insumos.filter((i) => {
    const nombreOk = busqueda
      ? i.denominacion.toLowerCase().includes(busqueda.toLowerCase())
      : true;

    const estadoOk = filtroEstado ? i.estadoStock === filtroEstado : true;

    let usoOk = true;
    if (filtroUso === "elaborar") usoOk = i.esParaElaborar;
    if (filtroUso === "venta") usoOk = !i.esParaElaborar;

    return nombreOk && estadoOk && usoOk;
  });

  // ==================== COLUMNAS ====================

  const columns: TableColumn<ArticuloInsumoResponseDTO>[] = [
    {
      key: "imagen",
      title: "Imagen",
      width: "8%",
      align: "center",
      render: (_, record) =>
        record.imagenes?.[0] ? (
          <img
            src={record.imagenes[0].url}
            alt={record.imagenes[0].denominacion}
            className="w-10 h-10 object-cover rounded-lg shadow-sm"
            onError={handleImageError}
          />
        ) : (
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-xs">📷</span>
          </div>
        ),
    },
    {
      key: "denominacion",
      title: "Ingrediente",
      width: "18%",
      render: (value, record) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">
            {record.esParaElaborar ? "🔧 Elaborar" : "🛍️ Venta"}
          </p>
        </div>
      ),
    },
    {
      key: "denominacionCategoria",
      title: "Categoría",
      width: "15%",
    },
    {
      key: "denominacionUnidadMedida",
      title: "Unidad",
      width: "10%",
    },
    {
      key: "stockActual",
      title: "Stock Actual",
      width: "12%",
      align: "center",
      render: (value, record) => (
        <div className="text-center">
          <div className="font-bold text-lg text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">máx: {record.stockMaximo}</div>
        </div>
      ),
    },
    {
      key: "estadoStock",
      title: "Estado",
      width: "10%",
      align: "center",
      // ✅ CORREGIDO: Pasar el valor correctamente
      render: (estado) => {
        console.log("📊 Render estadoStock - valor:", estado);
        return getStockBadge(estado);
      },
    },
    {
      key: "acciones",
      title: "Acciones",
      width: "15%",
      align: "center",
      stickyRight: true,
      render: (_, record) => (
        <div className="flex justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(record)}
            title="Editar"
          >
            ✏️
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setHistorialInsumoId(record.idArticulo)}
            title="Ver historial"
          >
            📊
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCompraInsumoId(record.idArticulo)}
            title="Registrar compra"
          >
            🛒
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => onDelete(record.idArticulo)}
            disabled={(record.cantidadProductosQueLoUsan ?? 0) > 0}
            title={
              (record.cantidadProductosQueLoUsan ?? 0) > 0
                ? "No se puede eliminar, se usa en productos"
                : "Eliminar"
            }
          >
            🗑️
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
            placeholder="Ej: Harina, Leche..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            📊 Estado
          </label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            {ESTADOS.map((est) => (
              <option key={est} value={est}>
                {est}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            🏷️ Uso
          </label>
          <select
            value={filtroUso}
            onChange={(e) => setFiltroUso(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            <option value="elaborar">Elaborar</option>
            <option value="venta">Venta</option>
          </select>
        </div>

        <Button onClick={handleLimpiar} variant="outline" size="sm">
          🗑️ Limpiar
        </Button>
      </div>

      {/* Info de resultados */}
      <div className="text-sm text-gray-600">
        Mostrando <strong>{insumosFiltrados.length}</strong> de{" "}
        <strong>{insumos.length}</strong> ingredientes
      </div>

      {/* Tabla */}
      <Table
        columns={columns}
        data={insumosFiltrados}
        loading={loading}
        emptyText="No hay ingredientes registrados"
        rowClassName={(record) => {
          switch (record.estadoStock) {
            case "CRITICO":
              return "bg-red-50 hover:bg-red-100";
            case "BAJO":
              return "bg-yellow-50 hover:bg-yellow-100";
            case "ALTO":
              return "bg-blue-50 hover:bg-blue-100";
            default:
              return "hover:bg-gray-50";
          }
        }}
      />

      {/* Modal historial */}
      {historialInsumoId !== null && (
        <HistorialPrecios
          insumoId={historialInsumoId}
          onClose={() => setHistorialInsumoId(null)}
          onDelete={() => {
            setHistorialInsumoId(null); // cierra modal tras eliminar
            onRefresh(); // refresca lista principal
          }}
        />
      )}

      {/* Modal: Compra */}
      {compraInsumoId && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-xl max-h-[85vh] overflow-y-auto">
            <CompraForm
              insumoId={compraInsumoId}
              onClose={() => setCompraInsumoId(null)}
              onSuccess={() => {
                setCompraInsumoId(null);
                onRefresh();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InsumosList;
