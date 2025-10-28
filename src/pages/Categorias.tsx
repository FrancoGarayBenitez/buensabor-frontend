import React, { useState } from "react";
import { Button } from "../components/common/Button";
import { Alert } from "../components/common/Alert";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { CategoriasList } from "../components/categorias/CategoriasList";
import { CategoriaModal } from "../components/categorias/CategoriaModal";
import { useCategorias } from "../hooks/useCategorias";
import type { CategoriaResponseDTO } from "../types/categorias/CategoriaResponseDTO";
import type { CategoriaRequestDTO } from "../types/categorias/CategoriaRequestDTO";

const Categorias: React.FC = () => {
  const {
    categorias,
    loading,
    error,
    createCategoria,
    updateCategoria,
    deleteCategoria,
  } = useCategorias();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<
    CategoriaResponseDTO | undefined
  >();
  const [operationLoading, setOperationLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleCreate = () => {
    setEditingCategoria(undefined);
    setModalOpen(true);
  };

  const handleEdit = (categoria: CategoriaResponseDTO) => {
    setEditingCategoria(categoria);
    setModalOpen(true);
  };

  const handleSubmit = async (data: CategoriaRequestDTO) => {
    setOperationLoading(true);
    try {
      if (editingCategoria) {
        await updateCategoria(editingCategoria.idCategoria, data);
        setAlert({
          type: "success",
          message: "Categoría actualizada correctamente",
        });
      } else {
        await createCategoria(data);
        setAlert({
          type: "success",
          message: "Categoría creada correctamente",
        });
      }
    } catch (error) {
      setAlert({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Error al guardar la categoría",
      });
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Está seguro de que desea eliminar esta categoría?")) {
      return;
    }

    try {
      await deleteCategoria(id);
      setAlert({
        type: "success",
        message: "Categoría eliminada correctamente",
      });
    } catch (error) {
      setAlert({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Error al eliminar la categoría",
      });
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategoria(undefined);
  };

  const closeAlert = () => {
    setAlert(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" />
        <p className="text-center text-gray-500 mt-4">Cargando categorías...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Rubros
          </h1>
          <p className="text-gray-600 mt-1">
            Administre las categorías para ingredientes y productos
          </p>
        </div>
        <Button onClick={handleCreate}>Nueva Categoría</Button>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">
            {categorias.filter((c) => !c.esSubcategoria).length}
          </div>
          <div className="text-sm text-gray-600">Categorías Principales</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {categorias.filter((c) => c.esSubcategoria).length}
          </div>
          <div className="text-sm text-gray-600">Subcategorías</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">
            {categorias.reduce(
              (acc, cat) => acc + (cat.cantidadArticulos || 0),
              0
            )}
          </div>
          <div className="text-sm text-gray-600">Total Artículos</div>
        </div>
      </div>

      {/* Table */}
      <CategoriasList
        categorias={categorias}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Modal */}
      <CategoriaModal
        isOpen={modalOpen}
        onClose={closeModal}
        categoria={editingCategoria}
        categoriasPadre={categorias}
        onSubmit={handleSubmit}
        loading={operationLoading}
      />
    </div>
  );
};

export default Categorias;
