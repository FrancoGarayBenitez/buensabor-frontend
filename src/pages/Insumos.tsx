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
  const { insumos, loading, error, createInsumo, updateInsumo, deleteInsumo, refresh } =
    useInsumos();

  const { categorias } = useCategorias();

  // Estado para unidades de medida
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedidaDTO[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<
    ArticuloInsumoResponseDTO | undefined
  >();
  const [operationLoading, setOperationLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Cargar unidades de medida
  useEffect(() => {
    const fetchUnidadesMedida = async () => {
      setLoadingUnidades(true);
      try {
        const unidades = await unidadMedidaService.getAll();
        setUnidadesMedida(unidades);
      } catch (error) {
        console.error("Error al cargar unidades de medida:", error);
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
    if (
      !window.confirm("¿Está seguro de que desea eliminar este ingrediente?")
    ) {
      return;
    }

    try {
      await deleteInsumo(id);
      setAlert({
        type: "success",
        message: "Ingrediente eliminado correctamente",
      });
    } catch (error) {
      setAlert({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Error al eliminar el ingrediente",
      });
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingInsumo(undefined);
  };

  const closeAlert = () => {
    setAlert(null);
  };

  // Calcular estadísticas
  const stats = {
    total: insumos.length,
    paraElaborar: insumos.filter((i) => i.esParaElaborar).length,
    stockBajo: insumos.filter(
      (i) => i.estadoStock === "BAJO" || i.estadoStock === "CRITICO"
    ).length,
    stockCritico: insumos.filter((i) => i.estadoStock === "CRITICO").length,
    ventaDirecta: insumos.filter((i) => !i.esParaElaborar).length,
  };

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
        <Button onClick={handleCreate}>Nuevo Ingrediente</Button>
      </div>

      {/* Alert */}
      {alert && (
        <Alert type={alert.type} message={alert.message} onClose={closeAlert} />
      )}

      {/* Error */}
      {error && (
        <Alert type="error" title="Error al cargar datos" message={error} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Ingredientes</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">
            {stats.paraElaborar}
          </div>
          <div className="text-sm text-gray-600">Para Elaborar</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">
            {stats.stockBajo}
          </div>
          <div className="text-sm text-gray-600">Stock Bajo</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">
            {stats.stockCritico}
          </div>
          <div className="text-sm text-gray-600">Stock Crítico</div>
        </div>
         <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-pink-600">
            {stats.ventaDirecta}
          </div>
          <div className="text-sm text-gray-600">Venta Directa</div>
        </div>
      </div>


      {/* Alertas de Stock */}
      {stats.stockCritico > 0 && (
        <Alert
          type="error"
          title="¡Atención! Stock Crítico"
          message={`Hay ${stats.stockCritico} ingrediente(s) con stock crítico que requieren reposición urgente.`}
        />
      )}

      {stats.stockBajo > 0 && stats.stockCritico === 0 && (
        <Alert
          type="warning"
          title="Stock Bajo"
          message={`Hay ${stats.stockBajo} ingrediente(s) con stock bajo. Considere realizar pedidos pronto.`}
        />
      )}

      {/* Table */}
      <InsumosList
        insumos={insumos}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={refresh}
      />

      {/* Modal de Insumo */}
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

export default Insumos;
