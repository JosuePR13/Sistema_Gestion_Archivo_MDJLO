import { useContext } from 'react';
import { ExpedienteContext } from './ExpedienteContext';

export function useExpedientes() {
    return useContext(ExpedienteContext);
}