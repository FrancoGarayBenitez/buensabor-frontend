import React, { useState, useEffect } from "react";
import { Button } from "../components/common/Button";
import { Alert } from "../components/common/Alert";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { InsumosList } from "../components/insumos/InsumosList";
import { InsumoModal } from "../components/insumos/InsumoModal";
import { useInsumos } from "../hooks/useInsumos";
import { useCategorias } from "../hooks/useCategorias";
import { unidadMedidaService } from "../services";
import type { ArticuloInsumoResponseDTO } from "../types/insumos/ArticuloInsumoResponseDTO";
import type { ArticuloInsumoRequestDTO } from "../types/insumos/ArticuloInsumoRequestDTO";
import type { UnidadMedidaDTO } from "../services";

export const Insumos: React.FC = () => {
  const {
    insumos,
    loading,
    error,
    createInsumo,
    updateInsumo,
    deleteInsumo,
    refresh,
  } = useInsumos();

  const { categorias } = useCategorias();

  // ==================== ESTADO ====================

  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedidaDTO[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<
    ArticuloInsumoResponseDTO | undefined
  >();
  const [operationLoading, setOperationLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  // ==================== EFECTOS ====================

  // Cargar unidades de medida
  useEffect(() => {
    const fetchUnidadesMedida = async () => {
      setLoadingUnidades(true);
      try {
        const unidades = await unidadMedidaService.getAll();
        setUnidadesMedida(unidades);
      } catch (error) {
        setAlert({
          type: "error",
          message: "Error al cargar unidades de medida",
        });
      } finally {
        setLoadingUnidades(false);
      }
    };

    fetchUnidadesMedida();
  }, []);

  // ==================== MANEJADORES ====================

  const handleCreate = () => {
    setEditingInsumo(undefined);
    setModalOpen(true);
  };

  const handleEdit = (insumo: ArticuloInsumoResponseDTO) => {
    setEditingInsumo(insumo);
    setModalOpen(true);
  };

  const handleSubmit = async (data: ArticuloInsumoRequestDTO) => {
    setOperationLoading(true);
    try {
      if (editingInsumo) {
        await updateInsumo(editingInsumo.idArticulo, data);
        setAlert({
          type: "success",
          message: "Ingrediente actualizado correctamente",
        });
      } else {
        await createInsumo(data);
        setAlert({
          type: "success",
          message: "Ingrediente creado correctamente",
        });
      }
      await refresh(); // asegura refresco tras submit
      closeModal();
    } catch (error) {
      setAlert({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Error al guardar el ingrediente",
      });
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const insumo = insumos.find((i) => i.idArticulo === id);
    const nombreInsumo = insumo?.denominacion || "el insumo";

    // ✅ Verificar si está en uso
    const enUso = (insumo?.cantidadProductosQueLoUsan ?? 0) > 0;

    let mensajeAdvertencia = "";
    if (enUso) {
      mensajeAdvertencia = `\n\n⚠️ ADVERTENCIA: Este insumo se usa en ${insumo?.cantidadProductosQueLoUsan} producto(s).`;
    }

    const mensaje =
      `¿Está seguro de que desea eliminar "${nombreInsumo}"?` +
      mensajeAdvertencia;

    if (!window.confirm(mensaje)) {
      return;
    }

    try {
      await deleteInsumo(id);
      setAlert({
        type: "success",
        message: `"${nombreInsumo}" eliminado correctamente`,
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Error al eliminar";
      setAlert({
        type: "error",
        message: errorMsg,
      });
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingInsumo(undefined);
  };

  // ==================== ESTADÍSTICAS ====================

  const stats = {
    total: insumos.length,
    paraElaborar: insumos.filter((i) => i.esParaElaborar).length,
    stockBajo: insumos.filter((i) => ["BAJO"].includes(i.estadoStock)).length,
    stockCritico: insumos.filter((i) => i.estadoStock === "CRITICO").length,
    ventaDirecta: insumos.filter((i) => !i.esParaElaborar).length,
  };

  // ==================== RENDER ====================

  if (loading || loadingUnidades) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" />
        <p className="text-center text-gray-500 mt-4">
          Cargando ingredientes...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Ingredientes
          </h1>
          <p className="text-gray-600 mt-1">
            Administre los insumos, stock y precios
          </p>
        </div>
        <Button onClick={handleCreate}>+ Nuevo Ingrediente</Button>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard label="Total Ingredientes" value={stats.total} color="blue" />
        <StatCard
          label="Para Elaborar"
          value={stats.paraElaborar}
          color="purple"
        />
        <StatCard label="Stock Bajo" value={stats.stockBajo} color="yellow" />
        <StatCard
          label="Stock Crítico"
          value={stats.stockCritico}
          color="red"
        />
        <StatCard
          label="Venta Directa"
          value={stats.ventaDirecta}
          color="pink"
        />
      </div>

      {/* Alertas de Stock */}
      {stats.stockCritico > 0 && (
        <Alert
          type="error"
          message={`⚠️ Hay ${stats.stockCritico} ingrediente(s) con stock crítico que requieren reposición urgente.`}
        />
      )}

      {stats.stockBajo > 0 && stats.stockCritico === 0 && (
        <Alert
          type="warning"
          message={`📦 Hay ${stats.stockBajo} ingrediente(s) con stock bajo. Considere realizar pedidos pronto.`}
        />
      )}

      {/* Tabla */}
      <InsumosList
        insumos={insumos}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={refresh}
      />

      {/* Modal */}
      <InsumoModal
        isOpen={modalOpen}
        onClose={closeModal}
        insumo={editingInsumo}
        categorias={categorias}
        unidadesMedida={unidadesMedida}
        onSubmit={handleSubmit}
        loading={operationLoading}
      />
    </div>
  );
};

// ==================== COMPONENTE AUXILIAR ====================

interface StatCardProps {
  label: string;
  value: number;
  color: "blue" | "purple" | "yellow" | "red" | "pink";
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => {
  const colorMap = {
    blue: "text-blue-600 bg-blue-50",
    purple: "text-purple-600 bg-purple-50",
    yellow: "text-yellow-600 bg-yellow-50",
    red: "text-red-600 bg-red-50",
    pink: "text-pink-600 bg-pink-50",
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className={`text-3xl font-bold ${colorMap[color]}`}>{value}</div>
      <div className="text-sm text-gray-600 mt-2">{label}</div>
    </div>
  );
};

export default Insumos;
