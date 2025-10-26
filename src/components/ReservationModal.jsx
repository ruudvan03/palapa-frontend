import React, { useState, useEffect } from 'react';

const ReservationModal = ({ isVisible, onClose, searchData, availableRooms }) => {
    
    // Estados internos
    const [step, setStep] = useState('RESULTS');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [checkoutError, setCheckoutError] = useState(null);
    const [paymentSuccess, setPaymentSuccess] = useState(null);
    const [clientData, setClientData] = useState({
        nombre: '',
        telefono: '',
        email: '',
        tipoPago: 'transferencia',
    });

    // useEffect para reiniciar el estado cuando el modal se abre
    useEffect(() => {
        if (isVisible) {
            setStep('RESULTS');
            setSelectedRoom(null);
            setCheckoutError(null);
            setPaymentSuccess(null);
            setClientData({
                nombre: '',
                telefono: '',
                email: '',
                tipoPago: 'transferencia',
            });
        }
    }, [isVisible]); // Esta dependencia es clave

    // No renderizar nada si no es visible
    if (!isVisible) return null;

    // --- Funciones auxiliares y manejadores ---

    const calculateNights = (start, end) => {
        if (!start || !end) return 0;
        const diffTime = Math.abs(new Date(end) - new Date(start));
        const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return nights > 0 ? nights : 1; // Mínimo 1 noche
    };

    const totalNights = calculateNights(searchData.llegada, searchData.salida);
    
    // Cálculo seguro de precio
    const calculatedPrice = selectedRoom?.precio ? (selectedRoom.precio * totalNights) : 0;
    const roomPrice = calculatedPrice.toFixed(2);

    const handleSelectRoom = (room) => {
        setSelectedRoom(room);
        setStep('CHECKOUT');
        setCheckoutError(null);
    };

    const handleClientChange = (e) => {
        setClientData({ ...clientData, [e.target.name]: e.target.value });
    };

    const handleFinalizeReservation = async (e) => {
        e.preventDefault();
        setCheckoutError(null);

        if (!clientData.email || !clientData.nombre || !clientData.telefono || !clientData.tipoPago || !selectedRoom) {
            setCheckoutError('Por favor, completa todos los campos requeridos y selecciona una habitación.');
            return;
        }
        if (!/^\d{10}$/.test(clientData.telefono)) {
            setCheckoutError('El teléfono debe tener exactamente 10 dígitos.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/reservas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    habitacionId: selectedRoom._id,
                    fechaInicio: searchData.llegada,
                    fechaFin: searchData.salida,
                    tipoPago: clientData.tipoPago,
                    clientName: clientData.nombre,
                    clientEmail: clientData.email,
                    emailHuesped: clientData.email,
                    nombreHuesped: clientData.nombre
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudo completar la reserva.');
            }

            const data = await response.json();
            
            if (clientData.tipoPago === 'transferencia' && data.configuracionPago) {
                setPaymentSuccess(data.configuracionPago);
            } else {
                setPaymentSuccess({ tipo: 'efectivo' }); // Indicador para efectivo
            }
            
            setStep('SUCCESS');

        } catch (error) {
            console.error("Error al finalizar reserva:", error);
            setCheckoutError(error.message || 'Error en el servidor al intentar reservar.');
        }
    };
    
    // --- VISTAS DEL MODAL (CÓDIGO JSX COMPLETO) ---

    const renderResultsView = () => (
        <div className="p-6 max-h-[70vh] overflow-y-auto">
            {availableRooms.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-xl font-semibold text-red-500">❌ ¡Lo sentimos!</p>
                    <p className="text-gray-600 mt-2">No hay habitaciones disponibles para las fechas seleccionadas ({searchData.llegada} al {searchData.salida}).</p>
                    <p className="text-sm text-gray-500 mt-1">Intenta con un rango de fechas diferente.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <p className="text-lg font-semibold text-green-600">{availableRooms.length} Habitación(es) encontrada(s) para {totalNights} noche(s).</p>
                    {availableRooms.map((room) => (
                        <div key={room._id} className="flex border rounded-lg overflow-hidden shadow-md bg-white">
                            <div className="w-24 md:w-32 bg-[#D4AF37] flex items-center justify-center text-4xl text-[#1C2A3D] font-bold">🛌</div>
                            <div className="flex-1 p-4">
                                <h4 className="text-xl font-bold text-[#1C2A3D] mb-1">Habitación {room.tipo} (No. {room.numero})</h4>
                                <p className="text-sm text-gray-600">Precio por noche: ${room.precio.toFixed(2)}</p>
                            </div>
                            <div className="w-32 md:w-48 bg-gray-50 flex flex-col justify-center items-center p-4 border-l">
                                <p className="text-2xl font-extrabold text-[#6C7D5C]">${(room.precio * totalNights).toFixed(2)}</p>
                                <span className="text-xs text-gray-500 mb-3">Total</span>
                                <button
                                    className="w-full py-2 bg-[#6C7D5C] text-white font-bold rounded-lg hover:bg-[#5a6b4d] transition-colors text-sm"
                                    onClick={() => handleSelectRoom(room)}
                                >
                                    Seleccionar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderCheckoutView = () => (
        <div className="p-6 max-h-[80vh] overflow-y-auto">
            <button
                onClick={() => setStep('RESULTS')}
                className="text-sm text-blue-600 hover:underline mb-4 block"
            >
                ← Volver a selección
            </button>
            <h4 className="text-2xl font-bold text-[#1C2A3D] mb-4">Finalizar Reserva</h4>
            
            {checkoutError && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4 border border-red-300 text-sm">{checkoutError}</div>
            )}

            {selectedRoom && (
                <div className="bg-green-50 p-4 rounded-lg mb-4 border border-green-200">
                    <p className="font-semibold text-lg text-green-700">Habitación: {selectedRoom.tipo} (No. {selectedRoom.numero})</p>
                    <p className="text-xl font-extrabold text-[#6C7D5C]">Total: ${roomPrice}</p>
                    <p className="text-sm text-gray-600">Estancia: {searchData.llegada} al {searchData.salida} ({totalNights} noches)</p>
                </div>
            )}

            <form onSubmit={handleFinalizeReservation} className="space-y-4">
                <h5 className="font-bold text-lg border-b pb-2">Datos de Contacto</h5>
                <input type="text" name="nombre" placeholder="Nombre completo *" required value={clientData.nombre} onChange={handleClientChange} className="w-full p-3 border rounded-lg"/>
                <input type="email" name="email" placeholder="Correo electrónico (para confirmación) *" required value={clientData.email} onChange={handleClientChange} className="w-full p-3 border rounded-lg"/>
                <input type="tel" name="telefono" placeholder="Teléfono (10 dígitos) *" required pattern="^\d{10}$" title="Introduce 10 dígitos sin espacios ni guiones" value={clientData.telefono} onChange={handleClientChange} className="w-full p-3 border rounded-lg"/>
                <h5 className="font-bold text-lg border-b pb-2 pt-4">Método de Pago</h5>
                <select name="tipoPago" value={clientData.tipoPago} onChange={handleClientChange} className="w-full p-3 border rounded-lg bg-white" required>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="efectivo">Efectivo (en el hotel)</option>
                </select>
                <button type="submit" className="w-full py-3 mt-4 bg-[#D4AF37] text-[#1C2A3D] font-extrabold rounded-lg hover:bg-yellow-500 transition-colors">
                    Confirmar Reserva
                </button>
            </form>
        </div>
    );

    const renderSuccessView = () => (
        <div className="p-6 text-center">
            <h4 className="text-3xl font-bold text-green-600 mb-4">¡Reserva Pendiente! 🎉</h4>
            
            {paymentSuccess?.tipo === 'efectivo' ? (
                <div className="mt-6">
                    <p className="text-lg mb-4 text-gray-700">Se ha enviado un correo a <strong>{clientData.email}</strong> con el resumen. Tu reserva está <strong>pendiente</strong>. El monto de <strong>${roomPrice}</strong> se liquidará en efectivo al check-in.</p>
                    <p className="text-sm text-gray-600">¡Te esperamos!</p>
                </div>
            ) : paymentSuccess?.banco ? (
                <div className="mt-6">
                    <p className="text-lg mb-4">Se ha enviado un correo a <strong>{clientData.email}</strong> con los detalles. Por favor, completa el pago de <strong>${roomPrice}</strong> por transferencia:</p>
                    <div className="bg-gray-100 p-4 rounded-lg mb-4 text-left inline-block border border-gray-300">
                        <p><strong>Banco:</strong> {paymentSuccess.banco}</p>
                        <p><strong>Cuenta:</strong> {paymentSuccess.cuentaBancaria}</p>
                        <p><strong>CLABE:</strong> {paymentSuccess.clabe}</p>
                    </div>
                    <p className="mb-4 text-sm text-gray-600">Envía el comprobante a WhatsApp para confirmar.</p>
                    <a href={paymentSuccess.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-[#25D366] text-white py-2 px-6 rounded-full font-bold hover:bg-[#1EBE5A] shadow-md">
                        Enviar por WhatsApp
                    </a>
                </div>
            ) : (
                 <p className="mt-6 text-lg text-gray-700">Se ha enviado un correo a <strong>{clientData.email}</strong> con los detalles de tu reserva.</p>
            )}
            
            <button onClick={onClose} className="mt-8 w-full py-3 bg-[#1C2A3D] text-white font-bold rounded-lg hover:bg-[#D4AF37] hover:text-[#1C2A3D] transition-colors">
                Finalizar
            </button>
        </div>
    );
    
    // Función para decidir qué vista mostrar
    const renderContent = () => {
        switch (step) {
            case 'RESULTS': return renderResultsView();
            case 'CHECKOUT': return renderCheckoutView();
            case 'SUCCESS': return renderSuccessView();
            default: return renderResultsView();
        }
    }

    // JSX principal del modal
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl md:max-w-4xl overflow-hidden transform transition-all duration-300 max-h-[95vh] flex flex-col">
                {step !== 'SUCCESS' && (
                    <div className="flex-shrink-0 bg-[#1C2A3D] text-white p-4 flex justify-between items-center">
                        <h3 className="text-lg md:text-xl font-bold">{step === 'RESULTS' ? 'Habitaciones Disponibles' : 'Detalles y Pago'}</h3>
                        <button onClick={onClose} className="text-2xl hover:text-red-400">×</button>
                    </div>
                )}
                
                {/* Contenido principal (scrollable) */}
                <div className="flex-grow overflow-y-auto">
                    {renderContent()}
                </div>

                {step !== 'SUCCESS' && (
                    <div className="flex-shrink-0 p-4 border-t text-right bg-gray-50">
                        <button onClick={onClose} className="py-2 px-4 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReservationModal;