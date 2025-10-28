import React, { useState, useEffect } from "react";
import { Button } from "../components/common/Button";
import { Alert } from "../components/common/Alert";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ProductosList } from "../components/productos/ProductosList";
import { ProductoModal } from "../components/productos/ProductoModal";
import { ProductoDetallesModal } from "../components/productos/ProductoDetallesModal";
import { useProductos } from "../hooks/useProductos";
import { useInsumos } from "../hooks/useInsumos";
import { useCategorias } from "../hooks/useCategorias";
import { unidadMedidaService } from "../services";
import type { ArticuloManufacturadoResponseDTO } from "../types/productos/ArticuloManufacturadoResponseDTO";
import type { ArticuloManufacturadoRequestDTO } from "../types/productos/ArticuloManufacturadoRequestDTO";
import type { UnidadMedidaDTO } from "../services";
import { RankingView } from '../components/productos/RankingView';

export const Productos: React.FC = () => {
  const {
    productos,
    loading,
    error,
    createProducto,
    updateProducto,
    desactivarProducto,
    activarProducto,
  } = useProductos();

  const { insumos } = useInsumos();
  const { categorias } = useCategorias();
  const [isRankingView, setIsRankingView] = useState(false);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedidaDTO[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [detallesModalOpen, setDetallesModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<ArticuloManufacturadoResponseDTO | undefined>();
  const [viewingProducto, setViewingProducto] = useState<ArticuloManufacturadoResponseDTO | undefined>();
  const [operationLoading, setOperationLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  // Filtros de búsqueda
  const [searchInput, setSearchInput] = useState("");
  const [categoriaInput, setCategoriaInput] = useState<number | "all">("all");
  const [precioMinInput, setPrecioMinInput] = useState<number | "">("");
  const [precioMaxInput, setPrecioMaxInput] = useState<number | "">("");
  const [estadoInput, setEstadoInput] = useState<"all" | "activos" | "eliminados">("all");

  // Filtros aplicados
  const [search, setSearch] = useState("");
  const [categoriaSel, setCategoriaSel] = useState<number | "all">("all");
  const [precioMin, setPrecioMin] = useState<number | "">("");
  const [precioMax, setPrecioMax] = useState<number | "">("");
  const [estadoSel, setEstadoSel] = useState<"all" | "activos" | "eliminados">("all");

  useEffect(() => {
    const fetchUnidadesMedida = async () => {
      setLoadingUnidades(true);
      try {
        const unidades = await unidadMedidaService.getAll();
        setUnidadesMedida(unidades);
      } catch (error) {
        console.error("Error al cargar unidades de medida:", error);
        setAlert({
          type: "error",
          message: "Error al cargar unidades de medida",
        });
      } finally {
        setLoadingUnidades(false);
      }
    };

    fetchUnidadesMedida();
  }, []);

  const handleCreate = () => {
    const ingredientesParaElaborar = insumos.filter((i) => i.esParaElaborar);
    if (ingredientesParaElaborar.length === 0) {
      setAlert({
        type: "warning",
        message:
          'Debe crear ingredientes marcados como "Para Elaborar" antes de crear productos.',
      });
      return;
    }

    setEditingProducto(undefined);
    setModalOpen(true);
  };

  const handleEdit = (producto: ArticuloManufacturadoResponseDTO) => {
    setEditingProducto(producto);
    setModalOpen(true);
  };

  const handleViewDetails = (producto: ArticuloManufacturadoResponseDTO) => {
    setViewingProducto(producto);
    setDetallesModalOpen(true);
  };

  const handleEditFromDetails = (
    producto: ArticuloManufacturadoResponseDTO
  ) => {
    setViewingProducto(undefined);
    setEditingProducto(producto);
    setModalOpen(true);
  };

  const handleSubmit = async (data: ArticuloManufacturadoRequestDTO) => {
    setOperationLoading(true);
    try {
      if (editingProducto) {
        await updateProducto(editingProducto.idArticulo, data);
        setAlert({
          type: "success",
          message: "Producto actualizado correctamente",
        });
      } else {
        await createProducto(data);
        setAlert({ type: "success", message: "Producto creado correctamente" });
      }
    } catch (error) {
      setAlert({
        type: "error",
        message:
          error instanceof Error ? error.message : "Error al guardar el producto",
      });
    } finally {
      setOperationLoading(false);
    }
  };

  const applyFilters = () => {
    return productos
      .filter((p) => p.denominacion.toLowerCase().includes(search.toLowerCase()))
      .filter((p) =>
        categoriaSel === "all" ? true : p.categoria.idCategoria === categoriaSel
      )
      .filter((p) => (precioMin === "" ? true : p.precioVenta >= Number(precioMin)))
      .filter((p) => (precioMax === "" ? true : p.precioVenta <= Number(precioMax)))
      .filter((p) =>
        estadoSel === "all"
          ? true
          : estadoSel === "activos"
          ? !p.eliminado
          : p.eliminado
      );
  };

  const productosFiltrados = applyFilters();

  const categoriasConProductos = [
    ...new Set(productosFiltrados.map((p) => p.categoria.idCategoria)),
  ];
  const categoriasFiltradas = categorias.filter((cat) =>
    categoriasConProductos.includes(cat.idCategoria)
  );

  const stats = {
    total: productosFiltrados.length,
    disponibles: productosFiltrados.filter((p) => p.stockSuficiente).length,
    sinStock: productosFiltrados.filter((p) => !p.stockSuficiente).length,
    margenAlto: productosFiltrados.filter((p) => p.margenGanancia >= 3).length,
  };

  const ingredientesParaElaborar = insumos.filter((i) => i.esParaElaborar);

  if (loading || loadingUnidades) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" />
        <p className="text-center text-gray-500 mt-4">Cargando productos...</p>
      </div>
    );
  }

 return (
    <div className="p-4 md:p-8 space-y-6">
      {/* --- ENCABEZADO Y PESTAÑAS (de la rama 'ramaPedro') --- */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600 mt-1">
            Administre los productos manufacturados o vea el ranking de ventas.
          </p>
        </div>
        {/* El botón de "Nuevo Producto" solo aparece en la vista de productos */}
        {!isRankingView && <Button onClick={handleCreate}>Nuevo Producto</Button>}
      </div>

      <div className="flex border-b">
        <button
          className={`py-2 px-4 text-lg ${!isRankingView ? 'border-b-2 border-purple-600 font-semibold text-gray-800' : 'text-gray-500'}`}
          onClick={() => setIsRankingView(false)}
        >
          Mis Productos
        </button>
        <button
          className={`py-2 px-4 text-lg ${isRankingView ? 'border-b-2 border-purple-600 font-semibold text-gray-800' : 'text-gray-500'}`}
          onClick={() => setIsRankingView(true)}
        >
          Ranking de Ventas
        </button>
      </div>

      {/* --- RENDERIZADO CONDICIONAL DE LA VISTA --- */}
      {isRankingView ? (
        // VISTA RANKING: Aquí irá tu componente de ranking.
        <RankingView />
      ) : (
        // VISTA GESTIÓN DE PRODUCTOS: Mantiene toda tu lógica existente.
        <div className="space-y-6">
          {alert && (
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          )}
          {error && (
            <Alert type="error" title="Error al cargar datos" message={error} />
          )}
          {ingredientesParaElaborar.length === 0 && (
            <Alert
              type="warning"
              title="Sin ingredientes para elaborar"
              message="No hay ingredientes marcados como 'Para Elaborar'. Debe crear ingredientes antes de poder crear productos."
            />
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput);
              setCategoriaSel(categoriaInput);
              setPrecioMin(precioMinInput);
              setPrecioMax(precioMaxInput);
              setEstadoSel(estadoInput); 
            }}
            className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-6 gap-4 items-end"
          >
            <input
              type="text"
              placeholder="Buscar producto"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg"
            />
            <select
              value={categoriaInput}
              onChange={(e) =>
                setCategoriaInput(e.target.value === "all" ? "all" : Number(e.target.value))
              }
              className="w-full border px-3 py-2 rounded-lg"
            >
              <option value="all">Todas las categorías</option>
              {categoriasFiltradas.map((cat) => (
                <option key={cat.idCategoria} value={cat.idCategoria}>
                  {cat.denominacion}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Precio mín."
              value={precioMinInput}
              onChange={(e) =>
                setPrecioMinInput(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full border px-3 py-2 rounded-lg"
            />
            <input
              type="number"
              placeholder="Precio máx."
              value={precioMaxInput}
              onChange={(e) =>
                setPrecioMaxInput(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full border px-3 py-2 rounded-lg"
            />
            <select
              value={estadoInput}
              onChange={e => setEstadoInput(e.target.value as "all" | "activos" | "eliminados")}
              className="w-full border px-3 py-2 rounded-lg"
            >
              <option value="all">Activos/Eliminados</option>
              <option value="activos">Solo Activos</option>
              <option value="eliminados">Solo Eliminados</option>
            </select>
            <button
              type="submit"
              className="text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: "#CD6C50" }}
            >
              Buscar
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Productos</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{stats.disponibles}</div>
              <div className="text-sm text-gray-600">Stock Disponible</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-red-600">{stats.sinStock}</div>
              <div className="text-sm text-gray-600">Sin Stock</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">{stats.margenAlto}</div>
              <div className="text-sm text-gray-600">Margen Alto (3x+)</div>
            </div>
          </div>

          {stats.sinStock > 0 && (
            <Alert
              type="warning"
              title="Productos sin stock suficiente"
              message={`Hay ${stats.sinStock} producto(s) que no se pueden preparar por falta de ingredientes.`}
            />
          )}

          <ProductosList
            productos={productosFiltrados}
            loading={loading}
            onEdit={handleEdit}
            desactivarProducto={desactivarProducto}
            activarProducto={activarProducto}
            onViewDetails={handleViewDetails}
          />

          <ProductoModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setEditingProducto(undefined);
            }}
            producto={editingProducto}
            categorias={categorias}
            unidadesMedida={unidadesMedida}
            ingredientes={ingredientesParaElaborar}
            onSubmit={handleSubmit}
            loading={operationLoading}
          />

          <ProductoDetallesModal
            isOpen={detallesModalOpen}
            onClose={() => {
              setDetallesModalOpen(false);
              setViewingProducto(undefined);
            }}
            producto={viewingProducto}
            onEdit={handleEditFromDetails}
          />
        </div>
      )}
    </div>
  )
}
