import React, { useState, useEffect, useRef } from 'react';

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
    // Ya no manejamos imageUrls directamente en el form principal
  });
  // ===== Estados para manejar imágenes =====
  const [existingImageUrls, setExistingImageUrls] = useState([]); // URLs ya guardadas
  const [newImages, setNewImages] = useState([]); // Archivos nuevos seleccionados (tipo File)
  const [isSubmitting, setIsSubmitting] = useState(false); // Para deshabilitar botones
  const fileInputRef = useRef(null); // Referencia al input de archivo

  // Obtener la lista de habitaciones del backend
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/habitaciones');
      if (!response.ok) {
        throw new Error('No se pudieron obtener las habitaciones.');
      }
      const data = await response.json();
      setRooms(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []); // Carga inicial

  // Abre el modal para crear o editar
  const handleOpenModal = (room = null) => {
    setCurrentEditingRoom(room);
    if (room) {
      // Cargando datos para editar
      setFormData({
        numero: room.numero,
        tipo: room.tipo,
        precio: room.precio, // Mantenemos como string aquí por el input
      });
      setExistingImageUrls(Array.isArray(room.imageUrls) ? room.imageUrls : []);
    } else {
      // Reseteando para crear
      setFormData({
        numero: '',
        tipo: 'individual',
        precio: '',
      });
      setExistingImageUrls([]);
    }
    // Siempre resetear campos de imágenes nuevas y errores del modal
    setNewImages([]);
    setIsSubmitting(false);
    setError(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Limpiar input visualmente
    }
    setIsModalOpen(true);
  };

  // Cierra el modal y limpia estados temporales
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditingRoom(null);
    setExistingImageUrls([]);
    setNewImages([]);
    setError(null);
  };

  // Maneja cambios en los campos de texto/select del formulario
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Maneja la selección de nuevos archivos de imagen
  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setNewImages(prevImages => [...prevImages, ...filesArray]);
       if (fileInputRef.current) { // Limpiar para permitir reseleccionar
            fileInputRef.current.value = "";
       }
    }
  };

  // Quita una imagen de la lista de *nuevas* imágenes (antes de subir)
   const handleRemoveNewImage = (indexToRemove) => {
    setNewImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
   };

  // Llama al backend para eliminar una imagen *existente*
  // ===== INICIO: CORRECCIÓN handleDeleteImage =====
  const handleDeleteImage = async (imageUrlToDelete) => {
    if (!currentEditingRoom?._id) return;

    const filename = imageUrlToDelete.split('/').pop();
    if (!filename) {
        alert('No se pudo extraer el nombre del archivo.');
        return;
    }

    // --- CORRECCIÓN AQUÍ: Asegurar que la URL sea /api/images/... ---
    const requestUrl = `http://localhost:5000/api/images/${currentEditingRoom._id}/${encodeURIComponent(filename)}`;
    // --- FIN CORRECCIÓN ---
    console.log("Intentando borrar imagen:", requestUrl); // Verifica la URL en la consola

    if (window.confirm(`¿Eliminar la imagen ${filename}?`)) {
        setIsSubmitting(true);
        setError(null);
        try {
            const response = await fetch(requestUrl, { method: 'DELETE' });
            if (!response.ok) {
                let errorMsg = `Error ${response.status}: ${response.statusText}`;
                try { // Intenta obtener mensaje del backend
                  const errorData = await response.json();
                  errorMsg = errorData.message || errorMsg;
                } catch(e) { /* Ignorar si no es JSON */ }
                throw new Error(errorMsg);
            }
            const result = await response.json();
            setExistingImageUrls(result.imageUrls || []); // Actualizar estado local
            alert('Imagen eliminada.');
        } catch (err) {
            console.error("Error al eliminar imagen:", err);
            setError(`Error al eliminar: ${err.message}`); // Mostrar en modal
        } finally {
            setIsSubmitting(false);
        }
    }
  };
  // ===== FIN: CORRECCIÓN handleDeleteImage =====

  // Llama al backend para eliminar una habitación completa
  const handleDelete = async (roomId) => {
    if (!roomId) { alert('Error: ID inválido.'); return; }
    if (window.confirm('¿Eliminar esta habitación y todas sus imágenes?')) {
        setIsSubmitting(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:5000/api/habitaciones/${roomId}`, { method: 'DELETE' });
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || `Error ${response.status}`);
            }
            alert('Habitación eliminada.');
            await fetchRooms(); // Recargar lista
        } catch (err) {
            console.error("Error al eliminar habitación:", err);
            setError(`Error al eliminar: ${err.message}`);
            alert(`Error al eliminar: ${err.message}`); // También alerta
        } finally {
             setIsSubmitting(false);
        }
    }
  };

  // Maneja el guardado (crear o actualizar) y la subida de imágenes
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    let currentRoomId = currentEditingRoom?._id;
    let operationType = currentEditingRoom ? 'actualizar' : 'crear';
    let roomJustCreated = null;

    // Convertir precio a número ANTES de enviar
    const dataToSend = {
        numero: formData.numero,
        tipo: formData.tipo,
        precio: parseFloat(formData.precio)
    };

    // Validar precio convertido
    if (isNaN(dataToSend.precio) || dataToSend.precio < 0) {
        setError('Error: El precio debe ser un número positivo.');
        setIsSubmitting(false);
        return;
    }

    try {
        // --- Paso 1: Crear o Actualizar datos básicos ---
        if (operationType === 'crear') {
            const createResponse = await fetch('http://localhost:5000/api/habitaciones', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSend),
            });
            if (!createResponse.ok) throw new Error((await createResponse.json()).message || 'Error al crear');
            const roomDataResponse = await createResponse.json();
            currentRoomId = roomDataResponse.habitacion._id;
            roomJustCreated = roomDataResponse.habitacion;
            console.log('Habitación creada con ID:', currentRoomId);
            setCurrentEditingRoom(roomJustCreated); // Actualizar estado para permitir subida
        } else {
            const updateResponse = await fetch(`http://localhost:5000/api/habitaciones/${currentRoomId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSend),
            });
            if (!updateResponse.ok) throw new Error((await updateResponse.json()).message || 'Error al actualizar');
            console.log('Datos básicos actualizados para ID:', currentRoomId);
        }

        // --- Paso 2: Subir nuevas imágenes ---
        if (newImages.length > 0 && currentRoomId) {
            console.log(`Subiendo ${newImages.length} imágenes para ${currentRoomId}...`);
            const imageFormData = new FormData();
            newImages.forEach(file => imageFormData.append('images', file));
            const uploadResponse = await fetch(`http://localhost:5000/api/upload/room-images/${currentRoomId}`, { method: 'POST', body: imageFormData });
            if (!uploadResponse.ok) throw new Error((await uploadResponse.json()).message || 'Error al subir imágenes');
            const uploadResult = await uploadResponse.json();
            console.log('Respuesta subida:', uploadResult);
            // Actualizar estado local
            setExistingImageUrls(uploadResult.imageUrls || []);
            setNewImages([]);
             if (fileInputRef.current) fileInputRef.current.value = "";
        }

        // --- Finalización ---
        await fetchRooms();
        if (operationType === 'crear') {
             alert(`Habitación creada. Ahora puedes seguir añadiendo imágenes.`);
             // Mantenemos modal abierto
        } else {
             handleCloseModal(); // Cerrar solo si estábamos actualizando
             alert(`Habitación actualizada.`);
        }

    } catch (err) {
        console.error(`Error al ${operationType} habitación o subir:`, err);
        setError(`${err.message}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- Renderizado ---
  if (loading && !isModalOpen) {
    return <p className="p-8 text-center text-lg text-gray-600">Cargando habitaciones...</p>;
  }

  if (error && !isModalOpen) {
    return <p className="p-8 text-center text-red-500 bg-red-50 border border-red-200 rounded-lg">Error al cargar habitaciones: {error}</p>;
  }

  return (
    <div>
      {/* Título y Botón Añadir */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[#1C2A3D]">Gestión de Habitaciones</h2>
        <button onClick={() => handleOpenModal()} className="bg-[#6C7D5C] text-white py-2 px-4 rounded-md font-bold hover:bg-[#5a6b4d] transition-colors" disabled={isSubmitting}>
          Añadir Nueva Habitación
        </button>
      </div>

      {/* Tabla de Habitaciones */}
      <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
         {loading && <p className="text-center text-gray-500 py-4">Recargando lista...</p>}
         {error && !loading && <p className="text-center text-red-500 py-4">Error al recargar: {error}</p>}

        <table className="w-full text-left table-auto min-w-[600px]">
          <thead>
            <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Número</th>
              <th className="py-3 px-6 text-left">Tipo</th>
              <th className="py-3 px-6 text-left">Precio</th>
              <th className="py-3 px-6 text-center">Imágenes</th>
              <th className="py-3 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {rooms.length === 0 && !loading && (<tr><td colSpan="5" className="text-center py-6 text-gray-500">No hay habitaciones registradas.</td></tr>)}
            {rooms.map((room) => (
              <tr key={room._id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">{room.numero}</td>
                <td className="py-3 px-6 text-left capitalize">{room.tipo}</td>
                <td className="py-3 px-6 text-left">${room.precio.toFixed(2)}</td>
                <td className="py-3 px-6 text-center">{Array.isArray(room.imageUrls) ? room.imageUrls.length : 0}</td>
                <td className="py-3 px-6 text-center">
                  <div className="flex item-center justify-center space-x-2">
                    <button onClick={() => handleOpenModal(room)} className="text-blue-500 hover:text-blue-700 transition-colors disabled:opacity-50" disabled={isSubmitting} title="Editar">✏️</button>
                    <button onClick={() => handleDelete(room._id)} className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50" disabled={isSubmitting} title="Eliminar">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Encabezado Modal */}
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-2xl font-bold text-[#1C2A3D]">
                {currentEditingRoom ? `Editando Habitación ${formData.numero}` : 'Añadir Nueva Habitación'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-800 text-3xl font-light leading-none" disabled={isSubmitting}>&times;</button>
            </div>

            {/* Mensaje Error Modal */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                    <button type="button" onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3 text-red-500 hover:text-red-800"><span aria-hidden="true">&times;</span></button>
                </div>
            )}

            {/* Contenido Formulario */}
            <div>
              {/* Campos Básicos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                 <div><label className="block text-gray-700 text-sm font-bold mb-2">Número *</label><input type="number" name="numero" value={formData.numero} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-md" required disabled={isSubmitting} /></div>
                 <div><label className="block text-gray-700 text-sm font-bold mb-2">Tipo *</label><select name="tipo" value={formData.tipo} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-md bg-white" required disabled={isSubmitting}><option value="individual">Individual</option><option value="doble">Doble</option><option value="King">King</option><option value="Doble Superior">Doble Superior</option><option value="King Deluxe">King Deluxe</option></select></div>
                 <div><label className="block text-gray-700 text-sm font-bold mb-2">Precio *</label><input type="number" name="precio" value={formData.precio} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-md" step="0.01" required disabled={isSubmitting} /></div>
              </div>

              {/* Sección Imágenes */}
              <div className="mb-6 border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Imágenes de la Habitación</h4>
                {/* Mostrar Existentes */}
                {currentEditingRoom && (
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Imágenes Actuales ({existingImageUrls.length})</label>
                        {existingImageUrls.length === 0 ? (<p className="text-sm text-gray-500 italic">No hay imágenes cargadas.</p>) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {existingImageUrls.map((url, index) => {
                                    let imageUrl = 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=InvalidURL';
                                    const backendOrigin = 'http://localhost:5000';
                                    if (url?.startsWith('/')) imageUrl = `${backendOrigin}${url}`;
                                    else if (url?.startsWith('http')) imageUrl = url;
                                    return (
                                        <div key={index} className="relative group border rounded overflow-hidden shadow-sm">
                                            <img src={imageUrl} alt={`Imagen ${index + 1}`} className="h-24 w-full object-cover" onError={(e) => { e.target.src = 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=Error'; e.target.alt="Error al cargar"}}/>
                                            <button type="button" onClick={() => handleDeleteImage(url)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" title="Eliminar imagen" disabled={isSubmitting}>X</button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
                {/* Input Subir Nuevas */}
                 <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="roomImages">Añadir nuevas imágenes</label>
                    <input type="file" id="roomImages" name="images" multiple onChange={handleFileChange} ref={fileInputRef} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed" accept="image/jpeg, image/png, image/webp, image/gif" disabled={isSubmitting || !currentEditingRoom}/>
                    {!currentEditingRoom && <p className="text-xs text-gray-500 mt-1 italic">Guarda la habitación primero para poder subir imágenes.</p>}
                 </div>
                 {/* Previsualización Nuevas */}
                 {newImages.length > 0 && (
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Nuevas imágenes a subir ({newImages.length})</label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {newImages.map((file, index) => (
                                <div key={index} className="relative group border rounded overflow-hidden shadow-sm">
                                    <img src={URL.createObjectURL(file)} alt={`Nueva imagen ${index + 1}`} className="h-24 w-full object-cover" onLoad={(e) => URL.revokeObjectURL(e.target.src)} />
                                    <button type="button" onClick={() => handleRemoveNewImage(index)} className="absolute top-1 right-1 bg-gray-600 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" title="Quitar imagen" disabled={isSubmitting}>X</button>
                                </div>
                            ))}
                        </div>
                    </div>
                 )}
              </div>
              {/* FIN Sección Imágenes */}

              {/* Botones Acción */}
              <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                <button type="button" onClick={handleCloseModal} className="py-2 px-4 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50" disabled={isSubmitting}>Cancelar</button>
                <button type="button" onClick={handleSubmit} className="py-2 px-4 bg-[#6C7D5C] text-white font-bold rounded-md hover:bg-[#5a6b4d] disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSubmitting || (!formData.numero || !formData.tipo || !formData.precio)}>
                  {isSubmitting ? 'Guardando...' : (currentEditingRoom ? 'Guardar Cambios' : 'Crear Habitación')}
                </button>
              </div>
            </div> {/* Fin div formulario */}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsManager;