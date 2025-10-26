import React, { useState } from 'react';
import Login from './components/Login.jsx';
import DashboardLayout from './components/dashboard/DashboardLayout.jsx';
import DashboardHome from './components/dashboard/DashboardHome.jsx';
import UserManager from './components/dashboard/UserManager.jsx';
import RoomsManager from './components/dashboard/RoomsManager.jsx';
import ReservationsManager from './components/dashboard/ReservationsManager.jsx';
import MenuManager from './components/dashboard/MenuManager.jsx';
import StatsManager from './components/dashboard/StatsManager.jsx';
import PublicHome from './components/PublicHome.jsx'; // Nuevo componente para la página pública

const MainContent = ({ user, currentPage }) => {
  switch (currentPage) {
    case 'dashboard':
      return <DashboardHome user={user} />;
    case 'users':
      return <UserManager />;
    case 'rooms':
      return <RoomsManager />;
    case 'reservations':
      return <ReservationsManager />;
    case 'menu':
      return <MenuManager />;
    case 'stats':
      return <StatsManager />;
    default:
      return <DashboardHome user={user} />;
  }
};

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false); // Nuevo estado para mostrar el modal de login

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
    setShowLogin(false); // Ocultar el login al entrar
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('dashboard'); // Volver al inicio público
  };

  const handleShowLogin = (shouldShow) => {
    setShowLogin(shouldShow);
  }

  return (
    <div className="app-container min-h-screen">
      {user ? (
        // Si el usuario está logueado, muestra el panel de administración
        <DashboardLayout user={user} onLogout={handleLogout} onNavigate={setCurrentPage}>
          <MainContent user={user} currentPage={currentPage} />
        </DashboardLayout>
      ) : (
        // Si el usuario NO está logueado, muestra la página pública
        <PublicHome onShowLogin={handleShowLogin} /> 
      )}

      {/* Modal de Login que se muestra sobre la página pública */}
      {showLogin && !user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative">
            <button 
                onClick={() => handleShowLogin(false)} 
                className="absolute top-2 right-2 text-white text-3xl font-bold p-2 hover:text-gray-300 transition-colors"
            >
                &times;
            </button>
            <Login onLoginSuccess={handleLoginSuccess} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;