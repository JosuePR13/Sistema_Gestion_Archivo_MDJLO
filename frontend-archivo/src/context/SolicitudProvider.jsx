import { useState, useEffect } from 'react';
import api from '../services/api';
import SolicitudContext from './SolicitudContext';

export function SolicitudProvider({ children }) {
    const [solicitudes, setSolicitudes] = useState([]);
    // 🚀 Optimización React 19: Nace directamente en true para evitar el setState síncrono inicial
    const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);

    const cargarSolicitudes = async () => {
        try {
            const res = await api.get('/solicitudes');
            setSolicitudes(res.data);
        } catch (error) {
            console.error("Error global al cargar solicitudes:", error);
        } finally {
            setLoadingSolicitudes(false);
        }
    };

    // 🚀 CORRECCIÓN: Llamada asíncrona limpia compatible con las directrices de React 19
    useEffect(() => {
        let activo = true;

        const ejecutarCarga = async () => {
            if (activo) {
                await cargarSolicitudes();
            }
        };

        ejecutarCarga();

        return () => {
            activo = false;
        };
    }, []);

    return (
        <SolicitudContext.Provider value={{ solicitudes, loadingSolicitudes, refrescarSolicitudes: cargarSolicitudes }}>
            {children}
        </SolicitudContext.Provider>
    );
}