import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useSolicitudes } from '../../context/useSolicitudes';

export default function RegistrarSolicitud({ setScreen, triggerToast }) {
    // CONTEXTO: Importación del trigger global para refrescar la lista de solicitudes
    const { refrescarSolicitudes } = useSolicitudes();

    // UTILITARIO: Obtención de la fecha actual formateada en la zona horaria local
    const obtenerFechaLocal = () => {
        const fecha = new Date();
        fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset());
        return fecha.toISOString().split('T')[0];
    };

    // ESTADO ESTRUCTURAL: Almacenamiento de los campos del formulario de Mesa de Partes
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

    // ESTADOS DE CONTROL DE FLUJO Y VALIDACIÓN
    const [validated, setValidated] = useState(false); // Disparador visual para renderizado de errores (HTML5 / Custom)
    const [isSubmitting, setIsSubmitting] = useState(false); // Estado de carga (Loading) para bloquear re-envíos duplicados

    // ESTADOS DE SEGURIDAD (PREVENCIÓN DE PÉRDIDA DE DATOS)
    const [isDirty, setIsDirty] = useState(false); // Bandera reactiva que detecta si el usuario modificó algún input
    const [showExitModal, setShowExitModal] = useState(false); // Flag para abrir/cerrar el modal de advertencia de salida
    const [pendingScreen, setPendingScreen] = useState(null); // Almacenamiento temporal de la ruta destino elegida por el operador

    // HOOK EFFECT 1: Control nativo del navegador (F5, Cerrar Pestaña o Alt+F4) para evitar pérdida de datos si isDirty está activo
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = ''; // Dispara la alerta nativa estándar del navegador
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // HOOK EFFECT 2: Interceptor del evento personalizado del Header (Navegación por clicks en la barra superior)
    useEffect(() => {
        const handleHeaderNavigation = (e) => {
            const targetScreen = e.detail;
            if (isDirty) {
                setPendingScreen(targetScreen); // Retiene la pantalla a la que el usuario quería ir
                setShowExitModal(true); // Frena la navegación y levanta el modal preventivo
            } else {
                setScreen(targetScreen); // Si el formulario está limpio, navega de inmediato
            }
        };
        window.addEventListener('onHeaderNavigate', handleHeaderNavigation);
        return () => window.removeEventListener('onHeaderNavigate', handleHeaderNavigation);
    }, [isDirty, setScreen]);

    // MANEJADOR REACTIVO: Sanitiza entradas de texto en tiempo real para evitar colapsos de espacios múltiples
    const handleInputChange = (field, value) => {
        let sanitizedValue = value;

        // Limpieza de espaciados dobles consecutivos intermedios
        if (field === 'nombres' || field === 'apellidos' || field === 'descripcion' || field === 'direccion') {
            sanitizedValue = value.replace(/\s+/g, ' ');
        }

        setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
        setIsDirty(true); // Activa la política de seguridad contra salidas fortuitas
    };

    // CONTROLADOR DE SALIDA INTERNA: Valida el botón Volver o Cancelar dentro de la vista actual
    const handleTryExit = () => {
        if (isDirty) {
            setPendingScreen({ name: 'dashboard', id: null });
            setShowExitModal(true);
        } else {
            setScreen({ name: 'dashboard', id: null });
        }
    };

    // PROCESAMIENTO PRINCIPAL: Validaciones estrictas del negocio y persistencia vía API REST
    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidated(true); // Activa la máscara visual de campos obligatorios

        // Captura directa del DOM vía FormData para un parseo limpio y asíncrono
        const formElement = e.currentTarget;
        const dataFromForm = new FormData(formElement);

        const payload = {
            dni: dataFromForm.get('dni') ? dataFromForm.get('dni').trim() : '',
            nombres: dataFromForm.get('nombres') ? dataFromForm.get('nombres').trim() : '',
            apellidos: dataFromForm.get('apellidos') ? dataFromForm.get('apellidos').trim() : '',
            telefono: dataFromForm.get('telefono') ? dataFromForm.get('telefono').trim() : '',
            direccion: dataFromForm.get('direccion') ? dataFromForm.get('direccion').trim() : '',
            expediente_solicitado: dataFromForm.get('expediente_solicitado') ? dataFromForm.get('expediente_solicitado').trim() : '',
            descripcion: dataFromForm.get('descripcion') ? dataFromForm.get('descripcion').trim() : '',
            fecha_solicitud: formData.fecha_solicitud
        };

        // VALIDACIONES DE BACKUP
        if (!payload.dni || payload.dni.length !== 8) return;
        if (!payload.nombres || payload.nombres.length < 2) return;
        if (!payload.apellidos || payload.apellidos.length < 2) return;
        if (!payload.expediente_solicitado || payload.expediente_solicitado.length < 4) return;
        if (!payload.descripcion || payload.descripcion.length < 10) return;
        if (payload.telefono && payload.telefono.length !== 9) return;

        setIsSubmitting(true); // Deshabilita el botón de acción principal de forma inmediata
        try {
            // Envío asíncrono del registro documentario a la base de datos de la municipalidad
            await api.post('/solicitudes', payload);
            
            setIsDirty(false); // Resetea bandera de seguridad para el ciclo de éxito
            triggerToast('¡Solicitud de Mesa de Partes registrada con éxito!');
            refrescarSolicitudes(); // Fuerza la recarga de datos en segundo plano
            
            // Re-inicialización del formulario para dejarlo limpio para el siguiente administrado
            setFormData({
                dni: '',
                nombres: '',
                apellidos: '',
                telefono: '',
                direccion: '',
                expediente_solicitado: '',
                descripcion: '',
                fecha_solicitud: new Date().toISOString().split('T')[0]
            });
            setValidated(false); // Apaga las alertas en rojo/verde de validación visual
        } catch (error) {
            console.error("Error al registrar solicitud de Mesa de Partes:", error);
        } finally {
            setIsSubmitting(false); // Libera el bloqueo de interfaz
        }
    };

    // CONFIGURACIÓN DE ESTILOS ESTÁTICOS TAILWIND
    const inputBaseStyles = "w-full h-[48px] px-4 border bg-slate-50/50 rounded-2xl text-[13px] outline-none transition-all duration-300 font-semibold text-slate-700 placeholder-slate-400";
    const readOnlyStyles = "w-full h-[48px] px-4 border border-slate-100 bg-slate-100/50 text-slate-500 rounded-2xl text-[13px] font-extrabold outline-none cursor-not-allowed flex items-center";
    const labelStyles = "block text-[11px] font-black text-slate-400 mb-2 tracking-widest uppercase";

    // Inyección de clases críticas de error de manera reactiva campo por campo
    const getInputStyles = (field, isOptional = false) => {
        const value = formData[field];
        let hasError = validated && !isOptional && (!value || String(value).trim() === '');

        if (validated && field === 'dni' && value.length !== 8) hasError = true;
        if (validated && field === 'telefono' && value && value.length !== 9) hasError = true;

        return `${inputBaseStyles} ${hasError ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10' : 'border-slate-200/80 focus:bg-white focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/10 shadow-sm'}`;
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 relative selection:bg-blue-100 selection:text-blue-900">
            <div className="max-w-[1200px] w-full mx-auto space-y-6 animate-fade-in">
                
                {/* Botón Superior de Retroceso */}
                <div className="flex items-center gap-2">
                    <button type="button" onClick={handleTryExit} className="text-[12px] text-slate-500 hover:text-[#0F4C81] transition-all font-black uppercase tracking-wider flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.01)] border border-slate-200/60 hover:shadow-sm">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        Volver
                    </button>
                </div>

                {/* Banner de Cabecera del Módulo */}
                <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500/20 via-indigo-100/40 to-transparent p-6 sm:px-8 sm:py-6 rounded-3xl border border-indigo-200/80 shadow-[0_4px_25px_rgb(0,0,0,0.01)] flex items-center gap-4 z-40">
                    <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-40 blur-xl bg-indigo-300 pointer-events-none"></div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-200/60 flex items-center justify-center text-indigo-600 relative z-10 shadow-sm shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                    </div>
                    <div className="flex flex-col relative z-10 text-left">
                        <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Registrar Solicitud</h1>
                        <span className="text-[11px] font-black text-indigo-700 mt-1.5 uppercase tracking-wider">Trámite de Mesa de Partes</span>
                    </div>
                </div>

                {/* Formulario Principal de Ingreso de Datos */}
                <form onSubmit={handleSubmit} className="space-y-6" noValidate autoComplete="off">
                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100/80">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            
                            {/* Input: DNI (Filtra caracteres no numéricos al vuelo) */}
                            <div className="md:col-span-4 lg:col-span-3">
                                <label htmlFor="dni" className={labelStyles}>DNI Solicitante *</label>
                                <input
                                    id="dni"
                                    name="dni"
                                    type="text"
                                    maxLength="8"
                                    placeholder="Ingrese DNI completo"
                                    className={getInputStyles('dni')}
                                    value={formData.dni}
                                    onChange={e => handleInputChange('dni', e.target.value.replace(/\D/g, ''))}
                                />
                                {validated && !formData.dni && <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Ingrese DNI</p>}
                                {validated && formData.dni && formData.dni.length !== 8 && <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ El DNI debe tener 8 dígitos</p>}
                            </div>

                            {/* Input: Nombres */}
                            <div className="md:col-span-8 lg:col-span-4">
                                <label htmlFor="nombres" className={labelStyles}>Nombres *</label>
                                <input
                                    id="nombres"
                                    name="nombres"
                                    type="text"
                                    placeholder="Nombres completos"
                                    className={getInputStyles('nombres')}
                                    value={formData.nombres}
                                    onChange={e => handleInputChange('nombres', e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
                                />
                                {validated && (!formData.nombres.trim() || formData.nombres.trim().length < 2) && (
                                    <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Ingrese nombres</p>
                                )}
                            </div>

                            {/* Input: Apellidos */}
                            <div className="md:col-span-12 lg:col-span-5">
                                <label htmlFor="apellidos" className={labelStyles}>Apellidos *</label>
                                <input
                                    id="apellidos"
                                    name="apellidos"
                                    type="text"
                                    placeholder="Apellidos completos"
                                    className={getInputStyles('apellidos')}
                                    value={formData.apellidos}
                                    onChange={e => handleInputChange('apellidos', e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
                                />
                                {validated && (!formData.apellidos.trim() || formData.apellidos.trim().length < 2) && (
                                    <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Ingrese apellidos</p>
                                )}
                            </div>

                            {/* Input: Teléfono (Opcional) */}
                            <div className="md:col-span-4 lg:col-span-4">
                                <label htmlFor="telefono" className={labelStyles}>Teléfono <span className="text-slate-400 normal-case font-bold tracking-normal">(Opcional)</span></label>
                                <input
                                    id="telefono"
                                    name="telefono"
                                    type="text"
                                    maxLength="9"
                                    placeholder="Ingrese teléfono completo"
                                    className={getInputStyles('telefono', true)}
                                    value={formData.telefono}
                                    onChange={e => handleInputChange('telefono', e.target.value.replace(/\D/g, ''))}
                                />
                                {validated && formData.telefono && formData.telefono.length !== 9 && <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Debe tener 9 dígitos exactos</p>}
                            </div>

                            {/* Input: Dirección (Opcional) */}
                            <div className="md:col-span-8 lg:col-span-8">
                                <label htmlFor="direccion" className={labelStyles}>Dirección de Residencia <span className="text-slate-400 normal-case font-bold tracking-normal">(Opcional)</span></label>
                                <input
                                    id="direccion"
                                    name="direccion"
                                    type="text"
                                    placeholder="Dirección del contribuyente"
                                    className={getInputStyles('direccion', true)}
                                    value={formData.direccion}
                                    onChange={e => handleInputChange('direccion', e.target.value)}
                                />
                            </div>

                            <div className="md:col-span-12 my-1 border-t border-slate-100"></div>

                            {/* Input: Código o Número de Expediente */}
                            <div className="md:col-span-8 lg:col-span-8">
                                <label htmlFor="expediente_solicitado" className={labelStyles}>Documento / N° Expediente Requerido *</label>
                                <input
                                    id="expediente_solicitado"
                                    name="expediente_solicitado"
                                    type="text"
                                    placeholder="Ej. EXP-2026-XXXX"
                                    className={getInputStyles('expediente_solicitado')}
                                    value={formData.expediente_solicitado}
                                    onChange={e => handleInputChange('expediente_solicitado', e.target.value)}
                                />
                                {validated && !formData.expediente_solicitado && <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Ingrese el documento o expediente</p>}
                            </div>

                            {/* Input: Fecha (Protegido por ReadOnly nativo para evitar manipulaciones externas) */}
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

                            {/* Textarea: Detalle del Asunto */}
                            <div className="md:col-span-12">
                                <label htmlFor="descripcion" className={labelStyles}>Descripción / Sustento de la Solicitud *</label>
                                <textarea
                                    id="descripcion"
                                    name="descripcion"
                                    rows="4"
                                    placeholder="Detalle de forma concisa el motivo del requerimiento del contribuyente..."
                                    className={`${getInputStyles('descripcion')} h-auto py-4 resize-none`}
                                    value={formData.descripcion}
                                    onChange={e => handleInputChange('descripcion', e.target.value)}
                                ></textarea>
                                {validated && (!formData.descripcion.trim() || formData.descripcion.trim().length < 10) && (
                                    <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Ingrese una descripción (al menos 10 caracteres)</p>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Footer de Controles de Envío */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={handleTryExit} className="px-6 py-3.5 rounded-2xl border border-slate-200 text-[13px] font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all shadow-sm">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-3.5 rounded-2xl font-black text-white text-[12px] uppercase tracking-widest bg-gradient-to-r from-[#0F4C81] to-blue-700 shadow-[0_4px_15px_rgba(15,76,129,0.2)] hover:-translate-y-0.5 transition-all disabled:opacity-50">
                            {isSubmitting ? 'Registrando...' : 'Registrar Solicitud'}
                        </button>
                    </div>
                </form>
            </div>

            {/* MODAL INTERNO: Alerta de seguridad ante fuga de datos con cambios pendientes */}
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
                            <p className="text-[13px] text-slate-500 px-2 leading-relaxed font-medium">Hay datos redactados en este formulario. Si decides regresar ahora, perderás toda la información ingresada.</p>
                        </div>
                        <div className="bg-slate-50/50 px-6 py-5 flex flex-col sm:flex-row justify-center gap-3 border-t border-slate-100">
                            <button type="button" onClick={() => setShowExitModal(false)} className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all order-2 sm:order-1">
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