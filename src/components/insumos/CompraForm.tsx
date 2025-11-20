import React, { useEffect, useState } from "react";
import { insumoService } from "../../services/InsumoService";
import type { ArticuloInsumoResponseDTO } from "../../types/insumos/ArticuloInsumoResponseDTO";
import { Button } from "../common/Button";
import { compraService } from "../../services/CompraService";
import type { CompraInsumoRequestDTO } from "../../types/insumos/CompraInsumoRequestDTO";

type Props = {
  insumoId: number;
  onClose: () => void;
  onSuccess: () => void;
};

const CompraForm: React.FC<Props> = ({ insumoId, onClose, onSuccess }) => {
  const [insumo, setInsumo] = useState<ArticuloInsumoResponseDTO | null>(null);

  // COMPRA: Lo que ingresa el admin
  const [cantidadComprada, setCantidadComprada] = useState<number>(1);
  const [precioCompra, setPrecioCompra] = useState<number>(0);

  const [error, setError] = useState<string | null>(null);
  const [compraExitosa, setCompraExitosa] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [loadingPrecio, setLoadingPrecio] = useState(true);

  // ✅ Cargar insumo + precio sugerido de VENTA
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Cargar datos del insumo
        const data = await insumoService.getById(insumoId);
        setInsumo(data);
      } catch (err) {
        setError("No se pudo cargar el insumo.");
        console.error("❌ Error:", err);
      } finally {
        setLoadingPrecio(false);
      }
    };

    fetchData();
  }, [insumoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cantidadComprada || cantidadComprada <= 0) {
      setError("Cantidad requerida (>0)");
      return;
    }

    if (!precioCompra || precioCompra <= 0) {
      setError("Precio de compra requerido (>0)");
      return;
    }

    setLoading(true);

    try {
      // Registrar la COMPRA (precio de compra)
      const request: CompraInsumoRequestDTO = {
        insumoId: insumoId,
        cantidad: cantidadComprada,
        precioUnitario: precioCompra,
        fechaCompra: new Date().toISOString().split("T")[0],
      };

      await compraService.registrarCompra(request);

      setCompraExitosa(true);
      onSuccess();

      setTimeout(() => {
        setCompraExitosa(false);
        setCantidadComprada(1);
        setPrecioCompra(0);
        onClose();
      }, 1500);
    } catch (e) {
      setError("Error al registrar compra");
      console.error("❌ Error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!insumo) return null;

  const subtotalCompra = cantidadComprada * precioCompra;

  return (
    <>
      {compraExitosa ? (
        <div className="text-center py-6">
          <div className="text-5xl mb-2">✅</div>
          <p className="text-green-700 font-semibold text-lg">
            Compra registrada
          </p>
        </div>
      ) : (
        <>
          <h2 className="text-base font-semibold mb-3 text-gray-800">
            🛒 {insumo.denominacion}
          </h2>

          {error && (
            <div className="bg-red-100 text-red-700 px-2 py-1 mb-2 rounded text-xs">
              ⚠️ {error}
            </div>
          )}

          {/* Info del insumo */}
          <div className="text-xs text-gray-600 space-y-0.5 mb-3 bg-gray-50 p-2 rounded">
            <p>
              <strong>Stock actual:</strong> {insumo.stockActual} /{" "}
              {insumo.stockMaximo}
            </p>
            <p>
              <strong>Unidad:</strong> {insumo.denominacionUnidadMedida}
            </p>
          </div>

          {/* ✅ SECCIÓN 1: INGRESO DE COMPRA */}
          <div className="border-b pb-3 mb-3">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">
              📦 COMPRA AL PROVEEDOR
            </h3>

            <div className="space-y-2">
              {/* Cantidad comprada */}
              <div>
                <label className="block text-xs font-medium mb-0.5">
                  Cantidad Comprada
                </label>
                <input
                  type="number"
                  value={cantidadComprada}
                  onChange={(e) =>
                    setCantidadComprada(parseFloat(e.target.value))
                  }
                  placeholder="1"
                  required
                  disabled={loading}
                  min={0.01}
                  step={0.01}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>

              {/* Precio de compra */}
              <div>
                <label className="block text-xs font-medium mb-0.5">
                  Precio de Compra (Unitario)
                </label>
                <input
                  type="number"
                  value={precioCompra}
                  onChange={(e) => setPrecioCompra(parseFloat(e.target.value))}
                  placeholder="0.00"
                  required
                  disabled={loading}
                  min={0.01}
                  step={0.01}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>

              {/* Subtotal compra */}
              {cantidadComprada > 0 && precioCompra > 0 && (
                <div className="bg-blue-50 px-2 py-1.5 rounded text-xs border border-blue-200">
                  <strong>Gasto Total:</strong> {cantidadComprada} × $
                  {precioCompra.toFixed(2)} = ${subtotalCompra.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !cantidadComprada || !precioCompra}
              loading={loading}
              className="flex-1"
            >
              {loading ? "..." : "Guardar Compra"}
            </Button>
          </div>
        </>
      )}
    </>
  );
};

export default CompraForm;
