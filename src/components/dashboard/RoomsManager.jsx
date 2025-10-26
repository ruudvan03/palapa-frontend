import React, { useState, useEffect } from 'react';

const RoomsManager = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEditingRoom, setCurrentEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    numero: '',
    tipo: 'individual',
    precio: '',
  });

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/habitaciones');
      if (!response.ok) {
        throw new Error('No se pudieron obtener las habitaciones.');
      }
      const data = await response.json();
      setRooms(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleOpenModal = (room = null) => {
    setCurrentEditingRoom(room);
    if (room) {
      setFormData({
        numero: room.numero,
        tipo: room.tipo,
        precio: room.precio,
      });
    } else {
      setFormData({
        numero: '',
        tipo: 'individual',
        precio: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditingRoom(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = currentEditingRoom
      ? `http://localhost:5000/api/habitaciones/${currentEditingRoom._id}`
      : 'http://localhost:5000/api/habitaciones';
    const method = currentEditingRoom ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar la habitación.');
      }

      await fetchRooms();
      handleCloseModal();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (roomId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta habitación?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/habitaciones/${roomId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Error al eliminar la habitación.');
        }
        await fetchRooms();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  if (loading) {
    return <p>Cargando habitaciones...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }
  
  // No hay un campo de "disponibilidad" en el formulario de edición de la habitación.
  // La disponibilidad se determina por si hay reservas para la habitación.
  // Así que, la siguiente información en la tabla es solo una vista, no un campo editable.
  // Para ver si la habitación está disponible, se debe revisar la tabla de reservas.

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[#1C2A3D]">Gestión de Habitaciones</h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#6C7D5C] text-white py-2 px-4 rounded-md font-bold hover:bg-[#5a6b4d] transition-colors"
        >
          Añadir Nueva Habitación
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Número</th>
              <th className="py-3 px-6 text-left">Tipo</th>
              <th className="py-3 px-6 text-left">Precio</th>
              <th className="py-3 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {rooms.map((room) => (
              <tr key={room._id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">{room.numero}</td>
                <td className="py-3 px-6 text-left capitalize">{room.tipo}</td>
                <td className="py-3 px-6 text-left">${room.precio}</td>
                <td className="py-3 px-6 text-center">
                  <div className="flex item-center justify-center space-x-2">
                    <button
                      onClick={() => handleOpenModal(room)}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(room._id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-[#1C2A3D]">
                {currentEditingRoom ? 'Editar Habitación' : 'Añadir Nueva Habitación'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Número</label>
                <input
                  type="number"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Tipo</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="individual">Individual</option>
                  <option value="doble">Doble</option>
                  <option value="King">King</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Precio</label>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                  step="0.01"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-300 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#6C7D5C] text-white py-2 px-4 rounded-md font-bold hover:bg-[#5a6b4d]"
                >
                  {currentEditingRoom ? 'Guardar Cambios' : 'Crear Habitación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsManager;