import React from 'react';
import { Table, type TableColumn } from '../common/Table';
import { Button } from '../common/Button';
import type{ CategoriaResponseDTO } from '../../types/categorias/CategoriaResponseDTO';

interface CategoriasListProps {
  categorias: CategoriaResponseDTO[];
  loading?: boolean;
  onEdit: (categoria: CategoriaResponseDTO) => void;
  onDelete: (id: number) => void;
}

export const CategoriasList: React.FC<CategoriasListProps> = ({
  categorias,
  loading = false,
  onEdit,
  onDelete,
}) => {
  const columns: TableColumn<CategoriaResponseDTO>[] = [
    {
      key: 'denominacion',
      title: 'Denominación',
      width: '25%',
    },
    {
      key: 'esSubcategoria',
      title: 'Tipo',
      width: '15%',
      render: (value: boolean) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {value ? 'Subcategoría' : 'Principal'}
        </span>
      ),
    },
    {
      key: 'denominacionCategoriaPadre',
      title: 'Categoría Padre',
      width: '20%',
      render: (value: string) => value || '-',
    },
    {
      key: 'cantidadArticulos',
      title: 'Artículos',
      width: '10%',
      align: 'center',
      render: (value: number) => (
        <span className="text-gray-600">{value || 0}</span>
      ),
    },
    {
      key: 'subcategorias',
      title: 'Subcategorías',
      width: '15%',
      align: 'center',
      render: (subcategorias: any[]) => (
        <span className="text-gray-600">{subcategorias?.length || 0}</span>
      ),
    },
    {
      key: 'acciones',
      title: 'Acciones',
      width: '15%',
      align: 'center',
      render: (_, record: CategoriaResponseDTO) => (
        <div className="flex justify-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(record)}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => onDelete(record.idCategoria)}
            disabled={record.cantidadArticulos > 0}
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={categorias}
      loading={loading}
      emptyText="No hay categorías registradas"
    />
  );
};

