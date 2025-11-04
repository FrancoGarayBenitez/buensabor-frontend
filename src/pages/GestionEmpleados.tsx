import React, { useState } from "react";
import type { EmpleadoRegisterDTO } from "../types/empleados/EmpleadoDTO";
import EmpleadoService from "../services/EmpleadoService";
import { EmpleadoForm } from "../components/auth/EmpleadoForm";

const GestionEmpleados: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  const handleRegistrarEmpleado = async (data: EmpleadoRegisterDTO) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await EmpleadoService.registrarEmpleado(data);
      setSuccess(
        `Empleado ${data.email} registrado exitosamente con rol ${data.rol}`
      );
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || "Error al registrar empleado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">
              Gestión de Empleados
            </h1>
            <p className="text-gray-600 mt-2">
              Administra los empleados del sistema
            </p>
          </div>

          <div className="p-6">
            {/* Mensajes de estado */}
            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                {success}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Botón para mostrar formulario */}
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-[#CD6C50] hover:bg-[#b85a42] text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-[#CD6C50] focus:ring-offset-2"
              >
                + Nuevo Empleado
              </button>
            )}

            {/* Formulario de registro */}
            {showForm && (
              <div className="max-w-md mx-auto">
                <EmpleadoForm
                  onSubmit={handleRegistrarEmpleado}
                  onCancel={() => {
                    setShowForm(false);
                    setError("");
                    setSuccess("");
                  }}
                  loading={loading}
                  error={error}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionEmpleados;
