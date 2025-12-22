import React, { useEffect, useState } from "react";
import { insumoService, compraService } from "../../services";
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
  const [insumo, setInsumo] = useState<ArticuloInsumoResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exitoCompra, setExitoCompra] = useState(false);

  // ✅ nuevo flujo: solo paquetes
  const [paquetes, setPaquetes] = useState<string>("1");
  const [unidadContenido, setUnidadContenido] = useState<
    "g" | "kg" | "ml" | "l" | "unidad"
  >("unidad");
  const [contenidoPorPaquete, setContenidoPorPaquete] = useState<string>("");
  const [precioPorPaquete, setPrecioPorPaquete] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const data = await insumoService.getById(insumoId);
        setInsumo(data);

        // Unidad técnica sembrada: g | ml | unidad → sugiero unidadContenido inicial
        const base = (data?.denominacionUnidadMedida || "").toLowerCase();
        if (base === "g") setUnidadContenido("g");
        else if (base === "ml") setUnidadContenido("ml");
        else setUnidadContenido("unidad");

        setError(null);
      } catch (err) {
        setError("No se pudo cargar el insumo");
        console.error("❌ Error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [insumoId]);

  const base =
    (insumo?.denominacionUnidadMedida || "").toLowerCase() === "g"
      ? "g"
      : (insumo?.denominacionUnidadMedida || "").toLowerCase() === "ml"
      ? "ml"
      : "unidad";

  const opcionesUnidadContenido =
    base === "g" ? ["g", "kg"] : base === "ml" ? ["ml", "l"] : ["unidad"];

  const parseN = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  };

  const cantPaq = parseN(paquetes);
  const contPaq = parseN(contenidoPorPaquete);
  const precioPaq = parseN(precioPorPaquete);

  // Preview: convertir contenido/paq a unidad técnica
  const contPaqBase =
    base === "g"
      ? unidadContenido === "kg"
        ? contPaq * 1000
        : contPaq
      : base === "ml"
      ? unidadContenido === "l"
        ? contPaq * 1000
        : contPaq
      : contPaq;

  const totalBase = cantPaq * contPaqBase; // cantidad técnica total
  const precioUnitarioBase = contPaqBase > 0 ? precioPaq / contPaqBase : 0;
  const totalCompra = cantPaq * precioPaq;

  // ✅ Formateadores inteligentes
  const nfCantidad = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: base === "unidad" ? 0 : 0,
    maximumFractionDigits: base === "unidad" ? 0 : 2,
  });
  const nfPrecioUnidad = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: base === "unidad" ? 2 : 0,
    maximumFractionDigits: base === "unidad" ? 2 : 4,
  });
  const nfPrecioTotal = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const unitLabel =
    base === "unidad"
      ? Math.round(totalBase) === 1
        ? "unidad"
        : "unidades"
      : base;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cantPaq <= 0) {
      setError("Los paquetes deben ser mayor a 0");
      return;
    }
    if (contPaq <= 0) {
      setError("El contenido por paquete debe ser mayor a 0");
      return;
    }
    if (precioPaq <= 0) {
      setError("El precio por paquete debe ser mayor a 0");
      return;
    }

    setSubmitLoading(true);
    try {
      const payload: CompraInsumoRequestDTO = {
        idArticuloInsumo: insumoId,
        paquetes: cantPaq,
        precioPorPaquete: precioPaq,
        unidadContenido,
        contenidoPorPaquete: contPaq,
      };

      await compraService.registrarCompra(payload);
      setExitoCompra(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al registrar compra"
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (!insumo) return null;

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

  return (
    <>
      <h2 className="text-lg font-semibold mb-4 text-gray-800">
        🛒 Registrar Compra: {insumo.denominacion}
      </h2>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {/* Info insumo */}
      <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm space-y-1">
        <p>
          <span className="text-gray-600">Stock actual:</span>{" "}
          <span className="font-semibold">
            {insumo.stockActual} / {insumo.stockMaximo}
          </span>
        </p>
        <p>
          <span className="text-gray-600">Unidad técnica:</span>{" "}
          <span className="font-semibold">{base}</span>
        </p>
        <p>
          <span className="text-gray-600">Categoría:</span>{" "}
          <span className="font-semibold">{insumo.denominacionCategoria}</span>
        </p>
      </div>

      {/* Formulario paquetes */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Paquetes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad de paquetes <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={paquetes}
            onChange={(e) => setPaquetes(e.target.value)}
            disabled={submitLoading}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Contenido de cada paquete */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contenido por paquete <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={contenidoPorPaquete}
              onChange={(e) => setContenidoPorPaquete(e.target.value)}
              disabled={submitLoading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidad del contenido <span className="text-red-500">*</span>
            </label>
            <select
              value={unidadContenido}
              onChange={(e) =>
                setUnidadContenido(
                  e.target.value as "g" | "kg" | "ml" | "l" | "unidad"
                )
              }
              disabled={submitLoading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {opcionesUnidadContenido.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500 mt-1">
              Unidad técnica del insumo: <b>{base}</b>
            </p>
          </div>
        </div>

        {/* Precio por paquete */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio por paquete <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={precioPorPaquete}
            onChange={(e) => setPrecioPorPaquete(e.target.value)}
            disabled={submitLoading}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Resumen */}
        {cantPaq > 0 && contPaq > 0 && precioPaq > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <div className="font-semibold text-blue-700">
              Gasto Total: {nfPrecioTotal.format(totalCompra)}
            </div>
            <div className="text-gray-600 mt-1">
              Equivalente: {nfCantidad.format(totalBase)} {unitLabel} a{" "}
              {nfPrecioUnidad.format(precioUnitarioBase)} por{" "}
              {base === "unidad" ? "unidad" : base}
            </div>
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
              submitLoading || cantPaq <= 0 || contPaq <= 0 || precioPaq <= 0
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
