import React, { useState, useEffect } from "react";
import type { CategoriaRequestDTO } from "../../types/categorias/CategoriaRequestDTO";
import type { CategoriaResponseDTO } from "../../types/categorias/CategoriaResponseDTO";
import { FormField } from "../common/FormFieldProps";
import { Button } from "../common/Button";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { TipoCategoria } from "../../types/categorias/TipoCategoria";

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
    denominacion: "",
    esSubcategoria: false,
    tipoCategoria: "COMIDAS", // por defecto
    idCategoriaPadre: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busquedaCategoria, setBusquedaCategoria] = useState("");

  // Cargar datos si es edición
  useEffect(() => {
    if (categoria) {
      setFormData({
        denominacion: categoria.denominacion,
        esSubcategoria: categoria.esSubcategoria,
        tipoCategoria: categoria.tipoCategoria,
        idCategoriaPadre: categoria.idCategoriaPadre,
      });
    }
  }, [categoria]);

  // Limpiar búsqueda cuando cambia el tipo de categoría
  useEffect(() => {
    if (!formData.esSubcategoria) {
      setBusquedaCategoria("");
    }
  }, [formData.esSubcategoria]);

  //  Filtrar categorías padre por tipo
  const categoriasDisponibles = React.useMemo(() => {
    if (!formData.esSubcategoria) return [];
    return categoriasPadre.filter((cat) => {
      if (cat.idCategoria === categoria?.idCategoria) return false;
      if (cat.esSubcategoria) return false;
      // Solo categorías del mismo tipo (COMIDAS / INGREDIENTES / BEBIDAS)
      if (cat.tipoCategoria !== formData.tipoCategoria) return false;
      return true;
    });
  }, [
    categoriasPadre,
    formData.esSubcategoria,
    formData.tipoCategoria,
    categoria,
  ]);

  // Organizar categorías
  const categoriasOrganizadas = React.useMemo(() => {
    if (!formData.esSubcategoria || categoriasDisponibles.length === 0) {
      return [];
    }

    // Aplicar filtro de búsqueda
    const categoriasFiltradas = categoriasDisponibles.filter((cat) => {
      if (!busquedaCategoria.trim()) return true;
      return cat.denominacion
        .toLowerCase()
        .includes(busquedaCategoria.toLowerCase().trim());
    });

    // Ordenar por nombre
    return categoriasFiltradas.sort((a, b) =>
      a.denominacion.localeCompare(b.denominacion)
    );
  }, [categoriasDisponibles, busquedaCategoria, formData.esSubcategoria]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.denominacion.trim()) {
      newErrors.denominacion = "La denominación es obligatoria";
    }

    if (formData.esSubcategoria && !formData.idCategoriaPadre) {
      newErrors.idCategoriaPadre = "Debe seleccionar una categoría padre";
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
        idCategoriaPadre: formData.esSubcategoria
          ? formData.idCategoriaPadre
          : undefined,
      };

      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error("Error al guardar categoría:", error);
    }
  };

  const handleEsSubcategoriaChange = (value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      esSubcategoria: value,
      idCategoriaPadre: value ? prev.idCategoriaPadre : undefined,
    }));

    if (!value) {
      setBusquedaCategoria("");
    }
  };

  const handleSelectCategoria = (categoriaId: number) => {
    setFormData((prev) => ({
      ...prev,
      idCategoriaPadre: categoriaId,
    }));
  };

  const clearSelection = () => {
    setFormData((prev) => ({
      ...prev,
      idCategoriaPadre: undefined,
    }));
  };

  const categoriaSeleccionada = categoriasPadre.find(
    (cat) => cat.idCategoria === formData.idCategoriaPadre
  );

  return (
    <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
      <FormField
        label="Denominación"
        name="denominacion"
        value={formData.denominacion}
        onChange={(value) =>
          setFormData((prev) => ({ ...prev, denominacion: value as string }))
        }
        placeholder="Ingrese el nombre de la categoría"
        required
        error={errors.denominacion}
      />

      {/*  Selector de tipo */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Tipo de Categoría *
        </label>
        <div className="grid grid-cols-3 gap-4">
          {(
            [
              {
                key: "COMIDAS",
                title: "🍕 Comidas",
                desc: "Para productos manufacturados",
              },
              {
                key: "INGREDIENTES",
                title: "🥕 Ingredientes",
                desc: "Para artículos insumo",
              },
              { key: "BEBIDAS", title: "🥤 Bebidas", desc: "Para bebidas" },
            ] as { key: TipoCategoria; title: string; desc: string }[]
          ).map((opt) => (
            <label
              key={opt.key}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.tipoCategoria === opt.key
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="tipoCategoria"
                checked={formData.tipoCategoria === opt.key}
                onChange={() =>
                  setFormData((prev) => ({
                    ...prev,
                    tipoCategoria: opt.key,
                    idCategoriaPadre: undefined,
                  }))
                }
                className="mr-3 text-orange-600"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{opt.title}</div>
                <div className="text-sm text-gray-500">{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Nivel de Categoría */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Nivel de Categoría *
        </label>
        <div className="grid grid-cols-2 gap-4">
          {/* Principal */}
          <label
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              !formData.esSubcategoria
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="esSubcategoria"
              checked={!formData.esSubcategoria}
              onChange={() => handleEsSubcategoriaChange(false)}
              className="mr-3 text-blue-600"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                Categoría Principal
              </div>
              <div className="text-sm text-gray-500">
                {formData.tipoCategoria === "INGREDIENTES"
                  ? "Ej: Harinas, Carnes"
                  : formData.tipoCategoria === "BEBIDAS"
                  ? "Ej: Refrescantes, Alcohólicas"
                  : "Ej: Pizzas, Pastas"}
              </div>
            </div>
          </label>
          {/* Subcategoría */}
          <label
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              formData.esSubcategoria
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="esSubcategoria"
              checked={formData.esSubcategoria}
              onChange={() => handleEsSubcategoriaChange(true)}
              className="mr-3 text-blue-600"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Subcategoría</div>
              <div className="text-sm text-gray-500">
                {formData.tipoCategoria === "INGREDIENTES"
                  ? "Ej: Trigo, Vacuna"
                  : formData.tipoCategoria === "BEBIDAS"
                  ? "Ej: Con gas, Sin alcohol"
                  : "Ej: Con champiñones, BBQ"}
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Sección de categoría padre */}
      {formData.esSubcategoria && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Categoría Principal *
          </label>

          {/* Información útil */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3 text-sm text-blue-700">
              <span className="text-lg">💡</span>
              <div>
                <div className="font-medium mb-1">Sistema de 2 niveles</div>
                <div>
                  Seleccione la <strong>categoría principal</strong> bajo la
                  cual se organizará esta subcategoría.
                </div>
                <div className="mt-2 text-blue-600">
                  <strong>Ejemplo:</strong>{" "}
                  {formData.tipoCategoria === "INGREDIENTES"
                    ? "Harinas → Integral, Común, Especial"
                    : formData.tipoCategoria === "BEBIDAS"
                    ? "Refrescantes → Con gas, Sin azúcar"
                    : "Pizzas → Clásica, Especial, Vegana"}
                </div>
              </div>
            </div>
          </div>

          {/* Campo de selección actual */}
          {categoriaSeleccionada && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {categoriaSeleccionada.denominacion}
                    </div>
                    <div className="text-sm text-gray-600">
                      Categoría Principal •{" "}
                      {categoriaSeleccionada.cantidadArticulos || 0} artículos
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Limpiar selección"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Buscador */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar categoría principal..."
              value={busquedaCategoria}
              onChange={(e) => setBusquedaCategoria(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Lista de categorías */}
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
            <div className="max-h-64 overflow-y-auto">
              {categoriasOrganizadas.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">
                    {busquedaCategoria.trim() ? "🔍" : "📁"}
                  </div>
                  <div className="text-lg font-medium text-gray-600 mb-2">
                    {busquedaCategoria.trim()
                      ? "Sin resultados"
                      : categoriasDisponibles.length === 0
                      ? "Sin categorías principales"
                      : "Seleccione una categoría"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {busquedaCategoria.trim()
                      ? `No se encontraron categorías con "${busquedaCategoria}"`
                      : categoriasDisponibles.length === 0
                      ? `Debe crear al menos una categoría principal de ${
                          formData.tipoCategoria === "INGREDIENTES"
                            ? "ingredientes"
                            : formData.tipoCategoria === "BEBIDAS"
                            ? "bebidas"
                            : "comidas"
                        } primero`
                      : `${categoriasDisponibles.length} categorías disponibles`}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Encabezado */}
                  {categoriasOrganizadas.length > 8 &&
                    !busquedaCategoria.trim() && (
                      <div className="p-3 bg-gray-50 border-b border-gray-200 text-sm text-gray-600 flex items-center space-x-2">
                        <span>💡</span>
                        <span>
                          Use el buscador para encontrar categorías rápidamente
                        </span>
                      </div>
                    )}

                  <div className="divide-y divide-gray-100">
                    {categoriasOrganizadas.map((cat) => (
                      <div
                        key={cat.idCategoria}
                        className={`p-4 cursor-pointer transition-all duration-200 hover:bg-orange-50 ${
                          cat.idCategoria === formData.idCategoriaPadre
                            ? "bg-orange-100 border-l-4 border-orange-500"
                            : "hover:border-l-4 hover:border-orange-200"
                        }`}
                        onClick={() => handleSelectCategoria(cat.idCategoria)}
                      >
                        <div className="flex items-center space-x-3">
                          {/* Icono */}
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-bold text-sm">
                              {cat.denominacion.charAt(0).toUpperCase()}
                            </span>
                          </div>

                          {/* Información */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900 flex items-center">
                                  {cat.denominacion}
                                  {cat.idCategoria ===
                                    formData.idCategoriaPadre && (
                                    <span className="ml-2 text-orange-600 font-bold">
                                      ✓
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 mt-1 flex items-center space-x-3">
                                  <span className="flex items-center space-x-1">
                                    <span>📊</span>
                                    <span>
                                      {cat.cantidadArticulos || 0} artículos
                                    </span>
                                  </span>
                                  {cat.cantidadSubcategorias && (
                                    <span className="flex items-center space-x-1">
                                      <span>📁</span>
                                      <span>
                                        {cat.cantidadSubcategorias}{" "}
                                        subcategorías
                                      </span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Indicador */}
                          {cat.idCategoria === formData.idCategoriaPadre && (
                            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-sm">✓</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {categoriasOrganizadas.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 p-3">
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>
                    {categoriasOrganizadas.length} de{" "}
                    {categoriasDisponibles.length} categorías
                  </span>
                  <span className="font-medium">Sistema de 2 niveles</span>
                </div>
              </div>
            )}
          </div>

          {errors.idCategoriaPadre && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 flex items-center space-x-2">
                <span>⚠️</span>
                <span>{errors.idCategoriaPadre}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={loading} disabled={loading}>
          {categoria ? "Actualizar" : "Crear"} Categoría
        </Button>
      </div>
    </form>
  );
};
