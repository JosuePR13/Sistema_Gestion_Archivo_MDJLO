import logoMunicipalidad from '../assets/Logo_2.png';

export default function Sidebar({ currentScreen, setScreen }) {

    // 📁 Módulo 1: Gestión de Archivo
    const menuArchivo = [
        { name: 'nuevo-expediente', label: 'Registrar Nuevo', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /> },
        { name: 'expedientes', label: 'Búsqueda', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /> },
        { name: 'digitalizacion', label: 'Digitalización', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /> },
        { name: 'seguimiento', label: 'Seguimiento', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
        { name: 'reportes', label: 'Métricas', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
    ];

    // 📝 Módulo 2: Mesa de Partes
    const menuMesaPartes = [
        { name: 'nueva-solicitud', label: 'Registrar Solicitud', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> },
        { name: 'bandeja-solicitudes', label: 'Bandeja de Gestión', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /> },
    ];

    const MenuItem = ({ item }) => {
        const isActive = currentScreen === item.name;
        return (
            <button
                onClick={() => setScreen({ name: item.name, id: null })}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                    ? 'bg-[#0F4C81] text-white shadow-md font-bold'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-[#0F4C81] font-semibold'
                    }`}
            >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {item.icon}
                </svg>
                <span className="text-[13px] tracking-wide truncate">{item.label}</span>
            </button>
        );
    };

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative z-20">

            {/* Cabecera del Sidebar con el LOGO INSTITUCIONAL REAL */}
            <div className="h-20 flex items-center px-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <img
                        src={logoMunicipalidad}
                        alt="Logo Municipalidad"
                        className="w-9 h-9 object-contain rounded-md"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                    <div className="flex flex-col text-left">
                        <span className="font-black text-[#0F4C81] text-[14px] leading-none tracking-tight">SISTEMA ARCHIVO</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestión Documental</span>
                    </div>
                </div>
            </div>

            {/* Menú de Navegación continuo */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-7">

                {/* ✅ BOTÓN DE INICIO REESTRUCTURADO: Sin raya abajo, sin fondo gris, integrado al flujo natural */}
                <div>
                    <button
                        onClick={() => setScreen({ name: 'dashboard', id: null })}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${currentScreen === 'dashboard'
                            ? 'bg-[#0F4C81] text-white shadow-md font-bold'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-[#0F4C81] font-semibold'
                            }`}
                    >
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-[13px] tracking-wide">Inicio</span>
                    </button>
                </div>

                {/* Bloque 1: Gestión Documental */}
                <div>
                    <h3 className="px-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                        Gestión Documental
                    </h3>
                    <div className="space-y-1">
                        {menuArchivo.map((item) => (
                            <MenuItem key={item.name} item={item} />
                        ))}
                    </div>
                </div>

                {/* Bloque 2: Mesa de Partes */}
                <div>
                    <h3 className="px-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        Mesa de Partes
                    </h3>
                    <div className="space-y-1">
                        {menuMesaPartes.map((item) => (
                            <MenuItem key={item.name} item={item} />
                        ))}
                    </div>
                </div>

            </div>

            {/* Footer del Sidebar */}
            <div className="p-4 border-t border-slate-100 shrink-0">
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-[12px] font-bold text-slate-700 truncate">Usuario</span>
                        <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> En línea
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
}