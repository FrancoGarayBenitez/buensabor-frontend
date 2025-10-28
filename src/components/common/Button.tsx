import React from "react";
import { LoadingSpinner } from "./LoadingSpinner";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger" | "success" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  title?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantClasses = {
    primary:
      "text-white hover:opacity-90 focus:ring-2 focus:ring-[#CD6C50]/50 disabled:opacity-50",
    secondary:
      "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-300",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300",
    success:
      "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300",
    outline:
      "border text-white hover:bg-[#CD6C50]/10 focus:ring-2 focus:ring-[#CD6C50]/50 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-300",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        backgroundColor: variant === "primary" ? "#CD6C50" : undefined,
        borderColor: variant === "outline" ? "#CD6C50" : undefined,
        color: variant === "outline" ? "#CD6C50" : undefined,
      }}
      className={`${baseClasses} ${sizeClasses[size]} ${
        variantClasses[variant]
      } ${className} ${
        isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
};