import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useSolicitudes } from '../../context/useSolicitudes';

export default function RegistrarSolicitud({ setScreen, triggerToast }) {
    const { refrescarSolicitudes } = useSolicitudes();

    const obtenerFechaLocal = () => {
        const fecha = new Date();
        fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset());
        return fecha.toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState({
        dni: '',
        nombres: '',
        apellidos: '',
        telefono: '',
        direccion: '',
        expediente_solicitado: '',
        descripcion: '',
        fecha_solicitud: obtenerFechaLocal()
    });

    const [validated, setValidated] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isDirty, setIsDirty] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [pendingScreen, setPendingScreen] = useState(null);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    useEffect(() => {
        const handleHeaderNavigation = (e) => {
            const targetScreen = e.detail;
            if (isDirty) {
                setPendingScreen(targetScreen);
                setShowExitModal(true);
            } else {
                setScreen(targetScreen);
            }
        };
        window.addEventListener('onHeaderNavigate', handleHeaderNavigation);
        return () => window.removeEventListener('onHeaderNavigate', handleHeaderNavigation);
    }, [isDirty, setScreen]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const handleTryExit = () => {
        if (isDirty) {
            setPendingScreen({ name: 'dashboard', id: null });
            setShowExitModal(true);
        } else {
            setScreen({ name: 'dashboard', id: null });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidated(true);

        const formElement = e.currentTarget;
        const dataFromForm = new FormData(formElement);

        const payload = {
            dni: dataFromForm.get('dni'),
            nombres: dataFromForm.get('nombres'),
            apellidos: dataFromForm.get('apellidos'),
            telefono: dataFromForm.get('telefono'),
            direccion: dataFromForm.get('direccion'),
            expediente_solicitado: dataFromForm.get('expediente_solicitado'),
            descripcion: dataFromForm.get('descripcion'),
            fecha_solicitud: formData.fecha_solicitud
        };

        if (!payload.dni || !payload.nombres || !payload.apellidos || !payload.expediente_solicitado || !payload.descripcion) {
            return;
        }

        if (payload.telefono && payload.telefono.length !== 9) {
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/solicitudes', payload);
            setIsDirty(false);
            triggerToast('¡Solicitud de Mesa de Partes registrada con éxito!');
            refrescarSolicitudes();
            setScreen({ name: 'dashboard', id: null });
        } catch (error) {
            console.error("Error al registrar solicitud:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputBaseStyles = "w-full h-[48px] px-4 border bg-slate-50 rounded-2xl text-[13px] outline-none transition-all duration-300 font-semibold text-slate-700 placeholder-slate-400";
    const readOnlyStyles = "w-full h-[48px] px-4 border border-slate-100 bg-slate-100/50 text-slate-500 rounded-2xl text-[13px] font-extrabold outline-none cursor-not-allowed flex items-center";
    const labelStyles = "block text-[11px] font-extrabold text-slate-500 mb-2 tracking-widest uppercase";

    const getInputStyles = (value, isOptional = false) => {
        const isError = validated && !isOptional && (!value || String(value).trim() === '');
        return `${inputBaseStyles} ${isError ? 'border-rose-500 bg-rose-50/10 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 focus:bg-white focus:border-[#0F4C81] focus:ring-[#0F4C81]/10'}`;
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8 relative selection:bg-blue-200 selection:text-blue-900">
            <div className="max-w-[1200px] w-full mx-auto animate-fade-in">

                <div className="flex items-center gap-2 mb-6">
                    <button type="button" onClick={handleTryExit} className="text-[13px] text-slate-500 hover:text-[#0F4C81] transition-colors font-extrabold flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-200">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        Volver
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8" noValidate>
                    <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">

                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-[#FFC107] rounded-full shadow-sm"></div>
                                <div className="flex flex-col">
                                    <span className="text-[15px] font-black text-slate-800 uppercase tracking-widest leading-none">Registro de Solicitud</span>
                                    <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Mesa de Partes Municipal</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">

                            <div className="md:col-span-4 lg:col-span-3">
                                <label htmlFor="dni" className={labelStyles}>DNI Solicitante *</label>
                                <input
                                    id="dni"
                                    name="dni"
                                    type="text"
                                    maxLength="8"
                                    placeholder="DNI del solicitante"
                                    className={getInputStyles(formData.dni)}
                                    value={formData.dni}
                                    onChange={e => handleInputChange('dni', e.target.value.replace(/\D/g, ''))}
                                />
                                {validated && !formData.dni && <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Ingrese el DNI</p>}
                            </div>

                            <div className="md:col-span-8 lg:col-span-4">
                                <label htmlFor="nombres" className={labelStyles}>Nombres *</label>
                                <input
                                    id="nombres"
                                    name="nombres"
                                    type="text"
                                    placeholder="Nombres completos"
                                    className={getInputStyles(formData.nombres)}
                                    value={formData.nombres}
                                    onChange={e => handleInputChange('nombres', e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
                                />
                                {validated && !formData.nombres && <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Ingrese los nombres</p>}
                            </div>

                            <div className="md:col-span-12 lg:col-span-5">
                                <label htmlFor="apellidos" className={labelStyles}>Apellidos *</label>
                                <input
                                    id="apellidos"
                                    name="apellidos"
                                    type="text"
                                    placeholder="Apellidos completos"
                                    className={getInputStyles(formData.apellidos)}
                                    value={formData.apellidos}
                                    onChange={e => handleInputChange('apellidos', e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
                                />
                                {validated && !formData.apellidos && <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Ingrese los apellidos</p>}
                            </div>

                            <div className="md:col-span-4 lg:col-span-4">
                                <label htmlFor="telefono" className={labelStyles}>Teléfono <span className="text-slate-400 normal-case tracking-normal">(Opcional)</span></label>
                                <input
                                    id="telefono"
                                    name="telefono"
                                    type="text"
                                    maxLength="9"
                                    placeholder="Teléfono de contacto"
                                    className={getInputStyles(formData.telefono, true)}
                                    value={formData.telefono}
                                    onChange={e => handleInputChange('telefono', e.target.value.replace(/\D/g, ''))}
                                />
                                {validated && formData.telefono && formData.telefono.length !== 9 && <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Debe tener 9 dígitos</p>}
                            </div>

                            <div className="md:col-span-8 lg:col-span-8">
                                <label htmlFor="direccion" className={labelStyles}>Dirección <span className="text-slate-400 normal-case tracking-normal">(Opcional)</span></label>
                                <input
                                    id="direccion"
                                    name="direccion"
                                    type="text"
                                    placeholder="Dirección del solicitante"
                                    className={getInputStyles(formData.direccion, true)}
                                    value={formData.direccion}
                                    onChange={e => handleInputChange('direccion', e.target.value)}
                                />
                            </div>

                            <div className="md:col-span-12 my-2 border-t border-slate-100"></div>

                            <div className="md:col-span-8 lg:col-span-8">
                                <label htmlFor="expediente_solicitado" className={labelStyles}>Documento / N° Expediente Solicitado *</label>
                                <input
                                    id="expediente_solicitado"
                                    name="expediente_solicitado"
                                    type="text"
                                    placeholder="Ej. EXP-2026-0011"
                                    className={getInputStyles(formData.expediente_solicitado)}
                                    value={formData.expediente_solicitado}
                                    onChange={e => handleInputChange('expediente_solicitado', e.target.value)}
                                />
                                {validated && !formData.expediente_solicitado && <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Ingrese el documento o número de expediente</p>}
                            </div>

                            <div className="md:col-span-4 lg:col-span-4">
                                <label htmlFor="fecha_solicitud" className={labelStyles}>Fecha de Ingreso *</label>
                                <input
                                    id="fecha_solicitud"
                                    name="fecha_solicitud"
                                    type="date"
                                    className={readOnlyStyles}
                                    value={formData.fecha_solicitud}
                                    readOnly
                                />
                            </div>

                            <div className="md:col-span-12">
                                <label htmlFor="descripcion" className={labelStyles}>Descripción / Motivo de la Solicitud *</label>
                                <textarea
                                    id="descripcion"
                                    name="descripcion"
                                    rows="4"
                                    placeholder="Detalle exactamente para qué necesita el documento el ciudadano..."
                                    className={`${getInputStyles(formData.descripcion)} h-auto py-4 resize-none`}
                                    value={formData.descripcion}
                                    onChange={e => handleInputChange('descripcion', e.target.value)}
                                ></textarea>
                                {validated && !formData.descripcion && <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Ingrese una descripción</p>}
                            </div>

                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 pb-8">
                        <button type="button" onClick={handleTryExit} className="px-8 py-3.5 rounded-2xl border-2 border-slate-200 text-[13px] font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all shadow-sm">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-8 py-3.5 rounded-2xl font-bold text-white text-[13px] uppercase tracking-widest bg-gradient-to-r from-[#0F4C81] to-blue-700 shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50">
                            {isSubmitting ? 'Registrando...' : 'Registrar Solicitud'}
                        </button>
                    </div>
                </form>
            </div>

            {showExitModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden transform scale-100 transition-all">
                        <div className="h-2 w-full bg-[#FFC107]"></div>
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-5 shadow-inner">
                                <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-black text-slate-800 mb-2 tracking-tight">¿Seguro que deseas salir?</h3>
                            <p className="text-[13px] text-slate-500 px-2 leading-relaxed font-medium">Tienes datos rellenados en este formulario. Si sales ahora, perderás todos los cambios realizados.</p>
                        </div>
                        <div className="bg-slate-50/50 px-6 py-5 flex flex-col sm:flex-row justify-center gap-3 border-t border-slate-100">
                            <button type="button" onClick={() => setShowExitModal(false)} className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 bg-white hover:bg-slate-50 hover:shadow-sm transition-all order-2 sm:order-1">
                                No, continuar
                            </button>
                            <button type="button" onClick={() => { setShowExitModal(false); setIsDirty(false); setScreen(pendingScreen || { name: 'dashboard', id: null }); }} className="w-full sm:w-auto px-5 py-3 rounded-xl text-white text-[13px] font-bold bg-[#0F4C81] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all order-1 sm:order-2">
                                Sí, salir sin guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}