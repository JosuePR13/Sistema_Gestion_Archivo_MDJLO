import { useExpedientes } from '../context/useExpedientes';

const SecTitle = ({ t, color }) => (
  <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3 bg-white">
    <div className="w-1.5 h-5 rounded-full shadow-sm" style={{ background: color }}></div>
    <p className="font-extrabold text-slate-800 text-[14px] uppercase tracking-[0.1em]">{t}</p>
  </div>
);

export default function Dashboard({ setScreen }) {
  const { expedientes: dataGlobal, loading } = useExpedientes();
  const expedientes = !loading && dataGlobal ? dataGlobal : [];

  const P = '#0F4C81';
  const Y = '#FFC107';

  const safeText = (val, fallback = 'General') => {
    if (!val) return fallback;
    if (typeof val === 'object') return val.nombre || fallback;
    return String(val);
  };

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

  const ingresosHoy = expedientes.filter(exp => {
    if (!exp.created_at) return false;
    const fechaDocLimpia = exp.created_at.substring(0, 10);
    const hoyPeru = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
    return fechaDocLimpia === hoyPeru;
  }).length;

  const pendientesDigitalizar = expedientes.filter(e => !(e.digitalizado === 1 || e.digitalizado === true)).length;
  const activos = expedientes.filter(e => (e.estado || '').toLowerCase() === 'activo').length;

  const paraDepurar = expedientes.filter(exp => {
    const fBase = exp.fecha_ingreso || exp.created_at || new Date().toISOString();
    const diffDays = Math.floor(Math.abs(new Date() - new Date(fBase)) / (1000 * 60 * 60 * 24));
    const anosVal = diffDays / 365.25;

    let lim = 5;
    const cStr = (exp.tiempo_conservacion || '5').toLowerCase();
    if (cStr.includes('perma') || cStr.includes('indefi')) return false;

    const m = cStr.match(/[\d.]+/);
    if (m) lim = cStr.includes('mes') ? parseFloat(m[0]) / 12 : parseFloat(m[0]);
    return anosVal >= lim;
  }).length;

  const areasMap = {};
  expedientes.forEach(e => {
    const areaOrigen = safeText(e.area_origen, 'No especificada');
    areasMap[areaOrigen] = (areasMap[areaOrigen] || 0) + 1;
  });

  const maxQty = Object.values(areasMap).length > 0 ? Math.max(...Object.values(areasMap)) : 1;

  const areasData = Object.keys(areasMap).map(name => {
    const cant = areasMap[name];
    const porcBarra = Math.round((cant / maxQty) * 100);
    return { a: name, qty: cant, width: porcBarra };
  }).sort((a, b) => b.qty - a.qty);

  const areaLider = areasData.length > 0 ? areasData[0] : null;

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

  const kpis = [
    { l: 'Ingresos de Hoy', v: ingresosHoy, sub: 'nuevos documentos', c: '#10B981' },
    { l: 'Físicos Pendientes', v: pendientesDigitalizar, sub: 'por digitalizar', c: '#F59E0B' },
    { l: 'En Trámite', v: activos, sub: 'expedientes activos', c: P },
    { l: 'Alertas Depuración', v: paraDepurar, sub: 'plazos vencidos', c: '#EF4444' },
  ];

  const acciones = [
    { name: 'nuevo-expediente', label: 'Registrar Nuevo', desc: 'Apertura e indexación de nuevos expedientes físicos.', bg: 'bg-blue-50/70', text: 'text-blue-700', border: 'border-blue-100', icon: <path d="M12 5v14M5 12h14" /> },
    { name: 'expedientes', label: 'Búsqueda', desc: 'Consulta y filtros avanzados.', bg: 'bg-amber-50/70', text: 'text-amber-600', border: 'border-amber-100', icon: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></> },
    { name: 'digitalizacion', label: 'Digitalización', desc: 'Carga masiva de PDFs.', bg: 'bg-emerald-50/70', text: 'text-emerald-600', border: 'border-emerald-100', icon: <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /> },
    { name: 'seguimiento', label: 'Seguimiento', desc: 'Control de vigencia y plazos.', bg: 'bg-rose-50/70', text: 'text-rose-600', border: 'border-rose-100', icon: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { name: 'reportes', label: 'Métricas', desc: 'Reportes y estadísticas KPI.', bg: 'bg-purple-50/70', text: 'text-purple-600', border: 'border-purple-100', icon: <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
  ];

  if (loading) return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#0F4C81]"></div>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 max-w-screen-xl mx-auto min-h-screen animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {kpis.map(k => (
          <div key={k.l} className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 p-6 relative overflow-hidden transition-all hover:-translate-y-1 duration-300 group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50 to-transparent rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
            <div className="absolute top-0 left-0 w-1.5 h-full transition-all duration-300" style={{ background: k.c }}></div>
            <p className="text-4xl font-black tracking-tighter relative z-10" style={{ color: k.c }}>{k.v}</p>
            <p className="text-[12px] font-extrabold text-slate-700 mt-2 uppercase tracking-widest relative z-10">{k.l}</p>
            <p className="text-[11px] text-slate-400 mt-1 font-semibold relative z-10">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col">
          <SecTitle t="Accesos Directos" color={Y} />
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 bg-slate-50/50">
            {acciones.map((a, i) => (
              <div
                key={i}
                onClick={() => { if (typeof setScreen === 'function') setScreen({ name: a.name, id: null }); }}
                className={`group rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 flex items-start gap-4 text-left border ${a.bg} ${a.border} ${i === 0 ? 'sm:col-span-2' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl bg-white flex shrink-0 items-center justify-center shadow-sm ${a.text} group-hover:scale-110 transition-transform`}>
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    {a.icon}
                  </svg>
                </div>
                <div className="flex flex-col justify-center h-full">
                  <p className="font-extrabold text-slate-700 text-[12px] uppercase tracking-wider leading-tight mb-1">{a.label}</p>
                  <p className="font-semibold text-slate-500 text-[11px] leading-snug">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col">
          <SecTitle t="Actividad Reciente" color={P} />
          <div className="p-6 space-y-5 flex-1">
            {actividadReciente.length > 0 ? (
              actividadReciente.map((a, i) => (
                <div key={a.id} className="flex items-start gap-4 group cursor-default">
                  <div className="relative mt-1.5">
                    <div className="w-3 h-3 rounded-full z-10 relative shadow-md ring-4 ring-white" style={{ background: a.color }}></div>
                    {i !== actividadReciente.length - 1 && (
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0.5 h-10 bg-slate-100 rounded-full"></div>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-extrabold text-slate-700 leading-tight">
                      {a.num} <span className="font-bold opacity-90" style={{ color: a.color }}>— {a.accion}</span>
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wide">{a.tiempo} · {a.area}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 font-medium text-center py-6">No hay actividades recientes.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col overflow-hidden h-[500px]">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#FFC107] rounded-full shadow-sm"></div>
            <div>
              <h3 className="text-[15px] font-black text-slate-800 uppercase tracking-widest">Carga Documentaria</h3>
              <p className="text-[12px] font-semibold text-slate-400 mt-0.5">Volumen de expedientes por área de origen</p>
            </div>
          </div>
          {areaLider && (
            <div className="hidden sm:block text-right bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Área Líder</p>
              <p className="text-[13px] font-black text-[#0F4C81] truncate max-w-[200px]" title={areaLider.a}>{areaLider.a}</p>
            </div>
          )}
        </div>

        <div className="flex-1 p-8 overflow-y-auto scrollbar-hide">
          {areasData.length > 0 ? (
            <div className="space-y-6">
              {areasData.map((a, idx) => {
                const isTop1 = idx === 0;
                const colorBarra = isTop1 ? 'from-amber-400 to-[#FFC107]' : 'from-blue-400 to-[#0F4C81]';

                return (
                  <div key={idx} className="group cursor-default">
                    <div className="flex justify-between items-end mb-2">
                      <span className={`text-[13px] font-extrabold truncate pr-4 transition-colors ${isTop1 ? 'text-amber-600' : 'text-slate-600 group-hover:text-[#0F4C81]'}`} title={a.a}>
                        {isTop1 && <span className="mr-2">🏆</span>}
                        {a.a}
                      </span>
                      <span className="text-[14px] font-black text-slate-700 whitespace-nowrap">
                        {a.qty} <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">exp.</span>
                      </span>
                    </div>

                    <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden shadow-inner flex items-center">
                      <div className={`h-full rounded-full bg-gradient-to-r ${colorBarra} transition-all duration-1000 ease-out relative overflow-hidden`} style={{ width: `${Math.max(a.width, 2)}%` }}>
                        <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><span className="text-2xl opacity-50">📊</span></div>
              <p className="text-sm text-slate-400 font-extrabold">Sin datos registrados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}