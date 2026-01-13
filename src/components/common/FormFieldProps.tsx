import React from "react";

interface FormFieldProps {
  label: string;
  name: string;
  type?:
    | "text"
    | "number"
    | "email"
    | "password"
    | "textarea"
    | "date"
    | "time";
  value?: string | number;
  onChange?: (value: string | number) => void;
  onBlur?: () => void; // ✅ AÑADIR PROP onBlur
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  hideLabel?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  onBlur, // ✅ DESESTRUCTURAR onBlur
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
  hideLabel = false,
}) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const inputValue = e.target.value;
    onChange?.(inputValue);
  };

  // ✅ AÑADIR MANEJADOR DE onBlur
  const handleBlur = () => {
    onBlur?.();
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

  // Normalizar value a string para evitar controlled/uncontrolled warnings
  const normalizedValue = value ?? "";

  return (
    <div className={`space-y-1 ${className}`}>
      {/* ✅ RENDERIZAR LA ETIQUETA CONDICIONALMENTE */}
      {!hideLabel && (
        <label
          htmlFor={name}
          className="block text-sm font-medium"
          style={{ color: "#443639" }}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={String(normalizedValue)}
          onChange={handleChange}
          onBlur={handleBlur} // ✅ AÑADIR onBlur
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
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={String(normalizedValue)}
          onChange={handleChange}
          onBlur={handleBlur} // ✅ AÑADIR onBlur
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
