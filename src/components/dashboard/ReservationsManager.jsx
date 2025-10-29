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
    nombreHuesped: '',
    emailHuesped: '',
    telefonoHuesped: '', // <-- 1. AÑADIDO AL ESTADO INICIAL
  });
  const [formError, setFormError] = useState(null);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Función Fetch unificada
  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:5000/api/reservas?periodo=${filtro}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron obtener las reservas.`);
      }
      const data = await response.json();
      setReservations(data.sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio)));
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setError(err.message);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [filtro]);

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
      setFormError(null);
    } catch (err) {
      console.error("Error fetching modal data:", err);
      setFormError("Error al cargar opciones: " + err.message);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toISOString().split('T')[0];
    } catch (e) {
        console.error("Error formateando fecha:", dateString, e);
        return '';
    }
  };

  const handleOpenModal = (reserva = null) => {
    fetchModalData();
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
        nombreHuesped: reserva.nombreHuesped || '',
        emailHuesped: reserva.emailHuesped || '',
        telefonoHuesped: reserva.telefonoHuesped || '', // <-- 2. AÑADIDO AL EDITAR
      });
    } else {
      setCurrentEditingReservation(null);
      setFormData({
        usuarioId: '',
        habitacionId: '',
        fechaInicio: '',
        fechaFin: '',
        tipoPago: 'efectivo',
        estado: 'pendiente',
        nombreHuesped: '',
        emailHuesped: '',
        telefonoHuesped: '', // <-- 2. AÑADIDO AL CREAR/RESET
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validaciones
    if (!formData.habitacionId) return setFormError('Debes seleccionar una habitación.');
    if (!formData.fechaInicio || !formData.fechaFin) return setFormError('Las fechas son obligatorias.');
    if (new Date(formData.fechaInicio) >= new Date(formData.fechaFin)) {
      return setFormError('La fecha de salida debe ser posterior a la de llegada.');
    }
    // VALIDACIÓN MEJORADA
    if (!formData.usuarioId && (!formData.nombreHuesped || !formData.telefonoHuesped)) {
         return setFormError('El nombre y teléfono del huésped son requeridos para reservas públicas.');
    }

    // Preparar datos para enviar
    const bodyData = {
        habitacionId: formData.habitacionId,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        tipoPago: formData.tipoPago,
        estado: formData.estado,
        // Enviar usuarioId o los datos del huésped público (incluyendo teléfono)
        // --- 4. AÑADIDO 'telefonoHuesped' AL GUARDAR ---
        ...(formData.usuarioId 
            ? { usuarioId: formData.usuarioId } 
            : { 
                nombreHuesped: formData.nombreHuesped, 
                emailHuesped: formData.emailHuesped, 
                telefonoHuesped: formData.telefonoHuesped // <-- AÑADIDO AQUÍ
            })
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

      await fetchReservations();
      handleCloseModal();
    } catch (err) {
      console.error("Error en submit:", err);
      setFormError(err.message);
    }
  };

  const handleDelete = async (reservaId) => {
    // ... (código sin cambios) ...
    if (window.confirm('¿Estás seguro de que quieres eliminar esta reserva permanentemente?')) {
        try {
          const response = await fetch(`http://localhost:5000/api/reservas/${reservaId}`, { method: 'DELETE' });
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || `Error ${response.status} al eliminar.`);
          }
          await fetchReservations();
        } catch (err) {
          console.error("Error al eliminar:", err);
          alert(`Error: ${err.message}`);
        }
      }
  };

  const handleUpdateStatus = async (reservaId, newStatus) => {
    // ... (código sin cambios) ...
    try {
        const response = await fetch(`http://localhost:5000/api/reservas/${reservaId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: newStatus }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status} al actualizar estado.`);
        }
        await fetchReservations();
    } catch (err) {
        console.error("Error al actualizar estado:", err);
        alert(`Error: ${err.message}`);
    }
  };

  // Lógica de paginación
  // ... (código sin cambios) ...
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = reservations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(reservations.length / itemsPerPage);
  const paginate = (pageNumber) => {
      if (pageNumber < 1 || pageNumber > totalPages) return;
      setCurrentPage(pageNumber);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[#1C2A3D]">Gestión de Reservas de Cuartos</h2>
        <button onClick={() => handleOpenModal()} className="bg-[#6C7D5C] text-white py-2 px-4 rounded-md font-bold hover:bg-[#5a6b4d]">Añadir Reserva</button>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex space-x-2 border bg-gray-50 p-2 rounded-lg">
        {/* ... (botones de filtro sin cambios) ... */}
        <button onClick={() => setFiltro('todas')} className={`py-2 px-4 rounded-md text-sm font-semibold transition-colors ${filtro === 'todas' ? 'bg-[#1C2A3D] text-white shadow' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}>Todas</button>
        <button onClick={() => setFiltro('semana')} className={`py-2 px-4 rounded-md text-sm font-semibold transition-colors ${filtro === 'semana' ? 'bg-[#1C2A3D] text-white shadow' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}>Esta Semana</button>
        <button onClick={() => setFiltro('mes')} className={`py-2 px-4 rounded-md text-sm font-semibold transition-colors ${filtro === 'mes' ? 'bg-[#1C2A3D] text-white shadow' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}>Este Mes</button>
        <button onClick={() => setFiltro('año')} className={`py-2 px-4 rounded-md text-sm font-semibold transition-colors ${filtro === 'año' ? 'bg-[#1C2A3D] text-white shadow' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}>Este Año</button>
      </div>

      {/* Tabla de Reservas */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {loading ? (
            <p className="text-center p-8">Cargando reservas...</p>
        ) : error ? (
            <p className="text-center p-8 text-red-500">Error: {error}</p>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead>
                        {/* ... (cabecera de tabla sin cambios) ... */}
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
                            {/* ... (contenido de la fila sin cambios) ... */}
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
           {/* ... (código de paginación sin cambios) ... */}
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
                        
                        {/* --- 3. AÑADIDO CAMPO DE TELÉFONO AL FORMULARIO --- */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Huésped Público *</label>
                            <input 
                                type="tel" 
                                name="telefonoHuesped" 
                                value={formData.telefonoHuesped} 
                                onChange={handleChange} 
                                required 
                                pattern="^\d{10}$"
                                title="Introduce 10 dígitos sin espacios ni guiones"
                                className="w-full mt-1 p-2 border rounded-md focus:ring-[#6C7D5C] focus:border-[#6C7D5C]"
                            />
                        </div>
                        {/* ------------------------------------------- */}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Huésped Público (para notificación)</label>
                            <input type="email" name="emailHuesped" value={formData.emailHuesped} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md focus:ring-[#6C7D5C] focus:border-[#6C7D5C]"/>
                        </div>
                    </>
                )}

                {/* Fechas */}
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
                {/* Pago y Estado */}
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
                {/* Botones de Acción */}
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