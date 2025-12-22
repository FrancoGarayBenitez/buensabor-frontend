import React, { useState, useEffect } from "react";
import { Button } from "../components/common/Button";
import { Alert } from "../components/common/Alert";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ProductosList } from "../components/productos/ProductosList";
import { ProductoModal } from "../components/productos/ProductoModal";
import { ProductoPreviewModal } from "../components/productos/ProductoPreviewModal";
import { useProductos } from "../hooks/useProductos";
import { useCategorias } from "../hooks/useCategorias";
import { unidadMedidaService, type UnidadMedidaDTO } from "../services";
import type { ArticuloManufacturadoResponseDTO } from "../types/productos/ArticuloManufacturadoResponseDTO";
import type { ArticuloManufacturadoRequestDTO } from "../types/productos/ArticuloManufacturadoRequestDTO";

export const Productos: React.FC = () => {
  const {
    productos,
    loading,
    error,
    createProducto,
    updateProducto,
    // deleteProducto,            // ❌ eliminar: ya no se usa
    refresh,
    activateProducto, // ✅
    deactivateProducto, // ✅
  } = useProductos();

  const { categorias } = useCategorias();

  // ==================== ESTADO ====================

  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedidaDTO[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<
    ArticuloManufacturadoResponseDTO | undefined
  >();
  const [operationLoading, setOperationLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewProducto, setPreviewProducto] = useState<
    ArticuloManufacturadoResponseDTO | undefined
  >(undefined);
  // ✅ nuevo: error para mostrar en el formulario dentro del modal
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

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
    setEditingProducto(undefined);
    setFormErrorMessage(null); // ✅ limpia errores previos del form
    setModalOpen(true);
  };

  const handleEdit = (producto: ArticuloManufacturadoResponseDTO) => {
    setEditingProducto(producto);
    setFormErrorMessage(null); // ✅ limpia errores previos del form
    setModalOpen(true);
  };

  // Ver detalles en vista previa
  const handleView = (producto: ArticuloManufacturadoResponseDTO) => {
    setPreviewProducto(producto);
    setPreviewOpen(true);
  };

  // Abre edición desde la vista previa
  const handleEditFromPreview = (
    producto: ArticuloManufacturadoResponseDTO
  ) => {
    setPreviewOpen(false);
    setEditingProducto(producto);
    setModalOpen(true);
  };

  const handleSubmit = async (data: ArticuloManufacturadoRequestDTO) => {
    setOperationLoading(true);
    setFormErrorMessage(null); // ✅ limpiar antes de intentar guardar
    try {
      if (editingProducto) {
        await updateProducto(editingProducto.idArticulo, data);
        setAlert({
          type: "success",
          message: "Producto actualizado correctamente",
        });
      } else {
        await createProducto(data);
        setAlert({
          type: "success",
          message: "Producto creado correctamente",
        });
      }
      closeModal();
    } catch (error) {
      // ✅ Mantener el modal abierto y mostrar el error en el formulario
      setFormErrorMessage(
        error instanceof Error ? error.message : "Error al guardar el producto"
      );
    } finally {
      setOperationLoading(false);
    }
  };

  const handleActivate = async (id: number) => {
    await activateProducto(id);
    setAlert({ type: "success", message: "Producto activado" });
  };

  const handleDeactivate = async (id: number) => {
    await deactivateProducto(id);
    setAlert({ type: "success", message: "Producto desactivado" });
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProducto(undefined);
    setFormErrorMessage(null); // ✅ limpiar error de form al cerrar
  };

  // ==================== ESTADÍSTICAS ====================

  const stats = {
    total: productos.length,
    activos: productos.filter((p) => !p.eliminado).length,
    sinStock: productos.filter((p) => !p.stockSuficiente).length,
  };

  // ==================== RENDER ====================

  if (loading || loadingUnidades) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" />
        <p className="text-center text-gray-500 mt-4">Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Productos
          </h1>
          <p className="text-gray-600 mt-1">
            Administre los productos manufacturados, recetas y precios
          </p>
        </div>
        <Button onClick={handleCreate}>+ Nuevo Producto</Button>
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
        <StatCard label="Total Productos" value={stats.total} color="blue" />
        <StatCard
          label="Activos para Venta"
          value={stats.activos}
          color="green"
        />
        <StatCard
          label="Sin Stock Suficiente"
          value={stats.sinStock}
          color="red"
        />
      </div>

      {/* Alerta de Stock */}
      {stats.sinStock > 0 && (
        <Alert
          type="warning"
          message={`⚠️ Hay ${stats.sinStock} producto(s) que no se pueden preparar por falta de ingredientes.`}
        />
      )}

      {/* Tabla */}
      <ProductosList
        productos={productos}
        loading={loading}
        onEdit={handleEdit}
        onRefresh={refresh}
        onView={handleView}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
      />

      {/* Modal */}
      <ProductoModal
        isOpen={modalOpen}
        onClose={closeModal}
        producto={editingProducto}
        categorias={categorias}
        unidadesMedida={unidadesMedida}
        onSubmit={handleSubmit}
        loading={operationLoading}
        serverErrorMessage={formErrorMessage ?? undefined}
      />

      {/* Vista Previa Modal */}
      <ProductoPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        producto={previewProducto}
        isAdmin={true}
        onEdit={handleEditFromPreview}
      />
    </div>
  );
};

// ==================== COMPONENTE AUXILIAR ====================

interface StatCardProps {
  label: string;
  value: number;
  color: "blue" | "green" | "red";
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => {
  const colorMap = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    red: "text-red-600 bg-red-50",
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className={`text-3xl font-bold ${colorMap[color]}`}>{value}</div>
      <div className="text-sm text-gray-600 mt-2">{label}</div>
    </div>
  );
};

export default Productos;
