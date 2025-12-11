import React, { useEffect, useState } from "react";
import { insumoService } from "../../services";
import { compraService } from "../../services";
import type { ArticuloInsumoResponseDTO } from "../../types/insumos/ArticuloInsumoResponseDTO";
import type { CompraInsumoRequestDTO } from "../../types/insumos/CompraInsumoRequestDTO";
import { Button } from "../common/Button";
import { Alert } from "../common/Alert";

interface CompraFormProps {
  insumoId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const CompraForm: React.FC<CompraFormProps> = ({
  insumoId,
  onClose,
  onSuccess,
}) => {
  // ==================== ESTADO ====================

  const [insumo, setInsumo] = useState<ArticuloInsumoResponseDTO | null>(null);
  const [cantidad, setCantidad] = useState<string>("1");
  const [precioUnitario, setPrecioUnitario] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exitoCompra, setExitoCompra] = useState(false);

  // ==================== EFECTOS ====================

  useEffect(() => {
    const fetchInsumo = async () => {
      try {
        const data = await insumoService.getById(insumoId);
        setInsumo(data);
        setError(null);
      } catch (err) {
        setError("No se pudo cargar el insumo");
        console.error("❌ Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsumo();
  }, [insumoId]);

  // ==================== MANEJADORES ====================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cantidadNum = parseFloat(cantidad);
    const precioUnitarioNum = parseFloat(precioUnitario);

    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      setError("Cantidad debe ser mayor a 0");
      return;
    }

    if (isNaN(precioUnitarioNum) || precioUnitarioNum <= 0) {
      setError("Precio unitario debe ser mayor a 0");
      return;
    }

    setSubmitLoading(true);

    try {
      const compra: CompraInsumoRequestDTO = {
        idArticuloInsumo: insumoId,
        cantidad: parseFloat(cantidad),
        precioUnitario: parseFloat(precioUnitario),
      };

      await compraService.registrarCompra(compra);

      setExitoCompra(true);

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al registrar compra"
      );
      console.error("❌ Error:", err);
    } finally {
      setSubmitLoading(false);
    }
  };

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (!insumo) {
    return null;
  }

  if (exitoCompra) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-2">✅</div>
        <p className="text-green-700 font-semibold text-lg">
          Compra registrada correctamente
        </p>
      </div>
    );
  }

  const cantidadNum = parseFloat(cantidad) || 0;
  const precioUnitarioNum = parseFloat(precioUnitario) || 0;
  const subtotal = cantidadNum * precioUnitarioNum;

  return (
    <>
      <h2 className="text-lg font-semibold mb-4 text-gray-800">
        🛒 Registrar Compra: {insumo.denominacion}
      </h2>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {/* Información del insumo */}
      <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm space-y-1">
        <p>
          <span className="text-gray-600">Stock actual:</span>{" "}
          <span className="font-semibold">
            {insumo.stockActual} / {insumo.stockMaximo}
          </span>
        </p>
        <p>
          <span className="text-gray-600">Unidad:</span>{" "}
          <span className="font-semibold">
            {insumo.denominacionUnidadMedida}
          </span>
        </p>
        <p>
          <span className="text-gray-600">Categoría:</span>{" "}
          <span className="font-semibold">{insumo.denominacionCategoria}</span>
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cantidad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad Comprada <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder="1"
            min={0.01}
            step={0.01}
            required
            disabled={submitLoading}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Precio unitario */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio Unitario <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={precioUnitario}
            onChange={(e) => setPrecioUnitario(e.target.value)}
            placeholder="0.00"
            min={0.01}
            step={0.01}
            required
            disabled={submitLoading}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Subtotal */}
        {cantidadNum > 0 && precioUnitarioNum > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-gray-600">Gasto Total:</p>
            <p className="text-xl font-bold text-blue-600">
              ${subtotal.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {cantidadNum} × ${precioUnitarioNum.toFixed(2)}
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={
              submitLoading || cantidadNum <= 0 || precioUnitarioNum <= 0
            }
            loading={submitLoading}
            className="flex-1"
          >
            Guardar Compra
          </Button>
        </div>
      </form>
    </>
  );
};

export default CompraForm;
