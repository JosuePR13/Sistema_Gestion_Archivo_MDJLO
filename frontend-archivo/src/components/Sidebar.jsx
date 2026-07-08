import { useState } from 'react';
import logoMunicipalidad from '../assets/Logo_2.png';

// ====================================================================
// CONFIGURACIÓN DE MENÚS Y RUTAS DEL SISTEMA DE GESTIÓN (SIDEBAR)
// ====================================================================

export default function Sidebar({ currentScreen, setScreen }) {
    // --- ESTADO LOCAL PARA EL COLAPSO DINÁMICO DE LA INTERFAZ ---
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Arreglo de rutas del módulo central de Gestión Documental (SISGEDO)
    const menuArchivo = [
        { name: 'nuevo-expediente', label: 'Registrar Documento', d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
        { name: 'expedientes', label: 'Búsqueda Documental', d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
        { name: 'digitalizacion', label: 'Digitalización', d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
        { name: 'seguimiento', label: 'Control de Plazos', d: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" },
        { name: 'reportes', label: 'Reporte Documental', d: "M3 13h2v7H3zm5-6h2v13H8zm5 9h2v4h-2zm5-12h2v16h-2z" },
    ];

    // Arreglo de rutas asignadas al procesamiento de Mesa de Partes Externa
    const menuMesaPartes = [
        { name: 'nueva-solicitud', label: 'Registrar Solicitud', d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
        { name: 'bandeja-solicitudes', label: 'Bandeja de Solicitudes', d: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" },
    ];

    // Arreglo de rutas del área de Tesorería, Tasas por Copias y Recaudación municipal
    const menuCaja = [
        { name: 'historial-caja', label: 'Historial de Caja', d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
        { name: 'reporte-costos', label: 'Reporte de Costos', d: "M3 13h2v7H3zm5-6h2v13H8zm5 9h2v4h-2zm5-12h2v16h-2z" },
    ];

    // --- ENRUTADOR SEGURO DE INTERFAZ (ANTI-PÉRDIDA DE FORMULARIOS) ---
    const navegarConSeguridad = (targetScreenName) => {
        const destino = { name: targetScreenName, id: null };
        if (currentScreen === targetScreenName) return;

        if (currentScreen === 'nuevo-expediente' || currentScreen === 'nueva-solicitud') {
            const eventoNavegacion = new CustomEvent('onHeaderNavigate', { detail: destino });
            window.dispatchEvent(eventoNavegacion);
        } else {
            setScreen(destino);
        }
    };

    // --- SUB-COMPONENTE INTERNO: ITEMS DEL MENÚ ---
    const MenuItem = ({ item }) => {
        const isActive = currentScreen === item.name;
        return (
            <button
                type="button"
                onClick={() => navegarConSeguridad(item.name)}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 ${isCollapsed ? 'justify-center gap-0' : 'gap-3'} ${isActive
                    ? 'bg-[#0F4C81] text-white shadow-md font-bold'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-[#0F4C81] font-semibold'
                    }`}
                title={isCollapsed ? item.label : ""}
            >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.d} />
                </svg>
                {!isCollapsed && <span className="text-[13px] tracking-wide truncate">{item.label}</span>}
            </button>
        );
    };

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-200 flex flex-col h-screen shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative z-20 transition-all duration-300`}>

            {/* Cabecera del Sidebar */}
            <div className={`h-20 flex items-center border-b border-slate-100 relative ${isCollapsed ? 'justify-center px-4' : 'px-6'}`}>

                {!isCollapsed ? (
                    <div className="flex items-center gap-3 overflow-hidden animate-fade-in w-full">
                        <img
                            src={logoMunicipalidad}
                            alt="Logo Municipalidad"
                            className="w-9 h-9 object-contain rounded-md shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="flex flex-col text-left">
                            <span className="font-black text-[#0F4C81] text-[14px] leading-none tracking-tight">SISTEMA ARCHIVO</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestión Documental</span>
                        </div>
                    </div>
                ) : null}

                {/* --- BOTÓN TOGGLE CON EXCELENTE ANIMACIÓN DE DESPLAZAMIENTO (UI/UX TRICK) --- */}
                <button
                    type="button"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`p-1.5 rounded-lg text-slate-500 hover:text-[#0F4C81] border border-slate-200/60 shadow-md transition-all duration-300 shrink-0 z-30 absolute top-1/2 -translate-y-1/2
                        ${isCollapsed
                            ? 'left-1/2 -translate-x-1/2 bg-slate-50 hover:bg-slate-100'
                            : 'right-0 translate-x-1/2 bg-white hover:bg-slate-50'
                        }`}
                    title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
                >
                    <svg className="w-4 h-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isCollapsed ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Zona de Enlaces: Menú interactivo */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-7 no-scrollbar">

                {/* Categoría Raíz: Panel de Monitoreo */}
                <div>
                    {!isCollapsed && (
                        <h3 className="px-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 animate-fade-in">
                            Panel Principal
                        </h3>
                    )}
                    <button
                        type="button"
                        onClick={() => navegarConSeguridad('dashboard')}
                        className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 ${isCollapsed ? 'justify-center gap-0' : 'gap-3'} ${currentScreen === 'dashboard'
                            ? 'bg-[#0F4C81] text-white shadow-md font-bold'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-[#0F4C81] font-semibold'
                            }`}
                        title={isCollapsed ? "Inicio" : ""}
                    >
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                        </svg>
                        {!isCollapsed && <span className="text-[13px] tracking-wide font-semibold">Inicio</span>}
                    </button>
                </div>

                {/* Categoría A: Módulo Documental Interno */}
                <div>
                    {!isCollapsed && (
                        <h3 className="px-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 animate-fade-in">
                            Gestión Documental
                        </h3>
                    )}
                    <div className="space-y-1">
                        {menuArchivo.map((item) => (
                            <MenuItem key={item.name} item={item} />
                        ))}
                    </div>
                </div>

                {/* Categoría B: Mesa de Partes Externa */}
                <div>
                    {!isCollapsed && (
                        <h3 className="px-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 animate-fade-in">
                            Mesa de Partes
                        </h3>
                    )}
                    <div className="space-y-1">
                        {menuMesaPartes.map((item) => (
                            <MenuItem key={item.name} item={item} />
                        ))}
                    </div>
                </div>

                {/* Categoría C: Módulo Operativo de Tesorería */}
                <div>
                    {!isCollapsed && (
                        <h3 className="px-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 animate-fade-in">
                            Caja y Reportes
                        </h3>
                    )}
                    <div className="space-y-1">
                        {menuCaja.map((item) => (
                            <MenuItem key={item.name} item={item} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Pie de Sidebar: Perfil del Operador de Turno */}
            <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/50 flex justify-center">
                <div className={`flex items-center w-full px-2 py-2 ${isCollapsed ? 'justify-center gap-0' : 'gap-3'}`}>
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 border border-slate-200 shadow-sm text-[#0F4C81]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col overflow-hidden text-left animate-fade-in">
                            <span className="text-[12px] font-black text-slate-700 truncate">Usuario</span>
                            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> En línea
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}