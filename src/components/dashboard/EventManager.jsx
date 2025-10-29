import React, { useState, useEffect } from 'react';

// Componente reutilizado para formatear la fecha
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        // Asegura que la fecha se interprete correctamente
        const date = new Date(dateString);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error("Error formateando fecha:", dateString, e);
        return '';
    }
};


const EventManager = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEditingEvento, setCurrentEditingEvento] = useState(null);
  const [formData, setFormData] = useState({
    nombreCliente: '',
    fechaEvento: '',
    horaInicio: '',
    horaFin: '',
    usoEspecifico: '',
    limiteAsistentes: '',
    areaRentada: 'Área Social',
    monto: '',
    estado: 'pendiente',
  });
  const [formError, setFormError] = useState(null);

  // Cargar todos los eventos
  const fetchEventos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:5000/api/eventos');
      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron obtener los eventos.`);
      }
      const data = await response.json();
      setEventos(data.sort((a, b) => new Date(a.fechaEvento) - new Date(b.fechaEvento)));
    } catch (err) {
      console.error("Error fetching eventos:", err);
      setError(err.message);
      setEventos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, []);

  // Abrir el modal
  const handleOpenModal = (evento = null) => {
    setFormError(null);
    if (evento) {
      // Editando
      setCurrentEditingEvento(evento);
      setFormData({
        nombreCliente: evento.nombreCliente || '',
        fechaEvento: formatDateForInput(evento.fechaEvento),
        horaInicio: evento.horaInicio || '',
        horaFin: evento.horaFin || '',
        usoEspecifico: evento.usoEspecifico || '',
        limiteAsistentes: evento.limiteAsistentes || '',
        areaRentada: evento.areaRentada || 'Área Social',
        monto: evento.monto || '',
        estado: evento.estado || 'pendiente',
      });
    } else {
      // Creando
      setCurrentEditingEvento(null);
      setFormData({
        nombreCliente: '',
        fechaEvento: '',
        horaInicio: '',
        horaFin: '',
        usoEspecifico: '',
        limiteAsistentes: '',
        areaRentada: 'Área Social',
        monto: '',
        estado: 'pendiente',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleChange = (e) => {
      const { name, value, type } = e.target;
      const finalValue = type === 'number' ? (value === '' ? '' : parseInt(value, 10)) : value;
      setFormData({ ...formData, [name]: finalValue });
  };

  // Guardar (Crear o Actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validaciones
    if (!formData.nombreCliente || !formData.fechaEvento || !formData.monto || !formData.horaInicio || !formData.horaFin || !formData.usoEspecifico || !formData.limiteAsistentes) {
      return setFormError('Todos los campos marcados con * son obligatorios.');
    }
    if (parseFloat(formData.monto) < 0) {
        return setFormError('El monto no puede ser negativo.');
    }
     if (parseInt(formData.limiteAsistentes, 10) <= 0) {
        return setFormError('El límite de asistentes debe ser un número positivo.');
    }

    // Preparar datos para enviar
    const bodyData = {
        nombreCliente: formData.nombreCliente,
        fechaEvento: formData.fechaEvento,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        usoEspecifico: formData.usoEspecifico,
        limiteAsistentes: parseInt(formData.limiteAsistentes, 10),
        areaRentada: formData.areaRentada,
        monto: parseFloat(formData.monto),
        estado: formData.estado,
    };

    const url = currentEditingEvento
      ? `http://localhost:5000/api/eventos/${currentEditingEvento._id}`
      : 'http://localhost:5000/api/eventos';
    const method = currentEditingEvento ? 'PUT' : 'POST';

    try {
      console.log(`Enviando ${method} a ${url} con datos:`, bodyData);
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error del backend:", errorData);
        throw new Error(errorData.message || `Error ${response.status} al guardar.`);
      }
      await fetchEventos();
      handleCloseModal();
    } catch (err) {
      console.error("Error en submit:", err);
      setFormError(err.message);
    }
  };

  // Eliminar Evento
  const handleDelete = async (eventoId) => {
      if (window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
        try {
          const response = await fetch(`http://localhost:5000/api/eventos/${eventoId}`, { method: 'DELETE' });
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || `Error ${response.status} al eliminar.`);
          }
          await fetchEventos();
        } catch (err) {
          console.error("Error al eliminar:", err);
          alert(`Error: ${err.message}`);
        }
      }
  };

  return (
    <div>
      {/* Título y Botón Añadir */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[#1C2A3D]">Gestión de Eventos (Área Social)</h2>
        <button onClick={() => handleOpenModal()} className="bg-[#6C7D5C] text-white py-2 px-4 rounded-md font-bold hover:bg-[#5a6b4d]">Añadir Evento</button>
      </div>

      {/* Tabla de Eventos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {loading ? (
            <p className="text-center p-8">Cargando eventos...</p>
        ) : error ? (
            <p className="text-center p-8 text-red-500">Error: {error}</p>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                            <th className="py-3 px-6">Cliente</th>
                            <th className="py-3 px-6">Fecha Evento</th>
                            <th className="py-3 px-6">Área</th>
                            <th className="py-3 px-6">Monto</th>
                            <th className="py-3 px-6">Estado</th>
                            <th className="py-3 px-6 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-light">
                        {eventos.length > 0 ? eventos.map((evento) => (
                        <tr key={evento._id} className="border-b border-gray-200 hover:bg-gray-100">
                            <td className="py-4 px-6 font-medium capitalize">
                                {evento.nombreCliente}
                            </td>
                            <td className="py-4 px-6">
                                {formatDateForInput(evento.fechaEvento)}
                            </td>
                            <td className="py-4 px-6">
                                {evento.areaRentada}
                            </td>
                             <td className="py-4 px-6 font-semibold">
                                ${evento.monto ? evento.monto.toFixed(2) : '0.00'}
                            </td>
                            <td className="py-4 px-6">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                    evento.estado === 'confirmado' ? 'bg-green-200 text-green-800' :
                                    evento.estado === 'pendiente' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'
                                }`}>{evento.estado}</span>
                            </td>
                            <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center space-x-3 text-lg">
                                    <button onClick={() => handleOpenModal(evento)} className="text-blue-500 hover:text-blue-700" title="Editar">✏️</button>
                                    <button onClick={() => handleDelete(evento._id)} className="text-red-500 hover:text-red-700" title="Eliminar">🗑️</button>
                                    <a
                                        href={`http://localhost:5000/api/eventos/${evento._id}/contrato`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Descargar Contrato Evento"
                                        className="text-gray-600 hover:text-gray-900"
                                    >
                                        📄
                                    </a>
                                </div>
                            </td>
                        </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="text-center py-8 text-gray-500">
                                    No hay eventos registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* Modal para Crear/Editar Evento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-center">{currentEditingEvento ? 'Editar Evento' : 'Crear Nuevo Evento'}</h3>
            {formError && <p className="text-red-600 bg-red-100 p-3 rounded mb-4 text-sm">{formError}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nombre Cliente */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente *</label>
                    <input type="text" name="nombreCliente" value={formData.nombreCliente} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md focus:ring-[#6C7D5C] focus:border-[#6C7D5C]"/>
                </div>
                {/* Fecha */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del Evento *</label>
                    <input type="date" name="fechaEvento" value={formData.fechaEvento} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md focus:ring-[#6C7D5C] focus:border-[#6C7D5C]"/>
                </div>
                {/* Horas Inicio y Fin */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio *</label>
                        <input type="time" name="horaInicio" value={formData.horaInicio} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md focus:ring-[#6C7D5C] focus:border-[#6C7D5C]"/>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin *</label>
                        <input type="time" name="horaFin" value={formData.horaFin} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md focus:ring-[#6C7D5C] focus:border-[#6C7D5C]"/>
                    </div>
                </div>
                 {/* Uso Específico */}
                <div>
                    {/* --- CORRECCIÓN AQUÍ: <label> en lugar de <Glabel> --- */}
                    <label className="block text-sm font-medium text-gray-700 mb-1">Uso / Tipo de Evento *</label>
                    {/* --------------------------------------------------- */}
                    <input type="text" name="usoEspecifico" value={formData.usoEspecifico} onChange={handleChange} required placeholder="Ej: Cumpleaños, Bautizo, Reunión..." className="w-full mt-1 p-2 border rounded-md focus:ring-[#6C7D5C] focus:border-[#6C7D5C]"/>
                </div>
                {/* Límite Asistentes */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Límite de Asistentes *</label>
                    <input type="number" name="limiteAsistentes" value={formData.limiteAsistentes} onChange={handleChange} required min="1" className="w-full mt-1 p-2 border rounded-md focus:ring-[#6C7D5C] focus:border-[#6C7D5C]"/>
                </div>
                {/* Área y Monto */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Área Rentada</label>
                        <input type="text" name="areaRentada" value={formData.areaRentada} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md focus:ring-[#6C7D5C] focus:border-[#6C7D5C]"/>
                    </div>
                     <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($) *</label>
                        <input type="number" name="monto" value={formData.monto} onChange={handleChange} required step="0.01" min="0" className="w-full mt-1 p-2 border rounded-md focus:ring-[#6C7D5C] focus:border-[#6C7D5C]"/>
                    </div>
                </div>
                {/* Estado */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                    <select name="estado" value={formData.estado} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md bg-white focus:ring-[#6C7D5C] focus:border-[#6C7D5C]">
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>
                {/* Botones */}
                <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                    <button type="button" onClick={handleCloseModal} className="py-2 px-4 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Cancelar</button>
                    <button type="submit" className="py-2 px-4 bg-[#6C7D5C] text-white font-bold rounded-md hover:bg-[#5a6b4d]">{currentEditingEvento ? 'Guardar Cambios' : 'Crear Evento'}</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManager;