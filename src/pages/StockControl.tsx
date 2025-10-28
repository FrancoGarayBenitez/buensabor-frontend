import React from "react";

const StockControl: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de Stock</h1>
          <p className="text-gray-600 mt-1">
            Monitoree el stock de ingredientes
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow text-center">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Página en Desarrollo
        </h2>
        <p className="text-gray-600 mb-4">
          El control de stock estará disponible próximamente.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 max-w-md mx-auto">
          <p className="text-yellow-800 text-sm">
            <strong>HU#25:</strong> Control de stock de ingredientes
            <br />
            Alertas de stock bajo y crítico
          </p>
        </div>
      </div>

      {/* Placeholder para mostrar estructura futura */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-red-600 mb-2">Stock Crítico</h3>
          <p className="text-sm text-gray-500">
            Ingredientes que requieren reposición urgente
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-yellow-600 mb-2">Stock Bajo</h3>
          <p className="text-sm text-gray-500">Ingredientes cerca del mínimo</p>
        </div>
      </div>
    </div>
  );
};

export default StockControl;
