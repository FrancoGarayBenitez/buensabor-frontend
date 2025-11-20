import React, { useState } from "react";
import { Table, type TableColumn } from "../common/Table";
import { Button } from "../common/Button";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { CategoriaResponseDTO } from "../../types/categorias/CategoriaResponseDTO";

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
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [filtros, setFiltros] = useState({
    busqueda: "",
    tipo: "todos", // 'todos', 'principales', 'subcategorias'
    mostrarVacio: true, // mostrar categorías sin artículos
  });

  // Organizar categorías principales con sus subcategorías
  const categoriasOrganizadas = React.useMemo(() => {
    const principales = categorias.filter((cat) => !cat.esSubcategoria);

    return principales.map((principal) => ({
      ...principal,
      subcategorias: categorias.filter(
        (cat) =>
          cat.esSubcategoria &&
          cat.denominacionCategoriaPadre === principal.denominacion
      ),
    }));
  }, [categorias]);

  // Función recursiva para construir la jerarquía completa
  const construirJerarquia = (categorias: CategoriaResponseDTO[]): any[] => {
    const categoriasMap = new Map(
      categorias.map((cat) => [cat.idCategoria, { ...cat, hijos: [] as any[] }])
    );
    const raices: any[] = [];

    categorias.forEach((categoria) => {
      const nodo = categoriasMap.get(categoria.idCategoria)!;

      if (categoria.idCategoriaPadre) {
        const padre = categoriasMap.get(categoria.idCategoriaPadre);
        if (padre) {
          padre.hijos.push(nodo);
        } else {
          // Si no encuentra el padre, lo trata como raíz
          raices.push(nodo);
        }
      } else {
        raices.push(nodo);
      }
    });

    return raices;
  };

  // Función recursiva para aplanar la jerarquía con niveles
  const aplanarJerarquia = (nodos: any[], nivel = 0): any[] => {
    const resultado: any[] = [];

    nodos.forEach((nodo) => {
      resultado.push({ ...nodo, nivel });

      if (expandedRows.has(nodo.idCategoria) && nodo.hijos.length > 0) {
        resultado.push(...aplanarJerarquia(nodo.hijos, nivel + 1));
      }
    });

    return resultado;
  };

  // Organizar categorías con jerarquía completa
  const categoriasJerarquicas = React.useMemo(() => {
    return construirJerarquia(categorias);
  }, [categorias]);

  // Aplicar filtros
  const categoriasFiltradas = React.useMemo(() => {
    if (filtros.tipo === "subcategorias") {
      return categorias
        .filter((cat) => cat.esSubcategoria)
        .filter(
          (cat) =>
            !filtros.busqueda ||
            cat.denominacion
              .toLowerCase()
              .includes(filtros.busqueda.toLowerCase())
        )
        .filter((cat) => filtros.mostrarVacio || cat.cantidadArticulos > 0)
        .map((cat) => ({ ...cat, nivel: 0, hijos: [] }));
    }

    let resultado = categoriasJerarquicas;

    if (filtros.tipo === "principales") {
      resultado = resultado.filter((cat) => !cat.esSubcategoria);
    }

    // Aplicar filtros de búsqueda recursivamente - MEJORADO
    if (filtros.busqueda) {
      const filtrarPorBusqueda = (nodos: any[]): any[] => {
        return nodos
          .map((nodo) => {
            const coincideNombre = nodo.denominacion
              .toLowerCase()
              .includes(filtros.busqueda.toLowerCase());

            // Filtrar hijos recursivamente
            const hijosFiltrados = filtrarPorBusqueda(nodo.hijos || []);

            // Si el nodo actual coincide O tiene hijos que coinciden, lo incluimos
            if (coincideNombre || hijosFiltrados.length > 0) {
              return {
                ...nodo,
                hijos: coincideNombre ? nodo.hijos : hijosFiltrados, // Si coincide el padre, mostrar todos sus hijos
              };
            }
            return null;
          })
          .filter((nodo) => nodo !== null);
      };

      resultado = filtrarPorBusqueda(resultado);
    }

    // Aplicar filtro de categorías vacías
    if (!filtros.mostrarVacio) {
      const filtrarVacios = (nodos: any[]): any[] => {
        return nodos
          .map((nodo) => {
            const hijosFiltrados = filtrarVacios(nodo.hijos || []);

            // Incluir si tiene artículos O tiene hijos válidos
            if (nodo.cantidadArticulos > 0 || hijosFiltrados.length > 0) {
              return {
                ...nodo,
                hijos: hijosFiltrados,
              };
            }
            return null;
          })
          .filter((nodo) => nodo !== null);
      };

      resultado = filtrarVacios(resultado);
    }

    return resultado;
  }, [categoriasJerarquicas, filtros, categorias]);

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Crear filas aplanadas para la tabla
  const filas = React.useMemo(() => {
    if (filtros.tipo === "subcategorias") {
      return categoriasFiltradas;
    }

    return aplanarJerarquia(categoriasFiltradas);
  }, [categoriasFiltradas, expandedRows, filtros.tipo]);

  const columns: TableColumn<any>[] = [
    {
      key: "denominacion",
      title: "Denominación",
      width: "30%",
      render: (value: string, record: any) => (
        <div
          className={`flex items-center`}
          style={{ paddingLeft: `${record.nivel * 24}px` }}
        >
          {record.hijos?.length > 0 && (
            <button
              onClick={() => toggleExpand(record.idCategoria)}
              className="mr-2 p-1 hover:bg-gray-100 rounded"
            >
              {expandedRows.has(record.idCategoria) ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          )}
          {record.nivel > 0 && (
            <span className="mr-2 text-gray-400">{"└─".repeat(1)}</span>
          )}
          <span className={record.nivel > 0 ? "text-gray-600" : "font-medium"}>
            {value}
          </span>
        </div>
      ),
    },
    {
      key: "subcategorias",
      title: "Subcategorías",
      width: "15%",
      align: "center",
      render: (_, record: any) => {
        return (
          <span className="text-gray-600">{record.hijos?.length || 0}</span>
        );
      },
    },
    {
      key: "cantidadArticulos",
      title: "Artículos",
      width: "15%",
      align: "center",
      render: (value: number) => (
        <span
          className={`font-medium ${
            value > 0 ? "text-green-600" : "text-gray-400"
          }`}
        >
          {value || 0}
        </span>
      ),
    },
    {
      key: "subcategorias",
      title: "Subcategorías",
      width: "15%",
      align: "center",
      render: (subcategorias: any[], record: any) => {
        if (record.esSubcategoria) return "-";
        return (
          <span className="text-gray-600">{subcategorias?.length || 0}</span>
        );
      },
    },
    {
      key: "acciones",
      title: "Acciones",
      width: "25%",
      align: "center",
      render: (_, record: any) => (
        <div className="flex justify-center space-x-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(record)}>
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
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar categoría
            </label>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={filtros.busqueda}
              onChange={(e) =>
                setFiltros((prev) => ({ ...prev, busqueda: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Filtro por tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vista
            </label>
            <select
              value={filtros.tipo}
              onChange={(e) =>
                setFiltros((prev) => ({ ...prev, tipo: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="todos">Todas las categorías</option>
              <option value="principales">Solo principales</option>
              <option value="subcategorias">Solo subcategorías</option>
            </select>
          </div>

          {/* Acciones rápidas */}
          <div className="flex items-end space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setExpandedRows(
                  new Set(categoriasOrganizadas.map((c) => c.idCategoria))
                )
              }
            >
              Expandir Todo
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExpandedRows(new Set())}
            >
              Colapsar Todo
            </Button>
          </div>
        </div>

        {/* Toggle mostrar vacíos */}
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filtros.mostrarVacio}
            onChange={(e) =>
              setFiltros((prev) => ({
                ...prev,
                mostrarVacio: e.target.checked,
              }))
            }
            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
          <span className="ml-2 text-sm text-gray-700">
            Mostrar categorías sin artículos
          </span>
        </label>
      </div>

      {/* Tabla */}
      <Table
        columns={columns}
        data={filas}
        loading={loading}
        emptyText="No hay categorías que coincidan con los filtros"
      />
    </div>
  );
};
