import { useState, useEffect, useRef } from 'react';
// 🚀 Importamos el logo circular premium
import logoMuni from '../assets/Logo_2.png';

export default function Header({ onLogout, setScreen, currentScreen }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Usuario', role: 'Operador' };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (screenName) => {
    if (screenName === 'expedientes' && currentScreen === 'detalle') return true;
    return currentScreen === screenName;
  };

  const menuOptions = [
    { id: 'dashboard', label: 'Inicio' },
    { id: 'nuevo-expediente', label: 'Expedientes' },
    { id: 'expedientes', label: 'Búsqueda' },
    { id: 'digitalizacion', label: 'Digitalización' },
    { id: 'seguimiento', label: 'Seguimiento' },
    { id: 'reportes', label: 'Reportes' },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-[0_4px_30px_-10px_rgba(0,0,0,0.05)] sticky top-0 z-40 w-full border-b border-slate-100 transition-all">
      {/* Línea top con glow corporativo */}
      <div className="h-1.5 w-full bg-[#FFC107] shadow-[0_0_10px_rgba(255,193,7,0.4)]"></div>

      <div className="w-full px-4 sm:px-8 lg:px-12 border-b border-slate-50">
        <div className="flex justify-between h-[72px] items-center w-full">

          <div className="flex items-center gap-4">
            {/* Logo Circular Adaptado */}
            <div className="w-12 h-12 rounded-full border border-slate-200 bg-white flex items-center justify-center overflow-hidden shadow-sm transition-transform hover:scale-105 duration-300">
              <img src={logoMuni} alt="Logo Municipalidad JLO" className="w-full h-full object-cover" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F4C81]/60">Municipalidad Distrital</p>
              <p className="text-[15px] font-extrabold text-slate-800 tracking-tight leading-none mt-0.5">José Leonardo Ortiz</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-3 px-3 py-1.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all select-none group">
                <div className="text-right hidden md:block">
                  <p className="text-[13px] font-extrabold text-slate-700 leading-tight group-hover:text-[#0F4C81] transition-colors">Usuario</p>
                  <p className="text-[11px] font-medium text-slate-400 leading-tight">Unidad Funcional de Archivo y Acceso Documentario</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0F4C81] to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-md group-hover:shadow-lg transition-all">
                  {user.name ? user.name.charAt(0) : 'A'}
                </div>
                <svg width="12" height="12" fill="none" stroke="#9CA3AF" strokeWidth="2.5" viewBox="0 0 24 24" className={`transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" /></svg>
              </button>

              {/* Menú Desplegable con Glassmorphism */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-white/50 py-2 z-50 overflow-hidden animate-fade-in origin-top-right">
                  <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 text-left">
                    <p className="text-[13px] font-extrabold text-slate-800">Usuario</p>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">Operador Autorizado</p>
                  </div>
                  <button onClick={() => { setDropdownOpen(false); onLogout(); }} className="w-full text-left px-5 py-3 text-[13px] font-bold text-red-600 hover:bg-red-50/80 transition-colors flex items-center gap-2.5">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navegación por Pestañas Refinada */}
      <div className="w-full px-4 sm:px-8 lg:px-12 flex overflow-x-auto scrollbar-hide gap-6">
        {menuOptions.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setScreen({ name: opt.id, id: null })}
            className={`py-4 text-[13px] tracking-wide transition-all duration-300 border-b-[3px] whitespace-nowrap relative ${isActive(opt.id) ? 'text-[#0F4C81] border-[#FFC107] font-extrabold' : 'text-slate-500 font-bold border-transparent hover:text-[#0F4C81] hover:border-slate-200'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </header>
  );
}