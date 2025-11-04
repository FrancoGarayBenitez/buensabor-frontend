import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { RegistroForm } from "../components/auth/RegistroForm";
import type { ClienteRegisterDTO } from "../types/clientes";

const Registro: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleRegister = async (data: ClienteRegisterDTO) => {
    setLoading(true);
    setError("");

    try {
      await register(data);
      navigate("/"); // Redirige al home después del registro
    } catch (err: any) {
      setError(err.message || "Error al registrar usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md">
        <RegistroForm
          onSubmit={handleRegister}
          onSwitchToLogin={handleSwitchToLogin}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};

export default Registro;
