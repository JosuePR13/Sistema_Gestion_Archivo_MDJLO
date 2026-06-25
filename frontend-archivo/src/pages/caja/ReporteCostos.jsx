import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ReporteCostos() {
    const [ingresos, setIngresos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDatos = async () => {
            try {
                const res = await api.get('/caja/ingresos');
                setIngresos(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDatos();
    }, []);

    // Métricas del Reporte
    const totalAceptadas = ingresos.filter(i => i.estado === 'Aceptada').length;
    const totalRechazadas = ingresos.filter(i => i.estado === 'Rechazada').length;
    const totalRecaudado = ingresos.filter(i => i.estado === 'Aceptada').reduce((acc, curr) => acc + (parseFloat(curr.costo_tupa) || 0), 0);
    const totalHojas = ingresos.filter(i => i.estado === 'Aceptada').reduce((acc, curr) => acc + (parseInt(curr.numero_hojas) || 0), 0);

    // Tasa porcentual de rechazo institucional
    const tasaRechazo = ingresos.length ? ((totalRechazadas / ingresos.length) * 100).toFixed(1) : "0.0";

    // Agrupación estadística por tipo de formato
    const conteoFormatos = ingresos.filter(i => i.estado === 'Aceptada').reduce((acc, curr) => {
        const tipo = curr.tipo_formato_tupa || 'Otros';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
    }, {});

    const cardStyles = "bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex items-center justify-between";

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8 animate-fade-in select-none">
            <div className="max-w-[1200px] w-full mx-auto space-y-8">

                {/* Título */}
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-blue-600 rounded-full shadow-sm"></div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Auditoría Financiera de Costos</h1>
                        <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Balance Ejecutivo y de Recaudación Distrital TUPA</span>
                    </div>
                </div>

                {loading ? (
                    <p className="text-center text-sm font-bold text-slate-400 py-12">Calculando estadísticas consolidadas...</p>
                ) : (
                    <>
                        {/* Fila de Kpis */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                            <div className={cardStyles}>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recaudación Total</p>
                                    <p className="text-xl font-black text-emerald-600 mt-1">S/. {totalRecaudado.toFixed(2)}</p>
                                </div>
                                <span className="text-xl">💰</span>
                            </div>

                            <div className={cardStyles}>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trámites Aprobados</p>
                                    <p className="text-xl font-black text-slate-800 mt-1">{totalAceptadas} Solicitudes</p>
                                </div>
                                <span className="text-xl">🟢</span>
                            </div>

                            <div className={cardStyles}>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Folios Emitidos</p>
                                    <p className="text-xl font-black text-slate-800 mt-1">{totalHojas} Hojas</p>
                                </div>
                                <span className="text-xl">📄</span>
                            </div>

                            <div className={cardStyles}>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasa de Denegación</p>
                                    <p className="text-xl font-black text-rose-600 mt-1">{tasaRechazo}% (Anulados)</p>
                                </div>
                                <span className="text-xl">🔴</span>
                            </div>
                        </div>

                        {/* Desglose Estadístico Visual */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6">
                            <div>
                                <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-wider">Demanda e Impacto de Formatos</h3>
                                <p className="text-[11px] font-bold text-slate-400 mt-0.5">Distribución porcentual de liquidaciones de caja completadas</p>
                            </div>

                            <div className="space-y-4 pt-2">
                                {Object.entries(conteoFormatos).map(([formato, cantidad]) => {
                                    const porcentaje = totalAceptadas ? ((cantidad / totalAceptadas) * 100).toFixed(1) : "0.0";
                                    return (
                                        <div key={formato} className="space-y-2">
                                            <div className="flex justify-between text-[13px] font-bold text-slate-700">
                                                <span>{formato}</span>
                                                <span className="text-slate-400">{cantidad} Trámites ({porcentaje}%)</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#0F4C81] rounded-full transition-all duration-1000"
                                                    style={{ width: `${porcentaje}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}