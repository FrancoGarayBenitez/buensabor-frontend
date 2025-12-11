import React, { useEffect, useState } from "react";
import type {
  HistoricoPrecioDTO,
  HistoricoPrecioStatsDTO,
  PrecioVentaSugeridoDTO,
} from "../../types/insumos/HistoricoPrecioDTO";
import { Button } from "../common/Index";
import { compraService, historicoPrecioService } from "../../services";

interface Props {
  insumoId: number;
  onClose: () => void;
  onDelete?: () => void;
}

export const HistorialPrecios: React.FC<Props> = ({
  insumoId,
  onClose,
  onDelete,
}) => {
  const [historial, setHistorial] = useState<HistoricoPrecioDTO[]>([]);
  const [estadisticas, setEstadisticas] =
    useState<HistoricoPrecioStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [margenGanancia, setMargenGanancia] = useState<number>(1.2);
  const [precioVentaSugerido, setPrecioVentaSugerido] =
    useState<PrecioVentaSugeridoDTO | null>(null);

  // ✅ Cargar datos al montar o cuando cambia el margen
  useEffect(() => {
    const t = setTimeout(() => {
      const fetchData = async () => {
        try {
          const [hist, stats, precioSug] = await Promise.all([
            historicoPrecioService.getHistorial(insumoId),
            historicoPrecioService.getEstadisticas(insumoId),
            historicoPrecioService.getPrecioVentaSugerido(
              insumoId,
              margenGanancia
            ),
          ]);
          setHistorial(hist);
          setEstadisticas(stats);
          setPrecioVentaSugerido(precioSug);
          setError(null);
        } catch (error) {
          setError("Error cargando datos.");
          console.error("❌ Error:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, 250);
    return () => clearTimeout(t);
  }, [insumoId, margenGanancia]);

  // ✅ Eliminar compra individual - USANDO COMPRA SERVICE
  const handleEliminarCompra = async (item: HistoricoPrecioDTO) => {
    // ✅ Validar que existe idCompra
    if (!item.idCompra) {
      setError("Error: No se encontró el ID de la compra");
      console.error("❌ idCompra es undefined para item:", item);
      return;
    }

    const confirmacion = window.confirm(
      `¿Está seguro de que desea eliminar esta compra?\n\n` +
        `Fecha: ${new Date(item.fecha).toLocaleDateString("es-AR")}\n` +
        `Precio: $${item.precioUnitario.toFixed(2)}\n` +
        `Cantidad: ${item.cantidad}\n\n` +
        `Esta acción no se puede deshacer.`
    );

    if (!confirmacion) return;

    setDeletingId(item.idCompra);

    try {
      console.log(`🗑️ Eliminando compra ${item.idCompra}`);

      // ✅ Llamar a compraService.deleteCompra() en lugar de historico
      const response = await compraService.deleteCompra(item.idCompra);
      console.log("✅ Respuesta del servidor:", response);

      // ✅ Actualizar tabla local con función para evitar estado desfasado
      setHistorial((prev) =>
        prev.filter((c) => c.idHistoricoPrecio !== item.idHistoricoPrecio)
      );

      // ✅ Refrescar datos (historial, estadísticas, precio sugerido)
      const [hist, stats, precioSug] = await Promise.all([
        historicoPrecioService.getHistorial(insumoId),
        historicoPrecioService.getEstadisticas(insumoId),
        historicoPrecioService.getPrecioVentaSugerido(insumoId, margenGanancia),
      ]);

      setHistorial(hist);
      setEstadisticas(stats);
      setPrecioVentaSugerido(precioSug);

      console.log("✅ Compra eliminada exitosamente");

      // ✅ Notificar al padre si es necesario
      if (onDelete) onDelete();
    } catch (err) {
      setError("Error al eliminar la compra");
      console.error("❌ Error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white p-6 rounded-xl shadow-2xl">
          <p className="text-gray-700">Cargando...</p>
        </div>
      </div>
    );
  }

  // ✅ Calcular total invertido (costo de compra)
  const totalInvertido = historial.reduce(
    (acc, c) => acc + c.precioUnitario * (c.cantidad || 1),
    0
  );

  // ✅ Total de unidades compradas
  const totalCantidadComprada = historial.reduce(
    (acc, c) => acc + (c.cantidad || 0),
    0
  );

  // ✅ Promedio ponderado (coincide con la lista de insumos)
  const precioPromedioPonderado =
    totalCantidadComprada > 0 ? totalInvertido / totalCantidadComprada : 0;

  // ✅ Calcular ganancia potencial si se vende todo
  const gananciaTotal = precioVentaSugerido
    ? precioVentaSugerido.gananciaUnitaria *
      historial.reduce((acc, c) => acc + (c.cantidad || 1), 0)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            📊 Historial de Compras
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 mb-3 rounded text-sm">
            ⚠️ {error}
          </div>
        )}

        {historial.length === 0 ? (
          <p className="text-center py-8 text-gray-500">
            Sin compras registradas
          </p>
        ) : (
          <>
            {/* ✅ Margen de ganancia slider */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <label className="block text-sm font-medium text-amber-900 mb-2">
                💰 Margen de Ganancia
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={margenGanancia}
                  onChange={(e) =>
                    setMargenGanancia(parseFloat(e.target.value))
                  }
                  className="flex-1 h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="font-bold text-amber-900 min-w-fit text-lg">
                  +{((margenGanancia - 1) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-amber-700 mt-2">
                {margenGanancia === 1
                  ? "Sin ganancia (vender a precio de costo)"
                  : `Ganancia estimada: +${((margenGanancia - 1) * 100).toFixed(
                      0
                    )}%`}
              </p>
            </div>

            {/* ✅ Estadísticas */}
            {estadisticas && estadisticas.totalRegistros > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Compras</p>
                  <p className="text-xl font-bold text-blue-600">
                    {estadisticas.totalRegistros}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Precio Promedio (ponderado)
                  </p>
                  <p className="text-xl font-bold text-gray-700">
                    ${precioPromedioPonderado.toFixed(2)}
                  </p>
                  {/* Mostrar referencia del promedio simple si difiere */}
                  {Math.abs(
                    (estadisticas?.precioPromedio ?? 0) -
                      precioPromedioPonderado
                  ) > 0.009 && (
                    <p className="text-[11px] text-gray-500 mt-1">
                      Promedio simple: $
                      {estadisticas!.precioPromedio.toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Invertido</p>
                  <p className="text-xl font-bold text-purple-600">
                    ${totalInvertido.toFixed(2)}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600">Min - Max</p>
                  <p className="text-sm font-mono text-gray-700">
                    ${estadisticas.precioMinimo.toFixed(2)} - $
                    {estadisticas.precioMaximo.toFixed(2)}
                  </p>
                </div>

                {precioVentaSugerido &&
                  precioVentaSugerido.precioVentaSugerido > 0 && (
                    <>
                      <div className="text-center bg-green-100 rounded-lg p-2">
                        <p className="text-sm text-gray-600">
                          Precio Venta Sugerido
                        </p>
                        <p className="text-xl font-bold text-green-700">
                          ${precioVentaSugerido.precioVentaSugerido.toFixed(2)}
                        </p>
                      </div>

                      <div className="text-center bg-green-100 rounded-lg p-2">
                        <p className="text-sm text-gray-600">Ganancia/Unidad</p>
                        <p className="text-xl font-bold text-green-700">
                          ${precioVentaSugerido.gananciaUnitaria.toFixed(2)}
                        </p>
                      </div>

                      {gananciaTotal > 0 && (
                        <div className="text-center bg-emerald-100 rounded-lg p-2 md:col-span-1">
                          <p className="text-sm text-gray-600">
                            Ganancia Total
                          </p>
                          <p className="text-xl font-bold text-emerald-700">
                            ${gananciaTotal.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
              </div>
            )}

            {/* ✅ Tabla de historial */}
            <div className="overflow-x-auto border rounded-lg mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">Fecha</th>
                    <th className="px-4 py-2 text-right">Cantidad</th>
                    <th className="px-4 py-2 text-right">Precio Compra</th>
                    <th className="px-4 py-2 text-right">Total Compra</th>
                    <th className="px-4 py-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((item) => (
                    <tr
                      key={item.idHistoricoPrecio}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-4 py-2">
                        {new Date(item.fecha).toLocaleDateString("es-AR")}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600">
                        {item.cantidad?.toFixed(2) || "-"}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-800">
                        ${item.precioUnitario.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-gray-900">
                        $
                        {(item.precioUnitario * (item.cantidad || 1)).toFixed(
                          2
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleEliminarCompra(item)}
                          disabled={deletingId === item.idCompra}
                          className={`text-sm px-2 py-1 rounded transition ${
                            deletingId === item.idCompra
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "text-red-600 hover:bg-red-100 hover:text-red-800"
                          }`}
                          title="Eliminar esta compra"
                        >
                          {deletingId === item.idCompra ? "🗑️ ..." : "🗑️"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ✅ Nota importante */}
            <div className="text-xs text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200">
              💡 <strong>Nota:</strong> Puedes eliminar compras individuales sin
              afectar el resto. El ingrediente NO se eliminará.
            </div>
          </>
        )}

        <div className="flex justify-end mt-4 sticky bottom-0 bg-white pt-2 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HistorialPrecios;
