import { useState } from 'react';
import { useCaja } from '../../context/CajaContext';

export default function HistorialCaja() {
    const { movimientos, loadingCaja } = useCaja();
    const [activeTab, setActiveTab] = useState('Aceptada');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const registrosPorPagina = 8;

    const datosFiltradosGlobales = movimientos.filter(item =>
        item.estado === activeTab &&
        ((item.dni && item.dni.includes(searchTerm)) ||
            (item.nombres && `${item.nombres} ${item.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const totalPaginas = Math.ceil(datosFiltradosGlobales.length / registrosPorPagina) || 1;
    const paginaActualVerificada = currentPage > totalPaginas ? 1 : currentPage;

    const indiceInicio = (paginaActualVerificada - 1) * registrosPorPagina;
    const indiceFin = indiceInicio + registrosPorPagina;
    const datosPaginados = datosFiltradosGlobales.slice(indiceInicio, indiceFin);

    const totalRecaudado = movimientos
        .filter(item => item.estado === 'Aceptada' &&
            ((item.dni && item.dni.includes(searchTerm)) ||
                (item.nombres && `${item.nombres} ${item.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase())))
        )
        .reduce((acc, curr) => acc + (parseFloat(curr.costo_tupa) || 0), 0)
        .toFixed(2);

    const irAPaginaAnterior = () => {
        if (paginaActualVerificada > 1) setCurrentPage(paginaActualVerificada - 1);
    };

    const irAPaginaSiguiente = () => {
        if (paginaActualVerificada < totalPaginas) setCurrentPage(paginaActualVerificada + 1);
    };

    const thStyles = "py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest";

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 animate-fade-in select-none relative pb-24">

            <style>{`
                .custom-scroll::-webkit-scrollbar { width: 6px; }
                .custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>

            <div className="max-w-[1200px] w-full mx-auto space-y-6">

                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-emerald-500 rounded-full shadow-sm"></div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Módulo de Caja Distrital</h1>
                            <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Control de Recaudación Integrado (TUPA)</span>
                        </div>
                    </div>

                    <div className="relative w-full md:w-96">
                        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder="Buscar por DNI o ciudadano..."
                            className="w-full h-[48px] pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                </div>

                <div className="flex gap-2 p-1.5 bg-slate-200/60 max-w-sm rounded-2xl border border-slate-200/40">
                    <button
                        type="button"
                        onClick={() => { setActiveTab('Aceptada'); setCurrentPage(1); }}
                        className={`w-full py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider transition-all ${activeTab === 'Aceptada' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        🟢 Aprobadas (Cobros)
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('Rechazada'); setCurrentPage(1); }}
                        className={`w-full py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider transition-all ${activeTab === 'Rechazada' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        🔴 Denegadas
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 lg:col-span-8 flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100">
                                        <th className={thStyles}>Contribuyente / Ciudadano</th>
                                        {activeTab === 'Aceptada' ? (
                                            <>
                                                <th className={thStyles}>Formato TUPA</th>
                                                <th className={`${thStyles} text-center`}>Hojas</th>
                                                <th className={`${thStyles} text-center`}>Copias</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className={thStyles}>Motivo de Denegación</th>
                                                <th className={`${thStyles} text-center`}>Estado</th>
                                            </>
                                        )}
                                        <th className={`${thStyles} text-center`}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingCaja ? (
                                        <tr><td colSpan={activeTab === 'Aceptada' ? "5" : "4"} className="py-12 text-center text-sm font-bold text-slate-400">Accediendo a registros...</td></tr>
                                    ) : datosPaginados.length === 0 ? (
                                        <tr><td colSpan={activeTab === 'Aceptada' ? "5" : "4"} className="py-12 text-center text-sm font-bold text-slate-400">No hay movimientos en esta sección.</td></tr>
                                    ) : (
                                        datosPaginados.map((item, index) => (
                                            <tr key={item.id || index} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-bold text-slate-700">{item.nombres} {item.apellidos}</span>
                                                        <span className="text-[11px] font-semibold text-slate-400 mt-0.5">DNI: {item.dni}</span>
                                                    </div>
                                                </td>

                                                {activeTab === 'Aceptada' ? (
                                                    <>
                                                        <td className="py-4 px-6">
                                                            <span className="text-[12px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                {item.tipo_formato_tupa}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-center text-[13px] font-bold text-slate-600">{item.numero_hojas || '0'}</td>
                                                        <td className="py-4 px-6 text-center text-[13px] font-bold text-slate-600">{item.cantidad_copias || '0'}</td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="py-4 px-6">
                                                            <p className="text-[12px] font-semibold text-slate-500 max-w-[200px] truncate italic">
                                                                "{item.motivo_rechazo || 'Sin detalle'}"
                                                            </p>
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            <span className="text-[11px] font-black text-rose-600 uppercase bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">Denegado</span>
                                                        </td>
                                                    </>
                                                )}

                                                <td className="py-4 px-6 text-center">
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

                        {!loadingCaja && totalPaginas > 1 && (
                            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30 rounded-b-3xl shrink-0">
                                <span className="text-[12px] font-bold text-slate-400">
                                    Mostrando {datosPaginados.length} de {datosFiltradosGlobales.length} registros
                                </span>

                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={irAPaginaAnterior}
                                        disabled={paginaActualVerificada === 1}
                                        className="h-9 px-3 border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-[12px] font-bold transition-all shadow-sm flex items-center justify-center"
                                    >
                                        Anterior
                                    </button>

                                    <div className="h-9 min-w-9 px-3 border border-[#0F4C81] bg-[#0F4C81]/5 text-[#0F4C81] rounded-xl text-[12px] font-black flex items-center justify-center shadow-sm select-none">
                                        {paginaActualVerificada}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={irAPaginaSiguiente}
                                        disabled={paginaActualVerificada === totalPaginas}
                                        className="h-9 px-3 border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-[12px] font-bold transition-all shadow-sm flex items-center justify-center"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 lg:col-span-4 space-y-6 relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex flex-col">
                                <h3 className="text-[12px] font-black uppercase tracking-widest text-[#0F4C81]">Balance General</h3>
                                <span className="text-[11px] font-bold text-slate-400 mt-0.5">Arqueo Automatizado Diario</span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F4C81] border border-blue-100 flex items-center justify-center text-lg font-bold">
                                💰
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Recaudado Hoy</span>
                            <div className="text-[36px] font-black tracking-tight leading-none text-emerald-600">S/. {totalRecaudado}</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[12px] text-slate-500 font-medium leading-relaxed">
                            📌 <strong>Tasa TUPA Activa:</strong> Las solicitudes aprobadas multiplican los folios físicos emitidos del archivo central por el valor normado de S/. 0.10 céntimos.
                        </div>
                    </div>

                </div>
            </div>

            {selectedItem && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden transform scale-100 transition-all flex flex-col max-h-[90vh]">
                        <div className={`h-2 w-full shrink-0 ${selectedItem.estado === 'Aceptada' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

                        <div className="p-6 sm:p-8 space-y-5 overflow-y-auto custom-scroll">

                            <div className="text-center space-y-1 pb-2 border-b border-slate-200">
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Municipalidad Distrital de José Leonardo Ortiz</h2>
                                <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Oficina de Tecnología de la Información y Comunicaciones</p>
                                <p className="text-[13px] font-extrabold text-[#0F4C81] pt-1">Ficha de Sustento - Mesa de Partes</p>
                            </div>

                            <div className="space-y-3 text-[13px] bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contribuyente</p>
                                        <p className="font-bold text-slate-800">{selectedItem.nombres} {selectedItem.apellidos}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento (DNI)</p>
                                        <p className="font-bold text-slate-800">{selectedItem.dni}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-2">
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dirección de Residencia</p>
                                        <p className="font-bold text-slate-800">{selectedItem.direccion || 'No registrada'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-2">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</p>
                                        <p className="font-bold text-slate-800">{selectedItem.telefono || 'No registrado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha de Registro</p>
                                        <p className="font-bold text-slate-800">{selectedItem.fecha_solicitud}</p>
                                    </div>
                                </div>
                                <div className="border-t border-slate-200/60 pt-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expediente Físico Requerido</p>
                                    <p className="font-bold text-[#0F4C81]">{selectedItem.expediente_solicitado}</p>
                                    <p className="text-slate-500 italic text-[12px] mt-1 leading-relaxed">"{selectedItem.descripcion}"</p>
                                </div>
                            </div>

                            {selectedItem.estado === 'Aceptada' && (
                                <div className="p-4 rounded-2xl text-[12px] space-y-3 bg-slate-50 border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estructura del Formato Solicitado</p>
                                    <p className="text-slate-700 font-semibold mb-2">📋 Modalidad Requerida: <strong className="font-black text-slate-800 ml-1">{selectedItem.tipo_formato_tupa || 'No Aplica'}</strong></p>

                                    {selectedItem.tipo_formato_tupa === 'Copia Simple A4' && selectedItem.paginas_simples && (
                                        <div className="flex justify-between items-center text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                                            <span>📄 Folios/Páginas a copiar simples:</span>
                                            <span className="font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">{selectedItem.paginas_simples}</span>
                                        </div>
                                    )}

                                    {selectedItem.tipo_formato_tupa === 'Fedateado' && selectedItem.paginas_fedateadas && (
                                        <div className="flex justify-between items-center text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                                            <span>📜 Folios/Páginas a certificar fedateadas:</span>
                                            <span className="font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">{selectedItem.paginas_fedateadas}</span>
                                        </div>
                                    )}

                                    {selectedItem.tipo_formato_tupa === 'Mixto' && (
                                        <>
                                            {selectedItem.paginas_simples && (
                                                <div className="flex justify-between items-center text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                                                    <span>📄 Rango de Copias Simples:</span>
                                                    <span className="font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">{selectedItem.paginas_simples}</span>
                                                </div>
                                            )}
                                            {selectedItem.paginas_fedateadas && (
                                                <div className="flex justify-between items-center text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                                                    <span>📜 Rango de Fedateados:</span>
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

                            {selectedItem.estado === 'Aceptada' ? (
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center text-[14px] font-black text-emerald-800">
                                    <span className="uppercase tracking-wider text-[10px] font-black">Monto Recaudado TUPA:</span>
                                    <span>S/. {parseFloat(selectedItem.costo_tupa).toFixed(2)}</span>
                                </div>
                            ) : (
                                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-[12px]">
                                    <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest mb-2">Motivo Técnico de Denegación:</p>
                                    <div className="max-h-[120px] overflow-y-auto pr-2 custom-scroll">
                                        <p className="text-rose-900 font-bold leading-relaxed italic">"{selectedItem.motivo_rechazo || 'No especificado.'}"</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-50 px-6 py-4 flex justify-end items-center border-t border-slate-100 shrink-0">
                            <button type="button" onClick={() => setSelectedItem(null)} className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[12px] font-bold rounded-xl transition-all shadow-sm">
                                Cerrar Ventana
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}