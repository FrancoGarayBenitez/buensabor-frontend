import React, { useEffect, useState } from "react";
import { compraService } from "../../services/CompraService";
import { insumoService } from "../../services/InsumoService";
import type { ArticuloInsumoResponseDTO } from "../../types/insumos/ArticuloInsumoResponseDTO";
import { Button } from "../common/Button";
import { FormField } from "../common/FormFieldProps";

type Props = {
  insumoId: number;
  onClose: () => void;
  onSuccess: () => void;
};

const CompraForm: React.FC<Props> = ({ insumoId, onClose, onSuccess }) => {
  const [insumo, setInsumo] = useState<ArticuloInsumoResponseDTO | null>(null);
  const [cantidad, setCantidad] = useState<number>(0);
  const [precioUnitario, setPrecioUnitario] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [compraExitosa, setCompraExitosa] = useState<boolean>(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await insumoService.getById(insumoId);
        setInsumo(data);
      } catch {
        setError("No se pudo cargar el insumo.");
      }
    };
    fetch();
  }, [insumoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cantidad <= 0 || precioUnitario <= 0) {
      setError("La cantidad y el precio deben ser mayores a 0.");
      return;
    }

    try {
      await compraService.registrarCompra({
        insumoId: insumoId,
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        fechaCompra: new Date().toISOString().slice(0, 10),
      });
      setCompraExitosa(true);
      onSuccess();

      // Cierra el modal automáticamente después de 1.5 segundos
      setTimeout(() => {
        setCompraExitosa(false);
        onClose();
      }, 1500);
    } catch (e) {
      setError("Error al registrar la compra.");
    }
  };

  if (!insumo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-lg"
        >
          ✖
        </button>

        <h2 className="text-xl font-semibold mb-3 text-gray-800">
          Compra de: <span className="text-blue-700">{insumo.denominacion}</span>
        </h2>

        <div className="mb-3 text-sm text-gray-700 space-y-1">
          <p><strong>Stock:</strong> {insumo.stockActual} / {insumo.stockMaximo}</p>
          <p><strong>Unidad:</strong> {insumo.denominacionUnidadMedida}</p>
          <p><strong>Categoría:</strong> {insumo.denominacionCategoria}</p>
          {!insumo.esParaElaborar && insumo.imagenes?.[0] && (
            <img
              src={insumo.imagenes[0].url}
              alt={insumo.imagenes[0].denominacion}
              className="w-16 h-16 object-cover rounded shadow mt-2"
            />
          )}
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 mb-3 rounded text-sm">
            {error}
          </div>
        )}

        {/* Mensaje de éxito */}
        {compraExitosa ? (
          <div className="bg-green-100 text-green-700 px-3 py-2 mb-3 rounded text-sm flex items-center gap-2 justify-center">
            <span>✅ Compra registrada con éxito</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Cantidad"
              name="cantidad"
              type="number"
              value={cantidad}
              onChange={(val) => setCantidad(Number(val))}
              required
              min={1}
              error={cantidad <= 0 ? "Ingrese una cantidad válida." : undefined}
            />

            <FormField
              label="Precio unitario"
              name="precioUnitario"
              type="number"
              value={precioUnitario}
              onChange={(val) => setPrecioUnitario(Number(val))}
              required
              min={0.01}
              step={0.01}
              error={precioUnitario <= 0 ? "Ingrese un precio válido." : undefined}
            />

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Registrar</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CompraForm;
