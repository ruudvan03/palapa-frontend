import React, { useState, useEffect } from 'react';

const UsersManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // La parte más importante: Asegurarse de que la URL es la correcta
        const response = await fetch('http://localhost:5000/api/users-list');

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'No se pudieron obtener los usuarios');
        }
        
        const data = await response.json();
        setUsers(data);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []); // El array vacío asegura que se ejecute solo una vez

  // --- Renderizado del componente ---

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-gray-500">Cargando usuarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-lg">
        <p className="text-lg text-red-600 font-semibold">Error al cargar los datos</p>
        <p className="text-sm text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg animate-fadeIn">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-3xl font-bold text-[#1C2A3D]">Gestión de Usuarios</h2>
        {/* Futuro botón para añadir usuarios */}
        {/* <button className="bg-[#6C7D5C] text-white py-2 px-4 rounded-md font-bold hover:bg-[#5a6b4d]">Añadir Usuario</button> */}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left table-auto">
            <thead>
                <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Nombre de Usuario</th>
                    <th className="py-3 px-6 text-left">ID de Usuario</th>
                    <th className="py-3 px-6 text-center">Rol</th>
                </tr>
            </thead>
            <tbody className="text-gray-700 text-sm font-light">
                {users.length > 0 ? (
                    users.map((user) => (
                        <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-100">
                            <td className="py-4 px-6 text-left whitespace-nowrap">
                                <span className="font-medium">{user.username}</span>
                            </td>
                            <td className="py-4 px-6 text-left">
                                <span className="text-gray-500">{user._id}</span>
                            </td>
                            <td className="py-4 px-6 text-center">
                                <span className={`py-1 px-3 rounded-full text-xs font-semibold ${
                                    user.role === 'admin' 
                                    ? 'bg-blue-200 text-blue-800' 
                                    : 'bg-gray-200 text-gray-800'
                                }`}>
                                    {user.role}
                                </span>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="3" className="text-center py-6 text-gray-500">
                            No se encontraron usuarios en la base de datos.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersManager;