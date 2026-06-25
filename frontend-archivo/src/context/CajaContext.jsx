import { createContext, useContext } from 'react';

// 1. Creamos el contexto raíz con un valor inicial nulo
export const CajaContext = createContext(null);

// 2. Hook personalizado para consumir la data de forma directa en el Front
export function useCaja() {
    const context = useContext(CajaContext);
    if (!context) {
        console.warn("useCaja debe ser usado estrictamente dentro de un CajaProvider");
    }
    return context;
}