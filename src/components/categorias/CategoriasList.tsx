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
    tipo: "todos", // 'todos', 'principales', 'subcategorias', 'comidas', 'ingredientes', 'bebidas'
    mostrarVacio: true,
  });

  // Tipo auxiliar para los nodos en la jerarquía
  type CategoriaNodo = {
    idCategoria: number;
    denominacion: string;
    esSubcategoria: boolean;
    tipoCategoria: "COMIDAS" | "INGREDIENTES" | "BEBIDAS";
    cantidadArticulos?: number;
    hijos: CategoriaNodo[];
    nivel?: number;
  };

  // Función recursiva para construir la jerarquía completa
  const construirJerarquia = (
    categorias: CategoriaResponseDTO[]
  ): CategoriaNodo[] => {
    const categoriasMap = new Map<number, CategoriaNodo>(
      categorias.map((cat) => [
        cat.idCategoria,
        { ...cat, hijos: [] as CategoriaNodo[] } as CategoriaNodo,
      ])
    );
    const raices: CategoriaNodo[] = [];

    categorias.forEach((categoria) => {
      const nodo = categoriasMap.get(categoria.idCategoria)!;

      if (categoria.idCategoriaPadre) {
        const padre = categoriasMap.get(categoria.idCategoriaPadre);
        if (padre) {
          padre.hijos.push(nodo);
        } else {
          raices.push(nodo);
        }
      } else {
        raices.push(nodo);
      }
    });

    return raices;
  };

  // Función recursiva para aplanar la jerarquía con niveles
  const aplanarJerarquia = (
    nodos: CategoriaNodo[],
    nivel = 0
  ): CategoriaNodo[] => {
    const resultado: CategoriaNodo[] = [];

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
    let categoriasBase = categoriasJerarquicas;

    const filtrarPorTipoCategoria = (
      nodos: CategoriaNodo[],
      tipo: "COMIDAS" | "INGREDIENTES" | "BEBIDAS"
    ): CategoriaNodo[] => {
      return nodos
        .filter((nodo) => nodo.tipoCategoria === tipo)
        .map((nodo) => ({
          ...nodo,
          hijos: filtrarPorTipoCategoria(nodo.hijos || [], tipo),
        }));
    };

    if (filtros.tipo === "comidas") {
      categoriasBase = filtrarPorTipoCategoria(categoriasBase, "COMIDAS");
    } else if (filtros.tipo === "ingredientes") {
      categoriasBase = filtrarPorTipoCategoria(categoriasBase, "INGREDIENTES");
    } else if (filtros.tipo === "bebidas") {
      categoriasBase = filtrarPorTipoCategoria(categoriasBase, "BEBIDAS");
    }

    // ✅ Recolectar subcategorías recursivamente
    const recolectarSubcategorias = (
      nodos: CategoriaNodo[]
    ): CategoriaNodo[] => {
      const out: CategoriaNodo[] = [];
      for (const nodo of nodos) {
        if (nodo.esSubcategoria) out.push({ ...nodo, nivel: 0, hijos: [] });
        if (nodo.hijos?.length)
          out.push(...recolectarSubcategorias(nodo.hijos));
      }
      return out;
    };

    // Filtrar por nivel (principales vs subcategorías)
    if (filtros.tipo === "subcategorias") {
      let subcats = recolectarSubcategorias(categoriasBase);

      // Búsqueda
      if (filtros.busqueda) {
        const q = filtros.busqueda.toLowerCase();
        subcats = subcats.filter((cat) =>
          cat.denominacion.toLowerCase().includes(q)
        );
      }

      // Vacíos
      if (!filtros.mostrarVacio) {
        subcats = subcats.filter((cat) => (cat.cantidadArticulos || 0) > 0);
      }

      return subcats;
    }

    if (filtros.tipo === "principales") {
      categoriasBase = categoriasBase.filter((cat) => !cat.esSubcategoria);
    }

    // Búsqueda recursiva sobre jerarquía
    if (filtros.busqueda) {
      const filtrarPorBusqueda = (nodos: CategoriaNodo[]): CategoriaNodo[] => {
        return nodos
          .map((nodo) => {
            const coincideNombre = nodo.denominacion
              .toLowerCase()
              .includes(filtros.busqueda.toLowerCase());
            const hijosFiltrados = filtrarPorBusqueda(nodo.hijos || []);
            if (coincideNombre || hijosFiltrados.length > 0) {
              return {
                ...nodo,
                hijos: coincideNombre ? nodo.hijos : hijosFiltrados,
              };
            }
            return null;
          })
          .filter(
            (nodo): nodo is CategoriaNodo & { hijos: CategoriaNodo[] } =>
              nodo !== null
          );
      };
      categoriasBase = filtrarPorBusqueda(categoriasBase);
    }

    // Ocultar categorías vacías en jerarquía
    if (!filtros.mostrarVacio) {
      const filtrarVacios = (nodos: CategoriaNodo[]): CategoriaNodo[] => {
        return nodos
          .map((nodo) => {
            const hijosFiltrados = filtrarVacios(nodo.hijos || []);
            if (
              (nodo.cantidadArticulos || 0) > 0 ||
              hijosFiltrados.length > 0
            ) {
              return { ...nodo, hijos: hijosFiltrados };
            }
            return null;
          })
          .filter(
            (nodo): nodo is CategoriaNodo & { hijos: CategoriaNodo[] } =>
              nodo !== null
          );
      };
      categoriasBase = filtrarVacios(categoriasBase);
    }

    return categoriasBase;
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

  // Obtener todas las categorías principales para Expandir/Colapsar
  const todasLasPrincipales = React.useMemo(() => {
    const obtenerPrincipales = (nodos: any[]): number[] => {
      return nodos
        .filter((n) => !n.esSubcategoria)
        .flatMap((n) => [n.idCategoria, ...obtenerPrincipales(n.hijos || [])]);
    };
    return obtenerPrincipales(categoriasJerarquicas);
  }, [categoriasJerarquicas]);

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
          <span
            className={`flex items-center space-x-2 ${
              record.nivel > 0 ? "text-gray-600" : "font-medium"
            }`}
          >
            <span>{value}</span>
            {/* Indicador de tipo solo en principales */}
            {!record.esSubcategoria && (
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  record.tipoCategoria === "INGREDIENTES"
                    ? "bg-green-100 text-green-700"
                    : record.tipoCategoria === "BEBIDAS"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {record.tipoCategoria === "INGREDIENTES"
                  ? "🥕 Ingredientes"
                  : record.tipoCategoria === "BEBIDAS"
                  ? "🥤 Bebidas"
                  : "🍕 Comidas"}
              </span>
            )}
          </span>
        </div>
      ),
    },
    {
      key: "subcategorias",
      title: "Subcategorías",
      width: "15%",
      align: "center",
      render: (_: any, record: any) => (
        <span className="text-gray-600">{record.hijos?.length || 0}</span>
      ),
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
      key: "tipoCategoria",
      title: "Tipo",
      width: "15%",
      align: "center",
      render: (_: any, record: any) => (
        <span className="text-sm text-gray-600">
          {record.tipoCategoria === "INGREDIENTES"
            ? "Ingrediente"
            : record.tipoCategoria === "BEBIDAS"
            ? "Bebida"
            : "Comida"}
        </span>
      ),
    },
    {
      key: "acciones",
      title: "Acciones",
      width: "25%",
      align: "center",
      render: (_: any, record: any) => (
        <div className="flex justify-center space-x-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(record)}>
            Editar
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => onDelete(record.idCategoria)}
            disabled={(record.cantidadArticulos || 0) > 0}
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
              <option value="comidas">🍕 Solo comidas</option>
              <option value="ingredientes">🥕 Solo ingredientes</option>
              <option value="bebidas">🥤 Solo bebidas</option>
              <option value="principales">📌 Solo principales</option>
              <option value="subcategorias">📁 Solo subcategorías</option>
            </select>
          </div>

          {/* Acciones rápidas */}
          <div className="flex items-end space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExpandedRows(new Set(todasLasPrincipales))}
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
