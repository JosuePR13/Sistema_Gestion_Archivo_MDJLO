import { createContext, useContext } from 'react';

export const CajaContext = createContext(null);

export function useCaja() {
    const context = useContext(CajaContext);
    if (!context) {
        console.warn("useCaja debe ser usado estrictamente dentro de un CajaProvider");
    }
    return context;
}