import { useState } from 'react';
import { useCaja } from '../../context/CajaContext';

export default function HistorialCaja() {
    // --- CONSUMO DE ESTADO GLOBAL ---
    const { movimientos, loadingCaja } = useCaja();

    // --- ESTADOS LOCALES DE CONTROL ---
    const [activeTab, setActiveTab] = useState('Aceptada');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);

    // --- CONFIGURACIÓN DE PAGINACIÓN ---
    const [currentPage, setCurrentPage] = useState(1);
    const registrosPorPagina = 12;

    // =========================================================================
    // BÚSQUEDA EXCLUSIVA POR COINCIDENCIA INICIAL
    // =========================================================================
    const datosFiltradosGlobales = movimientos.filter(item => {
        // 1. Discriminación primaria por pestaña activa
        if (item.estado !== activeTab) return false;

        // Sanitización de la entrada del usuario (Remoción de espacios en extremos)
        const search = searchTerm.toLowerCase().trim();
        if (!search) return true; // Si no hay criterio de búsqueda, retorna el registro

        // 2. Coincidencia exacta posicional para el documento de identidad (DNI)
        const coincideDni = item.dni && item.dni.startsWith(search);

        // 3. Coincidencia flexible por cualquier token nominal o bloque completo (Nombres o Apellidos)
        const nombreCompleto = `${item.nombres || ''} ${item.apellidos || ''}`.toLowerCase().trim();

        // Al usar .includes() permites que encuentre coincidencias completas en cualquier parte del nombre
        const coincideNombreOApellido = nombreCompleto.includes(search);

        return coincideDni || coincideNombreOApellido;
    });

    // =========================================================================
    // ALGORITMO MATEMÁTICO DE PAGINACIÓN Y CONTROL DE DESBORDAMIENTOS
    // =========================================================================
    const totalPaginas = Math.ceil(datosFiltradosGlobales.length / registrosPorPagina) || 1;

    // Reset preventivo automático si los filtros reducen el dataset mientras el usuario está en una página avanzada
    const paginaActualVerificada = currentPage > totalPaginas ? 1 : currentPage;

    // Cálculo geométrico de límites para el método slice
    const indiceInicio = (paginaActualVerificada - 1) * registrosPorPagina;
    const indiceFin = indiceInicio + registrosPorPagina;
    const datosPaginados = datosFiltradosGlobales.slice(indiceInicio, indiceFin);

    // --- HOJA DE ESTILOS AUXILIAR PARA CABECERAS ---
    const thStyles = "py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest";

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 animate-fade-in relative pb-28">

            {/* Inyección de estilos CSS nativos para estandarización de barras de desplazamiento del modal */}
            <style>{`
                .custom-scroll::-webkit-scrollbar { width: 6px; }
                .custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>

            <div className="max-w-[1200px] w-full mx-auto space-y-6">

                {/* --- CABECERA PRINCIPAL --- */}
                <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-amber-50/50 to-transparent p-6 sm:px-8 sm:py-6 rounded-3xl border border-amber-200/70 shadow-[0_4px_25px_rgb(0,0,0,0.01)] flex items-center gap-4 z-40">
                    <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-30 blur-xl bg-amber-300 pointer-events-none"></div>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-200/60 flex items-center justify-center text-orange-600 relative z-10 shadow-sm shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex flex-col relative z-10 text-left">
                        <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Historial de Caja</h1>
                        <span className="text-[11px] font-black text-orange-600 mt-1.5 uppercase tracking-wider">Control de Recaudación</span>
                    </div>
                </div>

                {/* --- SECCIÓN DE ACCIONES Y CONTROL DE BÚSQUEDA --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">

                    {/* Contenedor Adaptativo de Pestañas */}
                    <div className={`flex gap-2 p-1.5 backdrop-blur-md w-full md:max-w-sm rounded-2xl border transition-all duration-300 shrink-0 shadow-sm ${activeTab === 'Aceptada'
                        ? 'bg-emerald-50/70 border-emerald-200/50'
                        : 'bg-rose-50/70 border-rose-200/50'
                        }`}>
                        {/* Botón Pestaña Aprobadas */}
                        <button
                            type="button"
                            onClick={() => { setActiveTab('Aceptada'); setCurrentPage(1); }}
                            className={`w-full py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'Aceptada'
                                ? 'bg-white text-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.15)] border border-emerald-100'
                                : 'text-emerald-700/60 hover:text-emerald-800 hover:bg-white/30'
                                }`}
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Aprobadas
                        </button>

                        {/* Botón Pestaña Denegadas */}
                        <button
                            type="button"
                            onClick={() => { setActiveTab('Rechazada'); setCurrentPage(1); }}
                            className={`w-full py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'Rechazada'
                                ? 'bg-white text-rose-600 shadow-[0_4px_12px_rgba(244,63,94,0.15)] border border-rose-100'
                                : 'text-rose-700/60 hover:text-rose-800 hover:bg-white/30'
                                }`}
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Denegadas
                        </button>
                    </div>

                    {/* Componente Barra de Búsqueda */}
                    <div className="relative w-full md:w-96">
                        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder="Buscar por Contribuyente o DNI..."
                            className="w-full h-[48px] pl-12 pr-4 bg-white border border-slate-200/80 rounded-2xl text-[13px] font-semibold text-slate-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                </div>

                {/* --- PANEL DE DATOS EN FORMATO TABULAR --- */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col w-full overflow-hidden">

                    {/* Barra Superior con Contador de Registros */}
                    <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/60 border border-amber-100/80 rounded-xl text-[11px] font-bold text-amber-700 uppercase tracking-wider shadow-sm select-none">
                                <span className="font-black text-amber-800 text-[11px]">{datosFiltradosGlobales.length}</span>
                                movimiento(s) en historial
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    {activeTab === 'Aceptada' ? (
                                        <>
                                            {/* Distribución exacta para APROBADAS */}
                                            <th className={`${thStyles} text-center w-64`}>Contribuyente</th>
                                            <th className={`${thStyles} text-center w-28`}>DNI</th>
                                            <th className={`${thStyles} text-center w-40`}>Formato</th>
                                            <th className={`${thStyles} text-center w-20`}>Hojas</th>
                                            <th className={`${thStyles} text-center w-20`}>Copias</th>
                                            <th className={`${thStyles} text-center w-24`}>Acción</th>
                                        </>
                                    ) : (
                                        <>
                                            {/* Distribución calibrada para DENEGADAS */}
                                            <th className={`${thStyles} text-center w-[460px]`}>Contribuyente</th>
                                            <th className={`${thStyles} text-center w-28`}>DNI</th>
                                            <th className={`${thStyles} text-center w-[400px]`}>Motivo de Denegación</th>
                                            <th className={`${thStyles} text-center w-28`}>Estado</th>
                                            <th className={`${thStyles} text-center w-24`}>Acción</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-[13px]">
                                {loadingCaja ? (
                                    <tr><td colSpan={activeTab === 'Aceptada' ? "6" : "5"} className="py-12 text-center text-sm font-bold text-slate-400">Accediendo a registros...</td></tr>
                                ) : datosPaginados.length === 0 ? (
                                    <tr><td colSpan={activeTab === 'Aceptada' ? "6" : "5"} className="py-12 text-center text-sm font-bold text-slate-400">No hay movimientos en esta sección.</td></tr>
                                ) : (
                                    datosPaginados.map((item, index) => (
                                        <tr key={item.id || index} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            {/* Celda 1: Nombre con ancho elástico adaptativo */}
                                            <td className={`py-4 px-6 ${activeTab === 'Aceptada' ? 'w-64' : 'w-[460px]'}`}>
                                                <span className="text-[13px] font-bold text-slate-700 block truncate  text-center" title={`${item.nombres} ${item.apellidos}`}>
                                                    {item.nombres} {item.apellidos}
                                                </span>
                                            </td>

                                            {/* Celda 2: Identificador de Identidad */}
                                            <td className="py-4 px-6 text-center w-28">
                                                <span className="text-[13px] font-bold text-slate-600 tracking-wide">
                                                    {item.dni}
                                                </span>
                                            </td>

                                            {/* Renderizado Condicional del Core de Celdas según Tab activo */}
                                            {activeTab === 'Aceptada' ? (
                                                <>
                                                    <td className="py-4 px-6 text-center w-40">
                                                        <span className="text-[12px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 inline-block whitespace-nowrap">
                                                            {item.tipo_formato_tupa}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center w-20 text-[13px] font-bold text-slate-600">{item.numero_hojas || '0'}</td>
                                                    <td className="py-4 px-6 text-center w-20 text-[13px] font-bold text-slate-600">{item.cantidad_copias || '0'}</td>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Vista Denegadas: El texto abarca mayor recorrido horizontal eliminando espacios muertos */}
                                                    <td className="py-4 px-6 w-[400px] text-center">
                                                        <p className="text-[12px] font-semibold text-slate-500 w-full max-w-[380px] truncate italic mx-auto text-center" title={item.motivo_rechazo}>
                                                            "{item.motivo_rechazo || 'Sin detalle'}"
                                                        </p>
                                                    </td>
                                                    <td className="py-4 px-6 text-center w-28">
                                                        <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[10px] font-black uppercase tracking-wider inline-block">
                                                            DENEGADO
                                                        </span>
                                                    </td>
                                                </>
                                            )}

                                            {/* Celda de Disparador Operativo */}
                                            <td className="py-4 px-6 text-center w-24">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedItem(item)}
                                                    className="px-3.5 py-1.5 bg-slate-100 text-[#0F4C81] hover:bg-[#0F4C81] hover:text-white rounded-xl text-[11px] font-extrabold uppercase tracking-wide transition-all shadow-sm"
                                                >
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

                {/* --- COMPONENTE FLOTANTE DE CONTROL DE PAGINACIÓN --- */}
                {totalPaginas > 1 && !loadingCaja && datosPaginados.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 p-2 px-6 flex justify-between items-center bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all z-40 w-max min-w-[320px]">
                        <span className="text-[12px] text-slate-500 font-extrabold tracking-widest uppercase mr-8">
                            Pág. <span className="text-[#0F4C81] text-[14px]">{paginaActualVerificada}</span> / {totalPaginas}
                        </span>
                        <div className="flex gap-2">
                            {/* Retroceder Página */}
                            <button
                                type="button"
                                disabled={paginaActualVerificada === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 disabled:opacity-40 hover:bg-slate-50 hover:text-[#0F4C81] hover:border-blue-200 transition-all shadow-sm"
                            >
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            {/* Avanzar Página */}
                            <button
                                type="button"
                                disabled={paginaActualVerificada === totalPaginas}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPaginas))}
                                className="w-10 h-10 flex items-center justify-center bg-[#0F4C81] text-white rounded-xl disabled:opacity-50 hover:bg-blue-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                            >
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                )}

            </div>

            {/* =========================================================================
                MODAL DETALLE: SUSTENTO COMPLETO DE MESA DE PARTES
                ========================================================================= */}
            {selectedItem && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden transform scale-100 transition-all flex flex-col max-h-[90vh]">
                        {/* Barra de estado visual superior */}
                        <div className={`h-2 w-full shrink-0 ${selectedItem.estado === 'Aceptada' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

                        {/* Cuerpo interno del Modal */}
                        <div className="p-6 sm:p-8 space-y-5 overflow-y-auto custom-scroll">

                            {/* Membrete Oficial Institucional */}
                            <div className="text-center space-y-1 pb-2 border-b border-slate-200">
                                <h2 className="text-sm font-black text-slate-800 tracking-wider uppercase">Municipalidad Distrital de José Leonardo Ortiz</h2>
                                <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Unidad Funcional de Archivo y Acceso Documentario</p>
                                <p className="text-[13px] font-extrabold text-[#0F4C81] pt-1">Ficha de Sustento - Mesa de Partes</p>
                            </div>

                            {/* Ficha Técnica: Datos del Contribuyente */}
                            <div className="space-y-3 text-[13px] bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                {/* Cambiado a grid-cols-3 para empujar la segunda columna más a la derecha */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contribuyente</p>
                                        <p className="font-bold text-slate-800">{selectedItem.nombres} {selectedItem.apellidos}</p>
                                    </div>
                                    <div className="col-span-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DNI</p>
                                        <p className="font-bold text-slate-800">{selectedItem.dni}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 border-t border-slate-200/60 pt-2">
                                    <div className="col-span-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dirección de Residencia</p>
                                        <p className="font-bold text-slate-800">{selectedItem.direccion || 'No registrada'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 border-t border-slate-200/60 pt-2">
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</p>
                                        <p className="font-bold text-slate-800">{selectedItem.telefono || 'No registrado'}</p>
                                    </div>
                                    <div className="col-span-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha de Registro</p>
                                        <p className="font-bold text-slate-800 ">{selectedItem.fecha_solicitud}</p>
                                    </div>
                                </div>
                                <div className="border-t border-slate-200/60 pt-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expediente/Documento Requerido</p>
                                    <p className="font-bold text-[#0F4C81]">{selectedItem.expediente_solicitado}</p>
                                    <p className="text-slate-500 italic text-[12px] mt-1 leading-relaxed">"{selectedItem.descripcion}"</p>
                                </div>
                            </div>

                            {/* Desglose de Cálculo Analítico de Copias */}
                            {selectedItem.estado === 'Aceptada' && (
                                <div className="p-4 rounded-2xl text-[12px] space-y-3 bg-slate-50 border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estructura del Formato Solicitado</p>
                                    <p className="text-slate-700 font-semibold mb-2">📋 Modalidad Requerida: <strong className="font-black text-slate-800 ml-1">{selectedItem.tipo_formato_tupa || 'No Aplica'}</strong></p>

                                    {selectedItem.tipo_formato_tupa === 'Copia Simple A4' && selectedItem.paginas_simples && (
                                        <div className="flex justify-between items-center text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                                            <span>📄 Copias Simples A4:</span>
                                            <span className="font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">{selectedItem.paginas_simples}</span>
                                        </div>
                                    )}

                                    {selectedItem.tipo_formato_tupa === 'Fedateado' && selectedItem.paginas_fedateadas && (
                                        <div className="flex justify-between items-center text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                                            <span>📜 Copias Fedateadas:</span>
                                            <span className="font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">{selectedItem.paginas_fedateadas}</span>
                                        </div>
                                    )}

                                    {selectedItem.tipo_formato_tupa === 'Mixto' && (
                                        <>
                                            {selectedItem.paginas_simples && (
                                                <div className="flex justify-between items-center text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                                                    <span>📄 Copias Simples A4:</span>
                                                    <span className="font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">{selectedItem.paginas_simples}</span>
                                                </div>
                                            )}
                                            {selectedItem.paginas_fedateadas && (
                                                <div className="flex justify-between items-center text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                                                    <span>📜 Copias Fedateadas:</span>
                                                    <span className="font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">{selectedItem.paginas_fedateadas}</span>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-2">
                                        <div className="bg-white p-2 rounded-xl border border-slate-200/60 text-center">
                                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Hojas</span>
                                            <span className="text-[14px] font-black text-slate-700">{selectedItem.numero_hojas || '0'}</span>
                                        </div>
                                        <div className="bg-white p-2 rounded-xl border border-slate-200/60 text-center">
                                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Juegos/Copias</span>
                                            <span className="text-[14px] font-black text-slate-700">{selectedItem.cantidad_copias || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Renderizado de Datos Financieros Finales */}
                            {selectedItem.estado === 'Aceptada' ? (
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center text-[14px] font-black text-emerald-800">
                                    <span className="uppercase tracking-wider text-[10px] font-black">Monto Recaudado:</span>
                                    <span>S/. {parseFloat(selectedItem.costo_tupa).toFixed(2)}</span>
                                </div>
                            ) : (
                                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-[12px]">
                                    <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest mb-2">Motivo de la denegación:</p>
                                    <div className="max-h-[120px] overflow-y-auto pr-2 custom-scroll">
                                        <p className="text-rose-900 font-bold leading-relaxed italic">"{selectedItem.motivo_rechazo || 'No especificado.'}"</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Botón de Cierre del Modal */}
                        <div className="bg-slate-50 px-6 py-4 flex justify-end items-center border-t border-slate-100 shrink-0">
                            <button type="button" onClick={() => setSelectedItem(null)} className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[12px] font-bold rounded-xl transition-all shadow-sm">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}