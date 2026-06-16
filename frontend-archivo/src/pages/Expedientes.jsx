import { useState } from 'react';
import { useExpedientes } from '../context/useExpedientes';
import CustomDropdown from '../components/CustomDropdown';

export default function Expedientes({
  setScreen,
  searchTerm = '',
  setSearchTerm,
  filterTipo = '',
  setFilterTipo,
  filterFechaDesde = '',
  setFilterFechaDesde
}) {
  const { expedientes, tipos, loading } = useExpedientes();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getConservacionLabel = (val) => {
    if (!val) return 'N/A';
    if (typeof val === 'string' && (val.toLowerCase().includes('año') || val.toLowerCase().includes('mes') || val.toLowerCase().includes('perma'))) {
      return val;
    }
    if (val === '0.5') return '6 meses';
    return `${val} año${parseInt(val) > 1 ? 's' : ''}`;
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleLimpiarFiltros = () => {
    setSearchTerm('');
    setFilterTipo('');
    setFilterFechaDesde('');
    setCurrentPage(1);
  };

  const filteredExpedientes = expedientes.filter(exp => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch = query === '' ||
      (exp.numero_expediente && exp.numero_expediente.toLowerCase().includes(query)) ||
      (exp.titulo && exp.titulo.toLowerCase().includes(query)) ||
      (exp.razon_social && exp.razon_social.toLowerCase().includes(query));

    const matchesTipo = filterTipo === '' ||
      (exp.tipo_documento_id && exp.tipo_documento_id.toString() === filterTipo.toString());

    let matchesFecha = true;
    if (filterFechaDesde !== '') {
      const fechaDocStr = exp.fecha_ingreso || exp.fecha_income;
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredExpedientes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredExpedientes.length / itemsPerPage);

  const estadoBadge = (estado) => {
    const st = (estado || 'Activo').toLowerCase();
    if (st.includes('revisión') || st.includes('revision')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (st.includes('depurar') || st.includes('vencido')) return 'bg-rose-100 text-rose-700 border-rose-200';
    if (st.includes('digitalizado')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (st.includes('archivado')) return 'bg-slate-100 text-slate-700 border-slate-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200'; // Activo
  };

  // 🚀 Estilos base unificados para alineación perfecta a 48px
  const inputStyles = "w-full h-[48px] px-4 border border-slate-200 bg-slate-50 rounded-2xl text-[13px] focus:bg-white focus:border-[#0F4C81] focus:ring-4 focus:ring-[#0F4C81]/10 outline-none transition-all duration-300 font-semibold text-slate-700 placeholder-slate-400";
  const labelStyles = "block text-[11px] font-extrabold text-slate-500 mb-2 tracking-widest uppercase";

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8 relative selection:bg-blue-200 selection:text-blue-900 pb-24">
      <div className="max-w-screen-xl mx-auto animate-fade-in">

        {/* ENCABEZADO PREMIUM */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-[#FFC107] rounded-full shadow-sm"></div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Búsqueda Documental</h2>
              <p className="text-[13px] font-medium text-slate-400 mt-0.5">Localice expedientes y aplique filtros en tiempo real</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setScreen({ name: 'nuevo-expediente', id: null })}
            className="flex items-center gap-2 px-6 h-[48px] bg-gradient-to-r from-[#0F4C81] to-blue-700 text-white text-[13px] font-bold uppercase tracking-widest rounded-2xl shadow-[0_8px_20px_-6px_rgba(15,76,129,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(15,76,129,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
            Nuevo Expediente
          </button>
        </div>

        {/* 🚀 CAJA DE FILTROS ALINEADA (Glassmorphism sutil) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-8">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            <span className="text-[12px] font-extrabold text-slate-700 uppercase tracking-widest">Criterios de Búsqueda</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
              <label className={labelStyles}>Búsqueda Libre</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm transition-colors group-focus-within:text-[#0F4C81]">🔍</span>
                <input
                  type="text"
                  placeholder="Ej: EXP-2026, 001901..."
                  className={`${inputStyles} pl-11`}
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>

            <div className="md:mt-0 mt-2">
              <CustomDropdown
                label="Tipo Documental"
                placeholder="Todos los tipos"
                options={tipos}
                selectedValue={filterTipo}
                onSelect={(val) => { setFilterTipo(val); setCurrentPage(1) }}
              />
            </div>

            <div>
              <label className={labelStyles}>Fecha (A partir de)</label>
              <input
                type="date"
                className={inputStyles}
                value={filterFechaDesde}
                onChange={(e) => { setFilterFechaDesde(e.target.value); setCurrentPage(1) }}
              />
            </div>

            <button
              type="button"
              onClick={handleLimpiarFiltros}
              className="w-full h-[48px] rounded-2xl border-2 border-slate-100 text-[13px] font-bold text-slate-500 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all duration-300 shadow-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-16v1a3 3 0 003 3h10M9 3h6m2 4h-14" /></svg>
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* 🚀 TABLA MINIMALISTA PREMIUM */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col">
          <div className="px-8 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">{filteredExpedientes.length} Registros encontrados</p>
          </div>

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
              <p className="text-slate-400 text-[12px] font-medium mt-1">Intente ajustando los filtros de búsqueda superior.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest select-none bg-white">
                    <th className="p-5 px-6 w-[16%]">Expediente</th>
                    <th className="p-5 px-4 w-[22%]">Título del Documento</th>
                    <th className="p-5 px-4 w-[34%] hidden md:table-cell">Descripción</th>
                    <th className="p-5 px-4 w-[8%]">Plazo</th>
                    <th className="p-5 px-4 w-[9%]">Estado</th>
                    <th className="p-5 px-6 text-right w-[11%]">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[13px]">
                  {currentItems.map((exp) => (
                    <tr key={exp.id} className="hover:bg-blue-50/40 transition-colors group h-[72px]">
                      <td className="p-5 px-6 truncate">
                        <span className="font-black text-[#0F4C81] tracking-wide block truncate">{exp.numero_expediente}</span>
                      </td>
                      <td className="p-5 px-4 truncate">
                        <p className="font-extrabold text-slate-800 truncate leading-tight" title={exp.titulo}>{exp.titulo}</p>
                        {exp.razon_social && <p className="text-[11px] text-slate-400 font-bold truncate mt-0.5" title={exp.razon_social}>{exp.razon_social}</p>}
                      </td>
                      <td className="p-5 px-4 hidden md:table-cell truncate">
                        <p className="truncate text-slate-500 font-medium lowercase first-letter:uppercase" title={exp.descripcion}>
                          {exp.descripcion ? exp.descripcion.replace(/<[^>]*>/g, '') : 'Sin asunto registrado'}
                        </p>
                      </td>
                      <td className="p-5 px-4 text-slate-500 font-bold whitespace-nowrap truncate">
                        {getConservacionLabel(exp.tiempo_conservacion)}
                      </td>
                      <td className="p-5 px-4 whitespace-nowrap">
                        {(() => {
                          const fBase = exp.fecha_ingreso || exp.created_at || new Date().toISOString();
                          const diffDays = Math.floor(Math.abs(new Date() - new Date(fBase)) / (1000 * 60 * 60 * 24));
                          const anosVal = diffDays / 365.25;

                          let lim = 5;
                          const cStr = (exp.tiempo_conservacion || '5').toLowerCase();
                          let esPermanente = cStr.includes('perma') || cStr.includes('indefi');

                          const m = cStr.match(/[\d.]+/);
                          if (m) lim = cStr.includes('mes') ? parseFloat(m[0]) / 12 : parseFloat(m[0]);

                          const estadoReal = (!esPermanente && anosVal >= lim) ? 'Para Depurar' : (exp.estado || 'Activo');

                          return (
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border inline-block ${estadoBadge(estadoReal)}`}>
                              {estadoReal}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="p-5 px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setScreen({ name: 'detalle', id: exp.id })}
                          className="px-4 py-2 bg-slate-50 text-slate-600 hover:bg-[#0F4C81] hover:text-white border border-slate-200 hover:border-[#0F4C81] text-[12px] font-extrabold rounded-xl shadow-sm transition-all duration-300"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 🚀 PAGINACIÓN FLOTANTE PREMIUM */}
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