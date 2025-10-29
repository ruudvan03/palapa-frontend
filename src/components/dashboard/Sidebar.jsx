import React from 'react';

const Sidebar = ({ user, onLogout, onNavigate }) => {
  return (
    <div className="flex flex-col h-screen w-64 bg-[#1C2A3D] text-white p-6 shadow-2xl"> 
      <div className="flex-shrink-0 mb-10">
        <h1 className="text-3xl font-extrabold text-[#D4AF37]">
          La Casona
        </h1>
        <span className="text-xs text-gray-400">Panel de Administración</span>
      </div>

      <nav className="flex-grow">
        <ul className="space-y-3"> 
          {[
            { page: 'dashboard', label: 'Dashboard', icon: '🏠' },
            { page: 'reservations', label: 'Reservas', icon: '📅' },
            { page: 'rooms', label: 'Habitaciones', icon: '🛌' },
            // --- CAMBIO AQUÍ ---
            { page: 'eventos', label: 'Eventos', icon: '🎉' }, 
            // --- FIN DEL CAMBIO ---
            { page: 'stats', label: 'Estadísticas', icon: '📊' },
          ].map(({ page, label, icon }) => (
            <li key={page}>
              <button
                onClick={() => onNavigate(page)}
                className="flex items-center space-x-3 text-lg py-2 px-3 rounded-lg hover:bg-[#6C7D5C]/30 hover:text-[#6C7D5C] transition-colors duration-200 w-full text-left"
              >
                <span>{icon}</span>
                <span className="font-medium">{label}</span>
              </button>
            </li>
          ))}
          
          {/* Gestión de Usuarios (Solo para Admin) */}
          {user.role === 'admin' && (
            <li>
              <button
                onClick={() => onNavigate('users')}
                className="flex items-center space-x-3 text-lg py-2 px-3 rounded-lg hover:bg-[#6C7D5C]/30 hover:text-[#6C7D5C] transition-colors duration-200 w-full text-left mt-4 border-t border-gray-700 pt-4"
              >
                <span>👤</span>
                <span className="font-medium">Gestión de Usuarios</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* Pie de página con información del usuario y logout */}
      <div className="flex-shrink-0 mt-8 pt-4 border-t border-gray-700">
        <div className="text-sm text-gray-400 mb-4">
          <p className="font-semibold text-white">{user.username}</p>
          <p className="capitalize text-xs">{user.role}</p>
        </div>
        <button
          onClick={onLogout}
          className="w-full py-2 px-4 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors font-semibold"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;