import React, { useState, useEffect } from "react";
import { Select } from "./Select";
import type { CategoriaResponseDTO } from "../../types/categorias/CategoriaResponseDTO";

interface CategoriaSelectorProps {
  categorias: CategoriaResponseDTO[];
  value?: number; // idCategoria seleccionada (puede ser principal o subcategoría)
  onChange: (idCategoria: number) => void;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

export const CategoriaSelector: React.FC<CategoriaSelectorProps> = ({
  categorias,
  value,
  onChange,
  label = "Categoría",
  required = false,
  error,
  disabled = false,
  placeholder = "Seleccione una categoría",
}) => {
  const [categoriasPrincipales, setCategoriasPrincipales] = useState<
    CategoriaResponseDTO[]
  >([]);
  const [subcategorias, setSubcategorias] = useState<CategoriaResponseDTO[]>(
    []
  );
  const [categoriaPrincipalSelected, setCategoriaPrincipalSelected] =
    useState<number>(0);
  const [subcategoriaSelected, setSubcategoriaSelected] = useState<number>(0);

  // Separar categorías principales de subcategorías
  useEffect(() => {
    const principales = categorias.filter((cat) => !cat.esSubcategoria);
    setCategoriasPrincipales(principales);
  }, [categorias]);

  // Cargar valores iniciales si hay un valor predefinido
  useEffect(() => {
    if (value && categorias.length > 0) {
      const categoriaSeleccionada = categorias.find(
        (cat) => cat.idCategoria === value
      );
      if (categoriaSeleccionada) {
        if (categoriaSeleccionada.esSubcategoria) {
          // Es subcategoría
          setCategoriaPrincipalSelected(
            categoriaSeleccionada.idCategoriaPadre || 0
          );
          setSubcategoriaSelected(value);
        } else {
          // Es categoría principal
          setCategoriaPrincipalSelected(value);
          setSubcategoriaSelected(0);
        }
      }
    } else {
      // Reset si no hay valor
      setCategoriaPrincipalSelected(0);
      setSubcategoriaSelected(0);
    }
  }, [value, categorias]);

  // Actualizar subcategorías cuando cambia la categoría principal
  useEffect(() => {
    if (categoriaPrincipalSelected) {
      const subsDeCategoria = categorias.filter(
        (cat) =>
          cat.esSubcategoria &&
          cat.idCategoriaPadre === categoriaPrincipalSelected
      );
      setSubcategorias(subsDeCategoria);

      // Si no hay subcategorías, notificar que la principal está seleccionada
      if (subsDeCategoria.length === 0) {
        onChange(categoriaPrincipalSelected);
        setSubcategoriaSelected(0);
      } else {
        // Si hay subcategorías y no hay una seleccionada, limpiar la selección
        if (!subcategoriaSelected) {
          // No notificar cambio hasta que se seleccione una subcategoría
        }
      }
    } else {
      setSubcategorias([]);
      setSubcategoriaSelected(0);
    }
  }, [categoriaPrincipalSelected]);

  const handleCategoriaPrincipalChange = (value: string | number) => {
    const newValue = Number(value);
    setCategoriaPrincipalSelected(newValue);
    setSubcategoriaSelected(0); // Reset subcategoría

    // Si no hay subcategorías para esta principal, seleccionar directamente la principal
    const subsDeCategoria = categorias.filter(
      (cat) => cat.esSubcategoria && cat.idCategoriaPadre === newValue
    );

    if (subsDeCategoria.length === 0 && newValue > 0) {
      onChange(newValue);
    } else if (newValue === 0) {
      onChange(0); // Reset completo
    }
  };

  const handleSubcategoriaChange = (value: string | number) => {
    const newValue = Number(value);
    setSubcategoriaSelected(newValue);
    if (newValue > 0) {
      onChange(newValue);
    } else if (categoriaPrincipalSelected > 0) {
      // Si se deselecciona subcategoría pero hay principal, usar la principal
      onChange(categoriaPrincipalSelected);
    }
  };

  // Determinar si mostrar error
  const showError =
    error &&
    (!categoriaPrincipalSelected ||
      (subcategorias.length > 0 && !subcategoriaSelected));

  return (
    <div className="space-y-4">
      <Select
        label={label}
        name="categoriaPrincipal"
        value={categoriaPrincipalSelected}
        onChange={handleCategoriaPrincipalChange}
        options={categoriasPrincipales.map((cat) => ({
          value: cat.idCategoria,
          label: cat.denominacion,
        }))}
        placeholder="Seleccione categoría principal"
        required={required}
        disabled={disabled}
        error={showError ? error : undefined}
      />

      {/* Subcategorías - Solo mostrar si hay categoría principal seleccionada */}
      {categoriaPrincipalSelected > 0 && subcategorias.length > 0 && (
        <Select
          label="Subcategoría"
          name="subcategoria"
          value={subcategoriaSelected}
          onChange={handleSubcategoriaChange}
          options={subcategorias.map((sub) => ({
            value: sub.idCategoria,
            label: sub.denominacion,
          }))}
          placeholder="Seleccione subcategoría (opcional)"
          disabled={disabled}
          helperText="Opcional: Si no selecciona subcategoría, se usará la categoría principal"
        />
      )}

      {/* Mostrar selección actual */}
      {categoriaPrincipalSelected > 0 && (
        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
          <strong>Selección actual:</strong>{" "}
          {subcategoriaSelected > 0 ? (
            <>
              {
                categoriasPrincipales.find(
                  (c) => c.idCategoria === categoriaPrincipalSelected
                )?.denominacion
              }{" "}
              →{" "}
              {
                subcategorias.find(
                  (s) => s.idCategoria === subcategoriaSelected
                )?.denominacion
              }
            </>
          ) : (
            categoriasPrincipales.find(
              (c) => c.idCategoria === categoriaPrincipalSelected
            )?.denominacion
          )}
        </div>
      )}
    </div>
  );
};
