import React, { useState } from 'react';
import { EstadisticasService } from '../../services/EstadisticasService';
import type { MovimientosMonetariosDTO } from '../../types/estadisticas/MovimientosMonetariosDTO';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// Asumo que tu servicio de exportación está aquí y se llama así
import { exportToExcel } from '../../services/ExcelExportServices'; 
import Header from '../layout/Header';

const InformeFinanciero: React.FC = () => {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [movimientos, setMovimientos] = useState<MovimientosMonetariosDTO | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerarInforme = async () => {
    if (!fechaDesde || !fechaHasta) {
      alert('Por favor, seleccione ambas fechas.');
      return;
    }
    setLoading(true);
    try {
      const data = await EstadisticasService.getMovimientosMonetarios(fechaDesde, fechaHasta);
      setMovimientos(data);
    } catch (error) {
      console.error("Error al generar el informe:", error);
      alert("No se pudo generar el informe.");
    } finally {
      setLoading(false);
    }
  };
  
  // --- 👇 ¡NUEVO! Función para manejar la exportación ---
  const handleExportar = () => {
    if (movimientos) {
      // 1. Creamos un array que contiene un solo objeto con los datos formateados.
      // La librería usará las claves de este objeto como cabeceras de las columnas.
      const dataParaExportar = [
        {
          "Fecha Desde": fechaDesde,
          "Fecha Hasta": fechaHasta,
          "Ingresos Totales ($)": movimientos.ingresos,
          "Costos Totales ($)": movimientos.costos,
          "Ganancia Bruta ($)": movimientos.ganancias,
        }
      ];

      // 2. Llamamos a tu función de exportación existente.
      exportToExcel(dataParaExportar, 'Informe_Financiero');
    }
  };

  const chartData = movimientos ? [
    { name: 'Ingresos', valor: movimientos.ingresos, fill: '#4CAF50' },
    { name: 'Costos', valor: movimientos.costos, fill: '#F44336' },
    { name: 'Ganancias', valor: movimientos.ganancias, fill: '#2196F3' },
  ] : [];

  return (
    

    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Informe Financiero</h2>
        <p className="mt-1 text-sm text-gray-600">Analiza los ingresos, costos y ganancias de tu negocio en períodos de tiempo específicos.</p>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="fechaDesde" className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
            <input type="date" id="fechaDesde" className="w-full p-2 border border-gray-300 rounded-md shadow-sm" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
          </div>
          <div className="flex-1">
            <label htmlFor="fechaHasta" className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
            <input type="date" id="fechaHasta" className="w-full p-2 border border-gray-300 rounded-md shadow-sm" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
          </div>
          <div className="flex-1 flex space-x-2">
            <button 
              className="w-full px-4 py-2 bg-[#CD6C50] text-white rounded-md hover:bg-[#E29C44] transition-colors disabled:opacity-50" 
              onClick={handleGenerarInforme} 
              disabled={loading}
            >
              {loading ? 'Generando...' : 'Generar Informe'}
            </button>
            {/* --- 👇 Conectamos la función al evento onClick --- */}
            <button 
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50" 
              disabled={!movimientos}
              onClick={handleExportar}
            >
              Exportar a Excel
            </button>
          </div>
        </div>
      </div>

      {/* ... (el resto del JSX no cambia) ... */}
      {movimientos && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 p-6 rounded-lg shadow border-l-4 border-green-500">
              <h3 className="text-sm font-medium text-green-700">Ingresos Totales</h3>
              <p className="mt-2 text-3xl font-bold text-green-900">${movimientos.ingresos.toFixed(2)}</p>
            </div>
            <div className="bg-red-50 p-6 rounded-lg shadow border-l-4 border-red-500">
              <h3 className="text-sm font-medium text-red-700">Costos Totales</h3>
              <p className="mt-2 text-3xl font-bold text-red-900">${movimientos.costos.toFixed(2)}</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg shadow border-l-4 border-blue-500">
              <h3 className="text-sm font-medium text-blue-700">Ganancia Bruta</h3>
              <p className="mt-2 text-3xl font-bold text-blue-900">${movimientos.ganancias.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Gráfico de Movimientos</h4>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Monto']} 
                  wrapperClassName="rounded-md border bg-white px-3 py-2 shadow-sm"
                />
                <Bar dataKey="valor" name="Monto" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default InformeFinanciero;