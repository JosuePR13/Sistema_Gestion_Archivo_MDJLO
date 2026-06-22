import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import SolicitudContext from './SolicitudContext';

export function SolicitudProvider({ children }) {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);

    const cargarSolicitudes = useCallback(async () => {
        try {
            const res = await api.get('/solicitudes');
            setSolicitudes(res.data);
        } catch (error) {
            console.error("Error global al cargar solicitudes:", error);
        } finally {
            setLoadingSolicitudes(false);
        }
    }, []);

    useEffect(() => {
        let activo = true;

        const ejecutarCarga = async () => {
            const tokenActivo = localStorage.getItem('token');

            const tokenEsValido =
                typeof tokenActivo === 'string' &&
                tokenActivo.trim() !== '' &&
                tokenActivo !== 'undefined' &&
                tokenActivo !== 'null';

            if (!tokenEsValido) {
                if (activo) {
                    setLoadingSolicitudes(false);
                }

                return;
            }

            if (activo) {
                await cargarSolicitudes();
            }
        };

        ejecutarCarga();

        return () => {
            activo = false;
        };
    }, [cargarSolicitudes]);

    return (
        <SolicitudContext.Provider
            value={{
                solicitudes,
                loadingSolicitudes,
                refrescarSolicitudes: cargarSolicitudes
            }}
        >
            {children}
        </SolicitudContext.Provider>
    );
}