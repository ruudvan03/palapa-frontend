import React, { useState, useEffect } from 'react';
import ReservationModal from './ReservationModal';
import RoomCard from './RoomCard'; // <-- Importa el componente RoomCard

// DATOS DE UBICACIÓN
const LOCATION_DATA = {
    name: "Palapa La Casona",
    address: "Carretera Costera 200, Llano Grande, 70947 San Pedro Pochutla, Oax.",
    mapsUrl: "https://maps.app.goo.gl/JzKp4av7E7uwdWsM7", // URL actualizada
    displayAddress: "Carretera Costera 200, Llano Grande, San Pedro Pochutla, Oax."
};

// YA NO NECESITAMOS getRoomDescription aquí, está en RoomCard.jsx

const PublicHome = ({ onShowLogin }) => {

    const [allRooms, setAllRooms] = useState([]);
    const [whatsappLink, setWhatsappLink] = useState('tel:+529514401726'); // Fallback
    const [searchData, setSearchData] = useState({ llegada: '', salida: '', huespedes: 1 });
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [searchError, setSearchError] = useState(null);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [initialLoadError, setInitialLoadError] = useState(null);
    const [searchId, setSearchId] = useState(null);
    // ===== Estados para Galería Alberca =====
    const [poolImages, setPoolImages] = useState([]); // URLs de alberca
    const [currentPoolImageIndex, setCurrentPoolImageIndex] = useState(0); // Índice actual alberca
    // ===== Estados para Galería Comida =====
    const [foodImages, setFoodImages] = useState([]); // URLs de comida
    const [currentFoodImageIndex, setCurrentFoodImageIndex] = useState(0); // Índice actual comida

    // Altura del hero a 100vh
    const heroHeightVh = 100;
    const heroHeightStyle = { height: `${heroHeightVh}vh` };
    const mainPaddingTopStyle = { paddingTop: `${heroHeightVh}vh` };

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoadingRooms(true);
            setInitialLoadError(null);
            let roomsData = [];
            // --- Fetch Habitaciones ---
            try {
                const roomsResponse = await fetch('http://localhost:5000/api/habitaciones');
                if (!roomsResponse.ok) { throw new Error(`Error ${roomsResponse.status} al cargar habitaciones`); }
                roomsData = await roomsResponse.json();
                console.log("Habitaciones cargadas:", roomsData);
            } catch (error) { console.error("Error fetch habitaciones:", error); setInitialLoadError(error.message); }
            // --- Fetch Configuración ---
            try {
                const configResponse = await fetch('http://localhost:5000/api/config/contacto');
                 if (configResponse.ok) { const configData = await configResponse.json(); if (configData.whatsappUrl) { setWhatsappLink(configData.whatsappUrl); } }
                 else { console.error("Fetch config falló:", configResponse.status); }
            } catch (error) { console.error("Error fetch config:", error); }

            // ===== Fetch Imágenes Alberca =====
            try {
                const poolImagesResponse = await fetch('http://localhost:5000/api/gallery/pool');
                if (poolImagesResponse.ok) {
                    const poolUrls = await poolImagesResponse.json();
                    setPoolImages(poolUrls); // Guardar URLs en el estado
                    console.log("Imágenes de alberca cargadas:", poolUrls);
                } else {
                    console.error("Error al cargar imágenes de alberca:", poolImagesResponse.status);
                }
            } catch (error) {
                console.error("Error fetch imágenes alberca:", error);
            }

            // ===== Fetch Imágenes Comida =====
            try {
                const foodImagesResponse = await fetch('http://localhost:5000/api/gallery/food');
                if (foodImagesResponse.ok) {
                    const foodUrls = await foodImagesResponse.json();
                    setFoodImages(foodUrls); // Guardar URLs
                    console.log("Imágenes de comida cargadas:", foodUrls);
                } else {
                    console.error("Error al cargar imágenes de comida:", foodImagesResponse.status);
                }
            } catch (error) { console.error("Error fetch imágenes comida:", error); }

            finally { setAllRooms(roomsData); setLoadingRooms(false); }
        };
        fetchInitialData();
    }, []); // El array vacío asegura que se ejecute solo una vez al montar

    const handleChange = (e) => {
        setSearchData({ ...searchData, [e.target.name]: e.target.value });
        setSearchError(null);
    };

    const handleSearch = async () => {
        console.log("PASO 1: Se hizo clic en Buscar.");
        const { llegada, salida } = searchData;
        setSearchError(null);

        if (!llegada || !salida) {
            console.error("Error: Faltan fechas.");
            setSearchError("Debes seleccionar ambas fechas.");
            return;
        }
        if (new Date(llegada) >= new Date(salida)) {
            console.error("Error: Fechas inválidas.");
            setSearchError("La fecha de salida debe ser posterior a la de llegada.");
            return;
        }

        try {
            const url = `http://localhost:5000/api/habitaciones/disponibles?fechaInicio=${llegada}&fechaFin=${salida}`;
            console.log("PASO 2: Llamando a la API:", url);
            const response = await fetch(url);

            if (!response.ok) {
                let errorMsg = `Error ${response.status} en la API.`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch(e) { /* Ignorar si no es JSON */ }
                console.error("Error en respuesta de API:", errorMsg);
                throw new Error(errorMsg);
            }

            const data = await response.json();
            console.log("PASO 3: Datos recibidos de la API:", data);
            setAvailableRooms(data);
            setSearchId(new Date().getTime());

            console.log("PASO 4: Intentando abrir el modal (setIsModalVisible a true)");
            setIsModalVisible(true);

        } catch (error) {
            console.error("Error durante la búsqueda:", error);
            setSearchError(error.message || "Error de conexión con el servidor.");
        }
    };

    // ===== Funciones Navegación Alberca =====
    const goToNextPoolImage = () => {
        if (poolImages.length > 0) {
             setCurrentPoolImageIndex((prevIndex) => (prevIndex + 1) % poolImages.length);
        }
    };
    const goToPreviousPoolImage = () => {
         if (poolImages.length > 0) {
            setCurrentPoolImageIndex((prevIndex) => (prevIndex - 1 + poolImages.length) % poolImages.length);
         }
    };

    // ===== Funciones Navegación Comida =====
    const goToNextFoodImage = () => {
        if (foodImages.length > 0) {
             setCurrentFoodImageIndex((prevIndex) => (prevIndex + 1) % foodImages.length);
        }
    };
    const goToPreviousFoodImage = () => {
         if (foodImages.length > 0) {
            setCurrentFoodImageIndex((prevIndex) => (prevIndex - 1 + foodImages.length) % foodImages.length);
         }
    };


    return (
        <div className="min-h-screen bg-[#F7F3E9] text-[#1C2A3D] font-sans relative">
            {/* --- Header --- */}
            <header className="flex justify-between items-center py-4 px-8 shadow-lg bg-white sticky top-0 z-50">
                 <div className="flex items-center space-x-3">
                    <img src="/logo-lacasona.png" alt="Logo La Casona" className="h-12 w-auto"/>
                    <h1 className="text-5xl font-lacasona-custom text-cafe-oscuro tracking-wide">La Casona</h1>
                </div>
                <nav className="space-x-8 hidden md:flex font-medium text-lg">
                    <a href="#hotel" className="hover:text-[#6C7D5C]">Hotel</a>
                    <a href="#restaurante" className="hover:text-[#6C7D5C]">Restaurante</a>
                    <a href="#ubicacion" className="hover:text-[#6C7D5C]">Ubicación</a>
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:text-[#6C7D5C]">Contacto</a>
                </nav>
                <button
                    onClick={() => onShowLogin(true)}
                    className="bg-[#6C7D5C] text-white py-2 px-5 rounded-full font-semibold hover:bg-[#5a6b4d]"
                >
                    Administración
                </button>
            </header>

            {/* --- SECCIÓN HERO FIJA --- */}
            <div
                id="hero"
                className="fixed top-0 left-0 w-full bg-cover bg-center z-10"
                style={{ ...heroHeightStyle, backgroundImage: "url('/fachada-hotel.jpg')" }}
            >
                <div className="absolute inset-0 bg-black opacity-50 z-20"></div>
                <div className="relative h-full flex items-center justify-center text-white z-30 text-center p-4">
                    <div>
                        <h2 className="text-6xl md:text-7xl font-extrabold mb-3">Tu Oasis de Tranquilidad</h2>
                        <p className="text-xl font-light">Hotel, Restaurante y Alberca en la Costa Oaxaqueña.</p>
                    </div>
                </div>
            </div>
            {/* --- FIN SECCIÓN HERO FIJA --- */}


            {/* --- DIV CONTENEDOR PRINCIPAL --- */}
            <div className="relative z-20" style={mainPaddingTopStyle}>

                {/* --- BUSCADOR --- */}
                <div className="relative max-w-6xl mx-auto px-4 -mt-16 md:-mt-20 z-40">
                    <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:w-1/4">
                             <label htmlFor="llegada" className="block text-sm font-semibold mb-2">Llegada</label>
                             <div className="relative"><input type="date" id="llegada" name="llegada" value={searchData.llegada} onChange={handleChange} className="w-full p-3 pr-10 border rounded-lg" required /><span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">📅</span></div>
                        </div>
                         <div className="w-full md:w-1/4">
                             <label htmlFor="salida" className="block text-sm font-semibold mb-2">Salida</label>
                             <div className="relative"><input type="date" id="salida" name="salida" value={searchData.salida} onChange={handleChange} className="w-full p-3 pr-10 border rounded-lg" required /><span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">📅</span></div>
                        </div>
                        <div className="w-full md:w-1/4">
                            <label htmlFor="huespedes" className="block text-sm font-semibold mb-2">Huéspedes</label>
                            <div className="relative"><select id="huespedes" name="huespedes" value={searchData.huespedes} onChange={handleChange} className="w-full p-3 pr-10 border rounded-lg appearance-none"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4+</option></select><span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">▼</span></div>
                        </div>
                        <button onClick={handleSearch} className="w-full md:w-1/4 p-3 bg-[#6C7D5C] text-white font-bold rounded-lg text-lg h-[52px] mt-auto hover:bg-[#5a6b4d]">Buscar</button>
                    </div>
                    {searchError && <p className="mt-2 text-center text-red-600 font-medium bg-red-100 p-2 rounded-lg shadow-inner">{searchError}</p>}
                </div>
                {/* --- FIN BUSCADOR --- */}

                {/* Contenido principal de la página */}
                <main className="max-w-6xl mx-auto p-8 pt-12 md:pt-16 bg-transparent relative">
                    {initialLoadError && (
                        <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded text-center">
                            <p className="font-bold">¡Error!</p> <p>{initialLoadError}</p>
                        </div>
                    )}
                    {/* Sección Hotel - Usa RoomCard */}
                    <section id="hotel" className="py-12">
                        <h3 className="text-4xl font-extrabold text-center mb-12">Nuestras <span className="text-[#D4AF37]">Habitaciones</span></h3>
                        {loadingRooms ? <p className="text-center text-lg">Cargando...</p> : !initialLoadError && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {allRooms.map((room) => (
                                    <RoomCard
                                        key={room._id}
                                        room={room}
                                        onReserveClick={handleSearch}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    <hr className="my-16 border-gray-300/50" />

                    {/* Sección Restaurante y Alberca */}
                    <section id="restaurante" className="py-12 px-6 md:px-12 rounded-xl border border-gray-300/30 bg-white/70 backdrop-blur-sm shadow-md">
                         <h3 className="text-4xl font-extrabold text-center mb-12">Restaurante y <span className="text-[#D4AF37]">Alberca</span></h3>
                         
                         {/* ===== INICIO: Grid Restaurante CORREGIDO ===== */}
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            {/* Columna Izquierda - Carrusel Comida */}
                            <div className="h-80 rounded-xl shadow-lg relative group overflow-hidden bg-gray-200">
                                {foodImages.length > 0 ? (
                                    <>
                                        {/* Imagen de fondo */}
                                        <div
                                            className="h-full w-full bg-cover bg-center transition-opacity duration-500 ease-in-out"
                                            style={{ backgroundImage: `url('http://localhost:5000${foodImages[currentFoodImageIndex]}')` }}
                                            key={`food-${currentFoodImageIndex}`}
                                        ></div>
                                        {/* Botones */}
                                        {foodImages.length > 1 && (
                                            <>
                                                <button onClick={goToPreviousFoodImage} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 focus:outline-none transition-opacity opacity-0 group-hover:opacity-100 z-10" aria-label="Anterior Comida">❮</button>
                                                <button onClick={goToNextFoodImage} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 focus:outline-none transition-opacity opacity-0 group-hover:opacity-100 z-10" aria-label="Siguiente Comida">❯</button>
                                                {/* Indicadores */}
                                                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    {foodImages.map((_, index) => (
                                                        <span key={index} className={`block h-2 w-2 rounded-full cursor-pointer ${index === currentFoodImageIndex ? 'bg-white' : 'bg-gray-400 hover:bg-gray-200'}`} onClick={() => setCurrentFoodImageIndex(index)}></span>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    // Placeholder Comida
                                    <div className="h-full w-full flex items-center justify-center text-gray-500 italic" style={{ backgroundImage: "url('https://source.unsplash.com/600x400/?mexican+restaurant,oaxaca+cuisine')" }}>
                                        <div className="h-full w-full flex items-center justify-center bg-black bg-opacity-30 text-white p-4">
                                            Galería no disponible
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Columna Derecha - Texto Restaurante (Botón eliminado) */}
                             <div>
                                 <h4 className="text-3xl font-bold text-[#6C7D5C] mb-4">Sabores Oaxaqueños</h4>
                                 <p className="text-lg text-gray-800 mb-6">Ingredientes locales frescos en un ambiente rústico.</p>
                                 {/* Botón "Ver Menú" ELIMINADO */}
                             </div>
                         </div>
                         {/* ===== FIN: Grid Restaurante CORREGIDO ===== */}

                         {/* Grid Alberca */}
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-16">
                             {/* Columna Texto Alberca */}
                             <div>
                                 <h4 className="text-3xl font-bold text-[#6C7D5C] mb-4">Relájate en la Alberca</h4>
                                 <p className="text-lg text-gray-800 mb-6">Disfruta del clima de Oaxaca en nuestra alberca.</p>
                             </div>
                             {/* Columna Carrusel Alberca */}
                             <div className="h-80 rounded-xl shadow-lg relative group overflow-hidden bg-gray-200">
                                {poolImages.length > 0 ? (
                                    <>
                                        {/* Imagen de fondo */}
                                        <div
                                            className="h-full w-full bg-cover bg-center transition-opacity duration-500 ease-in-out"
                                            style={{ backgroundImage: `url('http://localhost:5000${poolImages[currentPoolImageIndex]}')` }}
                                            key={`pool-${currentPoolImageIndex}`}
                                        ></div>
                                        {/* Botones */}
                                        {poolImages.length > 1 && (
                                            <>
                                                <button onClick={goToPreviousPoolImage} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 focus:outline-none transition-opacity opacity-0 group-hover:opacity-100 z-10" aria-label="Anterior Alberca">❮</button>
                                                <button onClick={goToNextPoolImage} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 focus:outline-none transition-opacity opacity-0 group-hover:opacity-100 z-10" aria-label="Siguiente Alberca">❯</button>
                                                {/* Indicadores */}
                                                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    {poolImages.map((_, index) => (
                                                        <span key={index} className={`block h-2 w-2 rounded-full cursor-pointer ${index === currentPoolImageIndex ? 'bg-white' : 'bg-gray-400 hover:bg-gray-200'}`} onClick={() => setCurrentPoolImageIndex(index)}></span>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    // Placeholder Alberca
                                    <div className="h-full w-full flex items-center justify-center text-gray-500 italic">
                                        Galería no disponible
                                    </div>
                                )}
                             </div>
                        </div>
                    </section>

                    <hr className="my-16 border-gray-300/50" />

                    {/* Sección Ubicación */}
                   <section id="ubicacion" className="py-12 px-6 md:px-12 rounded-xl border border-gray-300/30 bg-white/70 backdrop-blur-sm shadow-md">
                        <h3 className="text-4xl font-extrabold text-center mb-12">Nuestra <span className="text-[#D4AF37]">Ubicación</span></h3>
                        <div className="rounded-xl overflow-hidden shadow-lg">
                            
                            {/* --- Tu iframe adaptado para React/Tailwind --- */}
                            <iframe 
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3840.3865245912934!2d-96.5379755263523!3d15.730678748415245!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85b8d7a645836183%3A0xaa2fd69b1b5b584d!2sPalapa%20La%20Casona!5e0!3m2!1ses-419!2smx!4v1761617292777!5m2!1ses-419!2smx" // La URL que copiaste
                                width="100%" 
                                height="450" 
                                style={{ border: 0 }} // 'style' en JSX usa doble llave
                                allowFullScreen="" // 'allowfullscreen' se convierte en 'allowFullScreen'
                                loading="lazy" 
                                referrerPolicy="no-referrer-when-downgrade"
                                className="w-full" // Asegura que ocupe el 100% del ancho
                            ></iframe>
                            {/* --- Fin del iframe --- */}
                            
                            <div className="p-6 text-center rounded-b-xl bg-white/70 backdrop-blur-sm">
                                <p className="text-xl font-semibold mb-4">{LOCATION_DATA.displayAddress}</p>
                                <a href={LOCATION_DATA.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center py-3 px-8 bg-[#D4AF37] text-[#1C2A3D] font-bold rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.243-4.243m10.606 0a3.5 3.5 0 11-5.656 0m5.656 0H12m-5.657 0a3.5 3.5 0 11-5.656 0M12 10a2 2 0 100-4 2 2 0 000 4z" /></svg>
                                    Google Maps
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* Sección Contacto */}
                    <section id="contacto" className="py-16 text-center mt-16 p-12 rounded-xl border border-gray-300/30 bg-white/70 backdrop-blur-sm shadow-md">
                        <h3 className="text-3xl font-extrabold mb-4">¿Tienes Preguntas?</h3>
                        <p className="text-lg text-gray-800 mb-6">Llámanos o envíanos un mensaje.</p>
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-4xl font-bold text-[#D4AF37] hover:underline">
                            <span className="text-[#25D366]">WhatsApp</span> / Llámanos
                        </a>
                    </section>
                </main>
            </div>
            {/* --- FIN DIV CONTENEDOR --- */}

            <footer className="bg-[#1C2A3D] text-white py-10 text-center mt-20 relative z-20">
                <p className="text-sm">© {new Date().getFullYear()} Palapa La Casona.</p>
                <p className="text-xs mt-2 text-gray-400">Oaxaca.</p>
            </footer>

            {/* --- Modal de Reservas --- */}
            {isModalVisible && (
                <ReservationModal
                    key={searchId}
                    isVisible={isModalVisible}
                    onClose={() => setIsModalVisible(false)}
                    searchData={searchData}
                    availableRooms={availableRooms}
                />
            )}
        </div>
    );
};

export default PublicHome;