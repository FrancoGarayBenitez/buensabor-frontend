import React, { useState, useEffect } from 'react';
import type { CategoriaRequestDTO } from '../../types/categorias/CategoriaRequestDTO';
import type { CategoriaResponseDTO } from '../../types/categorias/CategoriaResponseDTO';
import { FormField } from '../common/FormFieldProps';
import { Select } from '../common/Select';
import { Button } from '../common/Button';

interface CategoriaFormProps {
  categoria?: CategoriaResponseDTO;
  categoriasPadre: CategoriaResponseDTO[];
  onSubmit: (data: CategoriaRequestDTO) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const CategoriaForm: React.FC<CategoriaFormProps> = ({
  categoria,
  categoriasPadre,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CategoriaRequestDTO>({
    denominacion: '',
    esSubcategoria: false,
    idCategoriaPadre: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos si es edición
  useEffect(() => {
    if (categoria) {
      setFormData({
        denominacion: categoria.denominacion,
        esSubcategoria: categoria.esSubcategoria,
        idCategoriaPadre: categoria.idCategoriaPadre,
      });
    }
  }, [categoria]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.denominacion.trim()) {
      newErrors.denominacion = 'La denominación es obligatoria';
    }

    if (formData.esSubcategoria && !formData.idCategoriaPadre) {
      newErrors.idCategoriaPadre = 'Debe seleccionar una categoría padre';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const dataToSubmit = {
        ...formData,
        idCategoriaPadre: formData.esSubcategoria ? formData.idCategoriaPadre : undefined,
      };
      
      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error('Error al guardar categoría:', error);
    }
  };

  const handleEsSubcategoriaChange = (value: boolean) => {
    setFormData(prev => ({
      ...prev,
      esSubcategoria: value,
      idCategoriaPadre: value ? prev.idCategoriaPadre : undefined,
    }));
  };

  // Filtrar categorías padre disponibles (no pueden ser subcategorías y no puede ser la misma)
  const categoriasDisponibles = categoriasPadre.filter(cat => 
    !cat.esSubcategoria && cat.idCategoria !== categoria?.idCategoria
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField
        label="Denominación"
        name="denominacion"
        value={formData.denominacion}
        onChange={(value) => setFormData(prev => ({ ...prev, denominacion: value as string }))}
        placeholder="Ingrese el nombre del rubro"
        required
        error={errors.denominacion}
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Tipo de Categoría
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="esSubcategoria"
              checked={!formData.esSubcategoria}
              onChange={() => handleEsSubcategoriaChange(false)}
              className="mr-2"
            />
            Categoría Principal
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="esSubcategoria"
              checked={formData.esSubcategoria}
              onChange={() => handleEsSubcategoriaChange(true)}
              className="mr-2"
            />
            Subcategoría
          </label>
        </div>
      </div>

      {formData.esSubcategoria && (
        <Select
          label="Categoría Padre"
          name="idCategoriaPadre"
          value={formData.idCategoriaPadre || ''}
          onChange={(value) => setFormData(prev => ({ 
            ...prev, 
            idCategoriaPadre: value as number 
          }))}
          options={categoriasDisponibles.map(cat => ({
            value: cat.idCategoria,
            label: cat.denominacion,
          }))}
          placeholder="Seleccione la categoría padre"
          required
          error={errors.idCategoriaPadre}
        />
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
        >
          {categoria ? 'Actualizar' : 'Crear'} Categoría
        </Button>
      </div>
    </form>
  );
};

