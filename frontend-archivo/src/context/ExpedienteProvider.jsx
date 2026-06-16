import { useState, useEffect, useCallback } from 'react';
import { ExpedienteContext } from './ExpedienteContext';
import api from '../services/api';

export function ExpedienteProvider({ children }) {
    const [expedientes, setExpedientes] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🚀 Encapsulamos la descarga con useCallback para que esté disponible de forma estable
    const cargarDatosGlobales = useCallback(async () => {
        try {
            setLoading(true);
            const [resExp, resTipos] = await Promise.all([
                api.get('/expedientes'),
                api.get('/tipos-documento')
            ]);

            const dataReal = resExp.data.data ? resExp.data.data : resExp.data;
            const expedientesLista = dataReal || [];

            const ordenados = expedientesLista.sort((a, b) => {
                const tiempoB = new Date(b.updated_at || b.created_at).getTime();
                const tiempoA = new Date(a.updated_at || a.created_at).getTime();
                return tiempoB - tiempoA;
            });

            setExpedientes(ordenados);
            setTipos(resTipos.data || []);
        } catch (error) {
            console.error("Error en la carga global de datos:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const iniciarCarga = async () => {
            const tokenActivo = localStorage.getItem('token');

            if (!tokenActivo) {
                setLoading(false);
                return;
            }

            await cargarDatosGlobales();
        };

        iniciarCarga();
    }, [cargarDatosGlobales]);

    const refrescarData = () => {
        cargarDatosGlobales();
    };

    return (
        <ExpedienteContext.Provider value={{ expedientes, tipos, loading, refrescarData }}>
            {children}
        </ExpedienteContext.Provider>
    );
}