import { useState, useEffect, useMemo } from 'react';
import { useExpedientes } from '../../context/useExpedientes';
import CustomDropdown from '../../components/CustomDropdown';

export default function Expedientes({
  setScreen,
  searchTerm = '',
  setSearchTerm,
  filterTipo = '',
  setFilterTipo,
  filterFechaDesde = '',
  setFilterFechaDesde
}) {
  // Consumo de datos globales mediante Context
  const { expedientes, tipos, loading } = useExpedientes();

  // Estados locales para la paginación activa
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Limpia los filtros del estado del padre automáticamente al cambiar de pantalla en el sidebar
  useEffect(() => {
    return () => {
      setSearchTerm('');
      setFilterTipo('');
      setFilterFechaDesde('');
    };
  }, [setSearchTerm, setFilterTipo, setFilterFechaDesde]);

  // Formatea de forma amigable las etiquetas del tiempo de conservación legal
  const getConservacionLabel = (val) => {
    if (!val) return 'N/A';
    if (typeof val === 'string' && (val.toLowerCase().includes('año') || val.toLowerCase().includes('mes') || val.toLowerCase().includes('perma'))) {
      return val;
    }
    if (val === '0.5') return '6 meses';
    return `${val} año${parseInt(val) > 1 ? 's' : ''}`;
  };

  // Maneja el input de búsqueda y resetea a la primera página
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Restablece todos los filtros superiores del módulo a su estado por defecto
  const handleLimpiarFiltros = () => {
    setSearchTerm('');
    setFilterTipo('');
    setFilterFechaDesde('');
    setCurrentPage(1);
  };

  // ==========================================================================
  // LÓGICA PRINCIPAL DE FILTRADO MULTIDIMENSIONAL
  // ==========================================================================
  // Evita re-procesar el dataset completo de expedientes si no ha cambiado el estado de los filtros o la data global
  const filteredExpedientes = useMemo(() => {
    return expedientes.filter(exp => {
      const query = searchTerm.toLowerCase().trim();

      // 1. Filtro por Búsqueda
      const matchesSearch = query === '' ||
        (exp.numero_expediente && exp.numero_expediente.toLowerCase().includes(query)) ||
        (exp.titulo && exp.titulo.toLowerCase().includes(query)) ||
        (exp.razon_social && exp.razon_social.toLowerCase().includes(query));

      // 2. Filtro por Identificador de Tipo Documental
      const matchesTipo = filterTipo === '' ||
        (exp.tipo_documento_id && exp.tipo_documento_id.toString() === filterTipo.toString());

      // 3. Filtro Cronológico
      let matchesFecha = true;
      if (filterFechaDesde !== '') {
        const fechaDocStr = exp.fecha_ingreso || exp.created_at;
        if (fechaDocStr) {
          const fechaDocLimpia = fechaDocStr.split('T')[0];
          const fechaFiltroLimpia = filterFechaDesde.split('T')[0];
          matchesFecha = fechaDocLimpia >= fechaFiltroLimpia;
        } else {
          matchesFecha = false;
        }
      }
      return matchesSearch && matchesTipo && matchesFecha;
    });
  }, [expedientes, searchTerm, filterTipo, filterFechaDesde]);

  // Cálculos matemáticos exactos para segmentar el arreglo según la página activa
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredExpedientes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredExpedientes.length / itemsPerPage);

  // Semántica de colores para las sublíneas de estado de cada documento
  const colorEstadoSublinea = (estado) => {
    const st = (estado || 'Activo').toLowerCase();
    if (st.includes('revisión') || st.includes('revision')) return 'bg-amber-500';
    if (st.includes('depurar') || st.includes('vencido')) return 'bg-rose-500';
    return 'bg-emerald-500';
  };

  // Clases utilitarias reutilizables
  const inputStyles = "w-full h-[48px] px-4 border border-slate-200 bg-slate-50 rounded-2xl text-[13px] focus:bg-white focus:border-[#0F4C81] focus:ring-4 focus:ring-[#0F4C81]/10 outline-none transition-all duration-300 font-semibold text-slate-700 placeholder-slate-400";
  const labelStyles = "block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2";

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8 relative selection:bg-blue-200 selection:text-blue-900 pb-24 text-left">
      <div className="max-w-screen-xl mx-auto animate-fade-in">

        {/* --- SECCIÓN 1: CABECERA PRINCIPAL --- */}
        <div className="relative overflow-hidden bg-gradient-to-r from-pink-500/25 via-pink-100/40 to-transparent p-6 sm:px-8 sm:py-6 rounded-3xl border border-pink-200/80 shadow-[0_4px_30px_rgba(244,63,94,0.03)] flex items-center gap-4 mb-8 z-40">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-30 blur-xl bg-pink-300 pointer-events-none"></div>
          <div className="w-10 h-10 rounded-xl bg-pink-600/15 border border-pink-200/60 flex items-center justify-center text-slate-600 relative z-10 shadow-sm shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
            </svg>
          </div>
          <div className="flex flex-col relative z-10 text-left">
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Búsqueda Documental</h1>
            <span className="text-[11px] font-black text-pink-700 mt-1.5 uppercase tracking-wider">Gestión integral y localización</span>
          </div>
        </div>

        {/* --- SECCIÓN 2: BARRA DE HERRAMIENTAS Y FILTROS AVANZADOS --- */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-8 relative z-30">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            <span className="text-[12px] font-extrabold text-slate-700 uppercase tracking-widest">Filtros</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-3">
              <label className={labelStyles}>Búsqueda</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-pink-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Ej: EXP-2026, Título..."
                  className={`${inputStyles} pl-11 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10`}
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>

            {/* Inyección Automática de la Opción de Limpieza en los Tipos */}
            <div className="md:col-span-5">
              <CustomDropdown
                color="pink"
                label="Tipo Documental"
                placeholder="Todos los tipos"
                options={[
                  { id: '', nombre: 'Todos los tipos' },
                  ...tipos
                ]}
                selectedValue={filterTipo}
                optionsIdProp="id"
                optionsNameProp="nombre"
                onSelect={(val) => { setFilterTipo(val); setCurrentPage(1); }}
              />
            </div>

            {/* Selector de Fechas Lógicas */}
            <div className="md:col-span-2">
              <label className={labelStyles}>Fecha (A partir de)</label>
              <input
                type="date"
                className={`${inputStyles} focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10`}
                value={filterFechaDesde}
                onChange={(e) => { setFilterFechaDesde(e.target.value); setCurrentPage(1); }}
              />
            </div>

            {/* Acción de Reseteo del Panel */}
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handleLimpiarFiltros}
                className="w-full h-[48px] rounded-2xl border-2 border-slate-100 text-[13px] font-bold text-slate-500 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all duration-300 shadow-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-16v1a3 3 0 003 3h10M9 3h6m2 4h-14" />
                </svg>
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* --- SECCIÓN 3: TABLA GENERAL DE EXPEDIENTES --- */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col relative z-10">

          {/* Información General */}
          <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
            <div className="flex items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50/60 border border-pink-100/80 rounded-xl text-[11px] font-bold text-pink-700 uppercase tracking-wider shadow-sm select-none">
                <span className="font-black text-pink-800 text-[11px]">{filteredExpedientes.length}</span>
                REGISTROS
              </span>
            </div>

            <button
              type="button"
              onClick={() => setScreen({ name: 'nuevo-expediente', id: null })}
              className="flex items-center justify-center gap-2 px-4 h-[38px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-[#0F4C81] text-[11px] font-black uppercase tracking-widest rounded-xl shadow-sm transition-all duration-300 w-full sm:w-auto"
            >
              <svg width="14" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
              Registrar Documento
            </button>
          </div>

          {/* Renderizado Condicional: Estado de Carga / Sin Datos / Con Datos */}
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#0F4C81] mb-4"></div>
              <p className="text-slate-400 font-bold text-[13px] uppercase tracking-widest animate-pulse">Sincronizando Archivo Central...</p>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-slate-500 text-[14px] font-bold">No se hallaron documentos</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse table-fixed min-w-[950px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest select-none bg-white">
                    <th className="py-4 px-6 w-[16%] text-center pl-8">N° Exp / Doc</th>
                    <th className="py-4 px-4 w-[30%] text-center">Título</th>
                    <th className="py-4 px-4 w-[31%] text-center hidden md:table-cell">Descripción</th>
                    <th className="py-4 px-4 w-[12%] text-center">Límite</th>
                    <th className="py-4 px-6 w-[11%] text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[13px]">
                  {currentItems.map((exp) => (
                    <tr key={exp.id} className="border-b border-slate-50 hover:bg-blue-50/40 transition-colors h-[76px] bg-white group">

                      {/* Código Identificador Único */}
                      <td className="py-4 px-6 font-black text-[#0F4C81] truncate tracking-wide text-center pl-8">
                        {exp.numero_expediente}
                      </td>

                      {/* Título, Bloque de Cálculo de Estado y Razón Social */}
                      <td className="py-4 px-4 text-left truncate">
                        <p className="font-extrabold text-slate-800 truncate leading-tight" title={exp.titulo}>
                          {exp.titulo}
                        </p>

                        <div className="flex items-center gap-2 mt-1.5">
                          {(() => {
                            // Calcula la diferencia exacta de años transcurridos desde el ingreso
                            const fBase = exp.fecha_ingreso || exp.created_at || new Date().toISOString();
                            const diffDays = Math.floor(Math.abs(new Date() - new Date(fBase)) / (1000 * 60 * 60 * 24));
                            const anosVal = diffDays / 365.25;

                            // Evalúa los límites del ciclo de vida legal del archivo
                            let lim = 5;
                            const cStr = (exp.tiempo_conservacion || '5').toLowerCase();
                            let esPermanente = cStr.includes('perma') || cStr.includes('indefi');

                            const m = cStr.match(/[\d.]+/);
                            if (m) lim = cStr.includes('mes') ? parseFloat(m[0]) / 12 : parseFloat(m[0]);

                            // Inyección lógica de los nombres de estado estandarizados
                            const estadoReal = (!esPermanente && anosVal >= lim) ? 'Para depurar' : (exp.estado === 'Activo' ? 'Conservar' : exp.estado || 'Conservar');

                            return (
                              <>
                                <div className={`w-1.5 h-1.5 rounded-full ${colorEstadoSublinea(estadoReal)}`}></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                  {estadoReal}
                                </span>
                              </>
                            );
                          })()}

                          {exp.razon_social && (
                            <>
                              <span className="text-slate-300 text-[10px] select-none">•</span>
                              <span className="text-[11px] text-slate-400 font-bold truncate max-w-[180px]" title={exp.razon_social}>
                                {exp.razon_social}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Resumen del Asunto Legal */}
                      <td className="py-4 px-4 text-left hidden md:table-cell truncate">
                        <p className="truncate text-slate-500 font-medium lowercase first-letter:uppercase" title={exp.descripcion}>
                          {exp.descripcion ? exp.descripcion.replace(/<[^>]*>/g, '') : 'Sin asunto registrado'}
                        </p>
                      </td>

                      {/* Tiempo Restante Centrado */}
                      <td className="py-4 px-4 text-center text-slate-400 font-bold italic whitespace-nowrap truncate">
                        {getConservacionLabel(exp.tiempo_conservacion)}
                      </td>

                      {/* Disparador de Pantalla de Detalles */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setScreen({ name: 'detalle', id: exp.id })}
                          className="px-3.5 py-1.5 bg-slate-100 text-[#0F4C81] hover:bg-[#0F4C81] hover:text-white rounded-xl text-[11px] font-extrabold uppercase tracking-wide transition-all shadow-sm"
                        >
                          DETALLE
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* --- SECCIÓN 4: CONTROL DE PAGINACIÓN FLOTANTE --- */}
        {totalPages > 1 && !loading && currentItems.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 p-2 px-6 flex justify-between items-center bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all z-40 w-max min-w-[320px]">
            <span className="text-[12px] text-slate-500 font-extrabold tracking-widest uppercase mr-8">
              Pág. <span className="text-[#0F4C81] text-[14px]">{currentPage}</span> / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 disabled:opacity-40 hover:bg-slate-50 hover:text-[#0F4C81] hover:border-blue-200 transition-all shadow-sm"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
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