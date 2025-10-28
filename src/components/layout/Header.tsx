import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type { Rol } from "../../types/common";
import {
  type UsuarioBaseResponseDTO,
  isCliente,
} from "../../types/usuario/UserTypes";

// Importar todos los navbars
import NavbarInvitado from "./navbar/NavbarInvitado";
import NavbarCliente from "./navbar/NavbarCliente";
import NavbarCajero from "./navbar/NavbarCajero";
import NavbarDelivery from "./navbar/NavbarDelivery";
import NavbarCocinero from "./navbar/NavbarCocinero";
import NavbarAdmin from "./navbar/NavbarAdmin";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, user, role, logout } = useAuth();

  // Rutas donde NO debe aparecer ninguna navbar
  const noNavbarRoutes = ["/login", "/registro"];
  const shouldShowNavbar = !noNavbarRoutes.includes(location.pathname);

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

    if (isCliente(user)) {
      return (
        <NavbarCliente
          user={user} // 'user' es tipado como ClienteResponseDTO
          onLogout={handleLogout}
          onHome={handleHome}
        />
      );
    }

    // Si no es cliente, es necesariamente un Empleado/Admin (UsuarioBaseResponseDTO)
    const employeeData = user as UsuarioBaseResponseDTO;

    switch (userRole) {
      case "ADMIN":
        return (
          <NavbarAdmin
            user={employeeData}
            onLogout={handleLogout}
            onHome={handleHome}
          />
        );
      case "CAJERO":
        return (
          <NavbarCajero
            user={employeeData}
            onLogout={handleLogout}
            onHome={handleHome}
          />
        );
      case "DELIVERY":
        return (
          <NavbarDelivery
            user={employeeData}
            onLogout={handleLogout}
            onHome={handleHome}
          />
        );
      case "COCINERO":
        return (
          <NavbarCocinero
            user={employeeData}
            onLogout={handleLogout}
            onHome={handleHome}
          />
        );
      default:
        // Fallback por si el rol es reconocido pero no tipado (o es null, aunque ya lo chequeamos)
        return (
          <NavbarInvitado
            onLogin={handleLoginRedirect}
            onRegister={handleRegisterRedirect}
            onHome={handleHome}
          />
        );
    }
  };

  if (!shouldShowNavbar) {
    return null;
  }

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
