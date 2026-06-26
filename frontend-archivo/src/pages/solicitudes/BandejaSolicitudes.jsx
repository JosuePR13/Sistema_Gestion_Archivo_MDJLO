import { useState } from 'react';
import api from '../../services/api';
import CustomDropdown from '../../components/CustomDropdown';
import StatusBadge from '../../components/StatusBadge';
import { useSolicitudes } from '../../context/useSolicitudes';
import { useCaja } from '../../context/CajaContext';

export default function BandejaSolicitudes({ triggerToast }) {
    const { solicitudes, loadingSolicitudes, refrescarSolicitudes } = useSolicitudes();
    const { refrescarCaja } = useCaja();

    const [searchTerm, setSearchTerm] = useState('');
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);

    const [nuevoEstado, setNuevoEstado] = useState('');
    const [motivoRechazo, setMotivoRechazo] = useState('');
    const [isUpdating, setIsSubmitting] = useState(false);

    const [tipoFormatotupa, setTipoFormatotupa] = useState('');
    const [paginasRequeridas, setPaginasRequeridas] = useState('');
    const [numHojas, setNumHojas] = useState(1);
    const [cantCopias, setCantCopias] = useState(1);

    const [paginasSimples, setPaginasSimples] = useState('');
    const [paginasFedateadas, setPaginasFedateadas] = useState('');

    const [showConfirmExitModal, setShowConfirmExitModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    const costoCalculado = ((parseInt(numHojas) || 0) * (parseInt(cantCopias) || 0) * 0.10).toFixed(2);

    const opcionesDecision = [
        { id: 'Aceptada', nombre: '✅ Aprobada' },
        { id: 'Rechazada', nombre: '❌ Denegada' }
    ];

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

    const tieneProgresoEnPasoFinal = () => {
        if (currentStep !== 3) return false;
        if (nuevoEstado === 'Rechazada' && motivoRechazo.trim().length > 0) return true;
        if (nuevoEstado === 'Aceptada') {
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

    const validarCamposPasoFinal = () => {
        if (nuevoEstado === 'Rechazada') {
            return motivoRechazo.trim().length > 4;
        }
        if (nuevoEstado === 'Aceptada') {
            if (!tipoFormatotupa) return false;
            if (tipoFormatotupa === 'Mixto') {
                return paginasSimples.trim().length > 0 && paginasFedateadas.trim().length > 0;
            } else {
                return paginasRequeridas.trim().length > 0;
            }
        }
        return false;
    };

    const solicitudesFiltradas = (solicitudes || []).filter(sol =>
        sol.estado === 'Pendiente' &&
        ((sol.dni && sol.dni.includes(searchTerm)) ||
            (sol.nombres && sol.apellidos && `${sol.nombres} ${sol.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (sol.expediente_solicitado && sol.expediente_solicitado.toLowerCase().includes(searchTerm.toLowerCase())))
    );

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
    };

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
                cantidad_copias: nuevoEstado === 'Aceptada' ? cantCopias : null
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

    const labelStyles = "block text-[11px] font-extrabold text-slate-500 mb-2 tracking-widest uppercase";
    const inputStyles = "w-full h-[48px] px-4 border border-slate-200 bg-slate-50 rounded-2xl text-[13px] font-semibold text-slate-700 focus:bg-white focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/10 outline-none transition-all";

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8 relative selection:bg-blue-200 selection:text-blue-900">
            <div className="max-w-[1200px] w-full mx-auto animate-fade-in">
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-[#FFC107] rounded-full shadow-sm"></div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Bandeja de Entrantes</h1>
                            <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Mesa de Partes - Pendientes de Revisión</span>
                        </div>
                    </div>

                    <div className="relative w-full md:w-96">
                        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder="Buscar por DNI, Nombre o Expediente..."
                            className="w-full h-[48px] pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-[#0F4C81]/10 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Fecha / DNI</th>
                                    <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Solicitante</th>
                                    <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Documento Requerido</th>
                                    <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                    <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingSolicitudes ? (
                                    <tr><td colSpan="5" className="py-12 text-center text-sm font-bold text-slate-400">Cargando bandeja...</td></tr>
                                ) : solicitudesFiltradas.length === 0 ? (
                                    <tr><td colSpan="5" className="py-12 text-center text-sm font-bold text-slate-400">No hay solicitudes pendientes en este momento.</td></tr>
                                ) : (
                                    solicitudesFiltradas.map((sol, index) => (
                                        <tr key={sol.id || sol.id_solicitud || index} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold text-slate-700">{sol.fecha_solicitud}</span>
                                                    <span className="text-[11px] font-semibold text-slate-400 mt-0.5">DNI: {sol.dni}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-[13px] font-bold text-[#0F4C81]">{sol.nombres} {sol.apellidos}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-[13px] font-bold text-slate-700 line-clamp-2 max-w-xs" title={sol.expediente_solicitado}>
                                                    {sol.expediente_solicitado}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <StatusBadge estado={sol.estado} />
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => abrirModalGestion(sol)}
                                                    className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-[#0F4C81] hover:text-white rounded-xl text-[11px] font-extrabold uppercase tracking-wide transition-all shadow-sm"
                                                >
                                                    Gestionar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {solicitudSeleccionada && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-100 flex flex-col overflow-visible h-auto max-h-[90vh]">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl shrink-0">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex flex-col">
                                        <h3 className="text-[15px] font-black text-slate-800 tracking-tight">Gestión Documentaria</h3>
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

                            <div className="p-6 overflow-visible flex-1">
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
                                                <p className="text-slate-500 font-semibold">📞 Tel: <strong className="text-slate-700 font-bold">{solicitudSeleccionada.telefono || 'Ninguno'}</strong></p>
                                                <p className="text-slate-500 font-semibold col-span-2">📍 Dirección: <strong className="text-slate-700 font-bold">{solicitudSeleccionada.direccion || 'No especificada'}</strong></p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-100 text-[13px]">
                                            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Documentación Requerida</p>
                                            <p className="font-bold text-slate-800">{solicitudSeleccionada.expediente_solicitado}</p>
                                            <p className="text-slate-500 italic mt-1 text-[12px]">"{solicitudSeleccionada.descripcion}"</p>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="animate-fade-in space-y-4 min-h-[140px] overflow-visible">
                                        <div className="p-1 flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-[#0F4C81] text-white flex items-center justify-center text-[10px] font-black">2</span>
                                            <h4 className="text-[12px] font-black text-slate-700 uppercase tracking-wider">Dictamen de la Jefatura</h4>
                                        </div>
                                        <div className="relative z-50 pt-2">
                                            <label className={labelStyles}>Seleccione Resolución *</label>
                                            <CustomDropdown
                                                id="estado_gestion"
                                                name="estado_gestion"
                                                placeholder="¿Se aprueba el trámite?"
                                                options={opcionesDecision}
                                                selectedValue={nuevoEstado}
                                                onSelect={(val) => setNuevoEstado(val)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {currentStep === 3 && (
                                    <div className="animate-fade-in space-y-4 overflow-visible">
                                        <div className="p-1 flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-[#0F4C81] text-white flex items-center justify-center text-[10px] font-black">3</span>
                                            <h4 className="text-[12px] font-black text-slate-700 uppercase tracking-wider">
                                                {nuevoEstado === 'Aceptada' ? 'Liquidación de Caja (TUPA)' : 'Sustento de Denegación'}
                                            </h4>
                                        </div>

                                        {nuevoEstado === 'Aceptada' ? (
                                            <div className="space-y-4 overflow-visible relative">
                                                <div className="relative z-50">
                                                    <label className="block text-[11px] font-extrabold text-emerald-600 mb-2 tracking-widest uppercase">Tipo de Formato Requerido *</label>
                                                    <CustomDropdown
                                                        id="tipo_formato_tupa"
                                                        name="tipo_formato_tupa"
                                                        placeholder="Seleccione formato..."
                                                        options={opcionesFormatosTupa}
                                                        selectedValue={tipoFormatotupa}
                                                        onSelect={(val) => setTipoFormatotupa(val)}
                                                    />
                                                </div>

                                                {tipoFormatotupa === 'Mixto' ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in relative z-10">
                                                        <div>
                                                            <label className="block text-[11px] font-extrabold text-blue-600 mb-2 tracking-widest uppercase">Páginas Copia Simple *</label>
                                                            <input
                                                                type="text"
                                                                required
                                                                placeholder="Ej: 1-5, 8"
                                                                value={paginasSimples}
                                                                onChange={(e) => handleValidacionFolios(e.target.value, setPaginasSimples)}
                                                                className={inputStyles}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-extrabold text-purple-600 mb-2 tracking-widest uppercase">Páginas Fedateadas *</label>
                                                            <input
                                                                type="text"
                                                                required
                                                                placeholder="Ej: 6-9, 12"
                                                                value={paginasFedateadas}
                                                                onChange={(e) => handleValidacionFolios(e.target.value, setPaginasFedateadas)}
                                                                className={inputStyles}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 relative z-10 animate-fade-in">
                                                        <div>
                                                            <label className={labelStyles}>¿Qué Páginas/Folios requiere del expediente? *</label>
                                                            <input
                                                                type="text"
                                                                required
                                                                placeholder="Ej: 1-15, 20"
                                                                value={paginasRequeridas}
                                                                onChange={(e) => handleValidacionFolios(e.target.value, setPaginasRequeridas)}
                                                                className={inputStyles}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                                                    <div>
                                                        <label className={labelStyles}>N° Total de Hojas *</label>
                                                        <input type="number" min="1" required value={numHojas} onChange={(e) => setNumHojas(e.target.value)} className={inputStyles} />
                                                    </div>
                                                    <div>
                                                        <label className={labelStyles}>Cantidad de Copias *</label>
                                                        <input type="number" min="1" required value={cantCopias} onChange={(e) => setCantCopias(e.target.value)} className={inputStyles} />
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between shadow-inner shrink-0 relative z-10">
                                                    <div>
                                                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Monto Final Liquidado</p>
                                                        <p className="text-[11px] text-emerald-600 mt-0.5 font-semibold italic">Tasa TUPA Distrital: S/. 0.10 por folio</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[20px] font-black text-emerald-700 tracking-tight">S/. {costoCalculado}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="animate-fade-in relative z-10">
                                                <label className="block text-[11px] font-extrabold text-rose-600 mb-2 tracking-widest uppercase">Especifique Motivo de Rechazo *</label>
                                                <textarea
                                                    required
                                                    rows="4"
                                                    placeholder="Escriba el motivo técnico por el cual se rechaza el trámite..."
                                                    value={motivoRechazo}
                                                    onChange={(e) => setMotivoRechazo(e.target.value)}
                                                    className="w-full p-4 border border-rose-200 bg-rose-50/30 rounded-2xl text-[13px] font-bold text-rose-800 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all resize-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between rounded-b-3xl shrink-0 relative z-10">
                                <button
                                    type="button"
                                    onClick={() => currentStep === 1 ? intentarCerrarModal() : intentarIrAtras()}
                                    className="px-5 py-2.5 rounded-xl text-[12px] font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                                >
                                    {currentStep === 1 ? 'Cancelar' : 'Atrás'}
                                </button>

                                {currentStep < 3 ? (
                                    <button
                                        type="button"
                                        disabled={currentStep === 2 && !nuevoEstado}
                                        onClick={() => setCurrentStep(prev => prev + 1)}
                                        className="px-6 py-2.5 rounded-xl text-[12px] font-bold text-white uppercase tracking-wider bg-[#0F4C81] disabled:opacity-40 transition-all hover:shadow-md"
                                    >
                                        Continuar
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleActualizarEstado}
                                        disabled={isUpdating || !validarCamposPasoFinal()}
                                        className="px-6 py-2.5 rounded-xl text-[12px] font-bold text-white uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 transition-all hover:shadow-md"
                                    >
                                        {isUpdating ? 'Guardando...' : 'Finalizar Trámite'}
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                )}

                {showConfirmExitModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden transform scale-100 transition-all">
                            <div className="h-2 w-full bg-[#FFC107]"></div>
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-5 shadow-inner">
                                    <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 mb-2 tracking-tight">¿Seguro que deseas salir?</h3>
                                <p className="text-[13px] text-slate-500 px-2 leading-relaxed font-medium">Tienes datos rellenados en la liquidación de este trámite. Si sales ahora, perderás todos los cambios realizados.</p>
                            </div>
                            <div className="bg-slate-50/50 px-6 py-5 flex flex-col sm:flex-row justify-center gap-3 border-t border-slate-100">
                                <button type="button" onClick={() => { setShowConfirmExitModal(false); setPendingAction(null); }} className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 bg-white hover:bg-slate-50 hover:shadow-sm transition-all order-2 sm:order-1">
                                    No, continuar
                                </button>
                                <button type="button" onClick={confirmarAccionPendiente} className="w-full sm:w-auto px-5 py-3 rounded-xl text-white text-[13px] font-bold bg-[#0F4C81] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all order-1 sm:order-2">
                                    Sí, salir sin guardar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}