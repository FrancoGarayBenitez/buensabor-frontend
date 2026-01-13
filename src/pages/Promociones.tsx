import React, { useState, useMemo } from "react";
import { Button } from "../components/common/Button";
import { Alert } from "../components/common/Alert";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { PromocionModal } from "../components/promociones/PromocionModal";
import { PromocionesList } from "../components/promociones/PromocionesList";
import { PromocionPreviewModal } from "../components/promociones/PromocionPreviewModal";

// Hooks
import { usePromociones } from "../hooks/usePromociones";
import { useProductos } from "../hooks/useProductos";
import { useInsumos } from "../hooks/useInsumos";

// Types
import type {
  PromocionResponse,
  PromocionRequest,
  ArticuloShort,
} from "../types/promociones/promocion.types";
import { ESTADO_PROMOCION } from "../types/promociones/promocion.types";

export const Promociones: React.FC = () => {
  const {
    promociones,
    loading: loadingPromociones,
    error,
    createPromocion,
    updatePromocion,
    deletePromocion,
    toggleActivoPromocion,
    refresh,
  } = usePromociones();

  const { productos, loading: loadingProductos } = useProductos();
  const { insumos, loading: loadingInsumos } = useInsumos();

  // ==================== ESTADO ====================
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromocion, setEditingPromocion] = useState<
    PromocionResponse | undefined
  >();
  const [operationLoading, setOperationLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  // Estado para el modal de previsualización
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPromocion, setPreviewPromocion] = useState<
    PromocionResponse | undefined
  >(undefined);

  // ==================== DATOS COMBINADOS ====================
  const articulosParaVenta = useMemo((): ArticuloShort[] => {
    const productosMapeados = productos.map((p) => ({
      id: p.idArticulo,
      denominacion: p.denominacion,
      precioVenta: p.precioVenta,
    }));

    const insumosParaVenta = insumos
      .filter((i) => !i.esParaElaborar)
      .map((i) => ({
        id: i.idArticulo,
        denominacion: i.denominacion,
        precioVenta: i.precioVenta,
      }));

    return [...productosMapeados, ...insumosParaVenta].sort((a, b) =>
      a.denominacion.localeCompare(b.denominacion)
    );
  }, [productos, insumos]);

  // ==================== MANEJADORES ====================

  const handleCreate = () => {
    setEditingPromocion(undefined);
    setFormErrorMessage(null);
    setModalOpen(true);
  };

  const handleEdit = (promocion: PromocionResponse) => {
    setEditingPromocion(promocion);
    setFormErrorMessage(null);
    setModalOpen(true);
  };

  // Manejador para abrir la vista previa
  const handleView = (promocion: PromocionResponse) => {
    setPreviewPromocion(promocion);
    setPreviewOpen(true);
  };

  // ✅ NUEVO: Manejador para abrir edición desde la previsualización
  const handleEditFromPreview = (promocion: PromocionResponse) => {
    setPreviewOpen(false);
    setEditingPromocion(promocion);
    setModalOpen(true);
  };

  const handleSubmit = async (data: PromocionRequest) => {
    setOperationLoading(true);
    setFormErrorMessage(null);

    // Combinar fecha y hora en formato ISO 8601
    const payload: PromocionRequest = {
      ...data,
      fechaDesde: `${data.fechaDesde}T${data.horaDesde}`,
      fechaHasta: `${data.fechaHasta}T${data.horaHasta}`,
    };

    try {
      if (editingPromocion) {
        await updatePromocion(editingPromocion.id, payload);
        setAlert({
          type: "success",
          message: "Promoción actualizada correctamente",
        });
      } else {
        await createPromocion(payload);
        setAlert({
          type: "success",
          message: "Promoción creada correctamente",
        });
      }
      closeModal();
    } catch (error) {
      setFormErrorMessage(
        error instanceof Error ? error.message : "Error al guardar la promoción"
      );
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deletePromocion(id);
    setAlert({ type: "success", message: "Promoción eliminada" });
  };

  const handleToggleActivo = async (id: number) => {
    await toggleActivoPromocion(id);
    setAlert({ type: "success", message: "Estado de la promoción cambiado" });
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPromocion(undefined);
    setFormErrorMessage(null);
  };

  // ==================== ESTADÍSTICAS ====================

  const stats = useMemo(() => {
    return {
      total: promociones.length,
      vigentes: promociones.filter((p) => p.estado === ESTADO_PROMOCION.VIGENTE)
        .length,
      programadas: promociones.filter(
        (p) => p.estado === ESTADO_PROMOCION.PROGRAMADA
      ).length,
    };
  }, [promociones]);

  // ==================== RENDER ====================

  const isLoading = loadingPromociones || loadingProductos || loadingInsumos;

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" />
        <p className="text-center text-gray-500 mt-4">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Promociones
          </h1>
          <p className="text-gray-600 mt-1">
            Cree y administre ofertas y descuentos especiales
          </p>
        </div>
        <Button onClick={handleCreate}>+ Nueva Promoción</Button>
      </div>

      {/* Alerts */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
      {error && (
        <Alert type="error" message={error} onClose={() => setAlert(null)} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Promociones" value={stats.total} color="blue" />
        <StatCard label="Vigentes Ahora" value={stats.vigentes} color="green" />
        <StatCard
          label="Programadas"
          value={stats.programadas}
          color="yellow"
        />
      </div>

      {/* Tabla */}
      <PromocionesList
        promociones={promociones}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActivo={handleToggleActivo}
        onView={handleView}
        onRefresh={refresh}
      />

      {/* Modal de Creación/Edición */}
      <PromocionModal
        isOpen={modalOpen}
        onClose={closeModal}
        promocion={editingPromocion}
        articulosDisponibles={articulosParaVenta}
        onSubmit={handleSubmit}
        loading={operationLoading}
        serverErrorMessage={formErrorMessage ?? undefined}
      />

      {/* Modal de Previsualización */}
      <PromocionPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        promocion={previewPromocion}
        onEdit={handleEditFromPreview}
      />
    </div>
  );
};

// ==================== COMPONENTE AUXILIAR ====================

interface StatCardProps {
  label: string;
  value: number;
  color: "blue" | "green" | "yellow";
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => {
  const colorMap = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    yellow: "text-yellow-600 bg-yellow-50",
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className={`text-3xl font-bold ${colorMap[color]}`}>{value}</div>
      <div className="text-sm text-gray-600 mt-2">{label}</div>
    </div>
  );
};

export default Promociones;
