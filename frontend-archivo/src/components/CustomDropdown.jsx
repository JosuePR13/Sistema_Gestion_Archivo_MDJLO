import { useState, useEffect, useRef } from 'react';

export default function CustomDropdown({
  label,
  options = [],
  selectedValue,
  onSelect,
  placeholder = "Seleccione una opción",
  disabled = false,
  uppercase = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const optionSeleccionada = options.find(opt =>
    (opt.id !== undefined ? opt.id.toString() : opt.value?.toString()) === selectedValue?.toString()
  );

  const textoBoton = optionSeleccionada ? (optionSeleccionada.nombre || optionSeleccionada.label) : placeholder;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full text-left" ref={dropdownRef}>
      {label && <label className="block text-[11px] font-extrabold text-slate-500 mb-2 tracking-widest uppercase">{label}</label>}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`group w-full h-[48px] flex items-center justify-between pl-4 pr-2 border rounded-2xl text-[13px] transition-all duration-300 font-bold text-left outline-none ${disabled
          ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed shadow-inner'
          : 'bg-white border-slate-200 text-slate-700 shadow-[0_2px_15px_rgba(0,0,0,0.02)] hover:border-blue-300 hover:shadow-[0_4px_20_rgba(15,76,129,0.06)] focus:border-[#0F4C81] focus:ring-4 focus:ring-[#0F4C81]/10'
          }`}
      >
        <span 
          title={textoBoton} 
          className={`truncate block mt-0.5 ${uppercase ? 'uppercase tracking-wide' : ''} ${!optionSeleccionada ? 'text-slate-400 font-semibold' : 'text-slate-700 font-extrabold'}`}
        >
          {textoBoton}
        </span>

        <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors duration-300 flex-shrink-0 ${isOpen ? 'bg-blue-50 text-[#0F4C81]' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50/50 group-hover:text-[#0F4C81]'}`}>
          <svg className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 mt-2 w-full bg-white/90 backdrop-blur-2xl border border-white/40 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] z-50 p-2.5 animate-fade-in origin-top">
          <ul className="max-h-64 overflow-y-auto scrollbar-hide flex flex-col gap-1.5">
            {options.length === 0 ? (
              <li className="px-4 py-3 text-xs text-slate-400 font-semibold italic text-center">Cargando opciones...</li>
            ) : (
              options.map((opt, index) => {
                const valActual = opt.id !== undefined ? opt.id.toString() : opt.value?.toString();
                const isSelected = selectedValue?.toString() === valActual;
                const nombrePintar = opt.nombre || opt.label;

                return (
                  <li
                    key={opt.id !== undefined ? opt.id : index}
                    onClick={() => {
                      onSelect(valActual, opt);
                      setIsOpen(false);
                    }}
                    className={`relative px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between overflow-hidden text-[12px] ${uppercase ? 'uppercase tracking-wide' : ''
                      } ${isSelected
                        ? 'bg-gradient-to-r from-[#0F4C81] to-blue-700 text-white font-black shadow-md shadow-blue-900/20 scale-[0.98]'
                        : 'text-slate-600 font-bold hover:bg-slate-50 hover:text-[#0F4C81]'
                      }`}
                  >
                    <span className="truncate relative z-10" title={nombrePintar}>{nombrePintar}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-white relative z-10 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
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