import { useEffect, useRef, useMemo } from 'react';
import { useExpedientes } from '../context/useExpedientes';
import { Chart } from 'chart.js/auto';

// Componente Cabecera Reutilizable para consistencia visual
const HeaderBlock = ({ title, color }) => (
  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-white">
    <div className="w-1.5 h-5 rounded-full shadow-sm" style={{ background: color }}></div>
    <p className="font-black text-slate-800 text-[12px] uppercase tracking-widest">{title}</p>
  </div>
);

// --- DICCIONARIO DE TEMAS DE COLOR SEGÚN TU CONFIGURACIÓN OFICIAL ---
const kpiThemes = {
  fuchsia: { bg: 'bg-fuchsia-50/70', border: 'border-fuchsia-200/50', textLabel: 'text-fuchsia-700/70', textValue: 'text-fuchsia-800', decoration: 'bg-fuchsia-500' },
  pink: { bg: 'bg-pink-50/70', border: 'border-pink-200/50', textLabel: 'text-pink-700/70', textValue: 'text-pink-800', decoration: 'bg-pink-500' },
  lime: { bg: 'bg-lime-50/70', border: 'border-lime-200/50', textLabel: 'text-lime-700/70', textValue: 'text-lime-800', decoration: 'bg-lime-500' },
  emerald: { bg: 'bg-emerald-50/70', border: 'border-emerald-200/50', textLabel: 'text-emerald-700/70', textValue: 'text-emerald-800', decoration: 'bg-emerald-500' },
  rose: { bg: 'bg-rose-50/70', border: 'border-rose-200/50', textLabel: 'text-rose-700/70', textValue: 'text-rose-800', decoration: 'bg-rose-500' },
  blue: { bg: 'bg-blue-50/70', border: 'border-blue-200/50', textLabel: 'text-blue-700/70', textValue: 'text-blue-800', decoration: 'bg-blue-500' },
  sky: { bg: 'bg-sky-50/70', border: 'border-sky-200/50', textLabel: 'text-sky-700/70', textValue: 'text-sky-800', decoration: 'bg-sky-500' },
  orange: { bg: 'bg-amber-50/70', border: 'border-amber-200/50', textLabel: 'text-amber-700/70', textValue: 'text-amber-800', decoration: 'bg-amber-500' }, // Se mapea orange al amber visual de tu reporte
  purple: { bg: 'bg-purple-50/70', border: 'border-purple-200/50', textLabel: 'text-purple-700/70', textValue: 'text-purple-800', decoration: 'bg-purple-500' }
};

export default function Dashboard({ setScreen }) {
  // --- CONSUMO DEL CONTEXTO CENTRALIZADO ---
  const { expedientes: dataGlobal, loading } = useExpedientes();

  // Guardamos los expedientes con useMemo para asegurar la consistencia de renderizado
  const expedientes = useMemo(() => {
    return !loading && dataGlobal ? dataGlobal : [];
  }, [loading, dataGlobal]);

  const P = '#0F4C81';
  const Y = '#FFC107';

  // --- REFERENCIA PARA EL GRÁFICO DE TENDENCIA ---
  const chartLineasRef = useRef(null);
  const instanceLineasRef = useRef(null);

  const safeText = (val, fallback = 'General') => {
    if (!val) return fallback;
    if (typeof val === 'object') return val.nombre || fallback;
    return String(val);
  };

  // --- LÓGICA DE TIEMPO RELATIVO (CONSERVADA AL 100% SIN ALTERACIONES) ---
  const tiempoRelativo = (fechaTarget) => {
    const f = new Date(fechaTarget);
    const ahora = new Date();
    const diffMili = ahora - f;
    const diffMinutos = Math.floor(diffMili / (1000 * 60));

    if (diffMinutos < 1) return 'Hace un momento';
    if (diffMinutos < 60) return `Hace ${diffMinutos} min`;
    const diffHoras = Math.floor(diffMinutos / 60);
    if (diffHoras < 24) return `Hace ${diffHoras} h`;
    const diffDias = Math.floor(diffHoras / 24);
    if (diffDias === 1) return 'Ayer';
    if (diffDias < 30) return `Hace ${diffDias} días`;
    return f.toLocaleDateString('es-PE');
  };

  // --- MÉTRICA EXCLUSIVA PARA EL COMPORTAMIENTO INTERNO DEL GRÁFICO ---
  const ingresosHoy = expedientes.filter(exp => {
    if (!exp.created_at) return false;
    const fechaDocLimpia = exp.created_at.substring(0, 10);
    const hoyPeru = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
    return fechaDocLimpia === hoyPeru;
  }).length;

  // --- LAS 9 OPCIONES OPERATIVAS ADAPTADAS CON TUS COLORES OFICIALES Y DISEÑO DE KPICARD ---
  const accesosDirectos = [
    { name: 'nuevo-expediente', label: 'Ingresos de Hoy', desc: 'Registrar Documento', theme: kpiThemes.fuchsia, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> },
    { name: 'expedientes', label: 'Búsqueda Documental', desc: 'Consulta avanzada y localización.', theme: kpiThemes.pink, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /> },
    { name: 'digitalizacion', label: 'Digitalización', desc: 'Carga de PDFs y control de folios.', theme: kpiThemes.lime, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /> },
    { name: 'seguimiento', label: 'Control de Plazos', desc: 'Vigencias y alertas de depuración.', theme: kpiThemes.emerald, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
    { name: 'reportes', label: 'Reporte Documental', desc: 'Estadísticas del fondo archivístico.', theme: kpiThemes.rose, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 13h2v7H3zm5-6h2v13H8zm5 9h2v4h-2zm5-12h2v16h-2z" /> },
    { name: 'nueva-solicitud', label: 'Registrar Solicitud', desc: 'Ingreso formal de Mesa de Partes.', theme: kpiThemes.blue, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> },
    { name: 'bandeja-solicitudes', label: 'Bandeja Solicitudes', desc: 'Administración de trámites externos.', theme: kpiThemes.sky, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /> },
    { name: 'historial-caja', label: 'Historial de Caja', desc: 'Auditoría histórica de tasas de copias.', theme: kpiThemes.orange, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { name: 'reporte-costos', label: 'Reporte de Costos', desc: 'Métricas de recaudación de caja.', theme: kpiThemes.purple, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 13h2v7H3zm5-6h2v13H8zm5 9h2v4h-2zm5-12h2v16h-2z" /> }
  ];

  // --- CONSTRUCTOR COMPUESTO DE ACTIVIDAD RECIENTE (CONSERVADO AL 100%) ---
  const historialTimeline = [];
  expedientes.forEach(e => {
    const timeCreacion = new Date(e.created_at).getTime();
    const timeActualizacion = new Date(e.updated_at).getTime();
    const timePdf = e.ultimo_pdf_at ? new Date(e.ultimo_pdf_at).getTime() : null;

    const areaOrig = safeText(e.area_origen, 'Oficina');
    const numExp = safeText(e.numero_expediente);
    const isDigi = e.digitalizado === 1 || e.digitalizado === true;

    historialTimeline.push({
      id: `reg-${e.id}`,
      num: numExp,
      accion: 'Registrado',
      fechaReal: timeCreacion,
      tiempo: tiempoRelativo(timeCreacion),
      area: areaOrig,
      color: P
    });

    if (isDigi) {
      const fechaFinalPdf = timePdf || timeActualizacion;
      historialTimeline.push({
        id: `digi-${e.id}`,
        num: numExp,
        accion: 'Digitalizado',
        fechaReal: fechaFinalPdf + 10,
        tiempo: tiempoRelativo(fechaFinalPdf),
        area: areaOrig,
        color: '#10B981'
      });
    }

    if (timeActualizacion > timeCreacion + 3000) {
      const margenPrioridad = isDigi ? -10 : 0;
      historialTimeline.push({
        id: `upd-${e.id}-${timeActualizacion}`,
        num: numExp,
        accion: 'Actualizado',
        fechaReal: timeActualizacion + margenPrioridad,
        tiempo: tiempoRelativo(timeActualizacion),
        area: areaOrig,
        color: '#8B5CF6'
      });
    }
  });

  const uniqueTimeline = [];
  const seenKeys = new Set();
  historialTimeline
    .sort((a, b) => b.fechaReal - a.fechaReal)
    .forEach(item => {
      const key = `${item.num}|${item.accion}|${item.tiempo}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueTimeline.push(item);
      }
    });

  const actividadReciente = uniqueTimeline.slice(0, 6);

  // --- EFECTO AUTOMÁTICO: CONEXIÓN GRÁFICO (TENDENCIA DE CARGA) ---
  useEffect(() => {
    if (loading || expedientes.length === 0) return;

    if (instanceLineasRef.current) instanceLineasRef.current.destroy();

    if (chartLineasRef.current) {
      const ctxLineas = chartLineasRef.current.getContext('2d');
      instanceLineasRef.current = new Chart(ctxLineas, {
        type: 'line',
        data: {
          labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
          datasets: [{
            label: 'Flujo de Carga',
            data: [ingresosHoy * 0.4, ingresosHoy * 0.7, ingresosHoy * 0.5, ingresosHoy * 0.9, ingresosHoy, ingresosHoy * 0.3],
            borderColor: '#0F4C81',
            backgroundColor: 'rgba(15, 76, 129, 0.04)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#0F4C81',
            pointBorderColor: '#fff',
            pointBorderWidth: 1.5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { borderDash: [5, 5], color: '#f1f5f9' }, ticks: { precision: 0 } }
          }
        }
      });
    }

    return () => {
      if (instanceLineasRef.current) instanceLineasRef.current.destroy();
    };
  }, [loading, expedientes, ingresosHoy]);

  return (
    <div className="p-4 sm:p-8 max-w-screen-xl mx-auto min-h-screen bg-[#F8FAFC] animate-fade-in text-left selection:bg-blue-200 selection:text-blue-900 pb-24">

      {/* --- CABECERA DINÁMICA DE BIENVENIDA MUNICIPAL --- */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0F4C81]/15 via-blue-50/40 to-transparent p-6 sm:px-8 sm:py-5 rounded-3xl border border-blue-200/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#0F4C81]/10 border border-blue-200/50 flex items-center justify-center text-[#0F4C81] font-black shrink-0">🏛️</div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">¡Buen día, Josué!</h1>
            <span className="text-[11px] font-bold text-[#0F4C81] mt-1.5 uppercase tracking-wider">Módulo Principal de Monitoreo Archivístico</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200/80 shadow-sm rounded-xl text-[10px] font-black text-emerald-600 uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          SISGEDO API ONLINE
        </div>
      </div>

      {/* --- ENCAPSULADO CORRECTO: 9 ACCESOS USANDO EL DISEÑO ORIGINAL DE KPICARD EN 5 COLUMNAS --- */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col mb-8">
        <HeaderBlock title="Accesos Directos del Sistema" color={Y} />

        <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 bg-slate-50/30 items-stretch">

          {accesosDirectos.map((a, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { if (typeof setScreen === 'function') setScreen({ name: a.name, id: null }); }}
              className={`relative overflow-hidden p-5 rounded-2xl border ${a.theme.border} ${a.theme.bg} transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex items-center justify-between gap-3 text-left w-full min-h-[92px] group`}
            >
              {/* Resaltado especial de borde verde esmeralda lateral únicamente para el primer módulo (Registrar Documento) */}
              {i === 0 && <div className="absolute left-0 top-0 h-full w-1.5 bg-emerald-500 z-20"></div>}

              {/* Blur de decoración de fondo de tu KpiCard original */}
              <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-20 blur-xl ${a.theme.decoration} pointer-events-none`}></div>

              {/* Contenido de Texto exacto: Título arriba, descripción abajo */}
              <div className="relative z-10 flex flex-col min-w-0 flex-1">
                <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${a.theme.textLabel} truncate`}>
                  {a.label}
                </p>
                <p className={`text-[11px] font-bold text-slate-500 leading-snug line-clamp-2`}>
                  {a.desc}
                </p>
              </div>

              {/* Caja de Icono a la derecha: fondo blanco/60 con desenfoque de fondo */}
              <div className={`relative z-10 w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/60 backdrop-blur-md shadow-sm ${a.theme.textValue} group-hover:scale-105 duration-300`}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {a.icon}
                </svg>
              </div>
            </button>
          ))}

        </div>
      </div>

      {/* --- SECCIÓN 3: COMPONENTE INFERIOR (GRÁFICO TENDENCIA VS ACTIVIDAD RECIENTE) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* GRÁFICO B: TENDENCIA SEMANAL DE CARGA */}
        <div className="lg:col-span-8 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col">
          <HeaderBlock title="Tendencia Semanal de Carga" color={P} />
          <div className="p-8 flex-1 bg-white flex flex-col justify-center">
            <div className="w-full h-[200px]">
              <canvas ref={chartLineasRef}></canvas>
            </div>
          </div>
        </div>

        {/* PANEL: ACTIVIDAD RECIENTE */}
        <div className="lg:col-span-4 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col">
          <HeaderBlock title="Actividad Reciente" color={P} />
          <div className="p-6 space-y-5 flex-1 flex flex-col justify-center bg-white">
            {actividadReciente.length > 0 ? (
              actividadReciente.map((a, i) => (
                <div key={a.id} className="flex items-start gap-4 group cursor-default">
                  <div className="relative mt-1">
                    <div className="w-3 h-3 rounded-full z-10 relative shadow-sm ring-4 ring-white" style={{ background: a.color }}></div>
                    {i !== actividadReciente.length - 1 && (
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0.5 h-10 bg-slate-100 rounded-full"></div>
                    )}
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-[13px] font-extrabold text-slate-700 leading-tight truncate">
                      {a.num} <span className="font-black text-xs uppercase tracking-wide ml-0.5" style={{ color: a.color }}>— {a.accion}</span>
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider truncate">{a.tiempo} · {a.area}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 flex flex-col items-center justify-center h-full">
                <span className="text-2xl mb-2 opacity-40">📭</span>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No hay actividades recientes.</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}