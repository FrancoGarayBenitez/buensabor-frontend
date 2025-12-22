import React from "react";
import { Modal } from "../common/Modal";
import { ProductoForm } from "./ProductoForm";
import type { ArticuloManufacturadoRequestDTO } from "../../types/productos/ArticuloManufacturadoRequestDTO";
import type { ArticuloManufacturadoResponseDTO } from "../../types/productos/ArticuloManufacturadoResponseDTO";
import type { CategoriaResponseDTO } from "../../types/categorias/CategoriaResponseDTO";
import type { UnidadMedidaDTO } from "../../services";

interface ProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto?: ArticuloManufacturadoResponseDTO;
  categorias: CategoriaResponseDTO[];
  unidadesMedida: UnidadMedidaDTO[];
  onSubmit: (data: ArticuloManufacturadoRequestDTO) => Promise<void>;
  loading?: boolean;
  serverErrorMessage?: string;
}

export const ProductoModal: React.FC<ProductoModalProps> = ({
  isOpen,
  onClose,
  producto,
  categorias,
  unidadesMedida,
  onSubmit,
  loading = false,
  serverErrorMessage,
}) => {
  const title = producto ? "✏️ Editar Producto" : "➕ Nuevo Producto";

  const handleSubmit = async (data: ArticuloManufacturadoRequestDTO) => {
    await onSubmit(data);
  };

  const categoriasComidas = categorias.filter(
    (c) => c.tipoCategoria === "COMIDAS"
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <ProductoForm
        producto={producto}
        categorias={categoriasComidas}
        unidadesMedida={unidadesMedida}
        onSubmit={handleSubmit}
        onCancel={onClose}
        loading={loading}
        serverErrorMessage={serverErrorMessage} // ✅ pasa el error al form
      />
    </Modal>
  );
};

export default ProductoModal;
