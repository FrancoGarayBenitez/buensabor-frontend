import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  // Cerrar con ESC
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-6"
      style={{ backgroundColor: "rgba(68, 54, 57, 0.7)" }}
      onClick={handleOverlayClick}
    >
      <div
        className={`rounded-xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}
        style={{ backgroundColor: "#F7F7F5" }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center px-6 py-4 border-b rounded-t-xl"
          style={{
            borderColor: "#E29C44",
            backgroundColor: "#CD6C50",
          }}
        >
          <h2 className="text-xl font-semibold" style={{ color: "#F7F7F5" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="transition-all duration-200 p-2 rounded-lg hover:opacity-80"
            style={{
              color: "#F7F7F5",
              backgroundColor: "rgba(247, 247, 245, 0.1)",
            }}
            aria-label="Cerrar modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto px-6 py-6"
          style={{ color: "#443639" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
