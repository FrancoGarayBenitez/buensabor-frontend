import React, { useState } from "react";
import type { LoginRequestDTO } from "../../types/auth";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSubmit: (credentials: LoginRequestDTO) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  error,
  loading = false,
  onSubmit,
}) => {
  const [credentials, setCredentials] = useState<LoginRequestDTO>({
    email: "",
    password: "",
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    if (validationError) setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentials.email.trim() || !credentials.password.trim()) {
      setValidationError("Debe ingresar un email y una contraseña.");
      return;
    }

    setValidationError(null);
    await onSubmit(credentials);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-800 text-center mb-6">
        Inicia sesión
      </h2>

      {/* 🔄 Mostrar error del componente o error global */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {validationError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {validationError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={credentials.email}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent transition-all duration-200 placeholder-gray-400 border-gray-300"
          />
        </div>
        <div>
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={credentials.password}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CD6C50] focus:border-transparent transition-all duration-200 placeholder-gray-400 border-gray-300"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#CD6C50] hover:bg-[#b85a42] disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-[#CD6C50] focus:ring-offset-2 flex items-center justify-center space-x-2"
        >
          {loading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
      </form>

      {/* Link a Registro */}
      <div className="text-center mt-6">
        <span className="text-gray-600 text-sm">¿No tienes cuenta? </span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-[#CD6C50] hover:text-[#b85a42] font-medium transition-colors duration-200 text-sm"
        >
          Registrarse
        </button>
      </div>
    </div>
  );
};
