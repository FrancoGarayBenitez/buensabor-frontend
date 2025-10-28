import React, { useEffect, useState } from "react";

export const UserDeactivatedAlert: React.FC = () => {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // Verificar si hay parámetro de error en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");

    if (error === "usuario_desactivado") {
      setShowAlert(true);

      // Limpiar la URL después de mostrar el mensaje
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (!showAlert) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🚫</div>
          <div>
            <div className="font-semibold">Cuenta Desactivada</div>
            <div className="text-sm opacity-90">
              Tu cuenta ha sido desactivada. Contacta al administrador para más
              información.
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAlert(false)}
          className="text-white hover:text-gray-200 transition-colors text-xl font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
};
