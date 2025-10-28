import React, { useState } from 'react';
import { EstadisticasService } from '../../services/EstadisticasService';
import type { RankingProductoDTO } from '../../types/estadisticas/RankingProductoDTO';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Alert } from '../common/Alert';
import { exportToExcel } from '../../services/ExcelExportServices'; 

export const RankingView: React.FC = () => {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [rankingData, setRankingData] = useState<RankingProductoDTO[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuscarRanking = async () => {
    if (!fechaDesde || !fechaHasta) {
      setError('Por favor, seleccione ambas fechas para generar el ranking.');
      return;
    }
    setLoading(true);
    setError(null);
    setRankingData(null); // Limpia los resultados anteriores
    try {
      const data = await EstadisticasService.getRankingProductos(fechaDesde, fechaHasta);
      setRankingData(data);
    } catch (err) {
      console.error("Error al generar el ranking:", err);
      setError("No se pudo generar el ranking. Intente más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportar = () => {
    if (rankingData && rankingData.length > 0) {
      const datosParaExportar = rankingData.map(item => ({
        'Producto': item.denominacionProducto,
        'Cantidad Vendida': item.cantidadVendida,
        'Total Recaudado ($)': item.totalVendido,
      }));
      exportToExcel(datosParaExportar, `Ranking_Productos_${fechaDesde}_a_${fechaHasta}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Ranking de Productos Vendidos</h2>
      
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* --- Filtros de Fecha y Botones --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label htmlFor="fechaDesde" className="block text-sm font-medium text-gray-700">Fecha Desde</label>
          <input 
            type="date" 
            id="fechaDesde" 
            className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" 
            value={fechaDesde} 
            onChange={e => setFechaDesde(e.target.value)} 
          />
        </div>
        <div>
          <label htmlFor="fechaHasta" className="block text-sm font-medium text-gray-700">Fecha Hasta</label>
          <input 
            type="date" 
            id="fechaHasta" 
            className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" 
            value={fechaHasta} 
            onChange={e => setFechaHasta(e.target.value)} 
          />
        </div>
        <div className="flex space-x-2">
            <button 
                onClick={handleBuscarRanking} 
                disabled={loading}
                className="w-full px-4 py-2 bg-[#CD6C50] text-white rounded-md hover:bg-[#E29C44] transition-colors disabled:opacity-50"
            >
                {loading ? 'Buscando...' : 'Buscar Ranking'}
            </button>
            <button 
                onClick={handleExportar} 
                disabled={!rankingData || rankingData.length === 0}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
                Exportar a Excel
            </button>
        </div>
      </div>

      {/* --- Resultados --- */}
      <div className="mt-6">
        {loading && <div className="text-center p-8"><LoadingSpinner /></div>}
        
        {rankingData && (
          rankingData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posición</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Vendida</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Recaudado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rankingData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.denominacionProducto}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{item.cantidadVendida}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">${item.totalVendido.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-8 text-gray-500">
              <p>No se encontraron resultados para el rango de fechas seleccionado.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};