import React, { useState } from "react";
import { useClientePerfil } from "../hooks/useClientePerfil";
import { useDomicilios } from "../hooks/useDomicilios";
import { useAuth } from "../hooks/useAuth";
import AuthPasswordService from "../services/AuthPasswordService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Alert } from "../components/common/Alert";
import { Button } from "../components/common/Button";
import { PerfilInfoModal, DomicilioModal } from "../components/perfil";
import type { DomicilioResponseDTO } from "../types/clientes";

interface TabType {
  id: string;
  label: string;
  icon: string;
}

const TABS: TabType[] = [
  { id: "info", label: "Información Personal", icon: "👤" },
  { id: "domicilios", label: "Mis Domicilios", icon: "🏠" },
  { id: "seguridad", label: "Seguridad", icon: "🔒" },
];

// -- COMPONENTE PRINCIPAL --
export const MiPerfil: React.FC = () => {
  const { user, logout } = useAuth();

  const {
    perfil,
    isLoading: perfilLoading,
    error: perfilError,
    eliminarCuenta,
    refresh: refreshPerfil,
  } = useClientePerfil();

  const {
    domicilios,
    isLoading: domiciliosLoading,
    error: domiciliosError,
    marcarComoPrincipal,
    eliminarDomicilio,
    refresh: refreshDomicilios,
  } = useDomicilios();

  const [activeTab, setActiveTab] = useState<string>("info");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRequestingPasswordReset, setIsRequestingPasswordReset] =
    useState(false);

  // Estados para modales
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [showDomicilioModal, setShowDomicilioModal] = useState(false);
  const [selectedDomicilio, setSelectedDomicilio] = useState<
    DomicilioResponseDTO | undefined
  >();
  const [domicilioModalMode, setDomicilioModalMode] = useState<
    "create" | "edit"
  >("create");

  const isLoading = perfilLoading || domiciliosLoading;
  const error = perfilError || domiciliosError;

  /**
   * Maneja la eliminación de cuenta
   */
  const handleEliminarCuenta = async () => {
    const confirmacion = window.confirm(
      "¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible."
    );
    if (!confirmacion) return;

    try {
      setIsDeleting(true);
      const success = await eliminarCuenta();
      if (success) {
        logout();
      }
    } catch (error: any) {
      console.error("Error al eliminar cuenta:", error);
      alert("Error al eliminar cuenta. Intenta nuevamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * ✅ Manejo cambio de contraseña
   */
  const handleCambiarPassword = async () => {
    if (!user?.email) return;

    try {
      setIsRequestingPasswordReset(true);

      // Envía un email de restablecimiento de contraseña
      const result = await AuthPasswordService.requestPasswordReset();

      if (result.success) {
        alert(
          `✅ ${result.message}\n\nRevisa tu email: ${
            result.email || user.email
          }`
        );
      } else {
        alert(`❌ ${result.message || "No se pudo procesar la solicitud."}`);
      }
    } catch (error: any) {
      alert("❌ Error al solicitar cambio de contraseña. Intenta nuevamente.");
    } finally {
      setIsRequestingPasswordReset(false);
    }
  };

  /**
   * Abre modal para editar información personal
   */
  const handleEditarPerfil = () => {
    if (perfil) {
      setShowPerfilModal(true);
    } else {
      alert("No se pudo cargar la información del perfil para editar.");
    }
  };

  /**
   * Abre modal para crear domicilio
   */
  const handleCrearDomicilio = () => {
    setSelectedDomicilio(undefined);
    setDomicilioModalMode("create");
    setShowDomicilioModal(true);
  };

  /**
   * Abre modal para editar domicilio
   */
  const handleEditarDomicilio = (domicilio: DomicilioResponseDTO) => {
    setSelectedDomicilio(domicilio);
    setDomicilioModalMode("edit");
    setShowDomicilioModal(true);
  };

  /**
   * Marca un domicilio como principal
   */
  const handleMarcarComoPrincipal = async (id: number) => {
    try {
      await marcarComoPrincipal(id);
      alert("Domicilio marcado como principal correctamente");
    } catch (error: any) {
      alert(error.message || "Error al marcar como principal");
    }
  };

  /**
   * Elimina un domicilio
   */
  const handleEliminarDomicilio = async (id: number) => {
    try {
      const success = await eliminarDomicilio(id);
      if (success) {
        alert("Domicilio eliminado correctamente");
      }
    } catch (error: any) {
      alert(error.message || "Error al eliminar domicilio");
    }
  };

  /**
   * Callback para cuando se actualiza el perfil
   */
  const handlePerfilUpdated = () => {
    refreshPerfil();
  };

  /**
   * Callback para cuando se actualiza un domicilio
   */
  const handleDomicilioUpdated = () => {
    refreshDomicilios();
  };

  /**
   * Renderiza el contenido de cada tab
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case "info":
        // Contenido de la pestaña Información Personal
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Información Personal
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditarPerfil}
                >
                  ✏️ Editar
                </Button>
              </div>

              {perfil && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Nombre
                    </label>
                    <p className="text-gray-900">{perfil.nombre}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Apellido
                    </label>
                    <p className="text-gray-900">{perfil.apellido}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Email
                    </label>
                    <p className="text-gray-900">{perfil.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Teléfono
                    </label>
                    <p className="text-gray-900">{perfil.telefono}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Fecha de Nacimiento
                    </label>
                    <p className="text-gray-900">
                      {new Date(
                        perfil.fechaNacimiento + "T00:00:00"
                      ).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  {perfil.imagen && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        Foto de Perfil
                      </label>
                      <img
                        src={perfil.imagen.url}
                        alt="Foto de perfil"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case "domicilios":
        // Contenido de la pestaña Domicilios
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Mis Domicilios
                </h3>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCrearDomicilio}
                >
                  ➕ Agregar Domicilio
                </Button>
              </div>

              {domicilios.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No tienes domicilios registrados</p>
                  <Button
                    variant="primary"
                    className="mt-4"
                    onClick={handleCrearDomicilio}
                  >
                    Agregar mi primer domicilio
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {domicilios.map((domicilio) => (
                    <div
                      key={domicilio.idDomicilio}
                      className={`p-4 border rounded-lg ${
                        domicilio.esPrincipal
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {domicilio.direccionCompleta}
                            </p>
                            {domicilio.esPrincipal && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                Principal
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {domicilio.calle} {domicilio.numero},{" "}
                            {domicilio.localidad} (CP: {domicilio.cp})
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!domicilio.esPrincipal && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleMarcarComoPrincipal(domicilio.idDomicilio)
                              }
                            >
                              Marcar como principal
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditarDomicilio(domicilio)}
                          >
                            ✏️
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              handleEliminarDomicilio(domicilio.idDomicilio)
                            }
                            disabled={domicilios.length === 1}
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "seguridad":
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Configuración de Seguridad
              </h3>

              {/* 🔑 Sección de Cambio de Contraseña */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg mb-6">
                <div>
                  <h4 className="font-medium text-gray-900">
                    Cambiar Contraseña
                  </h4>
                  <p className="text-sm text-gray-500">
                    Envía un enlace a tu email para restablecer tu contraseña.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleCambiarPassword}
                  disabled={isRequestingPasswordReset}
                >
                  {isRequestingPasswordReset
                    ? "📧 Enviando..."
                    : "Solicitar Cambio"}
                </Button>
              </div>
            </div>

            {/* Zona de Peligro */}
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-red-900 mb-4">
                Zona de Peligro
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-red-900">Eliminar Cuenta</h4>
                  <p className="text-sm text-red-700">
                    Una vez eliminada, no podrás recuperar tu cuenta ni tus
                    datos
                  </p>
                </div>
                <Button
                  variant="danger"
                  onClick={handleEliminarCuenta}
                  disabled={isDeleting}
                >
                  {isDeleting ? "⏳ Eliminando..." : "🗑️ Eliminar Cuenta"}
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
              <p className="text-gray-600">
                Hola {user?.nombre || perfil?.nombre}, gestiona tu información
                personal y configuración
              </p>
            </div>
            {perfil?.imagen && (
              <img
                src={perfil.imagen.url}
                alt="Foto de perfil"
                className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
              />
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} />
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mb-8">{renderTabContent()}</div>

        {/* Modales */}
        <PerfilInfoModal
          isOpen={showPerfilModal}
          onClose={() => setShowPerfilModal(false)}
          onSuccess={handlePerfilUpdated}
        />

        <DomicilioModal
          isOpen={showDomicilioModal}
          onClose={() => setShowDomicilioModal(false)}
          onSuccess={handleDomicilioUpdated}
          domicilio={selectedDomicilio}
          mode={domicilioModalMode}
        />
      </div>
    </div>
  );
};
