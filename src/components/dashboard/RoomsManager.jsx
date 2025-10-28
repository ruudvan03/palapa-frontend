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
  // ===== INICIO: Nuevos estados para manejar imágenes =====
  const [existingImageUrls, setExistingImageUrls] = useState([]); // URLs de imágenes ya guardadas
  const [newImages, setNewImages] = useState([]); // Archivos seleccionados para subir (tipo File)
  const [isSubmitting, setIsSubmitting] = useState(false); // Para deshabilitar botones durante la subida/guardado
  const fileInputRef = useRef(null); // Referencia al input de archivo
  // ===== FIN: Nuevos estados para manejar imágenes =====


  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/habitaciones');
      if (!response.ok) {
        throw new Error('No se pudieron obtener las habitaciones.');
      }
      const data = await response.json();
      setRooms(data);
      setError(null); // Limpiar error si la carga es exitosa
    } catch (err) {
      setError(err.message);
      setRooms([]); // Limpiar habitaciones en caso de error
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
        // Las URLs se cargan en su propio estado
      });
      // Cargar imágenes existentes
      setExistingImageUrls(Array.isArray(room.imageUrls) ? room.imageUrls : []);
    } else {
      // Resetear formulario para nueva habitación
      setFormData({
        numero: '',
        tipo: 'individual',
        precio: '',
      });
      setExistingImageUrls([]); // No hay imágenes existentes para una nueva habitación
    }
    setNewImages([]); // Siempre limpiar las imágenes nuevas al abrir/reabrir el modal
    setIsSubmitting(false); // Asegurar que el botón de guardar esté habilitado
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Limpiar el input de archivo visualmente
    }
    // Limpiar error al abrir modal
    setError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditingRoom(null);
    // Limpiar estados relacionados con el modal al cerrar
    setExistingImageUrls([]);
    setNewImages([]);
    setError(null); // Limpiar errores del modal
  };

  // Maneja cambios en los inputs normales del formulario
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ===== INICIO: Nueva función para manejar selección de archivos =====
  const handleFileChange = (e) => {
    if (e.target.files) {
      // Convertir FileList a Array y añadir a las imágenes nuevas
      const filesArray = Array.from(e.target.files);
      // Podrías añadir validación de tamaño o tipo aquí si lo deseas
      setNewImages(prevImages => [...prevImages, ...filesArray]);
      // Limpiar el input para permitir seleccionar los mismos archivos si se eliminan y se vuelven a añadir
       if (fileInputRef.current) {
            fileInputRef.current.value = "";
       }
    }
  };
  // ===== FIN: Nueva función para manejar selección de archivos =====

   // ===== INICIO: Nueva función para quitar una imagen nueva (antes de subirla) =====
   const handleRemoveNewImage = (indexToRemove) => {
    setNewImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
   };
   // ===== FIN: Nueva función para quitar una imagen nueva =====

  // ===== INICIO: Nueva función para eliminar imagen existente =====
  const handleDeleteImage = async (imageUrlToDelete) => {
    if (!currentEditingRoom || !currentEditingRoom._id) return; // Necesitamos el ID de la habitación

    // Extraer el nombre del archivo de la URL
    const filename = imageUrlToDelete.split('/').pop();
    if (!filename) {
        alert('No se pudo extraer el nombre del archivo de la URL.');
        return;
    }

    const requestUrl = `http://localhost:5000/api/images/habitaciones/${currentEditingRoom._id}/${encodeURIComponent(filename)}`;
    console.log("Intentando borrar:", requestUrl); // Log para depurar

    if (window.confirm(`¿Estás seguro de que quieres eliminar la imagen ${filename}?`)) {
        setIsSubmitting(true); // Bloquear UI mientras se borra
        setError(null); // Limpiar errores previos
        try {
            const response = await fetch(requestUrl, { // Usar la URL codificada
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status} al eliminar la imagen.`);
            }

            const result = await response.json();
            // Actualizar el estado de imágenes existentes con la respuesta del backend
            setExistingImageUrls(result.imageUrls || []);
            alert('Imagen eliminada con éxito.');

        } catch (err) {
            console.error("Error al eliminar imagen:", err);
            setError(`Error al eliminar imagen: ${err.message}`);
            // alert(`Error al eliminar imagen: ${err.message}`); // Ya se muestra en el modal
        } finally {
            setIsSubmitting(false); // Desbloquear UI
        }
    }
  };
  // ===== FIN: Nueva función para eliminar imagen existente =====

  // ===== INICIO: Función handleDelete para eliminar habitación =====
  const handleDelete = async (roomId) => {
    if (!roomId) {
        alert('Error: ID de habitación no válido.');
        return;
    }
    if (window.confirm('¿Estás seguro de que quieres eliminar esta habitación? Esto borrará también sus imágenes.')) {
        setIsSubmitting(true); // Bloquear botones
        setError(null);
        try {
            const response = await fetch(`http://localhost:5000/api/habitaciones/${roomId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || `Error ${response.status} al eliminar la habitación.`);
            }
            // Si la eliminación fue exitosa
            alert('Habitación eliminada con éxito.');
            await fetchRooms(); // Recargar la lista para que desaparezca
        } catch (err) {
            console.error("Error al eliminar habitación:", err);
            setError(`Error al eliminar habitación: ${err.message}`); // Mostrar error si falla
            alert(`Error al eliminar habitación: ${err.message}`);
        } finally {
             setIsSubmitting(false); // Desbloquear botones
        }
    }
  };
  // ===== FIN: Función handleDelete para eliminar habitación =====


  // ===== INICIO: Lógica de handleSubmit con corrección de precio =====
  const handleSubmit = async (e) => {
    // Permitir llamar sin evento si es necesario (desde el botón type="button")
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    let currentRoomId = currentEditingRoom?._id;
    let operationType = currentEditingRoom ? 'actualizar' : 'crear';
    let roomForUpdate = null;

    // --- CORRECCIÓN: Convertir precio a número ANTES de enviar ---
    const dataToSend = {
        numero: formData.numero,
        tipo: formData.tipo,
        precio: parseFloat(formData.precio) // Convertir a número
    };

    // Validar precio convertido en el frontend
    if (isNaN(dataToSend.precio) || dataToSend.precio < 0) {
        setError('Error: El precio debe ser un número positivo.'); // Mensaje de error específico
        setIsSubmitting(false);
        return; // Detener si el precio no es válido
    }
    // --- FIN CORRECCIÓN ---

    try {
        // --- Paso 1: Crear o Actualizar datos básicos ---
        let roomDataResponse;
        if (operationType === 'crear') {
            const createResponse = await fetch('http://localhost:5000/api/habitaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend), // Enviar datos con precio numérico
            });
            if (!createResponse.ok) {
                const errorData = await createResponse.json();
                throw new Error(errorData.message || `Error ${createResponse.status} al crear.`);
            }
            roomDataResponse = await createResponse.json();
            currentRoomId = roomDataResponse.habitacion._id;
            roomForUpdate = roomDataResponse.habitacion;
            console.log('Habitación creada con ID:', currentRoomId);
            // Actualizar currentEditingRoom para futuras operaciones en este modal
            setCurrentEditingRoom(roomForUpdate);
        } else {
            const updateResponse = await fetch(`http://localhost:5000/api/habitaciones/${currentRoomId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend), // Enviar datos con precio numérico
            });
            if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                throw new Error(errorData.message || `Error ${updateResponse.status} al actualizar.`);
            }
            roomDataResponse = await updateResponse.json();
            roomForUpdate = roomDataResponse.habitacion;
            console.log('Datos de habitación actualizados para ID:', currentRoomId);
        }

        // --- Paso 2: Subir nuevas imágenes ---
        if (newImages.length > 0 && currentRoomId) {
            console.log(`Subiendo ${newImages.length} imágenes para ${currentRoomId}...`);
            const imageFormData = new FormData();
            newImages.forEach(file => imageFormData.append('images', file));

            const uploadResponse = await fetch(`http://localhost:5000/api/upload/room-images/${currentRoomId}`, {
                method: 'POST',
                body: imageFormData,
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                console.error("Error subida:", errorData);
                throw new Error(errorData.message || `Error ${uploadResponse.status} al subir.`);
            }
            const uploadResult = await uploadResponse.json();
            console.log('Respuesta subida:', uploadResult);
            // Actualizar estado local
            setExistingImageUrls(uploadResult.imageUrls || []);
            setNewImages([]);
             if (fileInputRef.current) fileInputRef.current.value = "";
        }

        // --- Finalización ---
        await fetchRooms();
        // Ajustar mensajes y cierre del modal
        if (operationType === 'crear') {
             alert(`Habitación creada con éxito. Ahora puedes añadir imágenes.`);
             // Mantenemos modal abierto, currentEditingRoom ya se actualizó
        } else { // Si estábamos actualizando
             handleCloseModal();
             alert(`Habitación actualizada con éxito.`);
        }

    } catch (err) {
        console.error(`Error al ${operationType} habitación o subir:`, err);
        setError(`Error: ${err.message}`); // Mostrar error en el modal
    } finally {
        setIsSubmitting(false);
    }
  };
  // ===== FIN: Lógica de handleSubmit con corrección de precio =====


  // --- Renderizado ---
  if (loading && !isModalOpen) {
    return <p className="p-8 text-center text-lg text-gray-600">Cargando habitaciones...</p>;
  }

  if (error && !isModalOpen) {
    return <p className="p-8 text-center text-red-500 bg-red-50 border border-red-200 rounded-lg">Error al cargar habitaciones: {error}</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[#1C2A3D]">Gestión de Habitaciones</h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#6C7D5C] text-white py-2 px-4 rounded-md font-bold hover:bg-[#5a6b4d] transition-colors"
          disabled={isSubmitting}
        >
          Añadir Nueva Habitación
        </button>
      </div>

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
            {rooms.length === 0 && !loading && (
                 <tr><td colSpan="5" className="text-center py-6 text-gray-500">No hay habitaciones registradas.</td></tr>
            )}
            {rooms.map((room) => (
              <tr key={room._id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">{room.numero}</td>
                <td className="py-3 px-6 text-left capitalize">{room.tipo}</td>
                <td className="py-3 px-6 text-left">${room.precio.toFixed(2)}</td>
                <td className="py-3 px-6 text-center">{Array.isArray(room.imageUrls) ? room.imageUrls.length : 0}</td>
                <td className="py-3 px-6 text-center">
                  <div className="flex item-center justify-center space-x-2">
                    <button
                      onClick={() => handleOpenModal(room)}
                      className="text-blue-500 hover:text-blue-700 transition-colors disabled:opacity-50"
                      disabled={isSubmitting}
                      title="Editar Habitación"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(room._id)} // Llamada correcta
                      className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                      disabled={isSubmitting}
                      title="Eliminar Habitación"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para Crear/Editar Habitación */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-2xl font-bold text-[#1C2A3D]">
                {currentEditingRoom ? `Editando Habitación ${formData.numero}` : 'Añadir Nueva Habitación'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-800 text-3xl font-light leading-none" disabled={isSubmitting}>
                &times;
              </button>
            </div>

            {/* Mensaje de error dentro del modal */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                    <button type="button" onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3 text-red-500 hover:text-red-800">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
            )}

            {/* Formulario principal */}
            <div>
              {/* Campos básicos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                 <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Número *</label>
                    <input type="number" name="numero" value={formData.numero} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-md" required disabled={isSubmitting} />
                 </div>
                 <div>
                     <label className="block text-gray-700 text-sm font-bold mb-2">Tipo *</label>
                     <select name="tipo" value={formData.tipo} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-md bg-white" required disabled={isSubmitting}>
                       <option value="individual">Individual</option>
                       <option value="doble">Doble</option>
                       <option value="King">King</option>
                       <option value="Doble Superior">Doble Superior</option>
                       <option value="King Deluxe">King Deluxe</option>
                     </select>
                 </div>
                 <div>
                     <label className="block text-gray-700 text-sm font-bold mb-2">Precio *</label>
                     {/* Input de precio sigue siendo type="number" para la interfaz, la conversión se hace al enviar */}
                     <input type="number" name="precio" value={formData.precio} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-md" step="0.01" required disabled={isSubmitting} />
                 </div>
              </div>

              {/* Sección Gestión Imágenes */}
              <div className="mb-6 border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Imágenes de la Habitación</h4>

                {/* Mostrar Imágenes Existentes */}
                {currentEditingRoom && (
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Imágenes Actuales ({existingImageUrls.length})</label>
                        {existingImageUrls.length === 0 ? (
                             <p className="text-sm text-gray-500 italic">No hay imágenes cargadas.</p>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {existingImageUrls.map((url, index) => (
                                    <div key={index} className="relative group border rounded overflow-hidden shadow-sm">
                                        <img src={url.startsWith('/') ? `http://localhost:5000${url}` : url}
                                             alt={`Imagen ${index + 1}`}
                                             className="h-24 w-full object-cover"
                                             onError={(e) => { e.target.src = 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=Error'; e.target.alt="Error al cargar"}}
                                        />
                                        <button type="button" onClick={() => handleDeleteImage(url)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" title="Eliminar imagen" disabled={isSubmitting}>X</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Input Subir Nuevas */}
                 <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="roomImages">
                        Añadir nuevas imágenes
                    </label>
                    <input
                        type="file"
                        id="roomImages"
                        name="images"
                        multiple
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        accept="image/jpeg, image/png, image/webp, image/gif"
                        // Deshabilitar si se está procesando O si es nueva Y aún no se ha creado (no hay ID)
                        disabled={isSubmitting || !currentEditingRoom}
                    />
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
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="py-2 px-4 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="py-2 px-4 bg-[#6C7D5C] text-white font-bold rounded-md hover:bg-[#5a6b4d] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || (!formData.numero || !formData.tipo || !formData.precio)}
                >
                  {isSubmitting ? 'Guardando...' : (currentEditingRoom ? 'Guardar Cambios' : 'Crear Habitación')}
                  {/* Cambiado texto botón crear */}
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