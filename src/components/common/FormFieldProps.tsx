import React from "react";

interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "number" | "email" | "password" | "textarea";
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  rows?: number; // Para textarea
  min?: number; // Para number
  max?: number; // Para number
  step?: number; // Para number
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  rows = 3,
  min,
  max,
  step,
  className = "",
}) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const inputValue = e.target.value;

    if (type === "number") {
      // Permitir borrar el campo (string vacío)
      if (inputValue === "") {
        onChange("");
        return;
      }

      // Convertir solo si es un número válido
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
      // Si no es un número válido, ignorar el cambio (no actualizar)
    } else {
      onChange(inputValue);
    }
  };

  const inputClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-opacity-50
    disabled:cursor-not-allowed disabled:opacity-60
    ${error ? "border-red-500 focus:ring-red-400 focus:border-red-500" : ""}
  `;

  const inputStyles = {
    backgroundColor: disabled ? "#9AAAB3" : "#F7F7F5",
    borderColor: error ? "#ef4444" : "#E29C44",
    color: disabled ? "#F7F7F5" : "#443639",
    "--tw-ring-color": error
      ? "rgba(239, 68, 68, 0.5)"
      : "rgba(205, 108, 80, 0.5)",
  } as React.CSSProperties;

  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={name}
        className="block text-sm font-medium"
        style={{ color: "#443639" }}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          className={inputClasses}
          style={inputStyles}
          onFocus={(e) => {
            if (!error) {
              e.target.style.borderColor = "#CD6C50";
              e.target.style.boxShadow = "0 0 0 2px rgba(205, 108, 80, 0.2)";
            }
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? "#ef4444" : "#E29C44";
            e.target.style.boxShadow = "none";
          }}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={inputClasses}
          style={inputStyles}
          onFocus={(e) => {
            if (!error) {
              e.target.style.borderColor = "#CD6C50";
              e.target.style.boxShadow = "0 0 0 2px rgba(205, 108, 80, 0.2)";
            }
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? "#ef4444" : "#E29C44";
            e.target.style.boxShadow = "none";
          }}
        />
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="text-sm" style={{ color: "#9AAAB3" }}>
          {helperText}
        </p>
      )}
    </div>
  );
};
