import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  useCatalogoProductos,
  type ProductoCatalogo,
} from "../hooks/useCatalogoProductos";
import {
  Star,
  Clock,
  MapPin,
  Phone,
  Mail,
  ShoppingCart,
  Tag,
} from "lucide-react";
import CarritoModal from "../components/cart/CarritoModal";
import ProductoDetalleModal from "../components/productos/ProductoDetalleModal";

// ✅ CAMBIO PRINCIPAL: Usar Context Unificado
import {
  useCarritoItems,
  useCarritoTotales,
  useCarritoPromociones,
  useCarritoUnificado,
} from "../context/CarritoUnificadoContext";

import { UserDeactivatedAlert } from "../components/common/UserDeactivatedAlert";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { productos, loading } = useCatalogoProductos();

  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [productoDetalle, setProductoDetalle] =
    useState<ProductoCatalogo | null>(null);

  // ✅ NUEVO: Usar hooks especializados del Context Unificado
  const { agregarItem, cantidadTotal, estaVacio } = useCarritoItems();
  const { total, tieneDescuentos } = useCarritoTotales();
  const { cargarPromocionesParaItem, getPromocionesDisponibles } =
    useCarritoPromociones();

  // Imagen producto
  const getProductImage = (producto: ProductoCatalogo) =>
    producto.imagenes && producto.imagenes.length > 0
      ? producto.imagenes[0].url
      : null;

  // Color por categoría
  const getCategoryColor = (categoriaId: number | undefined) => {
    const id = categoriaId || 0;
    const colors = [
      "from-orange-100 to-orange-200",
      "from-blue-100 to-blue-200",
      "from-green-100 to-green-200",
      "from-purple-100 to-purple-200",
      "from-red-100 to-red-200",
      "from-yellow-100 to-yellow-200",
    ];
    return colors[id % colors.length];
  };

  // ✅ ACTUALIZADO: Agregar producto al carrito usando Context Unificado
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

    // ✅ ACTUALIZADO: Auto-cargar promociones
    if (producto.id) {
      cargarPromocionesParaItem(producto.id);
    }

    setCarritoAbierto(true);
  };

  // Abrir modal de detalle
  const handleDetalleClick = (producto: ProductoCatalogo) => {
    setProductoDetalle(producto);
  };

  // Obtener icono por tipo de producto
  const getProductIcon = (producto: ProductoCatalogo) => {
    if (producto.tipo === "manufacturado") {
      return "🍽️";
    }
    return "🛒";
  };

  // ✅ ACTUALIZADO: Verificar promociones usando Context Unificado
  const getPromocionInfo = (producto: ProductoCatalogo) => {
    const promociones = getPromocionesDisponibles(producto.id);
    if (promociones.length === 0) return null;

    // Obtener la mejor promoción (mayor descuento)
    const mejorPromocion = promociones.reduce((mejor, actual) => {
      const descuentoActual =
        actual.tipoDescuento === "PORCENTUAL"
          ? actual.valorDescuento
          : (actual.valorDescuento / producto.precioVenta) * 100;

      const descuentoMejor =
        mejor.tipoDescuento === "PORCENTUAL"
          ? mejor.valorDescuento
          : (mejor.valorDescuento / producto.precioVenta) * 100;

      return descuentoActual > descuentoMejor ? actual : mejor;
    });

    return {
      promocion: mejorPromocion,
      textoDescuento:
        mejorPromocion.tipoDescuento === "PORCENTUAL"
          ? `${mejorPromocion.valorDescuento}% OFF`
          : `$${mejorPromocion.valorDescuento} OFF`,
      precioConDescuento:
        mejorPromocion.tipoDescuento === "PORCENTUAL"
          ? producto.precioVenta * (1 - mejorPromocion.valorDescuento / 100)
          : producto.precioVenta - mejorPromocion.valorDescuento,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UserDeactivatedAlert />
      {/* Hero Section */}
      <section className="relative text-white min-h-[500px]">
        <img
          src="/Header.jpg"
          alt="Header background"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 z-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              ¡Bienvenido a El Buen Sabor!
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Las mejores comidas caseras y productos de calidad
            </p>
            {isAuthenticated && user && (
              <p className="text-lg mb-8 opacity-80">
                Hola {user.nombre || user.email}, ¿qué se te antoja hoy?
              </p>
            )}
            <button
              onClick={() => navigate("/catalogo")}
              className="bg-white text-[#CD6C50] px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              {isAuthenticated ? "Ver Catálogo" : "Pedir Ahora"}
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="w-full h-12 fill-gray-50"
          >
            <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </section>

      {/* Productos Destacados */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Nuestros Productos Destacados
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comidas preparadas con amor y productos frescos de calidad premium
            </p>
          </div>
        </div>
      </section>

      {/* Información del Restaurante */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                Sobre El Buen Sabor
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Desde hace más de 10 años, nos dedicamos a preparar las mejores
                comidas caseras con ingredientes frescos y recetas tradicionales
                que han pasado de generación en generación.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                Además de nuestros platos preparados, también ofrecemos
                productos de calidad premium para que puedas disfrutar en casa.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#CD6C50] mb-2">
                    10+
                  </div>
                  <div className="text-gray-600">Años de experiencia</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#CD6C50] mb-2">
                    5000+
                  </div>
                  <div className="text-gray-600">Clientes satisfechos</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl p-8 text-center">
              <div className="w-32 h-32 bg-[#CD6C50] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-4xl font-bold">EB</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                El Buen Sabor
              </h3>
              <p className="text-gray-600">Comida casera con amor</p>
            </div>
          </div>
        </div>
      </section>

      {/* Horarios y Contacto */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Información de Contacto
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Horarios */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
              <div className="w-16 h-16 bg-[#CD6C50] rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Horarios
              </h3>
              <div className="space-y-2 text-gray-600">
                <div>Lunes a Viernes: 11:00 - 23:00</div>
                <div>Sábados: 11:00 - 00:00</div>
                <div>Domingos: 12:00 - 22:00</div>
              </div>
            </div>

            {/* Ubicación */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
              <div className="w-16 h-16 bg-[#CD6C50] rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Ubicación
              </h3>
              <div className="space-y-2 text-gray-600">
                <div>Av. Principal 123</div>
                <div>Centro, Mendoza</div>
                <div>Argentina</div>
              </div>
            </div>

            {/* Contacto */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
              <div className="w-16 h-16 bg-[#CD6C50] rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Contacto
              </h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center justify-center">
                  <Phone className="w-4 h-4 mr-2" />
                  +54 261 123-4567
                </div>
                <div className="flex items-center justify-center">
                  <Mail className="w-4 h-4 mr-2" />
                  info@elbuensabor.com
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Detalle del Producto */}
      <ProductoDetalleModal
        producto={productoDetalle}
        abierto={!!productoDetalle}
        onCerrar={() => setProductoDetalle(null)}
        onAgregarCarrito={handleOrderClick}
      />

      {/* Carrito Modal */}
      <CarritoModal
        abierto={carritoAbierto}
        onCerrar={() => setCarritoAbierto(false)}
      />

      {/* ✅ BOTÓN FLOTANTE ACTUALIZADO con Context Unificado */}
      <button
        onClick={() => setCarritoAbierto(true)}
        className="fixed bottom-8 right-8 z-50 bg-[#CD6C50] hover:bg-[#b85a42] text-white p-4 rounded-full shadow-2xl flex items-center gap-2 transition"
        style={{ boxShadow: "0 4px 24px rgba(205,108,80,.25)" }}
        title="Ver carrito"
      >
        <ShoppingCart className="w-7 h-7" />
        {cantidadTotal > 0 && (
          <div className="flex flex-col items-center">
            <span className="bg-white text-[#CD6C50] font-bold text-sm rounded-full px-2 py-1 shadow">
              {cantidadTotal}
            </span>
            {/* ✅ ACTUALIZADO: Mostrar descuentos en el botón flotante */}
            {tieneDescuentos && (
              <span className="bg-green-500 text-white text-xs px-1 rounded mt-1">
                🎁
              </span>
            )}
          </div>
        )}
      </button>
    </div>
  );
};

export default Home;
