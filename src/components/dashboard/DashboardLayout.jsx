import React from 'react';
import Sidebar from './Sidebar.jsx';

const DashboardLayout = ({ user, onLogout, onNavigate, children }) => {
  return (
    <div className="flex h-screen bg-gray-50"> 
      
      {/* 1. Sidebar (Barra Lateral - Fondo Oscuro) */}
      <Sidebar user={user} onLogout={onLogout} onNavigate={onNavigate} />

      {/* 2. Área Principal de Contenido (Fondo Claro) */}
      <div className="flex flex-col flex-1 overflow-hidden">
        
        {/* Header Superior (Simulando la barra de búsqueda y el perfil) */}
        <header className="flex justify-between items-center h-20 bg-white border-b border-gray-200 px-8 shadow-sm">
          
          {/* Barra de Búsqueda Estilizada */}
          <div className="relative w-1/3">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full py-2 pl-10 pr-4 text-gray-700 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#6C7D5C]"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>

          {/* Saludo y Perfil (Imitando el "Welcome! Kathryn Murphy") */}
          <div className="flex items-center space-x-4">
            <span className="text-gray-500 text-sm">
              ¡Bienvenido, <span className="font-semibold text-[#1C2A3D] capitalize">{user.username}</span>!
            </span>
            {/* Ícono de Notificaciones */}
            <button className="text-gray-400 hover:text-[#6C7D5C] transition-colors">
              🔔
            </button>
            {/* Ícono de Perfil */}
            <div className="w-10 h-10 bg-[#D4AF37] rounded-full flex items-center justify-center text-white font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Contenido Dinámico de la Página */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;