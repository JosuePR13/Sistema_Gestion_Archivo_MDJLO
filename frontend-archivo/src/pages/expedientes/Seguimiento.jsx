import { useState, useEffect, useRef, useMemo } from 'react';
import { useExpedientes } from '../../context/useExpedientes';
import CustomDropdown from '../../components/CustomDropdown';
import { Chart } from 'chart.js/auto';

export default function SeguimientoScreen({ setScreen }) {
    // --- CONSUMO DE ESTADO GLOBAL ---
    const { expedientes: dataGlobal, loading } = useExpedientes();

    // --- ESTADOS LOCALES DE CONTROL Y FILTRADO ---
    const [filterEstado, setFilterEstado] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;

    // --- REFERENCIAS REACTIVAS PARA RENDERS E INSTANCIAS DE CHART.JS ---
    const chartDonaRef = useRef(null);
    const chartBarraRef = useRef(null);
    const instanceDonaRef = useRef(null);
    const instanceBarraRef = useRef(null);

    // =========================================================================
    // LÓGICA MATEMÁTICA: PROCESAMIENTO CRONOLÓGICO DE VIGENCIA DOCUMENTAL
    // =========================================================================
    const procesarVigencia = (data) => {
        return data.map(exp => {
            // 1. Normalización y fallback del punto de partida temporal del expediente
            const fechaBase = exp.fecha_ingreso || exp.created_at || new Date().toISOString();
            const fechaDoc = new Date(fechaBase);
            const hoy = new Date();

            // Forzar reseteo de horas para una comparación aritmética exacta basada en días netos
            fechaDoc.setHours(0, 0, 0, 0);
            hoy.setHours(0, 0, 0, 0);

            // 2. Cálculo de días transcurridos y conversión exacta a factor de años
            const diffDays = Math.floor((hoy - fechaDoc) / (1000 * 60 * 60 * 24));
            const anosCalculados = diffDays / 365.25;

            // 3. Parseo analítico del tiempo de conservación establecido por la directiva
            let limiteAnos = 5; // Fallback institucional estándar (5 años)
            const conservStr = (exp.tiempo_conservacion?.toString() || '5 años').toLowerCase();

            if (conservStr.includes('perma') || conservStr.includes('indefi')) {
                limiteAnos = 999; // Flag numérico para documentos de conservación permanente
            } else {
                const matches = conservStr.match(/[\d.]+/); // Extracción de valores numéricos o decimales
                if (matches) {
                    let valorNum = parseFloat(matches[0]);
                    if (conservStr.includes('mes')) valorNum /= 12; // Conversión proporcional si está en meses
                    limiteAnos = valorNum;
                }
            }

            // 4. Calificación semántica del estado de retención legal
            let estadoRev = 'Conservar';
            if (limiteAnos !== 999) {
                const tiempoFaltante = limiteAnos - anosCalculados;
                if (tiempoFaltante <= 0) {
                    estadoRev = 'Para depurar'; // Plazo de retención cumplido o vencido
                } else if (tiempoFaltante <= (limiteAnos > 1 ? 1 : 0.085)) {
                    estadoRev = 'En revisión'; // Documento próximo a vencer (Umbral de aviso: 1 año o 1 mes)
                }
            }

            // 5. Formateo de etiquetas legibles para la interfaz de usuario
            const limiteLabel = limiteAnos === 999 ? 'Permanente' :
                limiteAnos < 1 ? `${Math.round(limiteAnos * 12)} meses` :
                    `${limiteAnos} años`;

            const edadLabel =
                anosCalculados >= 1
                    ? `${anosCalculados.toFixed(1)} years`.replace('years', 'años') // Mantener consistencia de texto
                    : (() => {
                        const mesesExactos = Math.floor(diffDays / 30.44);
                        if (mesesExactos >= 1) return `${mesesExactos} meses`;
                        return diffDays === 0 ? 'Hoy' : `${diffDays} días`;
                    })();

            // Retorno del payload expandido con las nuevas propiedades calculadas
            return {
                ...exp,
                anosCalculados,
                limiteAnos,
                edadLabel,
                limiteLabel,
                estadoRev
            };
        });
    };

    // --- UTILITARIO: PARSING SEGURO DE CADENAS / OBJETOS ---
    const safeText = (value, fallback = '---') => {
        if (value === null || value === undefined) return fallback;
        if (typeof value === 'string' || typeof value === 'number') return String(value);
        if (typeof value === 'object') return value.nombre || value.descripcion || fallback;
        return fallback;
    };

    // ==========================================================================
    // PREPARACIÓN DE REPOSITORIOS, CONTADORES Y FILTRADO
    // ==========================================================================
    // Agrupamos todo el procesamiento matemático masivo para que solo ocurra cuando cambia dataGlobal o el dropdown de estado
    const dataProcesada = useMemo(() => {
        const expedientes = !loading && dataGlobal ? procesarVigencia(dataGlobal) : [];

        // Contadores analíticos directos para alimentar los sub-paneles y gráficos
        const paraDepurar = expedientes.filter(s => s.estadoRev === 'Para depurar').length;
        const enRevision = expedientes.filter(s => s.estadoRev === 'En revisión').length;
        const conservar = expedientes.filter(s => s.estadoRev === 'Conservar').length;

        // Segmentación por Rangos de Antigüedad para el Histograma de Barras Verticales
        const RangoMenor1 = expedientes.filter(e => e.anosCalculados < 1).length;
        const Rango1a5 = expedientes.filter(e => e.anosCalculados >= 1 && e.anosCalculados < 5).length;
        const Rango5a10 = expedientes.filter(e => e.anosCalculados >= 5 && e.anosCalculados < 10).length;
        const RangoMayor10 = expedientes.filter(e => e.anosCalculados >= 10).length;

        // Discriminación y ordenamiento por Pestaña de Filtro dropdown activo
        const tablaFiltrada = expedientes.filter(e => filterEstado === '' || e.estadoRev === filterEstado);

        return {
            paraDepurar,
            enRevision,
            conservar,
            RangoMenor1,
            Rango1a5,
            Rango5a10,
            RangoMayor10,
            tablaFiltrada
        };
    }, [dataGlobal, loading, filterEstado]); // Solo corre si la data de Laragon cambia o se escoge otra clasificación de auditoría

    // Destructuración limpia de variables optimizadas
    const {
        paraDepurar,
        enRevision,
        conservar,
        RangoMenor1,
        Rango1a5,
        Rango5a10,
        RangoMayor10,
        tablaFiltrada
    } = dataProcesada;

    // Algoritmo matemático para el control estricto de paginación
    const totalPages = Math.ceil(tablaFiltrada.length / ITEMS_PER_PAGE) || 1;
    const paginaActualVerificada = currentPage > totalPages ? 1 : currentPage;

    const indiceInicio = (paginaActualVerificada - 1) * ITEMS_PER_PAGE;
    const currentData = tablaFiltrada.slice(indiceInicio, indiceInicio + ITEMS_PER_PAGE);

    const thStyles = "py-4 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center";

    // ==========================================================================
    // CICLO DE VIDA INTERNO: INICIALIZACIÓN Y CONTROL DE INSTANCIAS EN PARALELO
    // ==========================================================================
    useEffect(() => {
        if (loading) return;

        // -----------------------------------------------------------------
        // CONFIGURACIÓN 1: GRÁFICO DE DONA
        // -----------------------------------------------------------------
        if (chartDonaRef.current) {
            // Control preventivo: Destrucción obligatoria para evitar fugas de memoria o colisiones de IDs en el DOM
            if (instanceDonaRef.current) instanceDonaRef.current.destroy();

            const ctxDona = chartDonaRef.current.getContext('2d');
            instanceDonaRef.current = new Chart(ctxDona, {
                type: 'doughnut',
                data: {
                    labels: ['Para Depurar', 'En Revisión', 'Conservar'],
                    datasets: [{
                        data: [paraDepurar, enRevision, conservar],
                        backgroundColor: ['#F43F5E', '#F59E0B', '#10B981'],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: { boxWidth: 10, padding: 12, font: { weight: 'bold', size: 11 }, color: '#64748B' }
                        }
                    },
                    cutout: '72%'
                }
            });
        }

        // -----------------------------------------------------------------
        // CONFIGURACIÓN 2: HISTOGRAMA DE BARRAS VERTICALES
        // -----------------------------------------------------------------
        if (chartBarraRef.current) {
            if (instanceBarraRef.current) instanceBarraRef.current.destroy();

            const ctxBarra = chartBarraRef.current.getContext('2d');
            instanceBarraRef.current = new Chart(ctxBarra, {
                type: 'bar',
                data: {
                    labels: ['< 1 Año', '1 - 5 Años', '5 - 10 Años', '≥ 10 Años'],
                    datasets: [{
                        data: [RangoMenor1, Rango1a5, Rango5a10, RangoMayor10],
                        backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
                        borderRadius: 4,
                        barThickness: 22
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }, // Oculto porque los ejes ya definen la métrica
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1, color: '#94A3B8' }, grid: { color: '#F1F5F9' } },
                        x: { ticks: { color: '#94A3B8', font: { weight: 'bold', size: 11 } }, grid: { display: false } }
                    }
                }
            });
        }

        // Clean-up local imperativo al desmontar o actualizar el componente
        return () => {
            if (instanceDonaRef.current) instanceDonaRef.current.destroy();
            if (instanceBarraRef.current) instanceBarraRef.current.destroy();
        };
    }, [paraDepurar, enRevision, conservar, RangoMenor1, Rango1a5, Rango5a10, RangoMayor10, loading]);

    // --- RENDER DE ESQUELETO / LOADER ADAPTATIVO ---
    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#0F4C81] mb-4"></div>
                <p className="text-slate-400 font-bold text-[13px] uppercase tracking-widest animate-pulse">Analizando vigencia documental...</p>
            </div>
        </div>
    );

    // ==========================================================================
    // CAPA DE PRESENTACIÓN: INTERFAZ GRÁFICA DE USUARIO
    // ==========================================================================
    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 animate-fade-in relative pb-28">
            <div className="max-w-[1200px] w-full mx-auto space-y-6">

                {/* --- CABECERA PRINCIPAL --- */}
                <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500/20 via-emerald-100/40 to-transparent p-6 sm:px-8 sm:py-6 rounded-3xl border border-emerald-300/80 shadow-[0_4px_25px_rgb(0,0,0,0.01)] flex items-center gap-4 z-40">
                    <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-40 blur-xl bg-emerald-300 pointer-events-none"></div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/25 border border-emerald-300/60 flex items-center justify-center text-emerald-700 relative z-10 shadow-sm shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                    </div>
                    <div className="flex flex-col relative z-10 text-left">
                        <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Control de Plazos</h1>
                        <span className="text-[11px] font-black text-emerald-800 mt-1.5 uppercase tracking-wider">Vigencia Documental</span>
                    </div>
                </div>

                {/* --- SECCIÓN DE ANALÍTICA AVANZADA --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-20">

                    {/* Panel Izquierdo: Dona */}
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-[0_4px_25px_rgb(0,0,0,0.02)] lg:col-span-5 flex flex-col justify-between">
                        <div className="mb-4 text-left">
                            <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-wider">Estado del Repositorio</h3>
                            <p className="text-[11px] font-bold text-slate-400 mt-0.5">Distribución según plazos de retención legal</p>
                        </div>
                        <div className="relative h-60 w-full min-h-[210px] mt-2">
                            <canvas ref={chartDonaRef}></canvas>
                        </div>
                    </div>

                    {/* Panel Derecho: Histograma Multicolor */}
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-[0_4px_25px_rgb(0,0,0,0.02)] lg:col-span-7 flex flex-col justify-between">
                        <div className="mb-4 text-left">
                            <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-wider">Antigüedad del Archivo</h3>
                            <p className="text-[11px] font-bold text-slate-400 mt-0.5">Expedientes agrupados por su rango de edad actual</p>
                        </div>
                        <div className="relative h-60 w-full min-h-[210px] mt-2">
                            <canvas ref={chartBarraRef}></canvas>
                        </div>
                    </div>
                </div>

                {/* --- PANEL DE LISTADO PRINCIPAL --- */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col w-full overflow-hidden">

                    {/* Barra de Filtros Unificada con Fondo de Contraste y Badge Flotante */}
                    <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                        <div className="flex items-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/60 border border-emerald-100/80 rounded-xl text-[11px] font-bold text-emerald-700 uppercase tracking-wider shadow-sm select-none">
                                <span className="font-black text-emerald-800 text-[11px]">{tablaFiltrada.length}</span>
                                REGISTROS
                            </span>
                        </div>
                        <div className="relative w-full sm:w-56 z-30">
                            <CustomDropdown
                                placeholder="Filtrar por Auditoría"
                                options={[
                                    { id: 'Para depurar', nombre: '🔴 Para depurar' },
                                    { id: 'En revisión', nombre: '🟠 En revisión' },
                                    { id: 'Conservar', nombre: '🟢 Conservar' }
                                ]}
                                selectedValue={filterEstado}
                                onSelect={(val) => { setFilterEstado(val); setCurrentPage(1); }}
                                color="emerald"
                            />
                        </div>
                    </div>

                    {/* Grilla Tabular de Registros */}
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                            <thead>
                                <tr className="bg-white border-b border-slate-100 select-none">
                                    <th className="py-4 px-6 w-[20%] text-[11px] font-black text-slate-400 uppercase tracking-widest text-center pl-8">N° Exp / Doc</th>
                                    <th className="py-4 px-4 w-[32%] text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Título</th>
                                    <th className="py-4 px-4 w-[18%] text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Clasificación</th>
                                    <th className="py-4 px-4 w-[12%] text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Vigencia Documental</th>
                                    <th className={`${thStyles} w-[9%]`}>Límite</th>
                                    <th className={`${thStyles} w-[9%]`}>Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-[13px]">
                                {currentData.length > 0 ? (
                                    currentData.map((d) => (
                                        <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors h-[76px]">
                                            {/* N° Identificador Único */}
                                            <td className="py-4 px-8 font-black text-[#0F4C81] truncate tracking-wide text-center pl-8">
                                                {safeText(d.numero_expediente)}
                                            </td>

                                            {/* Título de Asunto + Sub-badge de Estado Interno */}
                                            <td className="py-4 px-4 text-left">
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold text-slate-700 line-clamp-1 mb-1" title={safeText(d.titulo)}>
                                                        {safeText(d.titulo)}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${d.estadoRev === 'Para depurar' ? 'bg-rose-500' :
                                                            d.estadoRev === 'En revisión' ? 'bg-amber-500' :
                                                                'bg-emerald-500'
                                                            }`}></div>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {d.estadoRev}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Tipología de Clasificación */}
                                            <td className="py-4 px-4 text-center">
                                                <span className="text-[13px] font-bold text-slate-500 truncate block">
                                                    {safeText(d.tipo_documento || d.tipo_documento_id, 'General')}
                                                </span>
                                            </td>

                                            {/* Edad Calculada del Documento */}
                                            <td className="py-4 px-4 text-center whitespace-nowrap">
                                                <span className={`text-[12px] font-bold px-3 py-1 rounded-full border inline-block ${d.estadoRev === 'Para depurar' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    d.estadoRev === 'En revisión' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        'bg-slate-50 text-slate-600 border-slate-100'
                                                    }`}>
                                                    {d.edadLabel}
                                                </span>
                                            </td>

                                            {/* Tiempo Límite Legal Establecido */}
                                            <td className="py-4 px-4 text-center">
                                                <span className="text-[12px] font-bold text-slate-400 italic">
                                                    {d.limiteLabel}
                                                </span>
                                            </td>

                                            {/* Disparador Operativo de Detalle */}
                                            <td className="py-4 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setScreen({ name: 'detalle', id: d.id })}
                                                    className="px-3.5 py-1.5 bg-slate-100 text-[#0F4C81] hover:bg-[#0F4C81] hover:text-white rounded-xl text-[11px] font-extrabold uppercase tracking-wide transition-all shadow-sm"
                                                >
                                                    DETALLE
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-sm font-bold text-slate-400">
                                            No hay registros disponibles en esta sección.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- PAGINACIÓN FLOTANTE --- */}
                {totalPages > 1 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 p-2 px-6 flex justify-between items-center bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all z-40 w-max min-w-[320px]">
                        <span className="text-[12px] text-slate-500 font-extrabold tracking-widest uppercase mr-8">
                            Pág. <span className="text-[#0F4C81] text-[14px]">{paginaActualVerificada}</span> / {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={paginaActualVerificada === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 disabled:opacity-40 hover:bg-slate-50 hover:text-[#0F4C81] hover:border-blue-200 transition-all shadow-sm"
                            >
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button
                                type="button"
                                disabled={paginaActualVerificada === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                className="w-10 h-10 flex items-center justify-center bg-[#0F4C81] text-white rounded-xl disabled:opacity-50 hover:bg-blue-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                            >
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}