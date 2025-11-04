import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoginForm } from "../components/auth/LoginForm";
import type { LoginRequestDTO } from "../types/auth";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleLogin = async (credentials: LoginRequestDTO) => {
    setLoading(true);
    setError("");

    try {
      await login(credentials);
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToRegister = () => {
    navigate("/registro");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md">
        <LoginForm
          onSubmit={handleLogin}
          onSwitchToRegister={handleSwitchToRegister}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};

export default Login;
