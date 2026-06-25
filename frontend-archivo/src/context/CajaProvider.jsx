import { useState, useEffect } from 'react';
import api from '../services/api'; // Ajusta la ruta a tu api.js si es necesario
import { CajaContext } from './CajaContext';

export const CajaProvider = ({ children }) => {
    const [movimientos, setMovimientos] = useState([]);
    const [loadingCaja, setLoadingCaja] = useState(true);

    const cargarMovimientos = async () => {
        try {
            const res = await api.get('/caja/ingresos');
            setMovimientos(res.data);
        } catch (error) {
            console.error("Error crítico al recuperar movimientos de caja:", error);
        } finally {
            setLoadingCaja(false);
        }
    };

    useEffect(() => {
        // 🔥 SOLUCIÓN AL CASCADING: Envolvemos la ejecución de forma aislada
        let activo = true;

        const inicializarCaja = async () => {
            if (activo) {
                await cargarMovimientos();
            }
        };

        inicializarCaja();

        return () => {
            activo = false;
        };
    }, []);

    return (
        <CajaContext.Provider value={{ movimientos, loadingCaja, refrescarCaja: cargarMovimientos }}>
            {children}
        </CajaContext.Provider>
    );
};