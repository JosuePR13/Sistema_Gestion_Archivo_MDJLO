import { useState, useMemo, useEffect, useRef } from 'react';
import { useCaja } from '../../context/CajaContext';
import CustomDropdown from '../../components/CustomDropdown';
import { Chart } from 'chart.js/auto';

// ==========================================
// COMPONENTES AUXILIARES Y CONFIGURACIÓN
// ==========================================

/**
 * KpiCard - Componente modular horizontal para visualización de métricas
 */
const KpiCard = ({ title, value, prefix = "", suffix = "", icon, theme }) => (
    <div className={`relative overflow-hidden p-5 rounded-2xl border ${theme.border} ${theme.bg} transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex items-center justify-between gap-3`}>
        <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-20 blur-xl ${theme.decoration} pointer-events-none`}></div>

        <div className="relative z-10 flex flex-col">
            <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${theme.textLabel}`}>{title}</p>
            <p className={`text-2xl font-black tracking-tight ${theme.textValue}`}>
                {prefix}{value}{suffix}
            </p>
        </div>

        <div className={`relative z-10 w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/60 backdrop-blur-md shadow-sm ${theme.textValue}`}>
            {icon}
        </div>
    </div>
);

const kpiThemes = {
    emerald: { bg: 'bg-emerald-50/70', border: 'border-emerald-200/50', textLabel: 'text-emerald-700/70', textValue: 'text-emerald-800', decoration: 'bg-emerald-500' },
    blue: { bg: 'bg-blue-50/70', border: 'border-blue-200/50', textLabel: 'text-blue-700/70', textValue: 'text-blue-800', decoration: 'bg-blue-500' },
    purple: { bg: 'bg-purple-50/70', border: 'border-purple-200/50', textLabel: 'text-purple-700/70', textValue: 'text-purple-800', decoration: 'bg-purple-500' },
    rose: { bg: 'bg-rose-50/70', border: 'border-rose-200/50', textLabel: 'text-rose-700/70', textValue: 'text-rose-800', decoration: 'bg-rose-500' },
    amber: { bg: 'bg-amber-50/70', border: 'border-amber-200/50', textLabel: 'text-amber-700/70', textValue: 'text-amber-800', decoration: 'bg-amber-500' },
    cyan: { bg: 'bg-cyan-50/70', border: 'border-cyan-200/50', textLabel: 'text-cyan-700/70', textValue: 'text-cyan-800', decoration: 'bg-cyan-500' },
    teal: { bg: 'bg-teal-50/70', border: 'border-teal-200/50', textLabel: 'text-teal-700/70', textValue: 'text-teal-800', decoration: 'bg-teal-500' },
    indigo: { bg: 'bg-indigo-50/70', border: 'border-indigo-200/50', textLabel: 'text-indigo-700/70', textValue: 'text-indigo-800', decoration: 'bg-indigo-500' },
};

export default function ReporteCostos() {
    // Consumo del estado global de Caja mediante Contexto
    const { movimientos, loadingCaja } = useCaja();

    // --- ESTADOS INDEPENDIENTES PARA FILTROS DE GRÁFICOS ---
    const [demandaMes, setDemandaMes] = useState('Todos');
    const [demandaAnio, setDemandaAnio] = useState('2026');
    const [tendenciaAnio, setTendenciaAnio] = useState('2026');

    // --- REFERENCIAS PARA RENDERS Y CONTROL DE INSTANCIAS ---
    const chartTendenciaRef = useRef(null);
    const chartDemandaRef = useRef(null);
    const chartInstanceTendencia = useRef(null);
    const chartInstanceDemanda = useRef(null);

    // Memorización de la fecha actual ajustada estrictamente a la hora de Perú
    const fechaHoyStr = useMemo(() => {
        const hoy = new Date();
        const opciones = { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' };
        const formateador = new Intl.DateTimeFormat('fr-CA', opciones);
        return formateador.format(hoy);
    }, []);

    // Extracción dinámica de años disponibles en el dataset
    const opcionesAnios = useMemo(() => {
        const anosSet = new Set();
        movimientos.forEach(m => {
            if (m.fecha_solicitud) {
                const ano = m.fecha_solicitud.substring(0, 4);
                if (/^\d{4}$/.test(ano)) anosSet.add(ano);
            }
        });
        anosSet.add('2026');
        return ['Todos', ...Array.from(anosSet).sort((a, b) => b - a)];
    }, [movimientos]);

    // Opciones estáticas para el filtrado mensualizado
    const opcionesMeses = [
        { value: 'Todos', label: 'Todos los Meses' },
        { value: '01', label: 'Enero' }, { value: '02', label: 'Febrero' },
        { value: '03', label: 'Marzo' }, { value: '04', label: 'Abril' },
        { value: '05', label: 'Mayo' }, { value: '06', label: 'Junio' },
        { value: '07', label: 'Julio' }, { value: '08', label: 'Agosto' },
        { value: '09', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
        { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' }
    ];

    // ==========================================
    // 1. PROCESAMIENTO DE KPIS GLOBALES
    // ==========================================
    const kpisGlobales = useMemo(() => {
        const aprobadasKpi = movimientos.filter(i => i.estado === 'Aceptada');
        const rechazadasKpi = movimientos.filter(i => i.estado === 'Rechazada');

        const totalAceptadasKpi = aprobadasKpi.length;
        const totalRecaudadoKpi = aprobadasKpi.reduce((acc, curr) => acc + (parseFloat(curr.costo_tupa) || 0), 0);
        const totalHojasKpi = aprobadasKpi.reduce((acc, curr) => acc + (parseInt(curr.numero_hojas) || 0), 0);

        const ingresoHoy = movimientos
            .filter(m =>
                m.estado === 'Aceptada' &&
                m.fecha_solicitud &&
                m.fecha_solicitud.trim() !== "" &&
                m.fecha_solicitud.substring(0, 10) === fechaHoyStr
            )
            .reduce((acc, curr) => acc + (parseFloat(curr.costo_tupa) || 0), 0);

        const listaSimplesKpi = aprobadasKpi.filter(i => i.tipo_formato_tupa && i.tipo_formato_tupa.toLowerCase().includes('simple') && !i.tipo_formato_tupa.toLowerCase().includes('mixto'));
        const totalSimplesHojasKpi = listaSimplesKpi.reduce((a, c) => a + (parseInt(c.numero_hojas) || 0), 0);

        const listaFedateadosKpi = aprobadasKpi.filter(i => i.tipo_formato_tupa && i.tipo_formato_tupa.toLowerCase().includes('fedat') && !i.tipo_formato_tupa.toLowerCase().includes('mixto'));
        const totalFedateadosHojasKpi = listaFedateadosKpi.reduce((a, c) => a + (parseInt(c.numero_hojas) || 0), 0);

        const listaMixtosKpi = aprobadasKpi.filter(i => i.tipo_formato_tupa && i.tipo_formato_tupa.toLowerCase().includes('mixto'));
        const totalMixtoHojasKpi = listaMixtosKpi.reduce((a, c) => a + (parseInt(c.numero_hojas) || 0), 0);

        return {
            ingresoHoy,
            totalRecaudadoKpi,
            totalAceptadasKpi,
            totalRechazadasKpi: rechazadasKpi.length,
            totalHojasKpi,
            totalSimplesHojasKpi,
            totalFedateadosHojasKpi,
            totalMixtoHojasKpi
        };
    }, [movimientos, fechaHoyStr]);

    // ==========================================
    // 2. FILTRADO EXCLUSIVO PARA EL GRÁFICO DE DEMANDA
    // ==========================================
    const datosGraficoDemanda = useMemo(() => {
        const aprobadasDemanda = movimientos.filter(i => {
            if (i.estado !== 'Aceptada') return false;
            if (demandaAnio !== 'Todos' && i.fecha_solicitud && !i.fecha_solicitud.startsWith(demandaAnio)) return false;
            if (demandaMes !== 'Todos' && i.fecha_solicitud && i.fecha_solicitud.substring(5, 7) !== demandaMes) return false;
            return true;
        });

        const totalSimples = aprobadasDemanda.filter(i => i.tipo_formato_tupa && i.tipo_formato_tupa.toLowerCase().includes('simple') && !i.tipo_formato_tupa.toLowerCase().includes('mixto')).length;
        const totalFedateados = aprobadasDemanda.filter(i => i.tipo_formato_tupa && i.tipo_formato_tupa.toLowerCase().includes('fedat') && !i.tipo_formato_tupa.toLowerCase().includes('mixto')).length;
        const totalMixtos = aprobadasDemanda.filter(i => i.tipo_formato_tupa && i.tipo_formato_tupa.toLowerCase().includes('mixto')).length;

        return [totalSimples, totalFedateados, totalMixtos];
    }, [movimientos, demandaAnio, demandaMes]);

    // ==========================================
    // 3. ESTRUCTURACIÓN DE DATOS MENSUALES
    // ==========================================
    const datosMensualesAnio = useMemo(() => {
        const mensualidades = Array(12).fill(0);
        movimientos.forEach(m => {
            if (m.estado === 'Aceptada' && m.fecha_solicitud) {
                const ano = m.fecha_solicitud.substring(0, 4);
                if (tendenciaAnio === 'Todos' || ano === tendenciaAnio) {
                    const mesIndex = parseInt(m.fecha_solicitud.substring(5, 7)) - 1;
                    if (mesIndex >= 0 && mesIndex < 12) {
                        mensualidades[mesIndex] += parseFloat(m.costo_tupa) || 0;
                    }
                }
            }
        });
        return mensualidades;
    }, [movimientos, tendenciaAnio]);

    // ==========================================
    // CYCLES DE RENDERIZADO AISLADO
    // ==========================================

    // Inicialización y actualización del Gráfico de Demanda
    useEffect(() => {
        if (loadingCaja || !chartDemandaRef.current) return;

        if (chartInstanceDemanda.current) chartInstanceDemanda.current.destroy();

        const ctxDemanda = chartDemandaRef.current.getContext('2d');
        chartInstanceDemanda.current = new Chart(ctxDemanda, {
            type: 'bar',
            data: {
                labels: ['Copias Simples A4', 'Copias Fedateadas', 'Mixtas'],
                datasets: [{
                    label: 'Trámites Concluidos',
                    data: datosGraficoDemanda,
                    backgroundColor: ['#0891B2', '#0D9488', '#4F46E5'],
                    borderRadius: 6,
                    barThickness: 24
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, grid: { color: '#F1F5F9' }, ticks: { stepSize: 1, font: { size: 11 }, color: '#94A3B8' } },
                    y: { grid: { display: false }, ticks: { font: { size: 12, weight: 'bold' }, color: '#64748B' } }
                }
            }
        });

        return () => {
            if (chartInstanceDemanda.current) chartInstanceDemanda.current.destroy();
        };
    }, [datosGraficoDemanda, loadingCaja]);

    // Inicialización y actualización del Gráfico de Historial de Recaudación
    useEffect(() => {
        if (loadingCaja || !chartTendenciaRef.current) return;

        if (chartInstanceTendencia.current) chartInstanceTendencia.current.destroy();

        const ctxTendencia = chartTendenciaRef.current.getContext('2d');
        const gradient = ctxTendencia.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(15, 76, 129, 0.25)');
        gradient.addColorStop(1, 'rgba(15, 76, 129, 0.0)');

        chartInstanceTendencia.current = new Chart(ctxTendencia, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'],
                datasets: [{
                    label: 'Recaudación',
                    data: datosMensualesAnio,
                    borderColor: '#0F4C81',
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#0F4C81',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    fill: true,
                    backgroundColor: gradient,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += 'S/. ' + context.parsed.y.toFixed(2);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94A3B8' } },
                    y: {
                        beginAtZero: true,
                        grid: { color: '#F1F5F9', borderDash: [5, 5] },
                        ticks: {
                            font: { size: 11 },
                            color: '#94A3B8',
                            callback: (value) => 'S/. ' + value.toFixed(2)
                        }
                    }
                }
            }
        });

        return () => {
            if (chartInstanceTendencia.current) chartInstanceTendencia.current.destroy();
        };
    }, [datosMensualesAnio, loadingCaja]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 animate-fade-in">
            <div className="max-w-[1200px] w-full mx-auto space-y-8">

                {/* --- CABECERA PRINCIPAL --- */}
                <div className="relative overflow-hidden bg-gradient-to-r from-purple-500/20 via-purple-100/40 to-transparent p-6 sm:px-8 sm:py-6 rounded-3xl border border-purple-200/80 shadow-[0_4px_25px_rgb(0,0,0,0.02)] flex items-center gap-4 z-40">
                    <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-40 blur-xl bg-purple-300 pointer-events-none"></div>
                    <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-200/60 flex items-center justify-center text-purple-600 relative z-10 shadow-sm shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2v7H3zm5-6h2v13H8zm5 9h2v4h-2zm5-12h2v16h-2z" />
                        </svg>
                    </div>
                    <div className="flex flex-col relative z-10 text-left">
                        <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Reporte de Costos</h1>
                        <span className="text-[11px] font-black text-purple-700 mt-1.5 uppercase tracking-wider">Auditoría histórica de caja</span>
                    </div>
                </div>

                {loadingCaja ? (
                    <div className="py-20 text-center text-sm font-bold text-slate-400">
                        🔄 Sincronizando balance de la base de datos...
                    </div>
                ) : (
                    <>
                        {/* --- RENDERING DE REJILLA DE INDICADORES (8 KPIs) --- */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
                            <KpiCard
                                title="Ingreso del Día" value={kpisGlobales.ingresoHoy.toFixed(2)} prefix="S/. " theme={kpiThemes.amber}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                            />
                            <KpiCard
                                title="Recaudado Neto" value={kpisGlobales.totalRecaudadoKpi.toFixed(2)} prefix="S/. " theme={kpiThemes.emerald}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>}
                            />
                            <KpiCard
                                title="Solic. Aceptadas" value={kpisGlobales.totalAceptadasKpi} theme={kpiThemes.blue}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            />
                            <KpiCard
                                title="Solic. Rechazadas" value={kpisGlobales.totalRechazadasKpi} theme={kpiThemes.rose}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            />
                            <KpiCard
                                title="Copias Emitidas" value={kpisGlobales.totalHojasKpi} theme={kpiThemes.purple}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>}
                            />
                            <KpiCard
                                title="Copias simples A4" value={kpisGlobales.totalSimplesHojasKpi} theme={kpiThemes.cyan}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                            />
                            <KpiCard
                                title="Copias Fedateadas" value={kpisGlobales.totalFedateadosHojasKpi} theme={kpiThemes.teal}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>}
                            />
                            <KpiCard
                                title="Copias Mixtas" value={kpisGlobales.totalMixtoHojasKpi} theme={kpiThemes.indigo}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                            />
                        </div>

                        {/* --- SECCIÓN DE BLOQUES GRÁFICOS --- */}
                        <div className="flex flex-col gap-8 relative z-10">

                            {/* Gráfico Demanda de copias */}
                            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-[0_4px_25px_rgb(0,0,0,0.02)] flex flex-col space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-wider">Demanda de copias</h3>
                                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">Volumen de trámites concluidos por modalidad</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 z-30">
                                        <div className="w-40">
                                            <CustomDropdown options={opcionesMeses} selectedValue={demandaMes} onSelect={setDemandaMes} color="purple" />
                                        </div>
                                        <div className="w-32">
                                            <CustomDropdown options={opcionesAnios.map(a => ({ value: a, label: a === 'Todos' ? 'Histórico' : a }))} selectedValue={demandaAnio} onSelect={setDemandaAnio} color="purple" />
                                        </div>
                                    </div>
                                </div>
                                <div className="relative h-60 w-full z-10">
                                    <canvas ref={chartDemandaRef}></canvas>
                                </div>
                            </div>

                            {/* Gráfico Historial de Recaudación */}
                            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-[0_4px_25px_rgb(0,0,0,0.02)] flex flex-col space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-wider">Historial de Recaudación</h3>
                                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">Evolución mensual - anual</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 z-20">
                                        <div className="w-32">
                                            <CustomDropdown options={opcionesAnios.map(a => ({ value: a, label: a === 'Todos' ? 'Histórico' : a }))} selectedValue={tendenciaAnio} onSelect={setTendenciaAnio} color="purple" />
                                        </div>
                                    </div>
                                </div>
                                <div className="relative h-72 w-full z-10">
                                    <canvas ref={chartTendenciaRef}></canvas>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}