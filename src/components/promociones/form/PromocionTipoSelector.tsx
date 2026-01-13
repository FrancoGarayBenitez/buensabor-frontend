import React from "react";
import { Button } from "../../common/Button";

interface PromocionTipoSelectorProps {
  onSelect: (type: "combo" | "nxm") => void;
}

export const PromocionTipoSelector: React.FC<PromocionTipoSelectorProps> = ({
  onSelect,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-8">
      <h2 className="text-2xl font-bold" style={{ color: "#443639" }}>
        ¿Qué tipo de promoción deseas crear?
      </h2>
      <div className="flex flex-col md:flex-row gap-4 w-full">
        <Button
          variant="outline"
          className="p-8 flex-1"
          onClick={() => onSelect("combo")}
        >
          <div className="text-center">
            <p className="font-semibold text-lg">Combo con Descuento</p>
            <p className="text-sm" style={{ color: "#9AAAB3" }}>
              Ej: Hamburguesa + Papas + Gaseosa a un precio especial.
            </p>
          </div>
        </Button>
        <Button
          variant="outline"
          className="p-8 flex-1"
          onClick={() => onSelect("nxm")}
        >
          <div className="text-center">
            <p className="font-semibold text-lg">Oferta NxM (2x1, 3x2)</p>
            <p className="text-sm" style={{ color: "#9AAAB3" }}>
              Ej: Elige 2 gaseosas de una lista y paga solo 1.
            </p>
          </div>
        </Button>
      </div>
    </div>
  );
};
