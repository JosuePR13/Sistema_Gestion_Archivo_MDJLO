export default function StatusBadge({ estado }) {
    switch (estado) {
        case 'Pendiente':
            return (
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black tracking-wider uppercase border border-amber-200">
                    Pendiente
                </span>
            );
        case 'Aceptada':
            return (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black tracking-wider uppercase border border-emerald-200">
                    Aceptada
                </span>
            );
        case 'Rechazada':
            return (
                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black tracking-wider uppercase border border-rose-200">
                    Rechazada
                </span>
            );
        default:
            return (
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black tracking-wider uppercase border border-slate-200">
                    {estado || 'Desconocido'}
                </span>
            );
    }
}