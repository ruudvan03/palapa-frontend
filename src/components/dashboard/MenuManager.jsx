import React, { useState, useEffect } from 'react';

const MenuManager = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEditingItem, setCurrentEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '',
  });

  const fetchMenuData = async () => {
    setLoading(true);
    try {
      const itemsResponse = await fetch('http://localhost:5000/api/menu/items');
      const categoriesResponse = await fetch('http://localhost:5000/api/menu/categorias');

      if (!itemsResponse.ok || !categoriesResponse.ok) {
        throw new Error('Error al cargar los datos del menú.');
      }

      const itemsData = await itemsResponse.json();
      const categoriesData = await categoriesResponse.json();

      setMenuItems(itemsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const handleOpenModal = (item = null) => {
    setCurrentEditingItem(item);
    if (item) {
      setFormData({
        nombre: item.nombre,
        descripcion: item.descripcion,
        precio: item.precio,
        categoria: item.categoria?._id,
      });
    } else {
      setFormData({ nombre: '', descripcion: '', precio: '', categoria: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditingItem(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = currentEditingItem
      ? `http://localhost:5000/api/menu/items/${currentEditingItem._id}`
      : 'http://localhost:5000/api/menu/items';
    const method = currentEditingItem ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar el ítem del menú.');
      }
      alert('Ítem guardado con éxito.');
      fetchMenuData();
      handleCloseModal();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este ítem?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/menu/items/${itemId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al eliminar el ítem.');
        }
        alert('Ítem eliminado con éxito.');
        fetchMenuData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  if (loading) return <p>Cargando menú...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[#1C2A3D]">Gestión del Menú</h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#6C7D5C] text-white py-2 px-4 rounded-md font-bold hover:bg-[#5a6b4d] transition-colors"
        >
          Añadir Ítem del Menú
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Ítem</th>
              <th className="py-3 px-6 text-left">Descripción</th>
              <th className="py-3 px-6 text-left">Precio</th>
              <th className="py-3 px-6 text-left">Categoría</th>
              <th className="py-3 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {menuItems.map((item) => (
              <tr key={item._id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left">{item.nombre}</td>
                <td className="py-3 px-6 text-left">{item.descripcion}</td>
                <td className="py-3 px-6 text-left">${item.precio.toFixed(2)}</td>
                <td className="py-3 px-6 text-left">{item.categoria?.nombre || 'N/A'}</td>
                <td className="py-3 px-6 text-center">
                  <div className="flex item-center justify-center space-x-2">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
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
                {currentEditingItem ? 'Editar Ítem' : 'Añadir Ítem del Menú'}
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
                <label className="block text-gray-700 mb-2">Nombre del Ítem</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                ></textarea>
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
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Categoría</label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
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
                  {currentEditingItem ? 'Guardar Cambios' : 'Crear Ítem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;