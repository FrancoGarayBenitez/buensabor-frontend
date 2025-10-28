import React from 'react';
import { Modal } from '../common/Modal';
import { ProductoForm } from './ProductoForm';
import type { ArticuloManufacturadoRequestDTO } from '../../types/productos/ArticuloManufacturadoRequestDTO';
import type { ArticuloManufacturadoResponseDTO } from '../../types/productos/ArticuloManufacturadoResponseDTO';
import type { ArticuloInsumoResponseDTO } from '../../types/insumos/ArticuloInsumoResponseDTO';
import type { CategoriaResponseDTO } from '../../types/categorias/CategoriaResponseDTO';
import type { UnidadMedidaDTO } from '../../services';


interface ProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto?: ArticuloManufacturadoResponseDTO;
  categorias: CategoriaResponseDTO[];
  unidadesMedida: UnidadMedidaDTO[];
  ingredientes: ArticuloInsumoResponseDTO[];
  onSubmit: (data: ArticuloManufacturadoRequestDTO) => Promise<void>;
  loading?: boolean;
}

export const ProductoModal: React.FC<ProductoModalProps> = ({
  isOpen,
  onClose,
  producto,
  categorias,
  unidadesMedida,
  ingredientes,
  onSubmit,
  loading = false,
}) => {
  const title = producto ? 'Editar Producto' : 'Nuevo Producto';

  const handleSubmit = async (data: ArticuloManufacturadoRequestDTO) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
    >
      <ProductoForm
        producto={producto}
        categorias={categorias}
        unidadesMedida={unidadesMedida}
        ingredientes={ingredientes}
        onSubmit={handleSubmit}
        onCancel={onClose}
        loading={loading}
      />
    </Modal>
  );
};