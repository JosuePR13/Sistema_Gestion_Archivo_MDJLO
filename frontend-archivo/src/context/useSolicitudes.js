import { useContext } from 'react';
import SolicitudContext from '../context/SolicitudContext';

export const useSolicitudes = () => {
    const context = useContext(SolicitudContext);
    if (!context) {
        throw new Error('useSolicitudes debe ser utilizado dentro de un SolicitudProvider');
    }
    return context;
};