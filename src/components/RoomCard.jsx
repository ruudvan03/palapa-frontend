import React, { useState } from 'react';

const getRoomDescription = (tipo) => {
    switch (tipo.toLowerCase()) {
        case 'individual': return "1 Cama Matrimonial (Máximo 2)";
        case 'doble': return "2 Camas Matrimoniales (Máximo 4)";
        case 'king': case 'rey': return "1 Cama King Size (Máximo 2)";
        case 'doble superior': return "2 Matrimoniales + Balcón";
        case 'king deluxe': return "1 King Size + Terraza";
        default: return "Habitación Estándar";
    }
};

// Componente RoomCard
const RoomCard = ({ room, onReserveClick }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const images = Array.isArray(room.imageUrls) ? room.imageUrls : [];
    const totalImages = images.length;

    const defaultImageUrl = 'https://via.placeholder.com/600x400/cccccc/888888?text=Imagen+no+disponible';

    const goToNextImage = () => {
        if (totalImages > 0) {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % totalImages);
        }
    };

    const goToPreviousImage = () => {
        if (totalImages > 0) {
            setCurrentImageIndex((prevIndex) => (prevIndex - 1 + totalImages) % totalImages);
        }
    };

    let displayImageUrl = defaultImageUrl;
    if (totalImages > 0) {
        const currentUrl = images[currentImageIndex]; 
        if (currentUrl && typeof currentUrl === 'string' && currentUrl.startsWith('/')) {
            displayImageUrl = `http://localhost:5000${currentUrl}`;
        } else if (currentUrl && typeof currentUrl === 'string') {
            displayImageUrl = currentUrl;
        }
    }
 

    // Obtener descripción
    const description = getRoomDescription(room.tipo);

    return (
        <div className="rounded-xl overflow-hidden border border-gray-300/30 group bg-white/70 backdrop-blur-md shadow-lg transform transition-all duration-300 hover:scale-[1.03] hover:shadow-xl cursor-pointer">
            {/* Contenedor de la Imagen con Posición Relativa */}
            <div
                className="h-52 w-full bg-cover bg-center rounded-t-xl relative" 
                style={{ backgroundImage: `url('${displayImageUrl}')` }}
                title={`Habitación ${room.tipo} ${room.numero}`}
            >
                {/* Botones de Navegación (solo si hay más de 1 imagen) */}
                {totalImages > 1 && (
                    <>
                        {/* Botón Anterior */}
                        <button
                            onClick={(e) => { e.stopPropagation(); goToPreviousImage(); }} 
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 focus:outline-none transition-opacity opacity-0 group-hover:opacity-100 z-10" // Añadido z-10
                            aria-label="Imagen anterior"
                        >
                            &#10094; {/* Flecha izquierda */}
                        </button>
                        {/* Botón Siguiente */}
                        <button
                            onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 focus:outline-none transition-opacity opacity-0 group-hover:opacity-100 z-10" // Añadido z-10
                            aria-label="Imagen siguiente"
                        >
                            &#10095; {/* Flecha derecha */}
                        </button>

                        {/* Indicadores de Puntos */}
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"> {/* Añadido z-10 */}
                            {images.map((_, index) => (
                                <span
                                    key={index}
                                    className={`block h-2 w-2 rounded-full cursor-pointer ${index === currentImageIndex ? 'bg-white' : 'bg-gray-400 hover:bg-gray-200'}`}
                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }} // Click para ir a esa imagen
                                ></span>
                            ))}
                        </div>
                    </>
                )}
                 {/* Mensaje si la imagen es la default Y no hay URLs (evita mostrarlo si la default es por error de carga) */}
                 {displayImageUrl === defaultImageUrl && totalImages === 0 && (
                      <div className="h-full w-full bg-gray-300/50 flex items-center justify-center text-gray-600 backdrop-blur-sm italic">
                          (Imagen no disponible)
                      </div>
                  )}
            </div>

            {/* Contenido de la Tarjeta */}
            <div className="p-6 rounded-b-xl">
                <h4 className="text-2xl font-bold mb-1 text-[#6C7D5C] capitalize">{room.tipo}</h4>
                <p className="text-gray-800 mb-3 text-sm">{description}</p>
                <div className="flex justify-between items-center mt-4">
                    <p className="text-3xl font-extrabold">${room.precio.toFixed(2)}<span className="text-base font-normal text-gray-600"> / noche</span></p>
                    <button
                        onClick={onReserveClick} // Usa la función pasada como prop
                        className="py-2.5 px-6 bg-[#D4AF37] text-[#1C2A3D] font-bold rounded-full text-base hover:bg-yellow-500"
                    >
                        ¡Reservar!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoomCard; 