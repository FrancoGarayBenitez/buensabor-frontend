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

const ESTADOS = ["CRITICO", "BAJO", "NORMAL", "ALTO", "SUPERADO"];

export const InsumosList: React.FC<InsumosListProps> = ({
  insumos,
  loading = false,
  onEdit,
  onDelete,
  onRefresh,
}) => {
  const [compraInsumoId, setCompraInsumoId] = useState<number | null>(null);
  const [historialInsumoId, setHistorialInsumoId] = useState<number | null>(
    null
  );

  // Buscador
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [filtroUso, setFiltroUso] = useState<string>(""); // "" | "elaborar" | "venta"
  const [filtros, setFiltros] = useState({
    nombre: "",
    estado: "",
    uso: "",
  });

  // Aplica filtros al hacer click en Buscar
  const handleBuscar = () => {
    setFiltros({
      nombre: busqueda.trim().toLowerCase(),
      estado: filtroEstado,
      uso: filtroUso,
    });
  };

  const handleLimpiar = () => {
    setBusqueda("");
    setFiltroEstado("");
    setFiltroUso("");
    setFiltros({ nombre: "", estado: "", uso: "" });
  };

  const cerrarCompra = () => setCompraInsumoId(null);

  // Calcula estado visual (incluye SUPERADO) SOLO para el render
  const getEstadoVisual = (insumo: ArticuloInsumoResponseDTO) =>
    insumo.stockActual > insumo.stockMaximo ? "SUPERADO" : insumo.estadoStock;

  const getStockBadge = (insumo: ArticuloInsumoResponseDTO) => {
    const estadoVisual = getEstadoVisual(insumo);

    const colors: Record<string, string> = {
      CRITICO: "bg-red-100 text-red-800",
      BAJO: "bg-yellow-100 text-yellow-800",
      NORMAL: "bg-green-100 text-green-800",
      ALTO: "bg-blue-100 text-blue-800",
      SUPERADO: "bg-pink-100 text-pink-800",
    };

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          colors[estadoVisual] || "bg-gray-100 text-gray-800"
        }`}
      >
        {estadoVisual}
      </span>
    );
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src =
      "https://via.placeholder.com/40x40/f3f4f6/6b7280?text=Sin+Imagen";
  };

  // Filtrar insumos
  const insumosFiltrados = insumos.filter((i) => {
    // Filtro nombre
    const nombreOk = filtros.nombre
      ? i.denominacion.toLowerCase().includes(filtros.nombre)
      : true;
    // Filtro estado (usando estado visual)
    const estadoVisual = getEstadoVisual(i);
    const estadoOk = filtros.estado ? estadoVisual === filtros.estado : true;
    // Filtro uso
    let usoOk = true;
    if (filtros.uso === "elaborar") usoOk = i.esParaElaborar;
    if (filtros.uso === "venta") usoOk = !i.esParaElaborar;
    return nombreOk && estadoOk && usoOk;
  });

  // Columnas tabla
  const columns: TableColumn<ArticuloInsumoResponseDTO>[] = [
    {
      key: "imagen",
      title: "Imagen",
      width: "8%",
      align: "center",
      render: (_, record) =>
        record.esParaElaborar ? (
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs">🧪</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            {record.imagenes?.[0] ? (
              <img
                src={record.imagenes[0].url}
                alt={record.imagenes[0].denominacion}
                className="w-10 h-10 object-cover rounded-lg shadow-sm"
                onError={handleImageError}
              />
            ) : (
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-xs">🛒</span>
              </div>
            )}
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
            {record.esParaElaborar ? "Para elaborar" : "Venta directa"}
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
      key: "precioCompra",
      title: "Precio Compra",
      width: "12%",
      align: "right",
      render: (value, record) => (
        <div className="flex flex-col items-end gap-2">
          <span className="font-semibold">${value.toFixed(2)}</span>
          {/* ✅ NUEVO: Botón para ver historial */}
          <button
            onClick={() => setHistorialInsumoId(record.idArticulo)}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
            title="Ver historial de precios"
          >
            📊 Historial
          </button>
        </div>
      ),
    },
    {
      key: "stockActual",
      title: "Stock",
      width: "10%",
      align: "center",
      render: (value, record) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">/ {record.stockMaximo}</div>
        </div>
      ),
    },
    {
      key: "estadoStock",
      title: "Estado",
      width: "10%",
      align: "center",
      render: (_, record) => getStockBadge(record),
    },
    {
      key: "esParaElaborar",
      title: "Uso",
      width: "8%",
      align: "center",
      render: (value: boolean) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value
              ? "bg-purple-100 text-purple-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {value ? "Elaborar" : "Venta"}
        </span>
      ),
    },
    {
      key: "acciones",
      title: "Acciones",
      width: "11%",
      align: "center",
      stickyRight: true,
      render: (_, record) => (
        <div className="flex justify-center space-x-1">
          <Button size="sm" variant="outline" onClick={() => onEdit(record)}>
            ✏️
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => onDelete(record.idArticulo)}
            disabled={record.cantidadProductosQueLoUsan > 0}
          >
            🗑️
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setCompraInsumoId(record.idArticulo)}
            title="Comprar stock"
          >
            🛒
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row md:items-end gap-3 mb-6">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            className="w-full border border-gray-300 rounded-md p-2 text-sm"
            type="text"
            value={busqueda}
            placeholder="Buscar por nombre"
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleBuscar();
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            className="border border-gray-300 rounded-md p-2 text-sm"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
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
            Uso
          </label>
          <select
            className="border border-gray-300 rounded-md p-2 text-sm"
            value={filtroUso}
            onChange={(e) => setFiltroUso(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="elaborar">Para Elaborar</option>
            <option value="venta">Venta Directa</option>
          </select>
        </div>
        <Button className="h-10 mt-4 md:mt-0" onClick={handleBuscar}>
          Buscar
        </Button>
        <Button
          className="h-10 mt-4 md:mt-0"
          variant="outline"
          onClick={handleLimpiar}
        >
          Limpiar
        </Button>
      </div>

      {/* Tabla */}
      <Table
        columns={columns}
        data={insumosFiltrados}
        loading={loading}
        emptyText="No hay ingredientes registrados"
        rowClassName={(record) =>
          record.stockActual > record.stockMaximo
            ? "bg-pink-50"
            : record.estadoStock === "CRITICO"
            ? "bg-red-50"
            : record.estadoStock === "BAJO"
            ? "bg-yellow-50"
            : ""
        }
      />

      {/* Modal historial */}
      {historialInsumoId !== null && (
        <HistorialPrecios
          insumoId={historialInsumoId}
          onClose={() => setHistorialInsumoId(null)}
          onDelete={() => onRefresh()}
        />
      )}

      {/* Modal compra */}
      {compraInsumoId !== null && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-5 rounded-lg w-full max-w-sm shadow-xl max-h-[85vh] overflow-y-auto">
            <CompraForm
              insumoId={compraInsumoId as number}
              onClose={cerrarCompra}
              onSuccess={() => {
                cerrarCompra();
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
