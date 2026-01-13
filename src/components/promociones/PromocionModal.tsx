import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import {
  type PromocionResponse,
  type PromocionRequest,
  type ArticuloShort,
  TIPO_PROMOCION, // ✅ IMPORTAR
} from "../../types/promociones/promocion.types";

// Importar los nuevos componentes del formulario
import { PromocionTipoSelector } from "./form/PromocionTipoSelector";
import { ComboForm } from "./form/ComboForm";
import { NxMForm } from "./form/NxMForm";

interface PromocionModalProps {
  isOpen: boolean;
  onClose: () => void;
  promocion?: PromocionResponse;
  articulosDisponibles: ArticuloShort[];
  onSubmit: (data: PromocionRequest) => Promise<void>;
  loading: boolean;
  serverErrorMessage?: string;
}

type FormType = "combo" | "nxm";

export const PromocionModal: React.FC<PromocionModalProps> = ({
  isOpen,
  onClose,
  promocion,
  articulosDisponibles,
  onSubmit,
  loading,
  serverErrorMessage,
}) => {
  const [selectedForm, setSelectedForm] = useState<FormType | null>(null);

  // Determinar el tipo de formulario al abrir el modal para edición
  useEffect(() => {
    if (isOpen && promocion) {
      if (promocion.tipoPromocion === TIPO_PROMOCION.NXM) {
        setSelectedForm("nxm");
      } else {
        // Por defecto, o si es explícitamente COMBO
        setSelectedForm("combo");
      }
    } else if (!isOpen) {
      // Resetear al cerrar el modal
      setSelectedForm(null);
    }
  }, [isOpen, promocion]);

  const isEditing = !!promocion;
  const title = isEditing
    ? `Editar Promoción: ${promocion?.denominacion}`
    : "Crear Nueva Promoción";

  const renderContent = () => {
    // Si estamos editando, o ya se seleccionó un tipo de formulario
    if (selectedForm === "combo") {
      return (
        <ComboForm
          promocion={promocion}
          articulosDisponibles={articulosDisponibles}
          onSubmit={onSubmit}
          onCancel={onClose}
          loading={loading}
          serverErrorMessage={serverErrorMessage}
        />
      );
    }
    if (selectedForm === "nxm") {
      return (
        <NxMForm
          promocion={promocion}
          articulosDisponibles={articulosDisponibles}
          onSubmit={onSubmit}
          onCancel={onClose}
          loading={loading}
          serverErrorMessage={serverErrorMessage}
        />
      );
    }

    // Si estamos creando y aún no se ha seleccionado un tipo, mostrar el selector
    return <PromocionTipoSelector onSelect={setSelectedForm} />;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      {renderContent()}
    </Modal>
  );
};
