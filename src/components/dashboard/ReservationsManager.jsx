import React, { useState, useEffect } from 'react';

const ReservationsManager = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEditingReservation, setCurrentEditingReservation] = useState(null);
  const [formData, setFormData] = useState({
    usuarioId: '',
    habitacionId: '',
    fechaInicio: '',
    fechaFin: '',
    tipoPago: 'efectivo',
    estado: 'pendiente',
    // No necesitamos precioTotal aquí, se calcula en backend
  });
  const [formError, setFormError] = useState(null);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Función Fetch unificada para mayor claridad
  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:5000/api/reservas?periodo=${filtro}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron obtener las reservas.`);
      }
      const data = await response.json();
      // Ordenar de más viejas a más recientes
      setReservations(data.sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio)));
      setCurrentPage(1); // Reset page on filter change
    } catch (err) {
      console.error("Error fetching reservations:", err); // Log detallado
      setError(err.message);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [filtro]); // Dependencia del filtro

  const fetchModalData = async () => {
    try {
      const [usersRes, roomsRes] = await Promise.all([
        fetch('http://localhost:5000/api/users-list'),
        fetch('http://localhost:5000/api/habitaciones')
      ]);
      if (!usersRes.ok || !roomsRes.ok) {
          throw new Error('Error de red al cargar datos del formulario.');
      }
      const usersData = await usersRes.json();
      const roomsData = await roomsRes.json();
      setUsers(usersData);
      setRooms(roomsData);
      setFormError(null); // Limpiar error si carga bien
    } catch (err) {
      console.error("Error fetching modal data:", err);
      setFormError("Error al cargar opciones: " + err.message);
      // Mantener modal abierto pero mostrar error
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toISOString().split('T')[0];
    } catch (e) {
        console.error("Error formateando fecha:", dateString, e);
        return ''; // Devuelve vacío si la fecha es inválida
    }
  };

  const handleOpenModal = (reserva = null) => {
    fetchModalData(); // Cargar datos ANTES de mostrar el modal
    setFormError(null);
    if (reserva) {
      setCurrentEditingReservation(reserva);
      setFormData({
        usuarioId: reserva.usuario?._id || '',
        habitacionId: reserva.habitacion?._id || '',
        fechaInicio: formatDateForInput(reserva.fechaInicio),
        fechaFin: formatDateForInput(reserva.fechaFin),
        tipoPago: reserva.tipoPago,
        estado: reserva.estado,
        nombreHuesped: reserva.nombreHuesped || '', // Incluir nombre huésped si existe
        emailHuesped: reserva.emailHuesped || '', // Incluir email si existe
      });
    } else {
      setCurrentEditingReservation(null);
      setFormData({ // Reset completo
        usuarioId: '',
        habitacionId: '',
        fechaInicio: '',
        fechaFin: '',
        tipoPago: 'efectivo',
        estado: 'pendiente',
        nombreHuesped: '',
        emailHuesped: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validaciones más estrictas
    if (!formData.habitacionId) return setFormError('Debes seleccionar una habitación.');
    if (!formData.fechaInicio || !formData.fechaFin) return setFormError('Las fechas son obligatorias.');
    if (new Date(formData.fechaInicio) >= new Date(formData.fechaFin)) {
      return setFormError('La fecha de salida debe ser posterior a la de llegada.');
    }
    // Si es huésped público, requerir nombre (email es opcional pero bueno tenerlo)
    if (!formData.usuarioId && !formData.nombreHuesped) {
         return setFormError('El nombre del huésped es requerido para reservas públicas.');
    }


    // Preparar datos para enviar (excluir campos vacíos innecesarios si aplica)
    const bodyData = {
        habitacionId: formData.habitacionId,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        tipoPago: formData.tipoPago,
        estado: formData.estado,
        // Enviar usuarioId solo si tiene valor, si no, enviar nombreHuesped y emailHuesped
        ...(formData.usuarioId ? { usuarioId: formData.usuarioId } : { nombreHuesped: formData.nombreHuesped, emailHuesped: formData.emailHuesped })
    };


    const url = currentEditingReservation
      ? `http://localhost:5000/api/reservas/${currentEditingReservation._id}`
      : 'http://localhost:5000/api/reservas';
    const method = currentEditingReservation ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status} al guardar.`);
      }

      await fetchReservations(); // Recargar la lista con el filtro actual
      handleCloseModal();
    } catch (err) {
      console.error("Error en submit:", err);
      setFormError(err.message);
    }
  };

  const handleDelete = async (reservaId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta reserva permanentemente?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/reservas/${reservaId}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status} al eliminar.`);
        }
        await fetchReservations(); // Recargar con filtro actual
      } catch (err) {
        console.error("Error al eliminar:", err);
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleUpdateStatus = async (reservaId, newStatus) => {
    // No necesitamos confirmación aquí si ya está en los botones individuales
    try {
        const response = await fetch(`http://localhost:5000/api/reservas/${reservaId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: newStatus }), // Solo enviar el estado
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status} al actualizar estado.`);
        }
        await fetchReservations(); // Recargar con filtro actual
    } catch (err) {
        console.error("Error al actualizar estado:", err);
        alert(`Error: ${err.message}`);
    }
  };

  // Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = reservations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(reservations.length / itemsPerPage);
  const paginate = (pageNumber) => {
      // Validar que el número de página sea válido
      if (pageNumber < 1 || pageNumber > totalPages) return;
      setCurrentPage(pageNumber);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[#1C2A3D]">Gestión de Reservas de Cuartos</h2>
        <button onClick={() => handleOpenModal()} className="bg-[#6C7D5C] text-white py-2 px-4 rounded-md font-bold hover:bg-[#5a6b4d]">Añadir Reserva</button>
      </div>

      <div className="mb-4 flex space-x-2 border bg-gray-50 p-2 rounded-lg">
        <button onClick={() => setFiltro('todas')} className={`py-2 px-4 rounded-md text-sm font-semibold transition-colors ${filtro === 'todas' ? 'bg-[#1C2A3D] text-white shadow' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}>Todas</button>
        <button onClick={() => setFiltro('semana')} className={`py-2 px-4 rounded-md text-sm font-semibold transition-colors ${filtro === 'semana' ? 'bg-[#1C2A3D] text-white shadow' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}>Esta Semana</button>
        <button onClick={() => setFiltro('mes')} className={`py-2 px-4 rounded-md text-sm font-semibold transition-colors ${filtro === 'mes' ? 'bg-[#1C2A3D] text-white shadow' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}>Este Mes</button>
        <button onClick={() => setFiltro('año')} className={`py-2 px-4 rounded-md text-sm font-semibold transition-colors ${filtro === 'año' ? 'bg-[#1C2A3D] text-white shadow' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}>Este Año</button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {loading ? (
            <p className="text-center p-8">Cargando reservas...</p>
        ) : error ? (
            <p className="text-center p-8 text-red-500">Error: {error}</p>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                            <th className="py-3 px-6">Habitación</th>
                            <th className="py-3 px-6">Huésped</th>
                            <th className="py-3 px-6">Fechas</th>
                            <th className="py-3 px-6">Estado</th>
                            <th className="py-3 px-6">Precio</th>
                            <th className="py-3 px-6 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-light">
                        {currentItems.length > 0 ? currentItems.map((reserva) => (
                        <tr key={reserva._id} className="border-b border-gray-200 hover:bg-gray-100">
                            <td className="py-4 px-6 font-medium">
                                {reserva.habitacion ? `No. ${reserva.habitacion.numero} (${reserva.habitacion.tipo})` : <span className="text-red-500">Hab. Borrada</span>}
                            </td>
                            <td className="py-4 px-6 capitalize">
                                {reserva.usuario ? (<span>{reserva.usuario.username}</span>) : (<span className="font-semibold text-gray-800">{reserva.nombreHuesped || 'Huésped Público'}</span>)}
                            </td>
                            <td className="py-4 px-6">{formatDateForInput(reserva.fechaInicio)} al {formatDateForInput(reserva.fechaFin)}</td>
                            <td className="py-4 px-6">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                    reserva.estado === 'confirmada' ? 'bg-green-200 text-green-800' :
                                    reserva.estado === 'pendiente' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'
                                }`}>{reserva.estado}</span>
                            </td>
                            <td className="py-4 px-6 font-semibold">${reserva.precioTotal ? reserva.precioTotal.toFixed(2) : '0.00'}</td>
                            <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center space-x-3 text-lg">
                                    <button onClick={() => handleOpenModal(reserva)} className="text-blue-500 hover:text-blue-700" title="Editar">✏️</button>
                                    {reserva.estado === 'pendiente' && <button onClick={() => handleUpdateStatus(reserva._id, 'confirmada')} className="text-green-500 hover:text-green-700" title="Confirmar">✅</button>}
                                    {reserva.estado !== 'cancelada' && <button onClick={() => handleUpdateStatus(reserva._id, 'cancelada')} className="text-orange-500 hover:text-orange-700" title="Cancelar">❌</button>}
                                    <button onClick={() => handleDelete(reserva._id)} className="text-red-500 hover:text-red-700" title="Eliminar">🗑️</button>
                                    {/* --- BOTÓN DE CONTRATO --- */}
                                    <a
                                        href={`http://localhost:5000/api/reservas/${reserva._id}/contrato?tipo=contrato_tipo1`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Descargar Contrato Hospedaje"
                                        className="text-gray-600 hover:text-gray-900"
                                    >
                                        📄
                                    </a>
                                </div>
                            </td>
                        </tr>
                        )) : (
                            <tr><td colSpan="6" className="text-center py-8 text-gray-500">No hay reservas para el período seleccionado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 border rounded-md disabled:opacity-50">Anterior</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => paginate(page)} className={`px-4 py-2 border rounded-md ${currentPage === page ? 'bg-[#6C7D5C] text-white' : 'hover:bg-gray-200'}`}>
                    {page}
                </button>
            ))}
            <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 border rounded-md disabled:opacity-50">Siguiente</button>
        </div>
      )}

      {/* Modal para Crear/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-center">{currentEditingReservation ? 'Editar Reserva' : 'Crear Nueva Reserva'}</h3>
            {formError && <p className="text-red-600 bg-red-100 p-3 rounded mb-4 text-sm">{formError}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Habitación *</label>
                    <select name="habitacionId" value={formData.habitacionId} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md bg-white focus:ring-[#6C7D5C] focus:border-[#6C7D5C]">
                        <option value="">-- Selecciona --</option>
                        {rooms.sort((a,b) => a.numero - b.numero).map(room => <option key={room._id} value={room._id}>No. {room.numero} ({room.tipo}) - ${room.precio}/noche</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Usuario Registrado (Opcional)</label>
                    <select name="usuarioId" value={formData.usuarioId} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-white focus:ring-[#6C7D5C] focus:border-[#6C7D5C]">
                        <option value="">-- Huésped Público --</option>
                        {users.map(user => <option key={user._id} value={user._id}>{user.username}</option>)}
                    </select>
                </div>
                {/* Campos para huésped público si no se selecciona usuario */}
                {!formData.usuarioId && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Huésped Público *</label>
                            <input type="text" name="nombreHuesped" value={formData.nombreHuesped} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md focus:ring-[#6C7D5C] focus:border-[#6C7D5C]"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Huésped Público (para notificación)</label>
                            <input type="email" name="emailHuesped" value={formData.emailHuesped} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md focus:ring-[#6C7D5C] focus:border-[#6C7D5C]"/>
                        </div>
                    </>
                )}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio *</label>
                        <input type="date" name="fechaInicio" value={formData.fechaInicio} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md focus:ring-[#6C7D5C] focus:border-[#6C7D5C]"/>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Fin *</label>
                        <input type="date" name="fechaFin" value={formData.fechaFin} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md focus:ring-[#6C7D5C] focus:border-[#6C7D5C]"/>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pago *</label>
                        <select name="tipoPago" value={formData.tipoPago} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md bg-white focus:ring-[#6C7D5C] focus:border-[#6C7D5C]">
                            <option value="efectivo">Efectivo</option>
                            <option value="transferencia">Transferencia</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                        <select name="estado" value={formData.estado} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md bg-white focus:ring-[#6C7D5C] focus:border-[#6C7D5C]">
                            <option value="pendiente">Pendiente</option>
                            <option value="confirmada">Confirmada</option>
                            <option value="cancelada">Cancelada</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                    <button type="button" onClick={handleCloseModal} className="py-2 px-4 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Cancelar</button>
                    <button type="submit" className="py-2 px-4 bg-[#6C7D5C] text-white font-bold rounded-md hover:bg-[#5a6b4d]">{currentEditingReservation ? 'Guardar Cambios' : 'Crear Reserva'}</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsManager;