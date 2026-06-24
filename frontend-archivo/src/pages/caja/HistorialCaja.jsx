export default function HistorialCaja() {
    return (
        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-8 bg-emerald-500 rounded-full shadow-sm"></div>
                <div className="flex flex-col">
                    <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Historial de Caja</h1>
                    <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Control Operativo de Liquidaciones Diarias</span>
                </div>
            </div>
            <p className="text-sm font-semibold text-slate-500 italic">
                Módulo listo para listar los vouchers de pago de copias certificadas y fedateadas del TUPA municipal (MDJLO).
            </p>
        </div>
    );
}