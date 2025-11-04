// src/pages/Usuarios.tsx
import React, { useState, useMemo } from "react";
import { useUsuarios } from "../hooks/useUsuarios";
import { UsuarioGestionTable } from "../components/usuarios/UsuarioGestionTable";

const Usuarios: React.FC = () => {
  const {
    usuarios,
    loading,
    error,
    updateUserRole,
    toggleUserStatus,
    currentUserId,
    refetch,
  } = useUsuarios();

  // Estados para filtros
  const [filtroEmail, setFiltroEmail] = useState("");
  const [filtroRol, setFiltroRol] = useState("");

  // Filtrar usuarios basado en los criterios
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      const cumpleFiltroEmail =
        filtroEmail === "" ||
        usuario.email.toLowerCase().includes(filtroEmail.toLowerCase());

      const cumpleFiltroRol = filtroRol === "" || usuario.rol === filtroRol;

      return cumpleFiltroEmail && cumpleFiltroRol;
    });
  }, [usuarios, filtroEmail, filtroRol]);

  // Estadísticas calculadas sobre usuarios filtrados
  const estadisticas = useMemo(() => {
    const total = usuariosFiltrados.length;
    const admins = usuariosFiltrados.filter((u) => u.rol === "ADMIN").length;
    const empleados = usuariosFiltrados.filter((u) =>
      ["CAJERO", "COCINERO", "DELIVERY"].includes(u.rol)
    ).length;
    const clientes = usuariosFiltrados.filter(
      (u) => u.rol === "CLIENTE"
    ).length;

    return { total, admins, empleados, clientes };
  }, [usuariosFiltrados]);

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltroEmail("");
    setFiltroRol("");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Error de acceso
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Gestión de Usuarios
              </h1>
              <p className="text-gray-600 mt-2">
                Administre los usuarios registrados en el sistema
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={refetch}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>{loading ? "Cargando..." : "Actualizar"}</span>
              </button>

              <div className="text-sm text-gray-500">
                {usuariosFiltrados.length} de {usuarios.length} usuario
                {usuarios.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="text"
                placeholder="Buscar por email"
                value={filtroEmail}
                onChange={(e) => setFiltroEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol
              </label>
              <select
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Todos</option>
                <option value="ADMIN">Administrador</option>
                <option value="CAJERO">Cajero</option>
                <option value="COCINERO">Cocinero</option>
                <option value="DELIVERY">Delivery</option>
                <option value="CLIENTE">Cliente</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={limpiarFiltros}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 w-full"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          {/* Indicador de filtros activos */}
          {(filtroEmail || filtroRol) && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Filtros activos:</span>
              {filtroEmail && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center">
                  Email: "{filtroEmail}"
                  <button
                    onClick={() => setFiltroEmail("")}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filtroRol && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
                  Rol: {filtroRol}
                  <button
                    onClick={() => setFiltroRol("")}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tabla de gestión */}
        <div className="bg-white rounded-lg shadow-sm">
          <UsuarioGestionTable
            usuarios={usuariosFiltrados} // ← Usar usuarios filtrados
            currentUserId={currentUserId ?? undefined}
            onRoleChange={updateUserRole}
            onUserToggle={toggleUserStatus}
            loading={loading}
          />
        </div>

        {/* Footer con estadísticas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Usuarios",
              value: estadisticas.total,
              color: "blue",
            },
            {
              label: "Administradores",
              value: estadisticas.admins,
              color: "red",
            },
            {
              label: "Empleados",
              value: estadisticas.empleados,
              color: "green",
            },
            {
              label: "Clientes",
              value: estadisticas.clientes,
              color: "orange",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm p-6 text-center"
            >
              <div className={`text-3xl font-bold text-${stat.color}-600 mb-2`}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Usuarios;
