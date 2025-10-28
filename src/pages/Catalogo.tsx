// src/pages/Catalogo.tsx - MIGRADO AL CONTEXT UNIFICADO COMPLETO
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ProductoService } from "../services/ProductoService";
import type { ArticuloManufacturadoResponseDTO } from "../types/productos/ArticuloManufacturadoResponseDTO";
import {
  useCatalogoProductos,
  type ProductoCatalogo,
} from "../hooks/useCatalogoProductos";
import {
  Star,
  Clock,
  ShoppingCart,
  Tag,
  Truck,
  Store,
  Filter,
  Grid,
  List,
  Search,
  Percent,
  Flame,
  TrendingUp,
  Gift,
  Zap,
} from "lucide-react";
import CarritoModal from "../components/cart/CarritoModal";
import { PedidoService } from "../services/PedidoServices";
import ProductoDetalleModal from "../components/productos/ProductoDetalleModal";
import {
  adaptarPromocionCompleta,
  validarPromocionCompleta,
  formatearPromocionCompleta,
  estaEnHorarioValido,
} from "../utils/promocionTypeAdapters";

// ✅ CAMBIO PRINCIPAL: Usar Context Unificado en lugar del hook complejo
import {
  useCarritoItems,
  useCarritoTotales,
  useCarritoPromociones,
  useCarritoUnificado,
} from "../context/CarritoUnificadoContext";

import { usePromociones } from "../hooks/usePromociones";
// ✅ IMPORTAR nuevos componentes de promociones
import {
  PromocionBadge,
  PromocionBadgeList,
  PromocionDestacada,
} from "../components/promociones/PromocionBadge";
import type { PromocionResponseDTO } from "../types/promociones";

import PromocionAgrupada from "../components/promociones/PromocionAgrupada";
import type { PromocionCompletaDTO } from "../types/promociones";

const productoService = new ProductoService();

type FiltroPromocion =
  | "TODAS"
  | "CON_PROMOCION"
  | "SIN_PROMOCION"
  | "MEJOR_DESCUENTO";

const Catalogo: React.FC = () => {
  const {
    productos,
    loading,
    buscarProductos,
    getCategorias,
    getProductosPorCategoria,
  } = useCatalogoProductos();

  // ✅ Hook de promociones
  const {
    promocionesVigentes,
    promocionesCompletas,
    loading: loadingPromociones,
  } = usePromociones(false, true);

  const [productosFiltrados, setProductosFiltrados] = useState<
    ProductoCatalogo[]
  >([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<
    number | null
  >(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<
    "todos" | "manufacturado" | "insumo"
  >("todos");

  // ✅ Filtro por promociones
  const [filtroPromocion, setFiltroPromocion] =
    useState<FiltroPromocion>("TODAS");

  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [productoDetalle, setProductoDetalle] =
    useState<ProductoCatalogo | null>(null);
  const [vistaGrid, setVistaGrid] = useState(true);

  // ✅ Estado para promociones destacadas
  const [mostrarPromocionesDestacadas, setMostrarPromocionesDestacadas] =
    useState(true);

  // ✅ CAMBIO PRINCIPAL: Usar hooks especializados del Context Unificado
  const { agregarItem, cantidadTotal, estaVacio } = useCarritoItems();
  const { total, tieneDescuentos, totales } = useCarritoTotales();
  const {
    cargarPromocionesParaItem,
    getPromocionesDisponibles,
    aplicarPromocionAgrupada,
    promocionAgrupada,
  } = useCarritoPromociones();
  const carrito = useCarritoUnificado(); // Para acceso completo cuando sea necesario

  const navigate = useNavigate();

  // ✅ Mapa de promociones por producto
  const promocionesPorProducto = useMemo(() => {
    const mapa = new Map<number, PromocionResponseDTO[]>();

    promocionesVigentes.forEach((promocion) => {
      // ✅ solo agregar si la promoción tiene un único artículo
      if (promocion.articulos.length === 1) {
        const articulo = promocion.articulos[0];
        const existing = mapa.get(articulo.idArticulo) || [];
        mapa.set(articulo.idArticulo, [...existing, promocion]);
      }
    });

    return mapa;
  }, [promocionesVigentes]);

  // ✅ Función para obtener promociones de un producto
  const getPromocionesProducto = (
    idProducto: number
  ): PromocionResponseDTO[] => {
    return promocionesPorProducto.get(idProducto) || [];
  };

  // ✅ Función para obtener la mejor promoción
  const getMejorPromocion = (
    producto: ProductoCatalogo
  ): PromocionResponseDTO | null => {
    const promociones = getPromocionesProducto(producto.id);
    if (promociones.length === 0) return null;

    return promociones.reduce((mejor, actual) => {
      const getDescuentoValue = (promo: PromocionResponseDTO) => {
        if (promo.tipoDescuento === "PORCENTUAL") {
          return promo.valorDescuento;
        } else {
          return (promo.valorDescuento / producto.precioVenta) * 100;
        }
      };

      return getDescuentoValue(actual) > getDescuentoValue(mejor)
        ? actual
        : mejor;
    });
  };

  // ✅ Productos con mejores promociones para destacar
  const productosConPromociones = useMemo(() => {
    return productos
      .map((producto) => ({
        producto,
        promociones: getPromocionesProducto(producto.id),
        mejorPromocion: getMejorPromocion(producto),
      }))
      .filter((item) => item.mejorPromocion)
      .sort((a, b) => {
        if (!a.mejorPromocion || !b.mejorPromocion) return 0;

        const getDescuentoValue = (
          promo: PromocionResponseDTO,
          precio: number
        ) => {
          return promo.tipoDescuento === "PORCENTUAL"
            ? promo.valorDescuento
            : (promo.valorDescuento / precio) * 100;
        };

        const descuentoA = getDescuentoValue(
          a.mejorPromocion,
          a.producto.precioVenta
        );
        const descuentoB = getDescuentoValue(
          b.mejorPromocion,
          b.producto.precioVenta
        );

        return descuentoB - descuentoA;
      })
      .slice(0, 3); // Top 3 promociones
  }, [productos, promocionesPorProducto]);

  // Aplicar filtros (MEJORADO con promociones)
  useEffect(() => {
    let productosTemp = productos;

    // Filtro por búsqueda
    if (busqueda.trim()) {
      productosTemp = buscarProductos(busqueda);
    }

    // Filtro por categoría
    if (categoriaSeleccionada) {
      productosTemp = productosTemp.filter(
        (p) => p.categoria.idCategoria === categoriaSeleccionada
      );
    }

    // Filtro por tipo
    if (tipoSeleccionado !== "todos") {
      productosTemp = productosTemp.filter((p) => p.tipo === tipoSeleccionado);
    }

    // ✅ Filtro por promociones
    if (filtroPromocion !== "TODAS") {
      switch (filtroPromocion) {
        case "CON_PROMOCION":
          productosTemp = productosTemp.filter(
            (p) => getPromocionesProducto(p.id).length > 0
          );
          break;
        case "SIN_PROMOCION":
          productosTemp = productosTemp.filter(
            (p) => getPromocionesProducto(p.id).length === 0
          );
          break;
        case "MEJOR_DESCUENTO":
          productosTemp = productosTemp
            .filter((p) => getPromocionesProducto(p.id).length > 0)
            .sort((a, b) => {
              const promocionA = getMejorPromocion(a);
              const promocionB = getMejorPromocion(b);
              if (!promocionA || !promocionB) return 0;

              const getDescuentoValue = (
                promo: PromocionResponseDTO,
                precio: number
              ) => {
                return promo.tipoDescuento === "PORCENTUAL"
                  ? promo.valorDescuento
                  : (promo.valorDescuento / precio) * 100;
              };

              const descuentoA = getDescuentoValue(promocionA, a.precioVenta);
              const descuentoB = getDescuentoValue(promocionB, b.precioVenta);

              return descuentoB - descuentoA;
            });
          break;
      }
    }

    setProductosFiltrados(productosTemp);
  }, [
    productos,
    busqueda,
    categoriaSeleccionada,
    tipoSeleccionado,
    filtroPromocion,
    buscarProductos,
    promocionesPorProducto,
  ]);

  const getProductRating = (producto: ProductoCatalogo) => {
    if (producto.tipo === "insumo") return 4.5;

    const cantidadVendida = producto.cantidadVendida;
    if (cantidadVendida >= 100) return 4.9;
    if (cantidadVendida >= 50) return 4.7;
    if (cantidadVendida >= 20) return 4.5;
    if (cantidadVendida >= 10) return 4.3;
    return 4.0;
  };

  // ✅ ACTUALIZADO: Usar Context Unificado
  const handleOrderClick = (producto: ProductoCatalogo) => {
    const productoParaCarrito = {
      idArticulo: producto.id,
      denominacion: producto.denominacion,
      descripcion: producto.descripcion,
      precioVenta: producto.precioVenta,
      imagenes: producto.imagenes,
      categoria: producto.categoria,
      tiempoEstimadoEnMinutos: producto.tiempoEstimadoEnMinutos || 0,
      stockSuficiente: producto.stockSuficiente,
      cantidadVendida: producto.cantidadVendida,
      tipo: producto.tipo,
    };

    // ✅ NUEVA SINTAXIS: Context Unificado
    agregarItem(productoParaCarrito, 1);

    // Auto-cargar promociones
    cargarPromocionesParaItem(producto.id);

    setCarritoAbierto(true);
  };

  const handleDetalleClick = (producto: ProductoCatalogo) => {
    setProductoDetalle(producto);
  };

  // ✅ ACTUALIZADO: Manejar click en promoción usando Context Unificado
  const handlePromocionClick = (
    producto: ProductoCatalogo,
    promocion: PromocionResponseDTO
  ) => {
    // Agregar producto y aplicar promoción automáticamente
    handleOrderClick(producto);

    // Aplicar promoción después de un breve delay
    setTimeout(() => {
      carrito.seleccionarPromocion(producto.id, promocion.idPromocion);
    }, 100);
  };

  // ✅ ACTUALIZADO: Promociones agrupadas usando Context Unificado
  const handlePromocionAgrupadaClick = (promocion: PromocionCompletaDTO) => {
    console.log(
      "🎯 [CATALOGO] Agregando promoción completa:",
      promocion.denominacion
    );

    try {
      // ✅ VALIDAR promoción básica
      const validacion = validarPromocionCompleta(promocion);
      if (!validacion.esValida) {
        console.error("❌ Promoción inválida:", validacion.razon);
        alert(`Error: ${validacion.razon}`);
        return;
      }

      // ✅ VALIDAR horario
      if (!estaEnHorarioValido(promocion)) {
        alert(
          `Esta promoción solo está disponible de ${promocion.horaDesde} a ${promocion.horaHasta}`
        );
        return;
      }

      // ✅ VERIFICAR stock de productos
      const productosNoDisponibles = promocion.articulos.filter((articulo) => {
        const producto = productos.find((p) => p.id === articulo.idArticulo);
        return !producto || !producto.stockSuficiente;
      });

      if (productosNoDisponibles.length > 0) {
        const nombresNoDisponibles = productosNoDisponibles
          .map((p) => p.denominacion)
          .join(", ");
        alert(
          `Algunos productos de la promoción no están disponibles: ${nombresNoDisponibles}`
        );
        return;
      }

      // ✅ CALCULAR descuento de la promoción
      const subtotalOriginal = promocion.articulos.reduce(
        (sum, art) => sum + art.precioVenta,
        0
      );

      let descuentoCalculado = 0;
      if (promocion.tipoDescuento === "PORCENTUAL") {
        descuentoCalculado =
          subtotalOriginal * (promocion.valorDescuento / 100);
      } else {
        descuentoCalculado = Math.min(
          promocion.valorDescuento,
          subtotalOriginal
        );
      }

      const precioFinal = subtotalOriginal - descuentoCalculado;
      const porcentajeDescuento = (descuentoCalculado / subtotalOriginal) * 100;

      const infoPromocion = {
        textoDescuento:
          promocion.tipoDescuento === "PORCENTUAL"
            ? `${promocion.valorDescuento}% OFF`
            : `$${promocion.valorDescuento} OFF`,
        subtotalOriginal,
        descuentoCalculado,
        precioFinal,
        porcentajeDescuento,
        esValidaCalcular: true,
      };

      console.log("💰 [CATALOGO] Info de promoción:", infoPromocion);

      // ✅ FIX: ADAPTAR promoción ANTES de aplicar (SIN limpiar carrito)
      const promocionAdaptada = adaptarPromocionCompleta(promocion);
      console.log("🔄 [CATALOGO] Promoción adaptada:", promocionAdaptada);

      // ✅ FIX: APLICAR promoción directamente (el Context maneja agregar productos faltantes)
      aplicarPromocionAgrupada(promocionAdaptada);

      console.log("✅ [CATALOGO] Promoción aplicada exitosamente");

      // ✅ Mostrar mensaje de éxito
      setTimeout(() => {
        console.log("🔍 [CATALOGO] Estado FINAL después de aplicar:", {
          promocionAgrupada: promocionAgrupada?.denominacion,
          itemsEnCarrito: cantidadTotal,
          totalPromocion: infoPromocion.precioFinal,
          descuentoAplicado: infoPromocion.descuentoCalculado,
        });

        setCarritoAbierto(true);
      }, 200);
    } catch (error: any) {
      console.error("❌ [CATALOGO] Error agregando promoción:", error);
      alert(`Error al agregar la promoción: ${error.message}`);
    }
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setCategoriaSeleccionada(null);
    setTipoSeleccionado("todos");
    setFiltroPromocion("TODAS");
  };

  const categorias = getCategorias();

  // ✅ COMPONENTE: Card de producto mejorada
  const ProductCard = ({ producto }: { producto: ProductoCatalogo }) => {
    const imagenUrl = producto.imagenes?.[0]?.url ?? null;
    const rating = getProductRating(producto);
    const promociones = getPromocionesProducto(producto.id);
    const mejorPromocion = getMejorPromocion(producto);

    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col relative">
        {/* ✅ Overlay de promoción destacada */}
        {mejorPromocion && (
          <div className="absolute top-0 left-0 right-0 z-10">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-center py-1 text-xs font-bold">
              🔥 OFERTA ESPECIAL -{" "}
              {mejorPromocion.tipoDescuento === "PORCENTUAL"
                ? `${mejorPromocion.valorDescuento}% OFF`
                : `$${mejorPromocion.valorDescuento} OFF`}
            </div>
          </div>
        )}

        <div
          className={`h-48 relative overflow-hidden ${
            mejorPromocion ? "mt-6" : ""
          }`}
        >
          {imagenUrl ? (
            <img
              src={imagenUrl}
              alt={producto.denominacion}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-4xl text-gray-400">
              {producto.tipo === "manufacturado" ? "🍽️" : "🛒"}
            </div>
          )}

          {/* ✅ Badges de promoción flotantes */}
          {promociones.length > 0 && (
            <div className="absolute top-3 left-3">
              <PromocionBadgeList
                promociones={promociones}
                precioOriginal={producto.precioVenta}
                maxVisible={1}
                variant="small"
                onBadgeClick={(promocion) =>
                  handlePromocionClick(producto, promocion)
                }
              />
            </div>
          )}

          <div className="absolute top-3 right-3">
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                producto.stockSuficiente
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {producto.stockSuficiente ? "Disponible" : "Agotado"}
            </span>
          </div>

          {producto.tiempoEstimadoEnMinutos && (
            <div className="absolute bottom-3 left-3">
              <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded-lg text-sm flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {producto.tiempoEstimadoEnMinutos} min
              </div>
            </div>
          )}
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-800 truncate">
              {producto.denominacion}
            </h3>
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600 ml-1">{rating}</span>
            </div>
          </div>

          <p className="text-gray-600 mb-4 text-sm line-clamp-2 flex-1">
            {producto.descripcion}
          </p>

          {/* ✅ Lista de promociones disponibles */}
          {promociones.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2 flex items-center">
                <Gift className="w-3 h-3 mr-1" />
                {promociones.length} promoción
                {promociones.length !== 1 ? "es" : ""} disponible
                {promociones.length !== 1 ? "s" : ""}
              </div>
              <PromocionBadgeList
                promociones={promociones}
                precioOriginal={producto.precioVenta}
                maxVisible={2}
                variant="small"
                onBadgeClick={(promocion) =>
                  handlePromocionClick(producto, promocion)
                }
              />
            </div>
          )}

          <div className="flex items-center text-xs text-gray-500 mb-4">
            <span className="bg-gray-100 px-2 py-1 rounded">
              {producto.categoria.denominacion}
            </span>
            {producto.tipo === "manufacturado" && (
              <span className="ml-2">{producto.cantidadVendida} vendidos</span>
            )}
            {producto.tipo === "insumo" && (
              <span className="ml-2">Stock: {producto.stockActual}</span>
            )}
          </div>

          <div className="flex items-center justify-between mt-auto">
            {/* ✅ Precios con descuento si hay promoción */}
            <div className="flex flex-col">
              {mejorPromocion ? (
                <>
                  <span className="text-sm text-gray-500 line-through">
                    ${producto.precioVenta.toFixed(0)}
                  </span>
                  <span className="text-2xl font-bold text-[#CD6C50]">
                    $
                    {(() => {
                      const descuento =
                        mejorPromocion.tipoDescuento === "PORCENTUAL"
                          ? (producto.precioVenta *
                              mejorPromocion.valorDescuento) /
                            100
                          : Math.min(
                              mejorPromocion.valorDescuento,
                              producto.precioVenta
                            );
                      return (producto.precioVenta - descuento).toFixed(0);
                    })()}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-[#CD6C50]">
                  ${producto.precioVenta.toFixed(0)}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleDetalleClick(producto)}
                className="px-3 py-2 border border-[#CD6C50] text-[#CD6C50] rounded-lg hover:bg-[#f5ebe8] transition-colors text-sm"
              >
                Detalle
              </button>
              <button
                onClick={() => handleOrderClick(producto)}
                disabled={!producto.stockSuficiente}
                className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                  producto.stockSuficiente
                    ? "bg-[#CD6C50] text-white hover:bg-[#b85a42]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {producto.stockSuficiente ? "Pedir" : "Agotado"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Catálogo de Productos
        </h1>
        <p className="text-gray-600">
          Descubre nuestras comidas preparadas y productos de calidad premium
        </p>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar productos
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent"
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent"
              value={categoriaSeleccionada || ""}
              onChange={(e) =>
                setCategoriaSeleccionada(
                  e.target.value ? Number(e.target.value) : null
                )
              }
            >
              <option value="">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat.idCategoria} value={cat.idCategoria}>
                  {cat.denominacion} ({cat.cantidadProductos})
                </option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de producto
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent"
              value={tipoSeleccionado}
              onChange={(e) => setTipoSeleccionado(e.target.value as any)}
            >
              <option value="todos">Todos los tipos</option>
              <option value="manufacturado">Comidas preparadas</option>
              <option value="insumo">Productos premium</option>
            </select>
          </div>

          {/* Filtro por promociones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Gift className="w-4 h-4 mr-1" />
              Promociones
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent"
              value={filtroPromocion}
              onChange={(e) =>
                setFiltroPromocion(e.target.value as FiltroPromocion)
              }
            >
              <option value="TODAS">Todas</option>
              <option value="CON_PROMOCION">Con promoción</option>
              <option value="SIN_PROMOCION">Sin promoción</option>
              <option value="MEJOR_DESCUENTO">Mejor descuento</option>
            </select>
          </div>

          {/* Vista */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vista
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setVistaGrid(true)}
                className={`flex-1 p-3 rounded-lg border transition-colors ${
                  vistaGrid
                    ? "bg-[#CD6C50] text-white border-[#CD6C50]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Grid className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => setVistaGrid(false)}
                className={`flex-1 p-3 rounded-lg border transition-colors ${
                  !vistaGrid
                    ? "bg-[#CD6C50] text-white border-[#CD6C50]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <List className="w-5 h-5 mx-auto" />
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas de filtros */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>
                {productosFiltrados.length} producto
                {productosFiltrados.length !== 1 ? "s" : ""} encontrado
                {productosFiltrados.length !== 1 ? "s" : ""}
              </span>
            </div>

            {!loadingPromociones && (
              <div className="flex items-center space-x-4">
                {promocionesCompletas.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Flame className="w-4 h-4 text-red-500" />
                    <span>
                      {promocionesCompletas.length} promoción
                      {promocionesCompletas.length !== 1 ? "es" : ""} especial
                      {promocionesCompletas.length !== 1 ? "es" : ""}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span>{promocionesVigentes.length} ofertas activas</span>
                </div>
              </div>
            )}
          </div>

          {(busqueda ||
            categoriaSeleccionada ||
            tipoSeleccionado !== "todos" ||
            filtroPromocion !== "TODAS") && (
            <div>
              <button
                onClick={limpiarFiltros}
                className="text-sm text-[#CD6C50] hover:text-[#b85a42] font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ✅ SECCIÓN: Promociones Agrupadas (OFERTAS ESPECIALES) */}
      {!loadingPromociones && promocionesCompletas.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Flame className="w-8 h-8 text-red-500" />
              <h2 className="text-3xl font-bold text-gray-800">
                🔥 Ofertas Especiales
              </h2>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                {promocionesCompletas.length} oferta
                {promocionesCompletas.length !== 1 ? "s" : ""} disponible
                {promocionesCompletas.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {promocionesCompletas.map((promocion) => (
              <PromocionAgrupada
                key={promocion.idPromocion}
                promocion={promocion}
                onAgregarAlCarrito={handlePromocionAgrupadaClick}
                className="transform hover:scale-105 transition-transform duration-200"
              />
            ))}
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              📦 Catálogo de Productos
            </h3>
          </div>
        </div>
      )}

      {/* ✅ SECCIÓN: TODOS LOS PRODUCTOS */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CD6C50] mx-auto mb-4"></div>
            <span className="text-[#CD6C50] text-xl font-semibold">
              Cargando productos...
            </span>
          </div>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No se encontraron productos
          </h3>
          <p className="text-gray-500 mb-4">
            Intenta cambiar los filtros o buscar otros términos
          </p>
          <button
            onClick={limpiarFiltros}
            className="bg-[#CD6C50] text-white px-6 py-2 rounded-lg hover:bg-[#b85a42] transition-colors"
          >
            Ver todos los productos
          </button>
        </div>
      ) : (
        <>
          {(!promocionesCompletas || promocionesCompletas.length === 0) && (
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                📦 Catálogo de Productos
              </h2>
              <p className="text-gray-600">
                Descubre todos nuestros productos disponibles
              </p>
            </div>
          )}
          <div
            className={vistaGrid ? "grid md:grid-cols-3 gap-8" : "space-y-6"}
          >
            {productosFiltrados.map((producto) => (
              <ProductCard
                key={`${producto.tipo}-${producto.id}`}
                producto={producto}
              />
            ))}
          </div>
        </>
      )}

      {/* Carrito Modal */}
      <CarritoModal
        abierto={carritoAbierto}
        onCerrar={() => setCarritoAbierto(false)}
      />

      {/* ✅ BOTÓN FLOTANTE ACTUALIZADO con Context Unificado */}
      {!estaVacio && (
        <div className="fixed bottom-8 right-8 z-50">
          {/* Widget de información del carrito */}
          <div className="bg-white shadow-lg rounded-lg p-4 mb-3 border min-w-[250px]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-800">Mi Carrito</span>
              <span className="text-sm text-gray-500">
                {cantidadTotal} productos
              </span>
            </div>

            {/* ✅ ACTUALIZADO: Mostrar promoción agrupada */}
            {promocionAgrupada && (
              <div className="flex items-center text-red-600 text-sm mb-1">
                <Gift className="w-3 h-3 mr-1" />
                <span>🎁 {promocionAgrupada.denominacion}</span>
              </div>
            )}

            {/* ✅ ACTUALIZADO: Mostrar descuentos usando Context Unificado */}
            {tieneDescuentos && (
              <div className="flex items-center text-green-600 text-sm mb-1">
                <Tag className="w-3 h-3 mr-1" />
                <span>
                  Descuento: -${(totales?.descuentoTotal || 0).toFixed(0)}
                </span>
              </div>
            )}

            {/* Mostrar envío si aplica */}
            {(totales?.gastosEnvio || 0) > 0 && (
              <div className="flex items-center text-gray-600 text-sm mb-1">
                <Truck className="w-3 h-3 mr-1" />
                <span>Envío: +${(totales?.gastosEnvio || 0).toFixed(0)}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between border-t pt-2">
              <span className="font-bold text-gray-800">Total:</span>
              <span className="font-bold text-[#CD6C50] text-lg">
                ${total.toFixed(0)}
              </span>
            </div>

            {/* ✅ ACTUALIZADO: Mensaje de estado usando Context Unificado */}
            {(() => {
              if (promocionAgrupada) {
                return (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    🎁 Promoción especial activa
                  </div>
                );
              } else if (tieneDescuentos) {
                return (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    ✨ {totales?.resumenDescuentos || "Descuentos aplicados"}
                  </div>
                );
              } else {
                return (
                  <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                    💡 Agrega más productos para acceder a promociones
                  </div>
                );
              }
            })()}

            {/* Loading indicator */}
            {carrito.state.loading && (
              <div className="flex items-center text-blue-600 text-xs mt-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-1"></div>
                Actualizando totales...
              </div>
            )}
          </div>

          {/* Botón principal */}
          <button
            onClick={() => setCarritoAbierto(true)}
            className="w-full bg-[#CD6C50] hover:bg-[#b85a42] text-white p-4 rounded-lg shadow-2xl flex items-center justify-center gap-2 transition font-semibold"
            style={{ boxShadow: "0 4px 24px rgba(205,108,80,.25)" }}
          >
            <ShoppingCart className="w-6 h-6" />
            Ver Carrito
            {promocionAgrupada && (
              <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                🎁
              </span>
            )}
          </button>
        </div>
      )}

      {/* Botón flotante simple cuando carrito está vacío */}
      {estaVacio && (
        <button
          onClick={() => setCarritoAbierto(true)}
          className="fixed bottom-8 right-8 z-50 bg-gray-400 text-white p-4 rounded-full shadow-lg"
          title="Carrito vacío"
        >
          <ShoppingCart className="w-6 h-6" />
        </button>
      )}

      {/* Modal de detalle del producto */}
      <ProductoDetalleModal
        producto={productoDetalle}
        abierto={!!productoDetalle}
        onCerrar={() => setProductoDetalle(null)}
        onAgregarCarrito={handleOrderClick}
      />
    </div>
  );
};

export default Catalogo;
