import { useState } from 'react';
import { useExpedientes } from '../../context/useExpedientes';
import CustomDropdown from '../../components/CustomDropdown';

export default function SeguimientoScreen({ setScreen }) {
  const { expedientes: dataGlobal, loading } = useExpedientes();

  const [filterEstado, setFilterEstado] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;

  const procesarVigencia = (data) => {
    return data.map(exp => {
      const fechaBase = exp.fecha_ingreso || exp.created_at || new Date().toISOString();
      const fechaDoc = new Date(fechaBase);
      const hoy = new Date();

      fechaDoc.setHours(0, 0, 0, 0);
      hoy.setHours(0, 0, 0, 0);

      let diffTime = hoy - fechaDoc;
      if (diffTime < 0) diffTime = 0;

      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const anosCalculados = diffDays / 365.25;

      let limiteAnos = 5;
      const conservStr = (exp.tiempo_conservacion?.toString() || '5 años').toLowerCase();

      if (conservStr.includes('perma') || conservStr.includes('indefi')) {
        limiteAnos = 999;
      } else {
        const matches = conservStr.match(/[\d.]+/);
        if (matches) {
          let valorNum = parseFloat(matches[0]);
          if (conservStr.includes('mes')) {
            valorNum = valorNum / 12;
          } else if (valorNum === 0.5 && !conservStr.includes('año')) {
            valorNum = 0.5;
          }
          limiteAnos = valorNum;
        }
      }

      let estadoRev = 'Conservar';
      if (limiteAnos !== 999) {
        const tiempoFaltante = limiteAnos - anosCalculados;
        if (tiempoFaltante <= 0) {
          estadoRev = 'Para depurar';
        } else {
          const umbralAviso = limiteAnos > 1 ? 1 : 0.085;
          if (tiempoFaltante <= umbralAviso) {
            estadoRev = 'En revisión';
          }
        }
      }

      const limiteLabel = limiteAnos === 999 ? 'Permanente' :
        limiteAnos < 1 ? `${Math.round(limiteAnos * 12)} meses` :
          `${limiteAnos} año${limiteAnos > 1 ? 's' : ''}`;

      const edadLabel =
        anosCalculados >= 1
          ? `${anosCalculados.toFixed(1)} años`
          : (() => {
            const mesesExactos = Math.floor(diffDays / 30.44);
            if (mesesExactos >= 1) {
              return `${mesesExactos} mes${mesesExactos > 1 ? 'es' : ''}`;
            }
            return diffDays === 0 ? 'Hoy' : `${diffDays} día${diffDays > 1 ? 's' : ''}`;
          })();

      return {
        ...exp,
        anosCalculados,
        limiteAnos,
        edadLabel,
        limiteLabel,
        estadoRev
      };
    });
  };

  const safeText = (value, fallback = 'General') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object') return value.nombre || value.descripcion || fallback;
    return fallback;
  };

  const expedientes = !loading && dataGlobal
    ? [...procesarVigencia(dataGlobal)].sort((a, b) => {
      const fechaA = new Date(a.fecha_ingreso || a.created_at || 0).getTime();
      const fechaB = new Date(b.fecha_ingreso || b.created_at || 0).getTime();
      return fechaB - fechaA;
    })
    : [];

  const paraDepurar = expedientes.filter(s => s.estadoRev === 'Para depurar').length;
  const enRevision = expedientes.filter(s => s.estadoRev === 'En revisión').length;
  const conservar = expedientes.filter(s => s.estadoRev === 'Conservar').length;

  const tablaFiltrada = expedientes.filter(e => {
    if (filterEstado === '') return true;
    return e.estadoRev === filterEstado;
  });

  const totalPages = Math.ceil(tablaFiltrada.length / ITEMS_PER_PAGE);
  const currentData = tablaFiltrada.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const opcionesEstado = [
    { id: 'Para depurar', nombre: '🔴 Para depurar' },
    { id: 'En revisión', nombre: '🟠 En revisión' },
    { id: 'Conservar', nombre: '🟢 Conservar' }
  ];

  const getBadgeStyle = (estado) => {
    switch (estado) {
      case 'Para depurar': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'En revisión': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Conservar': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#0F4C81] mb-4"></div>
        <p className="text-slate-400 font-bold text-[13px] uppercase tracking-widest animate-pulse">Analizando vigencia de documentos...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8 relative selection:bg-blue-200 selection:text-blue-900 pb-24">
      <div className="max-w-screen-xl mx-auto animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-8 bg-[#FFC107] rounded-full shadow-sm"></div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Seguimiento Documental</h2>
            <p className="text-[13px] font-medium text-slate-400 mt-0.5">Revisión automatizada de plazos de conservación y disposición final</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {[
            { l: 'Para depurar', v: paraDepurar, sub: 'Plazo vencido', c: '#E11D48', bg: 'bg-white', badge: 'bg-rose-50 text-rose-600 border-rose-100' },
            { l: 'En revisión', v: enRevision, sub: 'Por vencer', c: '#D97706', bg: 'bg-white', badge: 'bg-amber-50 text-amber-600 border-amber-100' },
            { l: 'Conservar', v: conservar, sub: 'Vigente / Permanente', c: '#059669', bg: 'bg-white', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
          ].map(k => (
            <div key={k.l} className={`${k.bg} p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50 to-transparent rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
              <div className="absolute top-0 left-0 w-1.5 h-full transition-all duration-300" style={{ background: k.c }}></div>
              <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest relative z-10">{k.l}</p>
              <p className="text-4xl font-black tracking-tighter my-2 relative z-10" style={{ color: k.c }}>{k.v}</p>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border inline-block mt-1 relative z-10 ${k.badge}`}>
                {k.sub}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col">
          <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
              {tablaFiltrada.length} documentos analizados
            </p>
            <div className="relative w-full sm:w-64 z-10">
              <CustomDropdown
                placeholder="Todos los estados"
                options={opcionesEstado}
                selectedValue={filterEstado}
                onSelect={(val) => { setFilterEstado(val); setCurrentPage(1); }}
              />
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest select-none bg-white">
                  <th className="p-5 px-6 w-[13%]">N° Expediente</th>
                  <th className="p-5 px-4 w-[20%]">Título / Asunto</th>
                  <th className="p-5 px-4 w-[13%]">Clasificación</th>
                  <th className="p-5 px-4 w-[16%]">Área Actual</th>
                  <th className="p-5 px-2 text-center w-[9%]">Edad Doc.</th>
                  <th className="p-5 px-2 text-center w-[8%]">Límite</th>
                  <th className="p-5 px-2 text-center w-[10%]">Auditoría</th>
                  <th className="p-5 px-6 text-center w-[11%]">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[13px]">
                {currentData.length > 0 ? (
                  currentData.map((d) => (
                    <tr key={d.id} className="hover:bg-blue-50/40 transition-colors h-[72px] group">
                      <td className="p-5 px-6 font-black text-[#0F4C81] truncate tracking-wide">{safeText(d.numero_expediente, 'S/N')}</td>
                      <td className="p-5 px-4 font-extrabold text-slate-800 truncate" title={safeText(d.titulo, 'Sin título')}>{safeText(d.titulo, 'Sin título')}</td>
                      <td className="p-5 px-4 text-slate-500 font-bold truncate lowercase first-letter:uppercase">
                        {safeText(d.tipo_documento || d.tipo_documento_id, 'General')}
                      </td>
                      <td className="p-5 px-4 text-slate-500 font-bold tracking-wide truncate uppercase text-[11px]">
                        Archivo Central
                      </td>
                      <td className="p-5 px-4 text-center whitespace-nowrap">
                        <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-lg border inline-block ${d.estadoRev === 'Para depurar' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          d.estadoRev === 'En revisión' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                          {d.edadLabel}
                        </span>
                      </td>
                      <td className="p-5 px-4 text-center text-[12px] font-bold text-slate-400 truncate">
                        {d.limiteLabel}
                      </td>
                      <td className="p-5 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border inline-block ${getBadgeStyle(d.estadoRev)}`}>
                          {d.estadoRev}
                        </span>
                      </td>
                      <td className="p-5 px-6 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setScreen({ name: 'detalle', id: d.id })}
                          className="px-4 py-2 text-[11px] uppercase tracking-wider rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-[#0F4C81] hover:text-white hover:border-[#0F4C81] font-extrabold transition-all shadow-sm"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="p-12 text-center text-slate-400 font-medium italic h-[200px]">
                      No hay registros disponibles.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-5 bg-rose-50/30 border-t border-rose-50 flex items-start gap-3">
            <span className="text-rose-400 text-xl leading-none">⚠️</span>
            <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
              Los documentos marcados como <strong className="text-rose-600 font-black">"Para depurar"</strong> han superado su plazo de conservación establecido en la directiva municipal. La decisión de eliminación física y digital debe estar autorizada formalmente por la Jefatura.
            </p>
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
                onClick={() => setCurrentPage(currentPage - 1)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 disabled:opacity-40 hover:bg-slate-50 hover:text-[#0F4C81] transition-all shadow-sm"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
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