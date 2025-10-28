import React, { useState, useEffect } from 'react';
import ReservationModal from './ReservationModal';
import RoomCard from './RoomCard'; // <-- Importa el nuevo componente

// DATOS DE UBICACIÓN
const LOCATION_DATA = {
    name: "Palapa La Casona",
    address: "Carretera Costera 200, Llano Grande, 70947 San Pedro Pochutla, Oax.",
    mapsUrl: "YOUR_GOOGLE_MAPS_URL_HERE", // Reemplaza con tu URL real o usa una variable de entorno
    displayAddress: "Carretera Costera 200, Llano Grande, San Pedro Pochutla, Oax."
};

// YA NO NECESITAMOS getRoomDescription aquí, se movió a RoomCard.jsx

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

    // Altura del hero a 100vh
    const heroHeightVh = 100;
    const heroHeightStyle = { height: `${heroHeightVh}vh` };
    const mainPaddingTopStyle = { paddingTop: `${heroHeightVh}vh` };

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoadingRooms(true);
            setInitialLoadError(null);
            let roomsData = [];
            try {
                // Ahora esta ruta debe devolver el array imageUrls
                const roomsResponse = await fetch('http://localhost:5000/api/habitaciones');
                if (!roomsResponse.ok) { throw new Error(`Error ${roomsResponse.status} al cargar habitaciones`); }
                roomsData = await roomsResponse.json();
                console.log("Habitaciones cargadas:", roomsData); // Verifica si llega imageUrls
            } catch (error) { console.error("Error fetch habitaciones:", error); setInitialLoadError(error.message); }
            try {
                const configResponse = await fetch('http://localhost:5000/api/config/contacto');
                 if (configResponse.ok) { const configData = await configResponse.json(); if (configData.whatsappUrl) { setWhatsappLink(configData.whatsappUrl); } }
                 else { console.error("Fetch config falló:", configResponse.status); }
            } catch (error) { console.error("Error fetch config:", error); }
            finally { setAllRooms(roomsData); setLoadingRooms(false); }
        };
        fetchInitialData();
    }, []);

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
                                {/* ===== INICIO USO RoomCard ===== */}
                                {allRooms.map((room) => (
                                    <RoomCard
                                        key={room._id}
                                        room={room}
                                        onReserveClick={handleSearch} // Pasa la función handleSearch para el botón Reservar
                                    />
                                ))}
                                {/* ===== FIN USO RoomCard ===== */}
                            </div>
                        )}
                    </section>

                    <hr className="my-16 border-gray-300/50" />

                    {/* Sección Restaurante */}
                    <section id="restaurante" className="py-12 px-6 md:px-12 rounded-xl border border-gray-300/30 bg-white/70 backdrop-blur-sm shadow-md">
                         <h3 className="text-4xl font-extrabold text-center mb-12">Restaurante y <span className="text-[#D4AF37]">Alberca</span></h3>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                             <div className="h-80 rounded-xl shadow-lg bg-cover bg-center" style={{ backgroundImage: "url('https://source.unsplash.com/600x400/?mexican+restaurant,oaxaca+cuisine')" }}></div>
                             <div>
                                 <h4 className="text-3xl font-bold text-[#6C7D5C] mb-4">Sabores Oaxaqueños</h4>
                                 <p className="text-lg text-gray-800 mb-6">Ingredientes locales frescos en un ambiente rústico.</p>
                                 <a href="#" className="inline-block py-3 px-6 bg-[#6C7D5C] text-white font-semibold rounded-lg">Ver Menú</a>
                             </div>
                         </div>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-16">
                             <div>
                                 <h4 className="text-3xl font-bold text-[#6C7D5C] mb-4">Relájate en la Alberca</h4>
                                 <p className="text-lg text-gray-800 mb-6">Disfruta del clima de Oaxaca en nuestra alberca.</p>
                                 <a href="#" className="inline-block py-3 px-6 bg-[#6C7D5C] text-white font-semibold rounded-lg">Ver Galería</a>
                             </div>
                             <div className="h-80 rounded-xl shadow-lg bg-cover bg-center" style={{ backgroundImage: "url('https://source.unsplash.com/600x400/?oaxaca+pool,hotel+swimming')" }}></div>
                        </div>
                    </section>

                    <hr className="my-16 border-gray-300/50" />

                    {/* Sección Ubicación */}
                    <section id="ubicacion" className="py-12 px-6 md:px-12 rounded-xl border border-gray-300/30 bg-white/70 backdrop-blur-sm shadow-md">
                        <h3 className="text-4xl font-extrabold text-center mb-12">Nuestra <span className="text-[#D4AF37]">Ubicación</span></h3>
                        <div className="rounded-xl overflow-hidden">
                            {/* Reemplaza TU_CLAVE_DE_API_AQUI con tu clave real de Google Maps Static API si quieres usarla */}
                            <a href={LOCATION_DATA.mapsUrl} target="_blank" rel="noopener noreferrer" title="Navegar" className="block h-96 w-full relative group">
                                <div className="h-full w-full bg-gray-300 bg-cover bg-center" style={{ backgroundImage: "url('https://maps.googleapis.com/maps/api/staticmap?center=15.73067,-96.53540&zoom=14&size=600x400&markers=color:red%7Clabel:P%7C15.73067,-96.53540&key=TU_CLAVE_DE_API_AQUI')" }}>
                                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100"><p className="text-white text-2xl font-bold">🗺️ Toca para Navegar</p></div>
                                </div>
                            </a>
                            <div className="p-6 text-center rounded-b-xl">
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