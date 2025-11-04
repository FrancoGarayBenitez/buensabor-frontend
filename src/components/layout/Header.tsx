import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type { Rol } from "../../types/common";
import { isCliente, isEmpleado } from "../../types/usuario/UserTypes";

// Importar todos los navbars
import NavbarInvitado from "./navbar/NavbarInvitado";
import NavbarCliente from "./navbar/NavbarCliente";
import NavbarCajero from "./navbar/NavbarCajero";
import NavbarDelivery from "./navbar/NavbarDelivery";
import NavbarCocinero from "./navbar/NavbarCocinero";
import NavbarAdmin from "./navbar/NavbarAdmin";
import type { EmpleadoResponseDTO } from "../../types/empleados/EmpleadoDTO";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, user, role, logout } = useAuth();

  // Rutas donde NO debe aparecer ninguna navbar
  const authRoutes = ["/login", "/registro"];
  const isAuthRoute = authRoutes.includes(location.pathname);

  // Redirecciones
  const handleLoginRedirect = () => navigate("/login");
  const handleRegisterRedirect = () => navigate("/registro");

  // Funciones helper
  const handleLogout = () => logout();

  const getUserRole = (): Rol => {
    return (role || "CLIENTE").toUpperCase() as Rol;
  };

  const handleHome = () => {
    const userRole = getUserRole();
    if (isAuthenticated && userRole === "DELIVERY") {
      navigate("/delivery");
    } else {
      navigate("/");
    }
  };

  // HEADER MÍNIMO PARA RUTAS DE AUTENTICACIÓN
  if (isAuthRoute) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <button
              onClick={handleHome}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200 cursor-pointer"
              aria-label="Ir al inicio"
            >
              <img
                src="/src/assets/logos/Logo-nabvar.png"
                alt="El Buen Sabor"
                className="h-12 w-auto"
              />
            </button>
          </div>
        </div>
      </header>
    );
  }

  // Renderizar navbar según autenticación y rol
  const renderNavbar = () => {
    // Si no está autenticado
    if (!isAuthenticated || !user) {
      return (
        <NavbarInvitado
          onLogin={handleLoginRedirect}
          onRegister={handleRegisterRedirect}
          onHome={handleHome}
        />
      );
    }

    // Usuario autenticado
    const userRole = getUserRole();

    // CLIENTE
    if (isCliente(user)) {
      return (
        <NavbarCliente
          user={user} // 'user' es tipado como ClienteResponseDTO
          onLogout={handleLogout}
          onHome={handleHome}
        />
      );
    }

    // EMPLEADO
    if (isEmpleado(user)) {
      const empleadoData: EmpleadoResponseDTO = user;

      switch (userRole) {
        case "ADMIN":
          return (
            <NavbarAdmin
              user={empleadoData}
              onLogout={handleLogout}
              onHome={handleHome}
            />
          );
        case "CAJERO":
          return (
            <NavbarCajero
              user={empleadoData}
              onLogout={handleLogout}
              onHome={handleHome}
            />
          );
        case "DELIVERY":
          return (
            <NavbarDelivery
              user={empleadoData}
              onLogout={handleLogout}
              onHome={handleHome}
            />
          );
        case "COCINERO":
          return (
            <NavbarCocinero
              user={empleadoData}
              onLogout={handleLogout}
              onHome={handleHome}
            />
          );
        default:
          console.warn(`Rol de empleado no reconocido: ${userRole}`);
          break;
      }
    }

    // Fallback si no es ni cliente ni empleado reconocido
    return (
      <NavbarInvitado
        onLogin={handleLoginRedirect}
        onRegister={handleRegisterRedirect}
        onHome={handleHome}
      />
    );
  };

  if (isLoading) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center">
            <div className="animate-pulse flex items-center space-x-4">
              <div className="h-8 w-32 bg-gray-300 rounded"></div>
              <div className="h-6 w-16 bg-gray-300 rounded"></div>
              <div className="h-6 w-16 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return <header>{renderNavbar()}</header>;
};

export default Header;
