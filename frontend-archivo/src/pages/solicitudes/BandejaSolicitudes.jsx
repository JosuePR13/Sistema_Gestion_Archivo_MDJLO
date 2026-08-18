import { useState } from 'react';
import api from '../../services/api';
import CustomDropdown from '../../components/CustomDropdown';
import StatusBadge from '../../components/StatusBadge';
import { useSolicitudes } from '../../context/useSolicitudes';
import { useCaja } from '../../context/CajaContext';

export default function BandejaSolicitudes({ triggerToast }) {
    // CONTEXTOS GLOBALES
    const { solicitudes, loadingSolicitudes, refrescarSolicitudes } = useSolicitudes();
    const { refrescarCaja } = useCaja();

    // ESTADOS DE CONTROL Y FILTRADO
    const [searchTerm, setSearchTerm] = useState('');
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);

    // ESTADOS DEL DICTAMEN DE EVALUACIÓN
    const [nuevoEstado, setNuevoEstado] = useState('');
    const [motivoRechazo, setMotivoRechazo] = useState('');
    const [isUpdating, setIsSubmitting] = useState(false);

    // ESTADOS DE LIQUIDACIÓN FINANCIERA
    const [tipoFormatotupa, setTipoFormatotupa] = useState('');
    const [paginasRequeridas, setPaginasRequeridas] = useState('');
    const [numHojas, setNumHojas] = useState(1);
    const [cantCopias, setCantCopias] = useState(1);

    // ESTADOS ADICIONALES PARA FORMULACIONES MIXTAS
    const [paginasSimples, setPaginasSimples] = useState('');
    const [paginasFedateadas, setPaginasFedateadas] = useState('');

    // ---> ESTADOS: DATOS DE PAGO <---
    const [numeroVoucher, setNumeroVoucher] = useState('');
    const [fechaPago, setFechaPago] = useState('');

    // ESTADOS DE SEGURIDAD
    const [showConfirmExitModal, setShowConfirmExitModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    // PAGINACIÓN
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    // REGLA DE NEGOCIO: Cálculo matemático
    const costoCalculado = ((parseInt(numHojas) || 0) * (parseInt(cantCopias) || 0) * 0.10).toFixed(2);

    const opcionesFormatosTupa = [
        { id: 'Copia Simple A4', nombre: '📄 Copia Simple Formato A4' },
        { id: 'Fedateado', nombre: '📜 Formato Fedateado' },
        { id: 'Mixto', nombre: '📑 Formato Mixto (Simple y Fedateado)' }
    ];

    const handleValidacionFolios = (valorStr, setterFunction) => {
        if (/^[0-9,\- ]*$/.test(valorStr)) {
            setterFunction(valorStr);
        }
    };

    // EVALUACIÓN DE INTEGRIDAD
    const tieneProgresoEnPasoFinal = () => {
        if (currentStep !== 3) return false;
        if (nuevoEstado === 'Rechazada' && motivoRechazo.trim().length > 0) return true;
        if (nuevoEstado === 'Aceptada') {
            if (numeroVoucher.trim().length > 0 || fechaPago.trim().length > 0) return true;
            if (tipoFormatotupa === 'Mixto' && (paginasSimples.trim().length > 0 || paginasFedateadas.trim().length > 0)) return true;
            if (tipoFormatotupa !== 'Mixto' && paginasRequeridas.trim().length > 0) return true;
        }
        return false;
    };

    const intentarCerrarModal = () => {
        if (tieneProgresoEnPasoFinal()) {
            setPendingAction('CLOSE');
            setShowConfirmExitModal(true);
        } else {
            setSolicitudSeleccionada(null);
        }
    };

    const intentarIrAtras = () => {
        if (currentStep === 3 && tieneProgresoEnPasoFinal()) {
            setPendingAction('BACK');
            setShowConfirmExitModal(true);
        } else {
            setCurrentStep(prev => prev - 1);
        }
    };

    const confirmarAccionPendiente = () => {
        setShowConfirmExitModal(false);
        if (pendingAction === 'CLOSE') {
            setSolicitudSeleccionada(null);
        } else if (pendingAction === 'BACK') {
            setCurrentStep(prev => prev - 1);
        }
        setPendingAction(null);
    };

    // VALIDACIÓN DE NEGOCIO
    const validarCamposPasoFinal = () => {
        if (nuevoEstado === 'Rechazada') {
            return motivoRechazo.trim().length > 4;
        }
        if (nuevoEstado === 'Aceptada') {
            if (parseFloat(costoCalculado) > 0) {
                if (numeroVoucher.trim().length === 0 || fechaPago.trim().length === 0) return false;
            }
            if (!tipoFormatotupa) return false;
            if (tipoFormatotupa === 'Mixto') {
                return paginasSimples.trim().length > 0 && paginasFedateadas.trim().length > 0;
            } else {
                return paginasRequeridas.trim().length > 0;
            }
        }
        return false;
    };

    const solicitudesFiltradas = (solicitudes || []).filter(sol => {
        if (sol.estado !== 'Pendiente') return false;
        const buscar = searchTerm.trim().toLowerCase();
        if (!buscar) return true;
        const porDni = sol.dni ? sol.dni.toLowerCase().startsWith(buscar) : false;
        const nombreCompleto = sol.nombres && sol.apellidos ? `${sol.nombres} ${sol.apellidos}`.toLowerCase() : '';
        const porNombre = nombreCompleto.includes(buscar);
        return porDni || porNombre;
    });

    const totalPages = Math.ceil(solicitudesFiltradas.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = solicitudesFiltradas.slice(indexOfFirstItem, indexOfLastItem);

    // INICIALIZADOR DEL ASISTENTE
    const abrirModalGestion = (solicitud) => {
        setSolicitudSeleccionada(solicitud);
        setCurrentStep(1);
        setNuevoEstado('');
        setMotivoRechazo('');
        setTipoFormatotupa('');
        setPaginasRequeridas('');
        setPaginasSimples('');
        setPaginasFedateadas('');
        setNumHojas(1);
        setCantCopias(1);
        setNumeroVoucher('');
        setFechaPago('');
    };

    // PERSISTENCIA DE LA EVALUACIÓN
    const handleActualizarEstado = async (e) => {
        e.preventDefault();
        if (!validarCamposPasoFinal()) return;

        setIsSubmitting(true);
        let pSimples = null;
        let pFedateadas = null;

        if (nuevoEstado === 'Aceptada') {
            if (tipoFormatotupa === 'Copia Simple A4') pSimples = paginasRequeridas;
            if (tipoFormatotupa === 'Fedateado') pFedateadas = paginasRequeridas;
            if (tipoFormatotupa === 'Mixto') {
                pSimples = paginasSimples;
                pFedateadas = paginasFedateadas;
            }
        }

        try {
            await api.put(`/solicitudes/${solicitudSeleccionada.id}`, {
                estado: nuevoEstado,
                motivo_rechazo: nuevoEstado === 'Rechazada' ? motivoRechazo : null,
                costo_tupa: nuevoEstado === 'Aceptada' ? parseFloat(costoCalculado) : null,
                tipo_formato_tupa: nuevoEstado === 'Aceptada' ? tipoFormatotupa : null,
                paginas_simples: pSimples,
                paginas_fedateadas: pFedateadas,
                numero_hojas: nuevoEstado === 'Aceptada' ? numHojas : null,
                cantidad_copias: nuevoEstado === 'Aceptada' ? cantCopias : null,
                numero_voucher: nuevoEstado === 'Aceptada' ? numeroVoucher : null,
                fecha_pago: nuevoEstado === 'Aceptada' ? fechaPago : null
            });

            await refrescarCaja();
            triggerToast('¡Decisión guardada con éxito!');
            setSolicitudSeleccionada(null);
            refrescarSolicitudes();
        } catch (error) {
            console.error("Error al actualizar la solicitud:", error);
            alert('Ocurrió un error al guardar los cambios en el servidor.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const labelStyles = "block text-[11px] font-black text-slate-400 mb-2 tracking-widest uppercase";
    const inputStyles = "w-full h-[48px] px-4 border border-slate-200 bg-slate-50/50 rounded-2xl text-[13px] font-semibold text-slate-700 focus:bg-white focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/10 outline-none transition-all duration-300";

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 relative selection:bg-blue-200 selection:text-blue-900 pb-24">

            {/* ESTILOS GLOBALES DE SCROLLBAR */}
            <style>{`
                .custom-scroll::-webkit-scrollbar { width: 6px; }
                .custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>

            <div className="max-w-[1200px] w-full mx-auto space-y-6 animate-fade-in">

                {/* CABECERA PRINCIPAL */}
                <div className="relative overflow-hidden bg-gradient-to-r from-sky-500/20 via-sky-100/40 to-transparent p-6 sm:px-8 sm:py-6 rounded-3xl border border-sky-200/80 shadow-[0_4px_25px_rgb(0,0,0,0.01)] flex items-center justify-between gap-4 z-40">
                    <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-40 blur-xl bg-sky-300 pointer-events-none"></div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-200/60 flex items-center justify-center text-sky-600 relative z-10 shadow-sm shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" /></svg>
                        </div>
                        <div className="flex flex-col relative z-10 text-left">
                            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Bandeja de Solicitudes</h1>
                            <span className="text-[11px] font-black text-sky-700 mt-1.5 uppercase tracking-wider">Control y Seguimiento</span>
                        </div>
                    </div>
                </div>

                {/* CONTENEDOR DEL BUSCADOR */}
                <div className="flex justify-end w-full animate-fade-in">
                    <div className="relative w-full md:w-96">
                        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input type="text" placeholder="Buscar por Contribuyente o DNI..." className="w-full h-[46px] pl-12 pr-4 bg-white border border-slate-200 rounded-2xl text-[13px] font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all shadow-sm" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                    </div>
                </div>

                {/* TABLA DE GESTIÓN PRINCIPAL */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                    <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50/60 border border-sky-100/80 rounded-xl text-[11px] font-bold text-sky-700 uppercase tracking-wider shadow-sm select-none">
                                <span className="font-black text-sky-800 text-[11px]">{solicitudesFiltradas.length}</span>
                                solicitud(es) en bandeja
                            </span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr className="bg-slate-50/70 border-b border-slate-100">
                                    <th className="py-4 px-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center w-[280px]">Contribuyente</th>
                                    <th className="py-4 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center w-[110px]">DNI</th>
                                    <th className="py-4 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center w-[120px]">Fecha</th>
                                    <th className="py-4 px-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Documento / Descripción</th>
                                    <th className="py-4 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center w-[120px]">Estado</th>
                                    <th className="py-4 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center w-[120px]">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-[13px]">
                                {loadingSolicitudes ? (
                                    <tr><td colSpan="6" className="py-12 text-center text-sm font-bold text-slate-400">Cargando bandeja...</td></tr>
                                ) : currentItems.length === 0 ? (
                                    <tr><td colSpan="6" className="py-12 text-center text-sm font-bold text-slate-400">No se encontraron solicitudes pendientes.</td></tr>
                                ) : (
                                    currentItems.map((sol, index) => (
                                        <tr key={sol.id || sol.id_solicitud || index} className="border-b border-slate-50 hover:bg-sky-50/20 transition-colors">
                                            <td className="py-4 px-5 w-[280px]">
                                                <span className="text-[13px] font-bold text-slate-800 block truncate text-center" title={`${sol.nombres} ${sol.apellidos}`}>{sol.nombres} {sol.apellidos}</span>
                                            </td>
                                            <td className="py-4 px-4 text-[13px] font-bold text-slate-700 text-center whitespace-nowrap w-[110px]">{sol.dni}</td>
                                            <td className="py-4 px-4 text-[13px] font-bold text-slate-600 text-center whitespace-nowrap w-[120px]">{sol.fecha_solicitud}</td>
                                            <td className="py-4 px-5 overflow-hidden">
                                                <div className="flex flex-col w-full max-w-[260px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[500px]">
                                                    <span className="text-[13px] font-bold text-sky-700 truncate text-center" title={sol.expediente_solicitado}>{sol.expediente_solicitado}</span>
                                                    <span className="text-[11px] text-slate-400 font-medium truncate mt-0.5 text-center" title={sol.descripcion}>{sol.descripcion}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-center w-[120px]"><StatusBadge estado={sol.estado} /></td>
                                            <td className="py-4 px-4 text-center w-[120px]">
                                                <button type="button" onClick={() => abrirModalGestion(sol)} className="w-full py-1.5 bg-slate-50 text-sky-700 border border-sky-100 hover:bg-sky-600 hover:text-white hover:border-sky-600 rounded-xl text-[11px] font-extrabold uppercase tracking-wide transition-all shadow-sm">
                                                    Detalle
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* COMPONENTE FLOTANTE DE PAGINACIÓN */}
                {totalPages > 1 && !loadingSolicitudes && currentItems.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 p-2 px-6 flex justify-between items-center bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all z-40 w-max min-w-[320px]">
                        <span className="text-[12px] text-slate-500 font-extrabold tracking-widest uppercase mr-8">
                            Pág. <span className="text-[#0F4C81] text-[14px]">{currentPage}</span> / {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 disabled:opacity-40 hover:bg-slate-50 hover:text-[#0F4C81] hover:border-blue-200 transition-all shadow-sm">
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} className="w-10 h-10 flex items-center justify-center bg-[#0F4C81] text-white rounded-xl disabled:opacity-50 hover:bg-blue-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* WIZARD MODAL CORREGIDO */}
                {solicitudSeleccionada && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">

                        {/* 1. Modal SIEMPRE tiene overflow-hidden para respetar bordes y el footer */}
                        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-100 flex flex-col overflow-hidden h-auto max-h-[90vh] transition-all">

                            <div className="p-6 bg-white rounded-t-3xl shrink-0 z-10 shadow-sm relative">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex flex-col">
                                        <h3 className="text-[15px] font-black text-slate-800 tracking-tight">Gestión de Solicitudes</h3>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Paso {currentStep} de 3</span>
                                    </div>
                                    <button type="button" onClick={intentarCerrarModal} className="text-slate-400 hover:text-rose-500 transition-colors">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                                    <div className={`h-full bg-[#0F4C81] transition-all duration-500 ${currentStep === 1 ? 'w-1/3' : currentStep === 2 ? 'w-2/3' : 'w-full'}`}></div>
                                </div>
                            </div>

                            {/* 2. Cuerpo del modal SIEMPRE permite scroll, y la clase 'custom-scroll' lo estiliza */}
                            <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 custom-scroll relative">

                                {/* STEP 1 */}
                                {currentStep === 1 && (
                                    <div className="animate-fade-in space-y-4">
                                        <div className="p-1 flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-[#0F4C81] text-white flex items-center justify-center text-[10px] font-black">1</span>
                                            <h4 className="text-[12px] font-black text-slate-700 uppercase tracking-wider">Datos del Solicitante</h4>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-[13px]">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombres y Apellidos</p>
                                                <p className="font-bold text-[#0F4C81] text-[14px]">{solicitudSeleccionada.nombres} {solicitudSeleccionada.apellidos}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 border-t border-slate-200/60 pt-3 text-[12px]">
                                                <p className="text-slate-500 font-semibold">🪪 DNI: <strong className="text-slate-700 font-bold">{solicitudSeleccionada.dni}</strong></p>
                                                <p className="text-slate-500 font-semibold">📞 Teléfono: <strong className="text-slate-700 font-bold">{solicitudSeleccionada.telefono || 'Ninguno'}</strong></p>
                                                <p className="text-slate-500 font-semibold col-span-2">📍 Dirección: <strong className="text-slate-700 font-bold">{solicitudSeleccionada.direccion || 'No especificada'}</strong></p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50 text-[13px]">
                                            <p className="text-[10px] font-black text-[#0F4C81] uppercase tracking-widest mb-1">Documentación Requerida</p>
                                            <p className="font-bold text-slate-800">{solicitudSeleccionada.expediente_solicitado}</p>
                                            <p className="text-slate-500 italic mt-1 text-[12px]">"{solicitudSeleccionada.descripcion}"</p>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: RESOLUCIÓN Y CALIFICACIÓN TÉCNICA LEGAL */}
                                {currentStep === 2 && (
                                    <div className="animate-fade-in space-y-4">
                                        <div className="p-1 flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-[#0F4C81] text-white flex items-center justify-center text-[10px] font-black">2</span>
                                            <h4 className="text-[12px] font-black text-slate-700 uppercase tracking-wider">Resolución del Trámite</h4>
                                        </div>

                                        <div className="pt-2">
                                            <label className={labelStyles}>Seleccione Decisión *</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">

                                                {/* Opción APROBADA */}
                                                <button
                                                    type="button"
                                                    onClick={() => setNuevoEstado('Aceptada')}
                                                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 ${nuevoEstado === 'Aceptada'
                                                            ? 'bg-emerald-50/70 border-emerald-500 shadow-md ring-2 ring-emerald-500/10'
                                                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                                                        }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${nuevoEstado === 'Aceptada' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                                                        }`}>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className={`text-[13px] font-bold ${nuevoEstado === 'Aceptada' ? 'text-emerald-900' : 'text-slate-700'}`}>
                                                            Aprobar Trámite
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                                            Derivar a liquidación de pago y entrega
                                                        </p>
                                                    </div>
                                                </button>

                                                {/* Opción DENEGADA */}
                                                <button
                                                    type="button"
                                                    onClick={() => setNuevoEstado('Rechazada')}
                                                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 ${nuevoEstado === 'Rechazada'
                                                            ? 'bg-rose-50/70 border-rose-500 shadow-md ring-2 ring-rose-500/10'
                                                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                                                        }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${nuevoEstado === 'Rechazada' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'
                                                        }`}>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className={`text-[13px] font-bold ${nuevoEstado === 'Rechazada' ? 'text-rose-900' : 'text-slate-700'}`}>
                                                            Denegar Trámite
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                                            Rechazar con sustento técnico legal
                                                        </p>
                                                    </div>
                                                </button>

                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3 */}
                                {currentStep === 3 && (
                                    <div className="animate-fade-in space-y-4 pb-2">
                                        <div className="p-1 flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-[#0F4C81] text-white flex items-center justify-center text-[10px] font-black">3</span>
                                            <h4 className="text-[12px] font-black text-slate-700 uppercase tracking-wider">
                                                {nuevoEstado === 'Aceptada' ? 'Liquidación y Pago' : 'Sustento de Denegación'}
                                            </h4>
                                        </div>

                                        <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[12px] flex items-start gap-3 animate-fade-in shrink-0">
                                            <span className="text-slate-400 mt-0.5 text-base shrink-0">📋</span>
                                            <div className="flex-1 min-w-0">
                                                <span className="font-extrabold text-[#0F4C81] tracking-wide block text-[10px] uppercase mb-0.5">Trámite Evaluado:</span>
                                                <span className="font-bold text-slate-800 block truncate" title={solicitudSeleccionada.expediente_solicitado}>{solicitudSeleccionada.expediente_solicitado}</span>
                                                <div className="max-h-[62px] overflow-y-auto pr-1 mt-1 scrollbar-thin scrollbar-thumb-slate-200 standard-scroll">
                                                    <p className="text-[11px] text-slate-500 italic leading-relaxed font-medium whitespace-pre-wrap">"{solicitudSeleccionada.descripcion}"</p>
                                                </div>
                                            </div>
                                        </div>

                                        {nuevoEstado === 'Aceptada' ? (
                                            <div className="space-y-4 relative mt-2">

                                                {/* BLOQUE: VOUCHER Y FECHA DE PAGO */}
                                                <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100">
                                                    <p className="text-[10px] font-black text-sky-700 uppercase tracking-widest mb-3 border-b border-sky-200/60 pb-2">Datos de Pago</p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className={labelStyles}>N° de Voucher *</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Ej: 0014589"
                                                                value={numeroVoucher}
                                                                onChange={(e) => setNumeroVoucher(e.target.value)}
                                                                className={inputStyles}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className={labelStyles}>Fecha de Pago *</label>
                                                            <input
                                                                type="date"
                                                                value={fechaPago}
                                                                max={new Date().toISOString().split("T")[0]}
                                                                onChange={(e) => setFechaPago(e.target.value)}
                                                                className={inputStyles}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="relative z-40 pt-2">
                                                    <label className="block text-[11px] font-extrabold text-[#0F4C81] mb-2 tracking-widest uppercase">Tipo de Formato Requerido *</label>
                                                    <CustomDropdown id="tipo_formato_tupa" name="tipo_formato_tupa" placeholder="Seleccione formato..." options={opcionesFormatosTupa} selectedValue={tipoFormatotupa} onSelect={(val) => setTipoFormatotupa(val)} color="sky" />
                                                </div>

                                                {tipoFormatotupa === 'Mixto' ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in relative z-10">
                                                        <div>
                                                            <label className={labelStyles}>Folios Copia Simple *</label>
                                                            <input type="text" placeholder="Ej: 1-5, 8" value={paginasSimples} onChange={(e) => handleValidacionFolios(e.target.value, setPaginasSimples)} className={inputStyles} />
                                                        </div>
                                                        <div>
                                                            <label className={labelStyles}>Folios Fedateados *</label>
                                                            <input type="text" placeholder="Ej: 6-9, 12" value={paginasFedateadas} onChange={(e) => handleValidacionFolios(e.target.value, setPaginasFedateadas)} className={inputStyles} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 relative z-10 animate-fade-in">
                                                        <div>
                                                            <label className={labelStyles}>¿Qué Folios requiere del documento o expediente? *</label>
                                                            <input type="text" placeholder="Ej: 1-15, 20" value={paginasRequeridas} onChange={(e) => handleValidacionFolios(e.target.value, setPaginasRequeridas)} className={inputStyles} />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                                                    <div>
                                                        <label className={labelStyles}>N° Total de Hojas *</label>
                                                        <input type="number" min="1" value={numHojas} onChange={(e) => setNumHojas(e.target.value)} className={inputStyles} />
                                                    </div>
                                                    <div>
                                                        <label className={labelStyles}>Cantidad de Copias *</label>
                                                        <input type="number" min="1" value={cantCopias} onChange={(e) => setCantCopias(e.target.value)} className={inputStyles} />
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between shadow-inner shrink-0 relative z-10 mt-2 mb-2">
                                                    <div>
                                                        <p className="text-[10px] font-black text-[#0F4C81] uppercase tracking-widest">Monto Final Liquidado</p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5 font-semibold italic">Tasa TUPA Distrital: S/. 0.10 por folio</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[20px] font-black text-[#0F4C81] tracking-tight">S/. {costoCalculado}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="animate-fade-in relative z-10">
                                                <label className="block text-[11px] font-extrabold text-rose-600 mb-2 tracking-widest uppercase">Especifique Motivo de Rechazo *</label>
                                                <textarea rows="4" placeholder="Escriba el motivo técnico por el cual se rechaza el trámite..." value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} className="w-full p-4 border border-rose-200 bg-rose-50/30 rounded-2xl text-[13px] font-bold text-rose-800 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all resize-none" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between rounded-b-3xl shrink-0 relative z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                                <button type="button" onClick={() => currentStep === 1 ? intentarCerrarModal() : intentarIrAtras()} className="px-5 py-2.5 rounded-xl text-[12px] font-bold text-slate-500 hover:bg-slate-200 transition-colors">
                                    {currentStep === 1 ? 'Cancelar' : 'Atrás'}
                                </button>
                                {currentStep < 3 ? (
                                    <button type="button" disabled={currentStep === 2 && !nuevoEstado} onClick={() => setCurrentStep(prev => prev + 1)} className="px-6 py-2.5 rounded-xl text-[12px] font-bold text-white uppercase tracking-wider bg-[#0F4C81] disabled:opacity-40 transition-all hover:shadow-md">
                                        Continuar
                                    </button>
                                ) : (
                                    <button type="button" onClick={handleActualizarEstado} disabled={isUpdating || !validarCamposPasoFinal()} className="px-6 py-2.5 rounded-xl text-[12px] font-bold text-white uppercase tracking-wider bg-[#0F4C81] hover:bg-blue-800 disabled:opacity-30 transition-all hover:shadow-md">
                                        {isUpdating ? 'Guardando...' : 'Finalizar Trámite'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL INTERNO EXIT */}
                {showConfirmExitModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden transform scale-100 transition-all">
                            <div className="h-2 w-full bg-[#FFC107]"></div>
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-5 shadow-inner">
                                    <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 mb-2 tracking-tight">¿Seguro que deseas salir?</h3>
                                <p className="text-[13px] text-slate-500 px-2 leading-relaxed font-medium">Tienes datos rellenados en la liquidación de este trámite. Si sales ahora, perderás todos los cambios realizados.</p>
                            </div>
                            <div className="bg-slate-50/50 px-6 py-5 flex flex-col sm:flex-row justify-center gap-3 border-t border-slate-100">
                                <button type="button" onClick={() => { setShowConfirmExitModal(false); setPendingAction(null); }} className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 bg-white hover:bg-slate-50/50 transition-all order-2 sm:order-1">No, continuar</button>
                                <button type="button" onClick={confirmarAccionPendiente} className="w-full sm:w-auto px-5 py-3 rounded-xl text-white text-[13px] font-bold bg-[#0F4C81] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all order-1 sm:order-2">Sí, salir sin guardar</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}