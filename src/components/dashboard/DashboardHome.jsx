import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DashboardHome = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true); // Asegurarse de mostrar carga
      const response = await fetch('http://localhost:5000/api/stats/reservas');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // --- RENDERIZADO ---

  if (loading) {
    return <div className="p-8 text-center text-lg text-gray-600">Cargando información del Dashboard...</div>;
  }

  if (error || !stats) {
    return <div className="p-8 text-center text-lg text-red-500 bg-red-50 border border-red-200 rounded-lg">
        <p className="font-bold">Error al cargar estadísticas</p>
        <p className="text-sm mt-1">{error || "No se recibieron datos del servidor."}</p>
        <p className="text-xs mt-2">Asegúrate de que el servidor backend (`server.js`) esté funcionando correctamente.</p>
    </div>;
  }

  // --- CÁLCULOS SEGUROS ---
  // Se usa '|| 0' y 'optional chaining' (?.) para prevenir errores si un dato es null o undefined
  
  const totalIngresosReservas = (stats.totalIngresosReservas || 0);
  const totalIngresosEventos = (stats.totalIngresosEventos || 0);
  const totalIngresos = totalIngresosReservas + totalIngresosEventos;
  
  const totalConfirmadas = stats.reservasPorEstado?.confirmada || 0;
  const totalPendientes = stats.reservasPorEstado?.pendiente || 0;
  const totalCanceladas = stats.reservasPorEstado?.cancelada || 0;
  
  const totalEventosConfirmados = stats.eventosPorEstado?.confirmado || 0;
  const totalEventosPendientes = stats.eventosPorEstado?.pendiente || 0;
  const totalEventosCancelados = stats.eventosPorEstado?.cancelado || 0;

  // Datos para el gráfico de barras
  const chartData = [
    { name: 'Reservas Pend.', valor: totalPendientes, fill: '#f59e0b' },
    { name: 'Reservas Conf.', valor: totalConfirmadas, fill: '#10b981' },
    { name: 'Eventos Pend.', valor: totalEventosPendientes, fill: '#a855f7' },
    { name: 'Eventos Conf.', valor: totalEventosConfirmados, fill: '#3b82f6' },
  ];
  
  // Datos para el desglose de cancelados
  const canceladosData = [
      { name: 'Reservas Canceladas', valor: totalCanceladas },
      { name: 'Eventos Cancelados', valor: totalEventosCancelados },
  ]

  return (
    <div className="animate-fadeIn p-4 md:p-6">
      <h2 className="text-3xl font-bold text-[#1C2A3D] mb-6">Resumen Operativo</h2>

      {/* --- Kpis principales --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Ingresos Totales (Confirmados)</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">${totalIngresos.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Reservas Totales (Cuartos)</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalReservas || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-indigo-500">
          <p className="text-sm text-gray-500">Eventos Totales (Área Social)</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalEventos || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Habitaciones Registradas</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalHabitaciones || 0}</p>
        </div>
      </div>

      {/* --- Gráficos y Desglose --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Barras (2/3 del ancho) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg h-96">
          <h3 className="text-xl font-semibold mb-4 text-[#1C2A3D]">Actividad Reciente</h3>
          {chartData.some(d => d.valor > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={50} interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => `${value} reservas/eventos`} />
                <Legend />
                <Bar dataKey="valor" name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No hay datos de actividad para mostrar.
            </div>
          )}
        </div>

        {/* Resumen de Estados de Reservas (1/3 del ancho) */}
        <div className="bg-white p-6 rounded-xl shadow-lg h-96 flex flex-col">
          <h3 className="text-xl font-semibold mb-4 text-[#1C2A3D]">Desglose de Ingresos</h3>
          <div className="space-y-4 flex-grow">
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium text-gray-600">Ingresos por Cuartos:</span>
              <span className="font-bold text-green-600">${totalIngresosReservas.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium text-gray-600">Ingresos por Eventos:</span>
              <span className="font-bold text-blue-600">${totalIngresosEventos.toFixed(2)}</span>
            </div>
            <div className="border-t pt-4 mt-4">
              <p className="flex justify-between items-center font-bold text-xl text-[#1C2A3D]">
                <span>Total Confirmado:</span>
                <span className="text-2xl">${totalIngresos.toFixed(2)}</span>
              </p>
            </div>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h4 className="text-md font-semibold text-gray-700 mb-2">Cancelaciones</h4>
            <div className="flex justify-between items-center text-gray-600">
              <span>Reservas Canceladas:</span>
              <span className="font-bold text-red-500">{totalCanceladas}</span>
            </div>
             <div className="flex justify-between items-center text-gray-600">
              <span>Eventos Cancelados:</span>
              <span className="font-bold text-red-500">{totalEventosCancelados}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;