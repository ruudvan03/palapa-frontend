import React, { useState } from 'react';
import Login from './components/Login.jsx';
import DashboardLayout from './components/dashboard/DashboardLayout.jsx';
import DashboardHome from './components/dashboard/DashboardHome.jsx';
import UserManager from './components/dashboard/UserManager.jsx';
import RoomsManager from './components/dashboard/RoomsManager.jsx';
import ReservationsManager from './components/dashboard/ReservationsManager.jsx';
// import MenuManager from './components/dashboard/MenuManager.jsx'; // <-- Ya no lo usamos
import StatsManager from './components/dashboard/StatsManager.jsx';
import PublicHome from './components/PublicHome.jsx';
// --- AÑADIR NUEVO IMPORTE ---
import EventManager from './components/dashboard/EventManager.jsx'; 

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
    // --- CAMBIO AQUÍ ---
    case 'eventos': // 'menu' se convierte en 'eventos'
      return <EventManager />; // Renderiza el nuevo componente
    // --- FIN DEL CAMBIO ---
    case 'stats':
      return <StatsManager />;
    default:
      return <DashboardHome user={user} />;
  }
};

function App() {
  // ... (El resto de la función App se queda igual) ...
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
    setShowLogin(false);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('dashboard');
  };

  const handleShowLogin = (shouldShow) => {
    setShowLogin(shouldShow);
  }

  return (
    <div className="app-container min-h-screen">
      {user ? (
        <DashboardLayout user={user} onLogout={handleLogout} onNavigate={setCurrentPage}>
          <MainContent user={user} currentPage={currentPage} />
        </DashboardLayout>
      ) : (
        <PublicHome onShowLogin={handleShowLogin} /> 
      )}

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