import { useState } from 'react';
import { useExpedientes } from '../../context/useExpedientes';
import CustomDropdown from '../../components/CustomDropdown';

export default function ReportesScreen() {
  const { expedientes: dataGlobal, loading } = useExpedientes();

  const [tipoRep, setTipoRep] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [anio, setAnio] = useState(new Date().getFullYear().toString());
  const [mes, setMes] = useState('Todos');
  const [areaFiltro, setAreaFiltro] = useState('Todas');

  // 1. DECLARACIÓN DEL ARREGLO DE MESES CON EL SVG INYECTADO DIRECTAMENTE
  const meses = [
    { 
      id: 'Todos', 
      nombre: (
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <span>Todo el año</span>
        </div>
      )
    },
    { id: '01', nombre: 'Enero' }, { id: '02', nombre: 'Febrero' }, { id: '03', nombre: 'Marzo' },
    { id: '04', nombre: 'Abril' }, { id: '05', nombre: 'Mayo' }, { id: '06', nombre: 'Junio' },
    { id: '07', nombre: 'Julio' }, { id: '08', nombre: 'Agosto' }, { id: '09', nombre: 'Septiembre' },
    { id: '10', nombre: 'Octubre' }, { id: '11', nombre: 'Noviembre' }, { id: '12', nombre: 'Diciembre' }
  ];

  // ... (Toda tu lógica de filtrado se mantiene idéntica)

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
      bgGradient: 'from-blue-500/5 via-blue-500/10 to-transparent',
      cols: ['N° Expediente', 'Título', 'Área Origen', 'Folios', 'Fecha'],
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
      bgGradient: 'from-emerald-500/5 via-emerald-500/10 to-transparent',
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
      bgGradient: 'from-indigo-500/5 via-indigo-500/10 to-transparent',
      cols: ['Clase Documental', 'Total Registros', 'Digitalizados', 'Físicos'],
      stats: [
        { l: 'Tipos Distintos', v: listaTipos.length, sub: 'clasificaciones' },
        { l: 'Tipo más común', v: tipoTop, sub: 'mayor volumen' },
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

        {/* --- CABECERA PRINCIPAL REAJUSTADA (COLOR ROSE / IDENTIDAD ÚNICA DE METRICAS) --- */}
        <div className="relative overflow-hidden bg-gradient-to-r from-rose-100/80 to-indigo-50/60 p-6 sm:px-8 sm:py-6 rounded-3xl border border-rose-200/50 shadow-[0_4px_25px_rgb(0,0,0,0.02)] flex items-center gap-4 mb-8 z-40">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-50 blur-xl bg-rose-200 pointer-events-none"></div>
          <div className="w-10 h-10 rounded-xl bg-rose-600/10 border border-rose-200/40 flex items-center justify-center text-rose-600 relative z-10 shadow-sm shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2v7H3zm5-6h2v13H8zm5 9h2v4h-2zm5-12h2v16h-2z" />
            </svg>
          </div>
          <div className="flex flex-col relative z-10">
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Reporte Documental</h1>
            <span className="text-[11px] font-bold text-rose-600 mt-1 uppercase tracking-wider">Consulta de métricas</span>
          </div>
        </div>

        {/* --- SELECTORES TOP CORREGIDOS: EN ALINEACIÓN CON EL COLOR DE SUS LETRAS (SIN VERSE OPACOS) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {tiposReporte.map((t, i) => {
            const isActive = tipoRep === i;
            
            // Estilos por defecto para el estado Inactivo
            let cardBg = "bg-white border-slate-200/60 shadow-sm hover:bg-slate-50 hover:border-slate-300";
            let titleColor = "text-slate-500 group-hover:text-slate-700";
            let descColor = "text-slate-400";
            let iconBg = "bg-slate-100 text-slate-400 group-hover:bg-white transition-all";
            let svgIcon = null;

            // Al activar, cada uno toma la variante de color de sus propias letras y fondo suave
            if (i === 0) {
              if (isActive) {
                cardBg = "from-blue-500/5 via-blue-500/10 to-transparent border-blue-200/60 shadow-[0_8px_25px_rgba(15,76,129,0.04)] scale-[1.01]";
                titleColor = "text-[#0F4C81]";
                descColor = "text-blue-600/80"; // Descripción en tono azul para que no se vea gris u opaco
                iconBg = "bg-blue-50/80 text-blue-700 border border-blue-100/50 shadow-sm";
              }
              svgIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-19.5 0A2.25 2.25 0 0 0 2.25 15v4.5a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V15a2.25 2.25 0 0 0-2.25-2.25m-19.5 0h19.5" /></svg>;
            } else if (i === 1) {
              if (isActive) {
                cardBg = "from-emerald-500/5 via-emerald-500/10 to-transparent border-emerald-200/60 shadow-[0_8px_25px_rgba(5,150,105,0.04)] scale-[1.01]";
                titleColor = "text-emerald-600";
                descColor = "text-emerald-600/70"; // Descripción en tono verde esmeralda suave
                iconBg = "bg-emerald-50/80 text-emerald-700 border border-emerald-100/50 shadow-sm";
              }
              svgIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25z" /></svg>;
            } else if (i === 2) {
              if (isActive) {
                cardBg = "from-indigo-500/5 via-indigo-500/10 to-transparent border-indigo-200/60 shadow-[0_8px_25px_rgba(99,102,241,0.04)] scale-[1.01]";
                titleColor = "text-indigo-600";
                descColor = "text-indigo-600/70"; // Descripción en tono índigo suave
                iconBg = "bg-indigo-50/80 text-indigo-700 border border-indigo-100/50 shadow-sm";
              }
              svgIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>;
            }

            return (
              <button
                key={i}
                onClick={() => { setTipoRep(i); setCurrentPage(1); }}
                className={`text-left p-5 rounded-3xl transition-all duration-300 border flex items-center justify-between gap-4 group relative overflow-hidden bg-gradient-to-br ${cardBg}`}
              >
                <div className="flex flex-col min-w-0 flex-1 relative z-10">
                  <p className={`text-[14px] font-black tracking-wide truncate ${titleColor}`}>
                    {t.t}
                  </p>
                  <p className={`text-[12px] mt-1 leading-relaxed font-medium truncate ${descColor}`}>
                    {t.d}
                  </p>
                </div>

                <div className={`w-11 h-12 rounded-2xl flex items-center justify-center shrink-0 relative z-10 ${iconBg}`}>
                  {svgIcon}
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-8 w-full">
          {/* --- BLOQUE DE FILTROS REPARTIDO ESTRATÉGICAMENTE CON ANCHO EXTENDIDO PARA EL ÁREA --- */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-30">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
              </svg>
              <span className="text-[12px] font-extrabold text-slate-700 uppercase tracking-widest">Filtros de Reporte</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-end">
              <div className="sm:col-span-2">
                <CustomDropdown
                  label="Año de Consulta"
                  placeholder="Año"
                  options={optsAnios}
                  selectedValue={anio}
                  onSelect={(val) => { setAnio(val); setCurrentPage(1); }}
                />
              </div>
              <div className="sm:col-span-3">
                <CustomDropdown
                  label="Mes de Consulta"
                  placeholder="Seleccione mes"
                  options={meses}
                  selectedValue={mes}
                  onSelect={(val) => { setMes(val); setCurrentPage(1); }}
                />
              </div>
              <div className="sm:col-span-5">
                <CustomDropdown
                  label="Área de Origen"
                  placeholder="Seleccione el área de la municipalidad..."
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
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          {/* --- METRICAS INFERIORES: CON PRESERVACIÓN DE TRUNCATE COMPACTO E ICONOS ESTABLES --- */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-20">
            {sel.stats.map((s, i) => {
              let cardBg = "from-blue-500/5 via-blue-500/10 to-transparent";
              let textColor = "text-blue-900";
              let iconBg = "bg-blue-50/80 text-blue-700";
              let svgIcon = null;

              if (tipoRep === 0) {
                if (i === 0) {
                  cardBg = "from-indigo-500/5 via-indigo-500/10 to-transparent";
                  textColor = "text-indigo-900";
                  iconBg = "bg-indigo-50/80 text-indigo-700";
                  svgIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
                } else if (i === 1) {
                  cardBg = "from-amber-500/5 via-amber-500/10 to-transparent";
                  textColor = "text-amber-900";
                  iconBg = "bg-amber-50/80 text-amber-700";
                  svgIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.967 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
                } else {
                  cardBg = "from-sky-500/5 via-sky-500/10 to-transparent";
                  textColor = "text-sky-900";
                  iconBg = "bg-sky-50/80 text-sky-700";
                  svgIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>;
                }
              } else if (tipoRep === 1) {
                if (i === 0) {
                  cardBg = "from-emerald-500/5 via-emerald-500/10 to-transparent";
                  textColor = "text-emerald-900";
                  iconBg = "bg-emerald-50/80 text-emerald-700";
                  svgIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
                } else if (i === 1) {
                  cardBg = "from-rose-500/5 via-rose-500/10 to-transparent";
                  textColor = "text-rose-900";
                  iconBg = "bg-rose-50/80 text-rose-700";
                  svgIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
                } else {
                  cardBg = "from-teal-500/5 via-teal-500/10 to-transparent";
                  textColor = "text-teal-900";
                  iconBg = "bg-teal-50/80 text-teal-700";
                  svgIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
                }
              } else if (tipoRep === 2) {
                if (i === 0) {
                  cardBg = "from-violet-500/5 via-violet-500/10 to-transparent";
                  textColor = "text-violet-900";
                  iconBg = "bg-violet-50/80 text-violet-700";
                  svgIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>;
                } else if (i === 1) {
                  cardBg = "from-fuchsia-500/5 via-fuchsia-500/10 to-transparent";
                  textColor = "text-fuchsia-900";
                  iconBg = "bg-fuchsia-50/80 text-fuchsia-700";
                  svgIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 1 3 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18z" /></svg>;
                } else {
                  cardBg = "from-blue-500/5 via-blue-500/10 to-transparent";
                  textColor = "text-blue-900";
                  iconBg = "bg-blue-50/80 text-blue-700";
                  // 📂 ICONO DE CARPETA REEMPLAZADO: Limpio, oficial y sin bugs
                  svgIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-19.5 0A2.25 2.25 0 0 0 2.25 15v4.5a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V15a2.25 2.25 0 0 0-2.25-2.25m-19.5 0h19.5" /></svg>;
                }
              }

              return (
                <div
                  key={i}
                  className={`p-6 rounded-3xl bg-gradient-to-br ${cardBg} border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex items-center justify-between transition-all duration-300 hover:shadow-md`}
                >
                  <div className="flex flex-col text-left min-w-0 flex-1 pr-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.l}</span>
                    <p className={`text-4xl font-black tracking-tight truncate ${textColor}`} title={s.v}>{s.v}</p>
                    <span className="text-[11px] font-bold text-slate-400 mt-1">{s.sub}</span>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl ${iconBg} border border-white/60 shadow-sm flex items-center justify-center shrink-0`}>
                    {svgIcon}
                  </div>
                </div>
              );
            })}
          </div>

          {/* --- LISTADOS DOCUMENTALES: ALINEACIONES INTEGRADAS --- */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col relative z-10">
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-[14px] font-black text-slate-800 tracking-tight uppercase">{sel.t}</p>
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">{sel.tabla.length} registros</span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse table-fixed min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest select-none bg-white">
                    {tipoRep === 2 ? (
                      <>
                        <th className="py-4 px-6 w-[35%] text-left">{sel.cols[0]}</th>
                        <th className="py-4 px-4 w-[20%] text-center">{sel.cols[1]}</th>
                        <th className="py-4 px-4 w-[20%] text-center">{sel.cols[2]}</th>
                        <th className="py-4 px-6 w-[25%] text-center">{sel.cols[3]}</th>
                      </>
                    ) : (
                      <>
                        <th className="py-4 px-6 w-[18%] text-center">{sel.cols[0]}</th>
                        <th className="py-4 px-4 w-[32%] text-left">{sel.cols[1]}</th>
                        <th className="py-4 px-4 w-[20%] text-left">{sel.cols[2]}</th>
                        <th className="py-4 px-4 w-[15%] text-center">{sel.cols[3]}</th>
                        <th className="py-4 px-6 w-[15%] text-center">{sel.cols[4] || ''}</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[13px]">
                  {currentData.length > 0 ? (
                    currentData.map((r, index) => (
                      <tr key={index} className="hover:bg-blue-50/40 transition-colors h-[64px] bg-white group">
                        {tipoRep === 2 ? (
                          <>
                            <td className="p-5 px-6 font-black text-[#0F4C81] truncate tracking-wide text-left">{r.c1}</td>
                            <td className="p-5 px-4 font-extrabold text-slate-700 truncate text-center">{r.c2}</td>
                            <td className="p-5 px-4 font-bold text-emerald-600 truncate text-center">{r.c3}</td>
                            <td className="p-5 px-6 font-bold text-amber-600 truncate text-center">{r.c4}</td>
                          </>
                        ) : (
                          <>
                            <td className="p-5 px-6 font-black text-[#0F4C81] truncate tracking-wide text-center">{r.c1}</td>
                            <td className="p-5 px-4 font-extrabold text-slate-800 truncate text-left" title={r.c2}>{r.c2}</td>
                            <td className="p-5 px-4 text-xs font-bold text-slate-500 truncate text-left">{r.c3}</td>
                            <td className="p-5 px-4 whitespace-nowrap text-center">
                              {tipoRep === 0 ? (
                                <span className="font-black text-slate-700 block">{r.c4}</span>
                              ) : (
                                <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider inline-block ${badgeColor(r.c4)}`}>
                                  {r.c4}
                                </span>
                              )}
                            </td>
                            <td className="p-5 px-6 text-[12px] font-bold text-slate-400 whitespace-nowrap truncate text-center">{r.c5}</td>
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

        {totalPages > 1 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 p-2 px-6 flex justify-between items-center bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all z-40 w-max min-w-[320px]">
            <span className="text-[12px] text-slate-500 font-extrabold tracking-widest uppercase mr-8">
              Pág. <span className="text-[#0F4C81] text-[14px]">{currentPage}</span> / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 disabled:opacity-40 hover:bg-slate-50 hover:text-[#0F4C81] transition-all shadow-sm"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
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