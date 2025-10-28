import React from "react";

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          📊 Dashboard Principal
        </h2>
        <p className="text-gray-600 mb-4">
          Bienvenido al sistema de gestión de delivery de comidas.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-blue-800 text-sm">
            🚧 <strong>En desarrollo:</strong> Panel principal con métricas y
            resúmenes
          </p>
        </div>
      </div>

      {/* Cards de estado rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">--</div>
          <div className="text-sm text-gray-600">Categorías</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">--</div>
          <div className="text-sm text-gray-600">Ingredientes</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">--</div>
          <div className="text-sm text-gray-600">Productos</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">--</div>
          <div className="text-sm text-gray-600">Stock Bajo</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
