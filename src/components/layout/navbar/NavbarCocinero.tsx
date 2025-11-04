import { useState, useEffect, useRef } from "react";
import { User, LogOut, ChefHat, Clock, RefreshCw, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { EmpleadoResponseDTO } from "../../../types/empleados/EmpleadoDTO";

interface NavbarCocineroProps {
  user?: EmpleadoResponseDTO;
  onLogout?: () => void;
  onHome?: () => void;
  totalPedidos?: number;
  pedidosPendientes?: number;
  pedidosEnPreparacion?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdate?: Date;
}

export default function NavbarCocinero({
  user,
  onLogout,
  onHome,
  pedidosPendientes = 0,
  pedidosEnPreparacion = 0,
  onRefresh,
  isRefreshing = false,
  lastUpdate,
}: NavbarCocineroProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isResourcesMenuOpen, setIsResourcesMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const resourcesMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const formatRole = (role?: string) => {
    const roleMap: { [key: string]: string } = {
      ADMIN: "Administrador",
      ADMINISTRADOR: "Administrador",
      CAJERO: "Cajero",
      DELIVERY: "Delivery",
      COCINERO: "Cocinero",
      CLIENTE: "Cliente",
    };
    return roleMap[role?.toUpperCase() || ""] || "Cocinero";
  };

  const formatLastUpdate = (date?: Date) => {
    if (!date) return "Nunca";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Hace un momento";
    if (diffMins < 60) return `Hace ${diffMins} min`;

    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
      if (
        resourcesMenuRef.current &&
        !resourcesMenuRef.current.contains(event.target as Node)
      ) {
        setIsResourcesMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Navega a Mi Perfil y cierra el dropdown
   */
  const handleMiPerfil = () => {
    setIsUserMenuOpen(false);
    navigate("/mi-perfil");
  };

  // Determinar urgencia basada en pedidos pendientes
  const getUrgencyColor = () => {
    if (pedidosPendientes >= 5) return "bg-red-500";
    if (pedidosPendientes >= 3) return "bg-orange-500";
    if (pedidosPendientes >= 1) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Izquierda: Usuario */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded-full transition-colors duration-200 cursor-pointer"
                  aria-label="Menú de cocinero"
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                    {user.imagen?.url ? (
                      <img
                        src={user.imagen.url}
                        alt={`${user.nombre} ${user.apellido}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-700">
                      {user.nombre} {user.apellido}
                    </div>
                    <div className="text-xs text-orange-600 font-semibold">
                      {formatRole(user.rol)}
                    </div>
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user.nombre} {user.apellido}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-orange-600 font-semibold mt-1">
                        {formatRole(user.rol)}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleMiPerfil}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                      >
                        <User className="mr-3 h-4 w-4" />
                        Mi Perfil
                      </button>

                      <div className="border-t border-gray-200 my-1"></div>

                      {/* Información sobre permisos */}
                      <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 mx-2 rounded">
                        👨‍🍳 Los cambios de turnos se aplicarán en tu próximo
                        inicio de sesión
                      </div>

                      <div className="border-t border-gray-200 my-1"></div>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout?.();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 cursor-pointer"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span>Cocina Activa</span>
            </div>
          </div>

          {/* Centro: Logo */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => navigate("/")}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200 cursor-pointer"
              aria-label="Dashboard de cocina"
            >
              <img
                src="/src/assets/logos/Logo-nabvar.png"
                alt="El Buen Sabor"
                className="h-12 w-auto"
              />
            </button>
          </div>

          {/* Derecha: Controles de cocina */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/cocina")}
              className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200 cursor-pointer"
            >
              <Package className="h-4 w-4" />
              <span className="hidden lg:block text-sm font-medium">
                Gestión Pedidos
              </span>
            </button>
            {/* Menú de recursos de cocina */}
            <button
              onClick={() => navigate("/productos")}
              className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 cursor-pointer"
            >
              <ChefHat className="h-4 w-4" />
              <span className="hidden lg:block text-sm font-medium">
                Cocina
              </span>
            </button>

            {/* Refresh button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 cursor-pointer"
              title="Actualizar pedidos"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden md:inline text-sm font-medium">
                {isRefreshing ? "Actualizando..." : "Actualizar"}
              </span>
            </button>

            {/* Última actualización */}
            {lastUpdate && (
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-sm ">
                <Clock className="h-4 w-4" />
                <span>{formatLastUpdate(lastUpdate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
