import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatsManager = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:5000/api/stats/reservas');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText || 'No se pudieron obtener las estadísticas.'}`);
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

  // --- RENDERIZADO CONDICIONAL ---
  // Primero, manejamos los estados de Carga y Error
  // ¡Aquí estaba el problema! El código original intentaba hacer cálculos ANTES de estas comprobaciones.
  if (loading) {
    return <div className="p-8 text-center text-lg text-gray-600">Cargando estadísticas...</div>;
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center text-lg text-red-500 bg-red-50 border border-red-200 rounded-lg">
        <p className="font-bold">Error al cargar estadísticas</p>
        <p className="text-sm mt-1">{error || "No se recibieron datos del servidor."}</p>
        <p className="text-xs mt-2">Asegúrate de que el servidor backend (`server.js`) esté funcionando correctamente.</p>
      </div>
    );
  }

  // --- CÁLCULOS SEGUROS ---
  // Solo si loading es false Y stats SÍ existe, continuamos con los cálculos.
  
  // Datos para gráfico de Ingresos
  const ingresosData = [
    { name: 'Cuartos', value: stats.totalIngresosReservas || 0 },
    { name: 'Eventos', value: stats.totalIngresosEventos || 0 },
  ];

  // Datos para gráfico de Estado de Reservas
  const reservasData = [
    { name: 'Confirmadas', value: stats.reservasPorEstado?.confirmada || 0 },
    { name: 'Pendientes', value: stats.reservasPorEstado?.pendiente || 0 },
    { name: 'Canceladas', value: stats.reservasPorEstado?.cancelada || 0 },
  ];
  
  // Datos para gráfico de Estado de Eventos
  const eventosData = [
    { name: 'Confirmados', value: stats.eventosPorEstado?.confirmado || 0 },
    { name: 'Pendientes', value: stats.eventosPorEstado?.pendiente || 0 },
    { name: 'Cancelados', value: stats.eventosPorEstado?.cancelado || 0 },
  ];

  const COLORS_INGRESOS = ['#10b981', '#3b82f6']; // Verde, Azul
  const COLORS_RESERVAS = ['#10b981', '#f59e0b', '#ef4444']; // Verde, Naranja, Rojo
  const COLORS_EVENTOS = ['#3b82f6', '#f59e0b', '#ef4444']; // Azul, Naranja, Rojo
  
  // Cálculo de ocupación (seguro)
  const ocupacionHoy = stats.totalHabitaciones > 0
    ? ((stats.reservasPorEstado?.confirmada || 0) / stats.totalHabitaciones * 100)
    : 0;

  return (
    <div className="p-4 md:p-6 animate-fadeIn">
      <h2 className="text-3xl font-bold text-[#1C2A3D] mb-6">Estadísticas Detalladas</h2>

      {/* --- Fila de KPIs Principales --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Ingresos Totales (Confirmados)</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">${(stats.totalIngresosReservas + stats.totalIngresosEventos).toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Ocupación (Confirmada)</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{ocupacionHoy.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">({stats.reservasPorEstado?.confirmada || 0} de {stats.totalHabitaciones} habs.)</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Total Reservas (Cuartos)</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalReservas || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-indigo-500">
          <p className="text-sm text-gray-500">Total Eventos (Área)</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalEventos || 0}</p>
        </div>
      </div>

      {/* --- Fila de Gráficos --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Ingresos */}
        <div className="bg-white p-6 rounded-xl shadow-lg h-96 flex flex-col">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">Desglose de Ingresos</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={ingresosData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {ingresosData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_INGRESOS[index % COLORS_INGRESOS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Gráfico de Reservas */}
        <div className="bg-white p-6 rounded-xl shadow-lg h-96 flex flex-col">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">Estado de Reservas (Cuartos)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={reservasData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>
                {reservasData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_RESERVAS[index % COLORS_RESERVAS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} reservas`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Eventos */}
        <div className="bg-white p-6 rounded-xl shadow-lg h-96 flex flex-col">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">Estado de Eventos (Área)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={eventosData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>
                {eventosData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_EVENTOS[index % COLORS_EVENTOS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} eventos`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatsManager;