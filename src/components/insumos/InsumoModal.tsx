import React from "react";
import { Modal } from "../common/Modal";
import { InsumoForm } from "./InsumoForm";
import type { ArticuloInsumoRequestDTO } from "../../types/insumos/ArticuloInsumoRequestDTO";
import type { ArticuloInsumoResponseDTO } from "../../types/insumos/ArticuloInsumoResponseDTO";
import type { CategoriaResponseDTO } from "../../types/categorias/CategoriaResponseDTO";
import type { UnidadMedidaDTO } from "../../services";

interface InsumoModalProps {
  isOpen: boolean;
  onClose: () => void;
  insumo?: ArticuloInsumoResponseDTO;
  categorias: CategoriaResponseDTO[];
  unidadesMedida: UnidadMedidaDTO[];
  onSubmit: (data: ArticuloInsumoRequestDTO) => Promise<void>;
  loading?: boolean;
}

export const InsumoModal: React.FC<InsumoModalProps> = ({
  isOpen,
  onClose,
  insumo,
  categorias,
  unidadesMedida,
  onSubmit,
  loading = false,
}) => {
  const title = insumo ? "✏️ Editar Ingrediente" : "➕ Nuevo Ingrediente";

  const categoriasIngredientesOBebidas = categorias.filter(
    (c) => c.tipoCategoria === "INGREDIENTES" || c.tipoCategoria === "BEBIDAS"
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <InsumoForm
        insumo={insumo}
        categorias={categoriasIngredientesOBebidas}
        unidadesMedida={unidadesMedida}
        onSubmit={onSubmit}
        onCancel={onClose}
        loading={loading}
      />
    </Modal>
  );
};

export default InsumoModal;
