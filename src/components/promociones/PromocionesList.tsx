import React, { useState } from "react";
import { Table, type TableColumn } from "../common/Table";
import { Button } from "../common/Button";
import {
  ESTADO_PROMOCION,
  TIPO_DESCUENTO,
  type PromocionResponse,
  type EstadoPromocion,
  type TipoDescuento,
} from "../../types/promociones/promocion.types";

interface PromocionesListProps {
  promociones: PromocionResponse[];
  loading?: boolean;
  onEdit: (promocion: PromocionResponse) => void;
  onDelete: (id: number) => void;
  onToggleActivo: (id: number) => void;
  onRefresh: () => void;
  onView: (promocion: PromocionResponse) => void;
}

export const PromocionesList: React.FC<PromocionesListProps> = ({
  promociones,
  loading = false,
  onEdit,
  onToggleActivo,
  onView,
}) => {
  // ==================== ESTADO DE FILTROS ====================
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | EstadoPromocion>(
    "todos"
  );
  const [filtroActivo, setFiltroActivo] = useState<
    "todos" | "activos" | "inactivos"
  >("todos");

  // ==================== MANEJADORES Y HELPERS ====================
  const handleLimpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstado("todos");
    setFiltroActivo("todos");
  };

  const formatDateTime = (date: string, time: string) => {
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${time.substring(0, 5)}`;
  };

  const formatDescuento = (tipo: TipoDescuento, valor: number) => {
    if (tipo === TIPO_DESCUENTO.PORCENTUAL) {
      return `${valor}% OFF`;
    }
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(valor);
  };

  const getEstadoBadge = (estado: EstadoPromocion, activo: boolean) => {
    const baseClasses =
      "inline-flex px-3 py-1 text-xs font-semibold rounded-full border";
    let colorClasses = "";
    let text = estado;

    if (!activo) {
      colorClasses = "bg-gray-100 text-gray-800 border-gray-300";
      text = ESTADO_PROMOCION.INACTIVA;
    } else {
      switch (estado) {
        case ESTADO_PROMOCION.VIGENTE:
          colorClasses = "bg-green-100 text-green-800 border-green-300";
          break;
        case ESTADO_PROMOCION.PROGRAMADA:
          colorClasses = "bg-blue-100 text-blue-800 border-blue-300";
          break;
        case ESTADO_PROMOCION.EXPIRADA:
          colorClasses = "bg-yellow-100 text-yellow-800 border-yellow-300";
          break;
        default:
          colorClasses = "bg-gray-100 text-gray-800 border-gray-300";
      }
    }
    return <span className={`${baseClasses} ${colorClasses}`}>{text}</span>;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src =
      "https://via.placeholder.com/40x40/f3f4f6/6b7280?text=Promo";
  };

  // ==================== FILTRADO DE DATOS ====================
  const promocionesFiltradas = promociones.filter((p) => {
    const busquedaOk = busqueda
      ? p.denominacion.toLowerCase().includes(busqueda.toLowerCase())
      : true;
    const estadoOk =
      filtroEstado === "todos" ? true : p.estado === filtroEstado;
    const activoOk =
      filtroActivo === "activos"
        ? p.activo
        : filtroActivo === "inactivos"
        ? !p.activo
        : true;
    return busquedaOk && estadoOk && activoOk;
  });

  // ==================== DEFINICIÓN DE COLUMNAS ====================
  const columns: TableColumn<PromocionResponse>[] = [
    {
      key: "imagen",
      title: "Img",
      width: "5%",
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
      title: "Promoción",
      width: "25%",
      render: (value, record) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 truncate">
            {record.descripcionDescuento}
          </p>
        </div>
      ),
    },
    {
      key: "vigencia",
      title: "Vigencia",
      width: "25%",
      render: (_, record) => (
        <div>
          <p className="text-sm text-gray-800">
            <span className="font-semibold">Desde:</span>{" "}
            {formatDateTime(record.fechaDesde, record.horaDesde)}
          </p>
          <p className="text-sm text-gray-800">
            <span className="font-semibold">Hasta:</span>{" "}
            {formatDateTime(record.fechaHasta, record.horaHasta)}
          </p>
        </div>
      ),
    },
    {
      key: "descuento",
      title: "Descuento",
      width: "15%",
      align: "center",
      render: (_, record) => (
        <div className="text-center font-bold text-lg text-blue-600">
          {formatDescuento(record.tipoDescuento, record.valorDescuento)}
        </div>
      ),
    },
    {
      key: "estado",
      title: "Estado",
      width: "15%",
      align: "center",
      render: (_, record) => getEstadoBadge(record.estado, record.activo),
    },
    {
      key: "acciones",
      title: "Acciones",
      width: "15%",
      align: "center",
      stickyRight: true,
      render: (_, record) => (
        <div className="flex justify-center gap-2">
          {/* ✅ NUEVO: Botón de vista previa */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(record)}
            title="Ver vista previa"
          >
            👁️
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleActivo(record.id)}
            title={
              record.activo
                ? "Deshabilitar manualmente"
                : "Habilitar manualmente"
            }
          >
            {record.activo ? "⏸️" : "▶️"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(record)}
            title="Editar"
          >
            ✏️
          </Button>
          {/* ❌ ELIMINADO: Botón de eliminar */}
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
            placeholder="Ej: Promo Pizza, 2x1..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            🏷️ Estado de Vigencia
          </label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="todos">Todos</option>
            {Object.values(ESTADO_PROMOCION).map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            ⚙️ Estado Manual
          </label>
          <select
            value={filtroActivo}
            onChange={(e) => setFiltroActivo(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="todos">Todos</option>
            <option value="activos">Habilitados</option>
            <option value="inactivos">Deshabilitados</option>
          </select>
        </div>
        <Button onClick={handleLimpiarFiltros} variant="outline" size="sm">
          Limpiar
        </Button>
      </div>

      {/* Info de resultados */}
      <div className="text-sm text-gray-600">
        Mostrando <strong>{promocionesFiltradas.length}</strong> de{" "}
        <strong>{promociones.length}</strong> promociones
      </div>

      {/* Tabla */}
      <Table
        columns={columns}
        data={promocionesFiltradas}
        loading={loading}
        emptyText="No hay promociones registradas"
        rowClassName={(record) =>
          !record.activo
            ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
            : "hover:bg-gray-50"
        }
      />
    </div>
  );
};
