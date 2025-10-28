import React, { useState } from 'react';
import { Plus, Search, Filter, Tag, Calendar, Clock, Percent, DollarSign } from 'lucide-react';
import { usePromociones } from '../hooks/usePromociones';
import { PromocionForm } from '../components/promociones/PromocionForm';
import { PromocionModal } from '../components/promociones/PromocionModal';
import { PromocionCard } from '../components/promociones/PromocionCart';
import { Alert } from '../components/common/Alert';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { PromocionResponseDTO } from '../types/promociones';

type FiltroEstado = 'TODAS' | 'VIGENTES' | 'PROGRAMADAS' | 'EXPIRADAS' | 'INACTIVAS';

const Promociones: React.FC = () => {
  const {
    promociones,
    promocionesVigentes,
    loading,
    error,
    crearPromocion,
    actualizarPromocion,
    eliminarPromocion,
    activarPromocion,
    desactivarPromocion,
    refreshPromociones,
    limpiarError
  } = usePromociones(true, true); // Cargar todas y vigentes

  // Estados del componente
  const [modalAbierto, setModalAbierto] = useState(false);
  const [promocionSeleccionada, setPromocionSeleccionada] = useState<PromocionResponseDTO | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const [procesando, setProcesando] = useState<number | null>(null);

  // Funciones de manejo
  const handleAbrirModal = (promocion?: PromocionResponseDTO) => {
    setPromocionSeleccionada(promocion || null);
    setModoEdicion(!!promocion);
    setModalAbierto(true);
    limpiarError();
  };

  const handleCerrarModal = () => {
    setModalAbierto(false);
    setPromocionSeleccionada(null);
    setModoEdicion(false);
  };

  const handleGuardarPromocion = async (data: any) => {
    try {
      if (modoEdicion && promocionSeleccionada) {
        await actualizarPromocion(promocionSeleccionada.idPromocion, data);
      } else {
        await crearPromocion(data);
      }
      handleCerrarModal();
    } catch (error) {
      console.error('Error al guardar promoción:', error);
    }
  };

  const handleEliminar = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta promoción?')) {
      try {
        setProcesando(id);
        await eliminarPromocion(id);
      } catch (error) {
        console.error('Error al eliminar:', error);
      } finally {
        setProcesando(null);
      }
    }
  };

  const handleToggleEstado = async (promocion: PromocionResponseDTO) => {
    try {
      setProcesando(promocion.idPromocion);
      if (promocion.activo) {
        await desactivarPromocion(promocion.idPromocion);
      } else {
        await activarPromocion(promocion.idPromocion);
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    } finally {
      setProcesando(null);
    }
  };

  // Filtrar promociones
  const promocionesFiltradas = promociones.filter(promocion => {
    // Filtro por búsqueda
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      if (!promocion.denominacion.toLowerCase().includes(busquedaLower) &&
          !promocion.descripcionDescuento?.toLowerCase().includes(busquedaLower)) {
        return false;
      }
    }

    // Filtro por estado
    switch (filtroEstado) {
      case 'VIGENTES':
        return promocion.estaVigente && promocion.activo;
      case 'PROGRAMADAS':
        return promocion.activo && !promocion.estaVigente && 
               promocion.estadoDescripcion.includes('inicia');
      case 'EXPIRADAS':
        return promocion.estadoDescripcion.includes('Expirada');
      case 'INACTIVAS':
        return !promocion.activo;
      default:
        return true;
    }
  });

  // Estadísticas
  const stats = {
    total: promociones.length,
    vigentes: promociones.filter(p => p.estaVigente && p.activo).length,
    programadas: promociones.filter(p => p.activo && !p.estaVigente && 
                                      p.estadoDescripcion.includes('inicia')).length,
    inactivas: promociones.filter(p => !p.activo).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Promociones</h1>
          <p className="text-gray-600 mt-1">
            Administra las promociones y descuentos de tu negocio
          </p>
        </div>
        <Button
          onClick={() => handleAbrirModal()}
          className="bg-green-600 hover:bg-green-700"
          
        >
          Nueva Promoción
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Tag className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vigentes</p>
              <p className="text-2xl font-bold text-green-600">{stats.vigentes}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Programadas</p>
              <p className="text-2xl font-bold text-blue-600">{stats.programadas}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactivas</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inactivas}</p>
            </div>
            <Tag className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Controles de filtrado y búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar promociones..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por estado */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[150px]"
            >
              <option value="TODAS">Todas</option>
              <option value="VIGENTES">Vigentes</option>
              <option value="PROGRAMADAS">Programadas</option>
              <option value="EXPIRADAS">Expiradas</option>
              <option value="INACTIVAS">Inactivas</option>
            </select>
          </div>

          <Button
            onClick={refreshPromociones}
            variant="outline"
            className="whitespace-nowrap"
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert
          type="error"
          title="Error"
          message={error}
          onClose={limpiarError}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {/* Lista de promociones */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {promocionesFiltradas.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-lg shadow-sm border text-center">
              <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay promociones
              </h3>
              <p className="text-gray-500 mb-4">
                {busqueda || filtroEstado !== 'TODAS' 
                  ? 'No se encontraron promociones con los filtros aplicados.'
                  : 'Comienza creando tu primera promoción.'
                }
              </p>
              {(!busqueda && filtroEstado === 'TODAS') && (
                <Button onClick={() => handleAbrirModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Promoción
                </Button>
              )}
            </div>
          ) : (
            promocionesFiltradas.map((promocion) => (
              <PromocionCard
                key={promocion.idPromocion}
                promocion={promocion}
                onEditar={() => handleAbrirModal(promocion)}
                onEliminar={() => handleEliminar(promocion.idPromocion)}
                onToggleEstado={() => handleToggleEstado(promocion)}
                procesando={procesando === promocion.idPromocion}
              />
            ))
          )}
        </div>
      )}

      {/* Modal */}
      <PromocionModal
        abierto={modalAbierto}
        onCerrar={handleCerrarModal}
        titulo={modoEdicion ? 'Editar Promoción' : 'Nueva Promoción'}
      >
        <PromocionForm
          promocion={promocionSeleccionada}
          onGuardar={handleGuardarPromocion}
          onCancelar={handleCerrarModal}
        />
      </PromocionModal>
    </div>
  );
};

export default Promociones;