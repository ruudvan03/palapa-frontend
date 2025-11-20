import React, { useState } from 'react';
import logoLaCasona from '../assets/logo-lacasona.png'; 

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('No se pudo conectar al servidor. Intenta de nuevo más tarde.');
    }
  };

  return (
    // Contenedor principal con fondo oscuro
    <div className="flex items-center justify-center p-4">
      <div className="bg-[#181818] p-8 rounded-xl shadow-2xl border border-gray-700 w-full max-w-sm">
        
        {/* NUEVO: Logo y Título de la Marca */}
        <div className="flex flex-col items-center mb-6">
            <img src={logoLaCasona} alt="Logo La Casona" className="h-16 w-auto mb-2" /> 
            <h1 className="text-4xl font-lacasona-custom text-[#D4AF37] tracking-wide">
                La Casona
            </h1>
        </div>
        
        {/* Título del Formulario */}
        <h2 className="text-2xl font-extrabold text-gray-200 text-center mb-6 tracking-wide border-t border-gray-700 pt-4">
          Iniciar Sesión
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Mensaje de Error */}
          {error && (
            <div className="bg-red-800/30 text-red-300 p-3 rounded-lg text-sm border border-red-900">
              {error}
            </div>
          )}

          {/* Campo Usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[#2A2A2A] text-white placeholder-gray-500 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6C7D5C] transition-colors"
              placeholder="Ingresa tu usuario"
              required
            />
          </div>
          
          {/* Campo Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#2A2A2A] text-white placeholder-gray-500 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6C7D5C] transition-colors"
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>
          
          {/* Botón de Entrada en Verde Olivo */}
          <button
            type="submit"
            className="w-full py-3 text-white font-bold rounded-lg bg-[#6C7D5C] hover:bg-[#5a6b4d] transition-colors duration-300 shadow-lg transform hover:scale-[1.01]"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;