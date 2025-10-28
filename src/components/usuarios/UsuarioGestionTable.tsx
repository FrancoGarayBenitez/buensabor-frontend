// components/usuarios/UsuarioGestionTable.tsx
import React, { useState } from "react";
import type { UsuarioGridDTO } from "../../types/usuario/UsuarioGridDTO";

interface UsuarioGestionTableProps {
  usuarios: UsuarioGridDTO[];
  currentUserId?: number;
  onRoleChange: (userId: number, newRole: string) => Promise<void>;
  onUserToggle: (userId: number, active: boolean) => Promise<void>;
  loading?: boolean;
}

const ROLES = [
  { value: "CLIENTE", label: "Cliente", color: "bg-blue-100 text-blue-800" },
  { value: "CAJERO", label: "Cajero", color: "bg-green-100 text-green-800" },
  {
    value: "COCINERO",
    label: "Cocinero",
    color: "bg-orange-100 text-orange-800",
  },
  {
    value: "DELIVERY",
    label: "Delivery",
    color: "bg-purple-100 text-purple-800",
  },
  { value: "ADMIN", label: "Administrador", color: "bg-red-100 text-red-800" },
];

export const UsuarioGestionTable: React.FC<UsuarioGestionTableProps> = ({
  usuarios,
  currentUserId,
  onRoleChange,
  onUserToggle,
  loading = false,
}) => {
  const [changingRole, setChangingRole] = useState<number | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);

  const handleRoleChange = async (
    userId: number,
    currentRole: string,
    newRole: string
  ) => {
    if (newRole === currentRole) return;

    // Validaciones de seguridad
    if (userId === currentUserId && currentRole === "ADMIN") {
      alert("No puedes cambiar tu propio rol de administrador");
      return;
    }

    if (newRole === "ADMIN") {
      const confirmed = confirm(
        "¿Estás seguro de otorgar permisos de administrador a este usuario?"
      );
      if (!confirmed) return;
    }

    setChangingRole(userId);
    try {
      await onRoleChange(userId, newRole);
    } catch (error) {
      console.error("Error cambiando rol:", error);
      alert("Error al cambiar el rol del usuario");
    } finally {
      setChangingRole(null);
    }
  };

  const handleUserToggle = async (userId: number, currentActive: boolean) => {
    if (userId === currentUserId && currentActive) {
      alert("No puedes desactivar tu propia cuenta");
      return;
    }

    setToggling(userId);
    try {
      await onUserToggle(userId, !currentActive);
    } catch (error) {
      console.error("Error toggling user:", error);
      alert("Error al cambiar el estado del usuario");
    } finally {
      setToggling(null);
    }
  };

  const getRoleColor = (role: string) => {
    return (
      ROLES.find((r) => r.value === role)?.color || "bg-gray-100 text-gray-800"
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando usuarios...</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow-lg rounded-lg">
      <table className="min-w-full bg-white">
        <thead style={{ backgroundColor: "#CD6C50" }} className="text-white">
          {" "}
          {/* ← Color exacto del botón */}
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Rol
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Apellido
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {usuarios.map((usuario) => (
            <tr key={usuario.idUsuario} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {usuario.idUsuario}
                {usuario.idUsuario === currentUserId && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    (Tú)
                  </span>
                )}
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {usuario.email}
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={usuario.rol}
                  onChange={(e) =>
                    handleRoleChange(
                      usuario.idUsuario,
                      usuario.rol,
                      e.target.value
                    )
                  }
                  disabled={changingRole === usuario.idUsuario}
                  className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${getRoleColor(
                    usuario.rol
                  )} ${
                    changingRole === usuario.idUsuario
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:opacity-80"
                  }`}
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {changingRole === usuario.idUsuario && (
                  <div className="mt-1">
                    <div className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-orange-600 rounded-full inline-block"></div>
                  </div>
                )}
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {usuario.nombre || "-"}
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {usuario.apellido || "-"}
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    usuario.activo !== false
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {usuario.activo !== false ? "Activo" : "Inactivo"}
                </span>
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  onClick={() =>
                    handleUserToggle(
                      usuario.idUsuario,
                      usuario.activo !== false
                    )
                  }
                  disabled={toggling === usuario.idUsuario}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    usuario.activo !== false
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  } ${
                    toggling === usuario.idUsuario
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {toggling === usuario.idUsuario ? (
                    <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full"></div>
                  ) : usuario.activo !== false ? (
                    "Desactivar"
                  ) : (
                    "Activar"
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {usuarios.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay usuarios registrados
        </div>
      )}
    </div>
  );
};
