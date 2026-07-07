import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import CustomDropdown from '../../components/CustomDropdown';
import { useExpedientes } from '../../context/useExpedientes';

export default function RegistrarExpediente({ setScreen, triggerToast }) {
  // CONTEXTO: Consumo del trigger global para refrescar las grillas de expedientes en segundo plano
  const { refrescarData } = useExpedientes();

  // ESTADO ESTRUCTURAL: Objeto de persistencia mapeado exactamente con las columnas del backend
  const [formData, setFormData] = useState({
    numero_expediente: '',
    titulo: '',
    descripcion: '',
    tipo_documento_id: '',
    area_origen_id: '',
    area_actual_id: '1', // Por defecto asignado a la id de Archivo Central
    numero_folios: '',
    estado: 'Activo',
    fecha_ingreso: '',
    tiempo_conservacion: '',
    fecha_revision: '',
    digitalizado: 0,
    razon_social: '',
    monto: '',
    registro_siaf: ''
  });

  // ESTADOS DE CONTROL DE FLUJO Y DATA RELACIONAL
  const [areas, setAreas] = useState([]); // Almacena el catálogo de áreas municipales
  const [tipos, setTipos] = useState([]); // Almacena el catálogo de tipos documentales
  const [esComprobante, setEsComprobante] = useState(false); // Flag reactivo para alternar la UI a flujo contable
  const [esPermanente, setEsPermanente] = useState(false); // Flag para omitir ciclo de expiración cronológica

  // ESTADOS DE SEGURIDAD (PREVENCIÓN DE PÉRDIDA DE DATOS)
  const [isDirty, setIsDirty] = useState(false); // Bandera reactiva que detecta modificaciones en el formulario
  const [showExitModal, setShowExitModal] = useState(false); // Visibilidad de la alerta preventiva de salida
  const [pendingScreen, setPendingScreen] = useState(null); // Retiene la pantalla destino solicitada por el usuario

  // ESTADOS DE EXCEPCIÓN Y VALIDACIÓN DE BASE DE DATOS
  const [showDuplicateModal, setShowDuplicateModal] = useState(false); // Modal de aviso por llave duplicada
  const [duplicateMessage, setDuplicateMessage] = useState(''); // Mensaje explicativo del error de duplicidad

  const [validated, setValidated] = useState(false); // Disparador visual para renderizar estados de error HTML5/Tailwind
  const editorRef = useRef(null); // Referencia mutable asignada al editor contentEditable (Asunto/Descripción)

  // UTILITARIO: Matriz de opciones predefinidas para el ciclo de vida del acervo documental
  const conservacionOptions = [
    { label: '6 meses', value: '0.5' },
    ...Array.from({ length: 15 }, (_, i) => ({ label: `${i + 1} año${i + 1 > 1 ? 's' : ''}`, value: (i + 1).toString() }))
  ];

  // HOOK EFFECT 1: Control nativo del navegador ante cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // HOOK EFFECT 2: Interceptor del evento para control cooperativo de navegación
  useEffect(() => {
    const handleHeaderNavigation = (e) => {
      const targetScreen = e.detail;
      if (isDirty) {
        setPendingScreen(targetScreen);
        setShowExitModal(true);
      } else {
        setScreen(targetScreen);
      }
    };
    window.addEventListener('onHeaderNavigate', handleHeaderNavigation);
    return () => window.removeEventListener('onHeaderNavigate', handleHeaderNavigation);
  }, [isDirty, setScreen]);

  // HOOK EFFECT 3: Carga asíncrona inicial de catálogos
  useEffect(() => {
    api.get('/areas').then(res => setAreas(res.data)).catch(console.error);
    api.get('/tipos-documento').then(res => setTipos(res.data)).catch(console.error);
  }, []);

  // CONTROLADOR REACTIVO: Setea el estado y calcula la fecha límite si corresponde
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updatedData = { ...prev, [field]: value };
      if ((field === 'fecha_ingreso' || field === 'tiempo_conservacion') && !esComprobante && !esPermanente) {
        updatedData.fecha_revision = calcularFechaRevision(
          field === 'fecha_ingreso' ? value : updatedData.fecha_ingreso,
          field === 'tiempo_conservacion' ? value : updatedData.tiempo_conservacion
        );
      }
      return updatedData;
    });
    setIsDirty(true);
  };

  // ALGORITMO CRONOLÓGICO: Añade el periodo de vigencia cuidando el desfase GMT
  const calcularFechaRevision = (fechaIngreso, tiempoConservacion) => {
    if (!fechaIngreso || !tiempoConservacion || esPermanente) return '';
    const date = new Date(fechaIngreso);
    date.setDate(date.getDate() + 1);
    const years = parseFloat(tiempoConservacion);
    if (years === 0.5) {
      date.setMonth(date.getMonth() + 6);
    } else {
      date.setFullYear(date.getFullYear() + years);
    }
    return date.toISOString().split('T')[0];
  };

  // MANEJADOR ESTRATÉGICO: Conmuta dinámicamente el layout según tipo de documento
  const handleTipoDocumentoSelect = (val, objetoSeleccionado) => {
    const esTipoComprobante = objetoSeleccionado && objetoSeleccionado.nombre.toLowerCase().includes('comprobante');

    if (esTipoComprobante) {
      setEsComprobante(true);
      setFormData(prev => ({
        ...prev,
        tipo_documento_id: val,
        area_origen_id: '1', // Forzado por defecto
        tiempo_conservacion: 'PERMANENTE', // Siempre permanente
        fecha_revision: 'N/A',
        titulo: '',
        razon_social: '',
        monto: '',
        registro_siaf: ''
      }));
    } else {
      setEsComprobante(false);
      setEsPermanente(false);
      setFormData(prev => ({
        ...prev,
        tipo_documento_id: val,
        area_origen_id: prev.area_origen_id === '1' ? '' : prev.area_origen_id,
        tiempo_conservacion: '',
        fecha_revision: '',
        razon_social: '',
        monto: '',
        registro_siaf: ''
      }));
    }
    if (editorRef.current) editorRef.current.innerHTML = '';
    setIsDirty(true);
  };

  // CONTROLADOR DE CLASIFICACIÓN: Conmuta estatus permanente para documentos tradicionales
  const handlePermanenteToggle = () => {
    const nuevoEstado = !esPermanente;
    setEsPermanente(nuevoEstado);
    setIsDirty(true);
    if (nuevoEstado) {
      setFormData(prev => ({ ...prev, tiempo_conservacion: 'PERMANENTE', fecha_revision: 'N/A' }));
    } else {
      setFormData(prev => ({ ...prev, tiempo_conservacion: '', fecha_revision: '' }));
    }
  };

  // CONTROLADOR RICH TEXT: Bold/Underline en div contentEditable
  const ejecutComando = (cmd) => {
    document.execCommand(cmd, false, null);
    if (editorRef.current) {
      handleInputChange('descripcion', editorRef.current.innerHTML);
    }
  };

  const handleTryExit = () => {
    if (isDirty) {
      setPendingScreen({ name: 'dashboard', id: null });
      setShowExitModal(true);
    } else {
      setScreen({ name: 'dashboard', id: null });
    }
  };

  // ENVIÓ Y PERSISTENCIA: Manejo estricto de payloads y captura de excepciones
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidated(true);

    const baseValid = formData.tipo_documento_id && formData.numero_expediente.trim() && formData.fecha_ingreso && formData.numero_folios;
    const conservacionValid = esComprobante || esPermanente || formData.tiempo_conservacion;
    const extraValid = esComprobante
      ? (formData.razon_social.trim() && formData.monto && formData.registro_siaf.trim())
      : (formData.titulo.trim() && formData.area_origen_id);

    if (!baseValid || !conservacionValid || !extraValid) return;

    try {
      const payloadLimpiado = {
        numero_expediente: formData.numero_expediente,
        titulo: esComprobante ? `Comprobante ${formData.numero_expediente}` : formData.titulo,
        descripcion: formData.descripcion || 'Sin descripción o asunto inicial.',
        numero_folios: parseInt(formData.numero_folios),
        fecha_ingreso: formData.fecha_ingreso,
        tiempo_conservacion: esComprobante || esPermanente ? 'PERMANENTE' : `${formData.tiempo_conservacion} ${parseInt(formData.tiempo_conservacion) === 1 && parseFloat(formData.tiempo_conservacion) !== 0.5 ? 'año' : 'años'}`,
        estado: 'Activo',
        tipo_documento_id: parseInt(formData.tipo_documento_id),
        area_origen_id: parseInt(formData.area_origen_id),
        area_actual_id: 1
      };

      if (!esComprobante && payloadLimpiado.tiempo_conservacion.includes('0.5')) {
        payloadLimpiado.tiempo_conservacion = '6 meses';
      }

      if (esComprobante) {
        payloadLimpiado.razon_social = formData.razon_social;
        payloadLimpiado.monto = parseFloat(formData.monto);
        payloadLimpiado.registro_siaf = formData.registro_siaf;
      }

      await api.post('/expedientes', payloadLimpiado);
      if (typeof refrescarData === 'function') refrescarData();

      setIsDirty(false);
      triggerToast('¡Documento ingresado con éxito!');

      setEsPermanente(false);
      setEsComprobante(false);

      setFormData({
        numero_expediente: '',
        titulo: '',
        descripcion: '',
        tipo_documento_id: '',
        area_origen_id: '',
        area_actual_id: '1',
        numero_folios: '',
        estado: 'Activo',
        fecha_ingreso: '',
        tiempo_conservacion: '',
        fecha_revision: '',
        digitalizado: 0,
        razon_social: '',
        monto: '',
        registro_siaf: ''
      });

      if (editorRef?.current) editorRef.current.innerHTML = '';
      if (typeof setValidated === 'function') setValidated(false);

    } catch (error) {
      console.error("Error devuelto por Laravel:", error.response?.data || error.message);
      const erroresBackend = error.response?.data?.errors;

      if (erroresBackend) {
        if (erroresBackend.numero_expediente) {
          const mensajeError = esComprobante
            ? `El N° de Comprobante de Pago "${formData.numero_expediente}" ya se encuentra registrado en el sistema de control municipal.`
            : `El código "${formData.numero_expediente}" ya se encuentra registrado bajo la custodia de otro documento en el sistema municipal.`;

          setDuplicateMessage(mensajeError);
          setShowDuplicateModal(true);
        } else {
          const listaErrores = Object.values(erroresBackend).flat().join('\n');
          alert(`Validación de campos de control de Laravel:\n${listaErrores}`);
        }
      } else {
        alert('Hubo un error al registrar. Verifica que los campos obligatorios no estén vacíos.');
      }
    }
  };

  const inputBaseStyles = "w-full h-[48px] px-4 border bg-slate-50/50 rounded-2xl text-[13px] outline-none transition-all duration-300 font-semibold text-slate-700 placeholder-slate-400 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:my-auto";
  const readOnlyStyles = "w-full h-[48px] px-4 border border-slate-100 bg-slate-100/50 text-slate-500 rounded-2xl text-[13px] font-extrabold outline-none cursor-not-allowed flex items-center";
  const labelStyles = "block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2";

  const getInputStyles = (value) => {
    const isError = validated && (!value || String(value).trim() === '');
    return `${inputBaseStyles} ${isError ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10' : 'border-slate-200 focus:bg-white focus:border-fuchsia-600 focus:ring-2 focus:ring-fuchsia-600/10 shadow-sm'}`;
  };

  return (
    /* CORREGIDO: Se restauró la selección nativa azul limpia de la UI para no interferir al resaltar texto */
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 relative selection:bg-blue-100 selection:text-blue-900 pb-24 text-left">
      <div className="max-w-[1200px] w-full mx-auto space-y-6 animate-fade-in">

        {/* BOTÓN SUPERIOR DE RETORNO CONTROLADO */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleTryExit} className="text-[12px] text-slate-500 hover:text-[#0F4C81] transition-all font-black uppercase tracking-wider flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.01)] border border-slate-200/60 hover:shadow-sm">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Volver
          </button>
        </div>

        {/* CABECERA PRINCIPAL */}
        <div className="relative overflow-hidden bg-gradient-to-r from-fuchsia-500/15 via-fuchsia-100/40 to-transparent p-6 sm:px-8 sm:py-6 rounded-3xl border border-fuchsia-200/80 shadow-[0_4px_25px_rgb(0,0,0,0.01)] flex items-center gap-4 z-40">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-30 blur-xl bg-fuchsia-300 pointer-events-none"></div>
          <div className="w-10 h-10 rounded-xl bg-fuchsia-600/15 border border-fuchsia-200/60 flex items-center justify-center text-fuchsia-600 relative z-10 shadow-sm shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div className="flex flex-col relative z-10 text-left">
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Registrar Documento</h1>
            <span className="text-[11px] font-black text-fuchsia-700 mt-1.5 uppercase tracking-wider">Trámite de ingreso al área funcional</span>
          </div>
        </div>

        {/* FORMULARIO PRINCIPAL */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate autoComplete="off">

          {/* SECCIÓN I: CAPTURA DE METADATOS PRINCIPALES */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100/80">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-1.5 h-5 bg-fuchsia-500 rounded-full shadow-sm"></div>
              <span className="text-[12px] font-black text-slate-700 uppercase tracking-widest">
                {esComprobante ? 'Información del Comprobante de Pago' : 'Información General'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

              {/* DESPLEGABLE: TIPO DE DOCUMENTO */}
              <div className="md:col-span-6 lg:col-span-4">
                <label htmlFor="tipo_documento_id" className={labelStyles}>Tipo de documento *</label>
                <div className={`rounded-2xl transition-all ${validated && !formData.tipo_documento_id ? 'ring-2 ring-rose-500 bg-rose-50/20' : ''}`}>
                  <CustomDropdown
                    id="tipo_documento_id"
                    name="tipo_documento_id"
                    placeholder="Seleccione tipo"
                    options={tipos}
                    selectedValue={formData.tipo_documento_id}
                    onSelect={handleTipoDocumentoSelect}
                    color="fuchsia"
                  />
                </div>
                {validated && !formData.tipo_documento_id && (
                  <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Seleccione una opción</p>
                )}
              </div>

              {/* RENDERIZADO CONDICIONAL: FLUJOS SEGÚN TIPO */}
              {esComprobante ? (
                <>
                  <div className="md:col-span-3 lg:col-span-4">
                    <label htmlFor="numero_comprobante" className={labelStyles}>N° Comprobante de Pago *</label>
                    <input
                      id="numero_comprobante"
                      name="numero_expediente"
                      value={formData.numero_expediente}
                      placeholder="001800"
                      className={getInputStyles(formData.numero_expediente)}
                      onChange={e => handleInputChange('numero_expediente', e.target.value.replace(/\D/g, ''))}
                    />
                    {validated && !formData.numero_expediente.trim() && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Ingrese el número de comprobante</p>
                    )}
                  </div>

                  <div className="md:col-span-3 lg:col-span-4">
                    <label htmlFor="fecha_comprobante" className={labelStyles}>Fecha de Ingreso *</label>
                    <input
                      id="fecha_comprobante"
                      name="fecha_ingreso"
                      type="date"
                      value={formData.fecha_ingreso}
                      className={getInputStyles(formData.fecha_ingreso)}
                      onChange={e => handleInputChange('fecha_ingreso', e.target.value)}
                    />
                    {validated && !formData.fecha_ingreso && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Ingrese la fecha</p>
                    )}
                  </div>

                  <div className="md:col-span-12 lg:col-span-6">
                    <label htmlFor="razon_social" className={labelStyles}>Nombres y Apellidos / Razón Social *</label>
                    <input
                      id="razon_social"
                      name="razon_social"
                      value={formData.razon_social}
                      placeholder="Ingrese el nombre completo o la razón social de la empresa"
                      className={getInputStyles(formData.razon_social)}
                      onChange={e => handleInputChange('razon_social', e.target.value.replace(/[0-9]/g, ''))}
                    />
                    {validated && !formData.razon_social.trim() && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Ingrese el interesado / razón social</p>
                    )}
                  </div>

                  <div className="md:col-span-6 lg:col-span-3">
                    <label htmlFor="monto" className={labelStyles}>Monto (S/.) *</label>
                    <input
                      id="monto"
                      name="monto"
                      type="number"
                      step="0.01"
                      value={formData.monto}
                      placeholder="0.00"
                      className={getInputStyles(formData.monto)}
                      onChange={e => handleInputChange('monto', e.target.value)}
                    />
                    {validated && !formData.monto && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Ingrese el monto total</p>
                    )}
                  </div>

                  <div className="md:col-span-6 lg:col-span-3">
                    <label htmlFor="registro_siaf" className={labelStyles}>Registro SIAF *</label>
                    <input
                      id="registro_siaf"
                      name="registro_siaf"
                      value={formData.registro_siaf}
                      placeholder="N° Registro SIAF"
                      className={getInputStyles(formData.registro_siaf)}
                      onChange={e => handleInputChange('registro_siaf', e.target.value.replace(/\D/g, ''))}
                    />
                    {validated && !formData.registro_siaf.trim() && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Ingrese el código SIAF</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="md:col-span-3 lg:col-span-3">
                    <label htmlFor="numero_expediente" className={labelStyles}>N° Expediente / Documento *</label>
                    <input
                      id="numero_expediente"
                      name="numero_expediente"
                      value={formData.numero_expediente}
                      placeholder="EXP-2026-XXXX"
                      className={getInputStyles(formData.numero_expediente)}
                      onChange={e => handleInputChange('numero_expediente', e.target.value)}
                    />
                    {validated && !formData.numero_expediente.trim() && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Ingrese el código</p>
                    )}
                  </div>

                  <div className="md:col-span-3 lg:col-span-3">
                    <label htmlFor="fecha_ingreso" className={labelStyles}>Fecha de Ingreso *</label>
                    <input
                      id="fecha_ingreso"
                      name="fecha_ingreso"
                      type="date"
                      value={formData.fecha_ingreso}
                      className={getInputStyles(formData.fecha_ingreso)}
                      onChange={e => handleInputChange('fecha_ingreso', e.target.value)}
                    />
                    {validated && !formData.fecha_ingreso && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Seleccione una fecha</p>
                    )}
                  </div>

                  <div className="md:col-span-2 lg:col-span-2">
                    <label htmlFor="numero_folios_gen" className={labelStyles}>N° de Folios *</label>
                    <input
                      id="numero_folios_gen"
                      name="numero_folios"
                      type="number"
                      min="1"
                      placeholder="Ej. 10"
                      className={getInputStyles(formData.numero_folios)}
                      value={formData.numero_folios}
                      onChange={e => handleInputChange('numero_folios', e.target.value)}
                    />
                    {validated && !formData.numero_folios && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Mín 1</p>
                    )}
                  </div>

                  <div className="md:col-span-12">
                    <label htmlFor="titulo" className={labelStyles}>Título del Documento *</label>
                    <input
                      id="titulo"
                      name="titulo"
                      value={formData.titulo}
                      placeholder="Título completo"
                      className={getInputStyles(formData.titulo)}
                      onChange={e => handleInputChange('titulo', e.target.value)}
                    />
                    {validated && !formData.titulo.trim() && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Ingrese el título del documento</p>
                    )}
                  </div>
                </>
              )}

              {/* CAJA DE TEXTO ENRIQUECIDA (DESCRIPCIÓN / ASUNTO) - DISPONIBLE EN AMBOS FLUJOS */}
              <div className="md:col-span-12">
                <label htmlFor="editor_descripcion" className={labelStyles}>Descripción / Asunto</label>
                <div className="w-full border border-slate-200 rounded-2xl bg-slate-50 overflow-hidden focus-within:ring-4 focus-within:ring-fuchsia-600/10 focus-within:border-fuchsia-600 focus-within:bg-white transition-all duration-300 shadow-inner shadow-slate-100/50">
                  <div className="bg-slate-100/60 border-b border-slate-200 px-3 py-2 flex gap-2 select-none">
                    <button type="button" onClick={() => ejecutComando('bold')} className="w-8 h-8 flex items-center justify-center text-sm font-extrabold rounded-lg text-slate-600 hover:bg-white hover:shadow-sm active:bg-slate-200 transition-all" title="Negrita">B</button>
                    <button type="button" onClick={() => ejecutComando('underline')} className="w-8 h-8 flex items-center justify-center text-sm underline rounded-lg text-slate-600 hover:bg-white hover:shadow-sm active:bg-slate-200 transition-all" title="Subrayado">U</button>
                  </div>
                  <div
                    id="editor_descripcion"
                    ref={editorRef}
                    contentEditable
                    className="w-full p-4 min-h-[120px] max-h-[220px] overflow-y-auto text-[13px] outline-none text-slate-700 leading-relaxed font-medium bg-transparent"
                    onInput={(e) => handleInputChange('descripcion', e.currentTarget.innerHTML)}
                    placeholder="Descripción detallada del contenido..."
                  />
                </div>
              </div>

              {/* ÁREA DE ORIGEN SÓLO PARA EXPEDIENTES GENERALES */}
              {!esComprobante && (
                <div className="md:col-span-6 lg:col-span-6">
                  <label htmlFor="area_origen_id" className={labelStyles}>Área de origen *</label>
                  <div className={`rounded-2xl transition-all ${validated && !formData.area_origen_id ? 'ring-2 ring-rose-500 bg-rose-50/20' : ''}`}>
                    <CustomDropdown
                      id="area_origen_id"
                      name="area_origen_id"
                      placeholder="Seleccione área"
                      options={areas}
                      selectedValue={formData.area_origen_id}
                      onSelect={(val) => handleInputChange('area_origen_id', val)}
                      color="fuchsia"
                    />
                  </div>
                  {validated && !formData.area_origen_id && (
                    <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Seleccione una opción</p>
                  )}
                </div>
              )}

              {/* CAMPOS ESTÁTICOS DE CONTROL INFERIOR */}
              {!esComprobante && (
                <>
                  <div className="md:col-span-3 lg:col-span-3">
                    <label htmlFor="area_actual" className={labelStyles}>Área Actual</label>
                    <input id="area_actual" name="area_actual" type="text" value="Archivo Central" readOnly className={readOnlyStyles} />
                  </div>

                  <div className="md:col-span-3 lg:col-span-3">
                    <label htmlFor="estado_documental" className={labelStyles}>Estado Documental</label>
                    <input id="estado_documental" name="estado_documental" type="text" value="Activo" readOnly className={readOnlyStyles} />
                  </div>
                </>
              )}

              {/* FILA COMPROBANTE: N° DE FOLIOS + DOS CAMPOS READONLY*/}
              {esComprobante && (
                <>
                  <div className="md:col-span-3 lg:col-span-3">
                    <label htmlFor="numero_folios_comp" className={labelStyles}>N° Folios *</label>
                    <input
                      id="numero_folios_comp"
                      name="numero_folios"
                      type="number"
                      min="1"
                      placeholder="Ej. 10"
                      className={getInputStyles(formData.numero_folios)}
                      value={formData.numero_folios}
                      onChange={e => handleInputChange('numero_folios', e.target.value)}
                    />
                    {validated && !formData.numero_folios && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Mín 1</p>
                    )}
                  </div>

                  <div className="md:col-span-3 lg:col-span-3">
                    <label htmlFor="area_actual_comp" className={labelStyles}>Área Actual</label>
                    <input id="area_actual_comp" name="area_actual_comp" type="text" value="Archivo Central" readOnly className={readOnlyStyles} />
                  </div>

                  <div className="md:col-span-3 lg:col-span-3">
                    <label htmlFor="vigencia_comp" className={labelStyles}>Vigencia Documental</label>
                    <input id="vigencia_comp" name="vigencia_comp" type="text" value="PERMANENTE" readOnly className={`${readOnlyStyles} text-amber-600`} />
                  </div>
                </>
              )}

            </div>
          </div>

          {/* SECCIÓN II: VIGENCIA DOCUMENTAL (SÓLO ADVERTIDA EN TRÁMITES TRADICIONALES) */}
          {!esComprobante && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100/80">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-5 bg-fuchsia-500 rounded-full shadow-sm"></div>
                  <span className="text-[12px] font-black text-slate-700 uppercase tracking-widest">Vigencia Documental *</span>
                </div>

                <button
                  type="button"
                  onClick={handlePermanenteToggle}
                  className={`px-4 h-[36px] text-[11px] font-black uppercase tracking-widest rounded-xl border transition-all duration-300 shadow-sm ${esPermanente ? 'bg-amber-500/10 text-amber-700 border-amber-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  {esPermanente ? '✓ Documento Permanente' : '¿Documento Permanente?'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="tiempo_conservacion" className={labelStyles}>Tiempo de Vigencia *</label>
                  {esPermanente ? (
                    <input id="tiempo_conservacion" name="tiempo_conservacion" type="text" value="PERMANENTE (No se elimina)" readOnly className="w-full h-[48px] px-4 border border-amber-100 bg-amber-50/40 text-amber-800 font-extrabold rounded-2xl text-[13px] outline-none cursor-not-allowed shadow-inner flex items-center" />
                  ) : (
                    <>
                      <div className={`rounded-2xl transition-all ${validated && !formData.tiempo_conservacion ? 'ring-2 ring-rose-500 bg-rose-50/20' : ''}`}>
                        <CustomDropdown
                          id="tiempo_conservacion"
                          name="tiempo_conservacion"
                          placeholder="Seleccione tiempo..."
                          options={conservacionOptions}
                          selectedValue={formData.tiempo_conservacion}
                          onSelect={(val) => handleInputChange('tiempo_conservacion', val)}
                          color="fuchsia"
                        />
                      </div>
                      {validated && !formData.tiempo_conservacion && (
                        <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2">⚠️ Seleccione una opción</p>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label htmlFor="fecha_revision" className={labelStyles}>Fecha límite de vigencia</label>
                  <input
                    id="fecha_revision"
                    name="fecha_revision"
                    type="text"
                    value={esPermanente ? 'N/A' : formData.fecha_revision}
                    readOnly
                    className="w-full h-[48px] px-4 border border-slate-100 bg-slate-50/50 text-slate-400 font-bold rounded-2xl text-[13px] outline-none cursor-not-allowed flex items-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CONTROLES DE CONFIRMACIÓN INFERIORES */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleTryExit} className="px-6 py-3.5 rounded-2xl border border-slate-200 text-[13px] font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all shadow-sm">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-3.5 rounded-2xl font-black text-white text-[12px] uppercase tracking-widest bg-gradient-to-r from-[#0F4C81] to-blue-700 shadow-[0_4px_15px_rgba(15,76,129,0.2)] hover:-translate-y-0.5 transition-all">
              Registrar Documento
            </button>
          </div>
        </form>
      </div>

      {/* MODAL I: ADVERTENCIA DE SALIDA */}
      {showExitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden transform scale-100 transition-all">
            <div className="h-2 w-full bg-amber-500"></div>
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-5 shadow-inner">
                <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2 tracking-tight">¿Seguro que deseas salir?</h3>
              <p className="text-[13px] text-slate-500 px-2 leading-relaxed font-medium">Hay datos redactados en este formulario. Si decides regresar ahora, perderás toda la información ingresada.</p>
            </div>
            <div className="bg-slate-50/50 px-6 py-5 flex flex-col sm:flex-row justify-center gap-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowExitModal(false)} className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all order-2 sm:order-1">
                No, continuar
              </button>
              <button type="button" onClick={() => { setShowExitModal(false); setIsDirty(false); setScreen(pendingScreen || { name: 'dashboard', id: null }); }} className="w-full sm:w-auto px-5 py-3 rounded-xl text-white text-[13px] font-bold bg-[#0F4C81] shadow-md hover:bg-blue-800 transition-all order-1 sm:order-2">
                Sí, salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL II: CONTROL DE EXCEPCIÓN POR CÓDIGO DUPLICADO */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden transform scale-100 transition-all text-center">
            <div className="h-1.5 w-full bg-rose-500"></div>
            <div className="p-8">
              <div className="w-14 h-14 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-5 shadow-sm">
                <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2 tracking-tight">Código Duplicado</h3>
              <p className="text-[13px] text-slate-500 px-3 leading-relaxed font-medium">{duplicateMessage}</p>
            </div>
            <div className="bg-slate-50/50 px-6 py-5 flex justify-center border-t border-slate-100">
              <button type="button" onClick={() => setShowDuplicateModal(false)} className="w-full h-[40px] text-white text-[11px] font-black uppercase tracking-widest rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 shadow-sm hover:from-rose-600 hover:to-rose-700 transition-all">
                Entendido, corregir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}