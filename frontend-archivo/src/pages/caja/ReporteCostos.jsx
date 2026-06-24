export default function ReporteCostos() {
    return (
        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full shadow-sm"></div>
                <div className="flex flex-col">
                    <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Reporte de Costos</h1>
                    <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Estadísticas y Métricas de Recaudación Institucional</span>
                </div>
            </div>
            <p className="text-sm font-semibold text-slate-500 italic">
                Módulo analítico listo para proyectar gráficos de recaudación mensual y trámites de mayor demanda de la gerencia.
            </p>
        </div>
    );
}