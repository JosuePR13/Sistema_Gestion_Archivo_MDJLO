import { useState } from 'react';
import { useExpedientes } from '../context/useExpedientes';
import CustomDropdown from '../components/CustomDropdown';

export default function ReportesScreen() {
  const { expedientes: dataGlobal, loading } = useExpedientes();

  const [tipoRep, setTipoRep] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [anio, setAnio] = useState(new Date().getFullYear().toString());
  const [mes, setMes] = useState('Todos');
  const [areaFiltro, setAreaFiltro] = useState('Todas');

  const meses = [
    { id: 'Todos', nombre: '📅 Todo el año' },
    { id: '01', nombre: 'Enero' }, { id: '02', nombre: 'Febrero' }, { id: '03', nombre: 'Marzo' },
    { id: '04', nombre: 'Abril' }, { id: '05', nombre: 'Mayo' }, { id: '06', nombre: 'Junio' },
    { id: '07', nombre: 'Julio' }, { id: '08', nombre: 'Agosto' }, { id: '09', nombre: 'Septiembre' },
    { id: '10', nombre: 'Octubre' }, { id: '11', nombre: 'Noviembre' }, { id: '12', nombre: 'Diciembre' }
  ];

  const safeText = (val, fallback = 'S/N') => {
    if (!val) return fallback;
    if (typeof val === 'object') return val.nombre || fallback;
    return String(val);
  };

  const aniosDisponibles = Array.from(
    new Set(
      dataGlobal
        .map(exp => exp.fecha_ingreso || exp.created_at)
        .filter(Boolean)
        .map(fecha => fecha.substring(0, 4))
    )
  ).sort((a, b) => b - a);

  const areasDisponibles = Array.from(
    new Set(
      dataGlobal
        .map(exp =>
          safeText(
            exp.area_origen || exp.area_origen_id,
            'Desconocida'
          )
        )
        .filter(area => area !== 'Desconocida')
    )
  ).sort();

  const expedientesFiltrados = dataGlobal.filter(exp => {
    const fecha = exp.fecha_ingreso || exp.created_at;
    if (!fecha) return false;

    const expAnio = fecha.substring(0, 4);
    const expMes = fecha.substring(5, 7);
    const expAreaOrig = safeText(exp.area_origen || exp.area_origen_id, 'Desconocida');

    const matchAnio = expAnio === anio;
    const matchMes = mes === 'Todos' ? true : (expMes === mes);
    const matchArea = areaFiltro === 'Todas' ? true : (expAreaOrig === areaFiltro);

    return matchAnio && matchMes && matchArea;
  });

  const totalFolios = expedientesFiltrados.reduce((acc, exp) => acc + (parseInt(exp.numero_folios) || 0), 0);
  const promedioFolios = expedientesFiltrados.length > 0 ? Math.round(totalFolios / expedientesFiltrados.length) : 0;

  const digitalizados = expedientesFiltrados.filter(e => e.digitalizado === 1 || e.digitalizado === true).length;
  const pendientes = expedientesFiltrados.length - digitalizados;
  const porcentaje = expedientesFiltrados.length > 0 ? Math.round((digitalizados / expedientesFiltrados.length) * 100) : 0;

  const tiposMap = {};
  expedientesFiltrados.forEach(e => {
    const tipoDoc = safeText(e.tipo_documento || e.tipo_documento_id, 'General');
    if (!tiposMap[tipoDoc]) tiposMap[tipoDoc] = { total: 0, digi: 0 };
    tiposMap[tipoDoc].total += 1;
    if (e.digitalizado === 1 || e.digitalizado === true) tiposMap[tipoDoc].digi += 1;
  });
  const listaTipos = Object.keys(tiposMap).map(k => ({ tipo: k, ...tiposMap[k] })).sort((a, b) => b.total - a.total);
  const tipoTop = listaTipos.length > 0 ? listaTipos[0].tipo : 'N/A';

  const tiposReporte = [
    {
      t: 'Expedientes Registrados',
      d: 'Ingresos al sistema en el período',
      c: '#0F4C81',
      cols: ['N° Expediente', 'Título', 'Área Origen', 'Folios', 'Fecha Registro'],
      stats: [
        { l: 'Total registrados', v: expedientesFiltrados.length, sub: 'documentos' },
        { l: 'Volumen Físico', v: totalFolios, sub: 'folios totales' },
        { l: 'Promedio Tamaño', v: promedioFolios, sub: 'folios / exp.' },
      ],
      tabla: expedientesFiltrados.map(e => ({
        c1: safeText(e.numero_expediente), c2: safeText(e.titulo), c3: safeText(e.area_origen || e.area_origen_id),
        c4: safeText(e.numero_folios, '0'), c5: safeText(e.fecha_ingreso).split('T')[0]
      }))
    },
    {
      t: 'Avance de Digitalización',
      d: 'Progreso de conversión a digital',
      c: '#059669',
      cols: ['N° Expediente', 'Título', 'Área Origen', 'Estado Digital', 'Fecha'],
      stats: [
        { l: 'Digitalizados', v: digitalizados, sub: 'con archivo PDF' },
        { l: 'Pendientes', v: pendientes, sub: 'solo físicos' },
        { l: 'Avance Total', v: `${porcentaje}%`, sub: 'de cobertura' },
      ],
      tabla: expedientesFiltrados.map(e => ({
        c1: safeText(e.numero_expediente), c2: safeText(e.titulo), c3: safeText(e.area_origen || e.area_origen_id),
        c4: (e.digitalizado === 1 || e.digitalizado === true) ? 'Digitalizado' : 'Pendiente', c5: safeText(e.fecha_ingreso).split('T')[0]
      }))
    },
    {
      t: 'Tipología Documental',
      d: 'Clasificación de documentos recibidos',
      c: '#6366F1',
      cols: ['Clase Documental', 'Total Registros', 'Digitalizados', 'Físicos'],
      stats: [
        { l: 'Tipos Distintos', v: listaTipos.length, sub: 'clasificaciones' },
        { l: 'Tipo más común', v: tipoTop.length > 15 ? tipoTop.substring(0, 15) + '...' : tipoTop, sub: 'mayor volumen' },
        { l: 'Total Docs', v: expedientesFiltrados.length, sub: 'registros' },
      ],
      tabla: listaTipos.map(t => ({
        c1: t.tipo, c2: t.total, c3: t.digi, c4: t.total - t.digi
      }))
    },
  ];

  const sel = tiposReporte[tipoRep];

  const totalPages = Math.ceil(sel.tabla.length / ITEMS_PER_PAGE);
  const currentData = sel.tabla.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const optsAnios = aniosDisponibles.map(a => ({ id: a, nombre: a }));
  const optsAreas = [{ id: 'Todas', nombre: 'Todas las áreas' }, ...areasDisponibles.map(a => ({ id: a, nombre: a }))];

  // 🚀 Lógica premium de Pastillas (Badges) para la tabla
  const badgeColor = (estado) => {
    if (!estado) return '';
    const e = estado.toLowerCase();
    if (e === 'activo' || e === 'digitalizado') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (e === 'archivado' || e === 'pendiente') return 'bg-rose-50 text-rose-600 border-rose-100';
    return 'bg-blue-50 text-[#0F4C81] border-blue-100';
  }

  const handleLimpiarFiltros = () => {
    setAnio(new Date().getFullYear().toString());
    setMes('Todos');
    setAreaFiltro('Todas');
    setCurrentPage(1);
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#0F4C81] mb-4"></div>
        <p className="text-slate-400 font-bold text-[13px] uppercase tracking-widest animate-pulse">Compilando reportes y métricas...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8 relative selection:bg-blue-200 selection:text-blue-900 pb-24">
      <div className="max-w-screen-xl mx-auto animate-fade-in text-left">

        {/* ENCABEZADO PREMIUM */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-8 bg-[#FFC107] rounded-full shadow-sm"></div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Panel de Reportes</h2>
            <p className="text-[13px] font-medium text-slate-400 mt-0.5">Consulta de métricas documentales y estadísticas en tiempo real</p>
          </div>
        </div>

        {/* SELECCIÓN DE REPORTE (Tarjetas Horizontales Premium) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {tiposReporte.map((t, i) => (
            <button
              key={i}
              onClick={() => { setTipoRep(i); setCurrentPage(1); }}
              className={`text-left p-6 rounded-3xl transition-all duration-300 relative overflow-hidden group border ${tipoRep === i
                ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-transparent scale-[1.02]'
                : 'bg-white/60 shadow-sm border-slate-200/60 hover:bg-white hover:border-slate-300'
                }`}
            >
              <div className="absolute left-0 top-0 h-full w-1.5 transition-all duration-300" style={{ background: tipoRep === i ? t.c : 'transparent' }}></div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-transform duration-300 ${tipoRep === i ? 'scale-110 shadow-sm' : 'opacity-40 group-hover:scale-110 group-hover:opacity-100'}`} style={{ background: t.c }}></div>
                <p className={`text-[14px] font-extrabold tracking-wide transition-colors ${tipoRep === i ? 'text-slate-800' : 'text-slate-500 group-hover:text-slate-700'}`}>{t.t}</p>
              </div>
              <p className="text-[12px] text-slate-400 mt-2 ml-6 leading-relaxed font-medium">{t.d}</p>
            </button>
          ))}
        </div>

        <div className="space-y-8 w-full">

          {/* ====== CAJA DE FILTROS ALINEADA ====== */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-30">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              <span className="text-[12px] font-extrabold text-slate-700 uppercase tracking-widest">Filtros de Reporte</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-end">
              <div className="sm:col-span-3">
                <CustomDropdown
                  label="Año de Consulta"
                  placeholder="Seleccione"
                  options={optsAnios}
                  selectedValue={anio}
                  onSelect={(val) => { setAnio(val); setCurrentPage(1); }}
                />
              </div>
              <div className="sm:col-span-3">
                <CustomDropdown
                  label="Mes de Consulta"
                  placeholder="Seleccione"
                  options={meses}
                  selectedValue={mes}
                  onSelect={(val) => { setMes(val); setCurrentPage(1); }}
                />
              </div>
              <div className="sm:col-span-4">
                <CustomDropdown
                  label="Área de Origen"
                  placeholder="Filtrar por área"
                  options={optsAreas}
                  selectedValue={areaFiltro}
                  onSelect={(val) => { setAreaFiltro(val); setCurrentPage(1); }}
                />
              </div>
              <div className="sm:col-span-2">
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
          </div>

          {/* ====== TARJETAS KPI (Dashboard Style) ====== */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-20">
            {sel.stats.map((s, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50 to-transparent rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
                <div className="absolute top-0 left-0 w-1.5 h-full transition-all duration-300" style={{ background: sel.c }}></div>
                <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest relative z-10 mb-2">{s.l}</p>
                <p className="text-4xl font-black tracking-tighter relative z-10" style={{ color: sel.c }}>{s.v}</p>
                <p className="text-[12px] font-bold text-slate-400 mt-2 relative z-10">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* ====== TABLA DE DETALLES PREMIUM ====== */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col relative z-10">
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-[14px] font-black text-slate-800 tracking-tight">{sel.t}</p>
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">{sel.tabla.length} registros</span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse table-fixed min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest select-none bg-white">
                    <th className="p-5 px-8 w-[20%]">{sel.cols[0]}</th>
                    <th className="p-5 px-4 w-[35%]">{sel.cols[1]}</th>
                    <th className="p-5 px-4 w-[20%]">{sel.cols[2]}</th>
                    <th className="p-5 px-4 w-[12%]">{sel.cols[3]}</th>
                    <th className="p-5 px-8 w-[13%]">{sel.cols[4] || ''}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[13px]">
                  {currentData.length > 0 ? (
                    currentData.map((r, index) => (
                      <tr key={index} className="hover:bg-blue-50/40 transition-colors h-[64px] bg-white group">
                        <td className="p-5 px-8 font-black text-[#0F4C81] truncate tracking-wide">{r.c1}</td>

                        {tipoRep === 2 ? (
                          <>
                            <td className="p-5 px-4 font-extrabold text-slate-700 truncate">{r.c2}</td>
                            <td className="p-5 px-4 font-bold text-emerald-600 truncate">{r.c3}</td>
                            <td className="p-5 px-4 font-bold text-amber-600 truncate">{r.c4}</td>
                            <td className="p-5 px-8"></td>
                          </>
                        ) : (
                          <>
                            <td className="p-5 px-4 font-extrabold text-slate-800 truncate" title={r.c2}>{r.c2}</td>
                            <td className="p-5 px-4 text-xs font-bold text-slate-500 truncate">{r.c3}</td>
                            <td className="p-5 px-4 whitespace-nowrap">
                              {tipoRep === 0 ? (
                                <span className="font-black text-slate-700 block text-left pl-2">{r.c4}</span>
                              ) : (
                                <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider inline-block ${badgeColor(r.c4)}`}>
                                  {r.c4}
                                </span>
                              )}
                            </td>
                            <td className="p-5 px-8 text-[12px] font-bold text-slate-400 whitespace-nowrap truncate">{r.c5}</td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={sel.cols.length} className="p-12 text-center text-slate-400 font-medium italic h-[200px]">
                        Sin registros en este periodo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ====== ISLA FLOTANTE DE PAGINACIÓN ====== */}
        {totalPages > 1 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 p-2 px-6 flex justify-between items-center bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all z-40 w-max min-w-[320px]">
            <span className="text-[12px] text-slate-500 font-extrabold tracking-widest uppercase mr-8">
              Pág. <span className="text-[#0F4C81] text-[14px]">{currentPage}</span> / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 disabled:opacity-40 hover:bg-slate-50 hover:text-[#0F4C81] transition-all shadow-sm"
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