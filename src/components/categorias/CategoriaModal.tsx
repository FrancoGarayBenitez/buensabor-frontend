import React from "react";
import { Modal } from "../common/Modal";
import { CategoriaForm } from "./CategoriaForm";
import type { CategoriaRequestDTO } from "../../types/categorias/CategoriaRequestDTO";
import type { CategoriaResponseDTO } from "../../types/categorias/CategoriaResponseDTO";

interface CategoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoria?: CategoriaResponseDTO;
  categoriasPadre: CategoriaResponseDTO[];
  onSubmit: (data: CategoriaRequestDTO) => Promise<void>;
  loading?: boolean;
}

export const CategoriaModal: React.FC<CategoriaModalProps> = ({
  isOpen,
  onClose,
  categoria,
  categoriasPadre,
  onSubmit,
  loading = false,
}) => {
  const title = categoria ? "Editar Categoría" : "Nueva Categoría";

  const handleSubmit = async (data: CategoriaRequestDTO) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <CategoriaForm
        categoria={categoria}
        categoriasPadre={categoriasPadre}
        onSubmit={handleSubmit}
        onCancel={onClose}
        loading={loading}
      />
    </Modal>
  );
};
