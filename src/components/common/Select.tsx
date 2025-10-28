import React from "react";

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  name: string;
  value: string | number;
  onChange: (value: string | number) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Seleccione una opción",
  required = false,
  disabled = false,
  error,
  helperText,
  className = "",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    // Si es número, convertir
    const parsedValue =
      !isNaN(Number(newValue)) && newValue !== "" ? Number(newValue) : newValue;
    onChange(parsedValue);
  };

  const selectClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm transition-colors
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${
      error
        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
        : "border-gray-300"
    }
  `;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <select
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        className={selectClasses}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={option.disabled ? "text-gray-400" : ""}
          >
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
