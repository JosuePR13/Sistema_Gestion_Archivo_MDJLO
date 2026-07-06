import { useState, useEffect, useRef } from 'react';

export default function CustomDropdown({
  label,
  options = [],
  selectedValue,
  onSelect,
  placeholder = "Seleccione una opción",
  disabled = false,
  uppercase = false,
  color = "blue" // PROPIEDAD ADICIONADA: Soporta variantes dinámicas del sistema
}) {
  // CONTROL DE VISIBILIDAD: Flag para abrir/cerrar la lista flotante
  const [isOpen, setIsOpen] = useState(false);

  // REFERENCIA ESTRUCTURAL: Nodo asignado al wrapper principal para controlar eventos fuera del componente
  const dropdownRef = useRef(null);

  // LOGICA DE RECONOCIMIENTO: Busca el objeto seleccionado abstrayendo si usa llave primaria (id) o valor estático (value)
  const optionSeleccionada = options.find(opt =>
    (opt.id !== undefined ? opt.id.toString() : opt.value?.toString()) === selectedValue?.toString()
  );

  // DETERMINACIÓN TEXTUAL: Define la etiqueta a pintar en el trigger basándose en el estado de selección
  const textoBoton = optionSeleccionada ? (optionSeleccionada.nombre || optionSeleccionada.label) : placeholder;

  // MAPAS DE ESTILOS DINÁMICOS: Mutación cromática limpia según la identidad del módulo
  const themes = {
    blue: {
      hoverBorder: 'hover:border-blue-300',
      hoverShadow: 'hover:shadow-[0_4px_20px_rgba(15,76,129,0.06)]',
      focusActive: 'border-[#0F4C81] ring-4 ring-blue-600/10',
      textActive: 'text-[#0F4C81]',
      bgBadge: 'bg-blue-50',
      bgItemActive: 'bg-blue-100/70 border-blue-200/80'
    },
    emerald: {
      hoverBorder: 'hover:border-emerald-300',
      hoverShadow: 'hover:shadow-[0_4px_20px_rgba(16,185,129,0.06)]',
      focusActive: 'border-emerald-600 ring-4 ring-emerald-600/10',
      textActive: 'text-emerald-700',
      bgBadge: 'bg-emerald-50',
      bgItemActive: 'bg-emerald-100/70 border-emerald-200/80'
    },
    purple: {
      hoverBorder: 'hover:border-purple-300',
      hoverShadow: 'hover:shadow-[0_4px_20px_rgba(147,51,234,0.06)]',
      focusActive: 'border-purple-600 ring-4 ring-purple-600/10',
      textActive: 'text-purple-700',
      bgBadge: 'bg-purple-50',
      bgItemActive: 'bg-purple-100/70 border-purple-200/80'
    },
    sky: {
      hoverBorder: 'hover:border-sky-300',
      hoverShadow: 'hover:shadow-[0_4px_20px_rgba(14,165,233,0.06)]',
      focusActive: 'border-sky-600 ring-4 ring-sky-600/10',
      textActive: 'text-sky-700',
      bgBadge: 'bg-sky-50',
      bgItemActive: 'bg-sky-100/70 border-sky-200/80'
    },
    fuchsia: {
      hoverBorder: 'hover:border-fuchsia-300',
      hoverShadow: 'hover:shadow-[0_4px_20px_rgba(217,70,239,0.06)]',
      focusActive: 'border-fuchsia-600 ring-4 ring-fuchsia-600/10',
      textActive: 'text-fuchsia-700',
      bgBadge: 'bg-fuchsia-50',
      bgItemActive: 'bg-fuchsia-100/70 border-fuchsia-200/80'
    }
  };

  // Respaldo de seguridad en caso de recibir una variante no registrada
  const currentTheme = themes[color] || themes.blue;

  // HOOK EFFECT: Captura interacciones táctiles o de click fuera del nodo de referencia para replegar el dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    // Optimización: Pointerdown para una intercepción de hardware y respuesta reactiva inmediata
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full text-left" ref={dropdownRef}>
      {/* RENDERIZADO CONDICIONAL: Label descriptivo del select */}
      {label && <label className="block text-[11px] font-black text-slate-400 mb-2 tracking-widest uppercase">{label}</label>}

      {/* BOTÓN DISPARADOR (TRIGGER PRINCIPAL) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`group w-full h-[48px] flex items-center justify-between pl-4 pr-2 border rounded-2xl text-[13px] transition-all duration-300 font-bold text-left outline-none ${disabled
          ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed shadow-inner'
          : `bg-white border-slate-200 text-slate-700 shadow-[0_2px_15px_rgba(0,0,0,0.02)] ${isOpen ? currentTheme.focusActive : `${currentTheme.hoverBorder} ${currentTheme.hoverShadow}`
          }`
          }`}
      >
        {/* TEXTO DE CONTROL SELECCIONADO */}
        <span
          title={textoBoton}
          className={`truncate block mt-0.5 ${uppercase ? 'uppercase tracking-wide' : ''} ${!optionSeleccionada ? 'text-slate-400 font-semibold' : 'text-slate-700 font-extrabold'}`}
        >
          {textoBoton}
        </span>

        {/* INDICADOR DE ESTADO EN CAPA (ROTACIÓN Y COLOR DINÁMICO) */}
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors duration-300 flex-shrink-0 ${isOpen ? `${currentTheme.bgBadge} ${currentTheme.textActive}` : `bg-slate-50 text-slate-400 group-hover:${currentTheme.bgBadge}/50 group-hover:${currentTheme.textActive}`
          }`}>
          <svg className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* MENÚ FLOTANTE DESPLEGABLE */}
      {isOpen && !disabled && (
        <div className="absolute left-0 mt-2 w-full bg-white/95 backdrop-blur-2xl border border-slate-100 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)] z-50 p-2 animate-fade-in origin-top">

          {/* NODO DE LISTA CON SCROLLBAR INTERNO AJUSTADO */}
          <ul className="max-h-40 overflow-y-auto flex flex-col gap-1 [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.200)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">

            {/* MANEJO DE ESTADO VACÍO (CARGA ASÍNCRONA DE ENDPOINTS) */}
            {options.length === 0 ? (
              <li className="px-4 py-3 text-xs text-slate-400 font-semibold italic text-center">Cargando opciones...</li>
            ) : (
              // ITERACIÓN DINÁMICA DE LA MATRIZ DE OPCIONES
              options.map((opt, index) => {
                const valActual = opt.id !== undefined ? opt.id.toString() : opt.value?.toString();
                const isSelected = selectedValue?.toString() === valActual;
                const nombrePintar = opt.nombre || opt.label;

                return (
                  <li
                    key={opt.id !== undefined ? opt.id : index}
                    onClick={() => {
                      onSelect(valActual, opt); // Retorna el id/value limpio y el objeto íntegro al componente padre
                      setIsOpen(false); // Repliega el menú flotante
                    }}
                    className={`relative px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between overflow-hidden text-[12px] ${uppercase ? 'uppercase tracking-wide' : ''} ${isSelected
                      ? `${currentTheme.bgItemActive} ${currentTheme.textActive} font-black border shadow-[0_2px_8px_rgba(0,0,0,0.02)]`
                      : `text-slate-600 font-bold hover:bg-slate-50 hover:${currentTheme.textActive}`
                      }`}
                  >
                    {/* TEXTO DE LA OPCIÓN */}
                    <span className="truncate relative z-10" title={nombrePintar}>{nombrePintar}</span>

                    {/* CHECKMARK VISUAL: Renderizado exclusivo para el elemento activo */}
                    {isSelected && (
                      <svg className={`w-3.5 h-3.5 ${currentTheme.textActive} relative z-10 flex-shrink-0`} fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}