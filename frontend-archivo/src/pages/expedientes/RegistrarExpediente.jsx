import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import CustomDropdown from '../../components/CustomDropdown';
import { useExpedientes } from '../../context/useExpedientes';

export default function RegistrarExpediente({ setScreen, triggerToast }) {
  const { refrescarData } = useExpedientes();

  const [formData, setFormData] = useState({
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

  const [areas, setAreas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [esComprobante, setEsComprobante] = useState(false);
  const [esPermanente, setEsPermanente] = useState(false);

  const [isDirty, setIsDirty] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingScreen, setPendingScreen] = useState(null);

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState('');

  const [validated, setValidated] = useState(false);

  const editorRef = useRef(null);

  const conservacionOptions = [
    { label: '6 meses', value: '0.5' },
    ...Array.from({ length: 15 }, (_, i) => ({ label: `${i + 1} año${i + 1 > 1 ? 's' : ''}`, value: (i + 1).toString() }))
  ];

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

  useEffect(() => {
    api.get('/areas').then(res => setAreas(res.data)).catch(console.error);
    api.get('/tipos-documento').then(res => setTipos(res.data)).catch(console.error);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updatedData = { ...prev, [field]: value };
      if (field === 'fecha_ingreso' || field === 'tiempo_conservacion') {
        updatedData.fecha_revision = calcularFechaRevision(
          field === 'fecha_ingreso' ? value : updatedData.fecha_ingreso,
          field === 'tiempo_conservacion' ? value : updatedData.tiempo_conservacion
        );
      }
      return updatedData;
    });
    setIsDirty(true);
  };

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

  const handleTipoDocumentoSelect = (val, objetoSeleccionado) => {
    if (objetoSeleccionado && objetoSeleccionado.nombre.toLowerCase().includes('comprobante')) {
      setEsComprobante(true);
      setFormData(prev => ({ ...prev, tipo_documento_id: val, area_origen_id: '1', razon_social: '', monto: '', registro_siaf: '' }));
    } else {
      setEsComprobante(false);
      setFormData(prev => ({ ...prev, tipo_documento_id: val, area_origen_id: '', numero_expediente: '', fecha_ingreso: '', titulo: '' }));
    }
    setIsDirty(true);
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidated(true);

    const baseValid = formData.tipo_documento_id && formData.numero_expediente.trim() && formData.fecha_ingreso && formData.numero_folios;
    const conservacionValid = esPermanente || formData.tiempo_conservacion;

    const extraValid = esComprobante
      ? (formData.razon_social.trim() && formData.monto && formData.registro_siaf.trim())
      : (formData.titulo.trim() && formData.area_origen_id);

    if (!baseValid || !conservacionValid || !extraValid) {
      return;
    }

    try {
      const payloadLimpiado = {
        numero_expediente: formData.numero_expediente,
        titulo: esComprobante ? `Comprobante ${formData.numero_expediente}` : formData.titulo,
        descripcion: formData.descripcion || 'Sin descripción o asunto inicial.',
        numero_folios: parseInt(formData.numero_folios),
        fecha_ingreso: formData.fecha_ingreso,
        tiempo_conservacion: esPermanente ? 'PERMANENTE' : `${formData.tiempo_conservacion} ${parseInt(formData.tiempo_conservacion) === 1 && parseFloat(formData.tiempo_conservacion) !== 0.5 ? 'año' : 'años'}`,
        estado: 'Activo',
        tipo_documento_id: parseInt(formData.tipo_documento_id),
        area_origen_id: parseInt(formData.area_origen_id),
        area_actual_id: 1
      };

      if (payloadLimpiado.tiempo_conservacion.includes('0.5')) {
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
      triggerToast('¡Expediente registrado con éxito en el Archivo Central!');
      setScreen({ name: 'dashboard', id: null });
    } catch (error) {
      console.error("Error devuelto por Laravel:", error.response?.data || error.message);
      const erroresBackend = error.response?.data?.errors;
      if (erroresBackend) {
        if (erroresBackend.numero_expediente) {
          setDuplicateMessage(`El código "${formData.numero_expediente}" ya se encuentra registrado bajo la custodia de otro documento en el sistema municipal.`);
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

  const inputBaseStyles = "w-full h-[48px] px-4 border bg-slate-50 rounded-2xl text-[13px] outline-none transition-all duration-300 font-semibold text-slate-700 placeholder-slate-400 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:my-auto";
  const readOnlyStyles = "w-full h-[48px] px-4 border border-slate-100 bg-slate-50/50 text-slate-400 rounded-2xl text-[13px] font-extrabold outline-none cursor-not-allowed flex items-center";
  const labelStyles = "block text-[11px] font-extrabold text-slate-500 mb-2 tracking-widest uppercase";

  const getInputStyles = (value) => {
    const isError = validated && (!value || String(value).trim() === '');
    return `${inputBaseStyles} ${isError ? 'border-rose-500 bg-rose-50/10 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 focus:bg-white focus:border-[#0F4C81] focus:ring-[#0F4C81]/10'}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8 relative selection:bg-blue-200 selection:text-blue-900">
      <div className="max-w-[1200px] w-full mx-auto animate-fade-in">
        <div className="flex items-center gap-2 mb-6">
          <button type="button" onClick={handleTryExit} className="text-[13px] text-slate-500 hover:text-[#0F4C81] transition-colors font-extrabold flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-200">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Volver
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-1.5 h-5 bg-[#FFC107] rounded-full shadow-sm"></div>
              <span className="text-[14px] font-extrabold text-slate-800 uppercase tracking-widest">
                {esComprobante ? 'Información del Comprobante de Pago' : 'Información General'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
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
                  />
                </div>
                {validated && !formData.tipo_documento_id && (
                  <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2 animate-pulse">⚠️ Seleccione una opción</p>
                )}
              </div>

              {esComprobante ? (
                <>
                  <div className="md:col-span-3 lg:col-span-4">
                    <label htmlFor="numero_comprobante" className={labelStyles}>N° Comprobante de Pago *</label>
                    <input
                      id="numero_comprobante"
                      name="numero_expediente"
                      value={formData.numero_expediente}
                      placeholder="N° de Comprobante"
                      className={getInputStyles(formData.numero_expediente)}
                      onChange={e => handleInputChange('numero_expediente', e.target.value)}
                    />
                    {validated && !formData.numero_expediente.trim() && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2 animate-pulse">⚠️ Ingrese el número</p>
                    )}
                  </div>

                  <div className="md:col-span-3 lg:col-span-4">
                    <label htmlFor="fecha_comprobante" className={labelStyles}>Fecha *</label>
                    <input
                      id="fecha_comprobante"
                      name="fecha_ingreso"
                      type="date"
                      value={formData.fecha_ingreso}
                      className={getInputStyles(formData.fecha_ingreso)}
                      onChange={e => handleInputChange('fecha_ingreso', e.target.value)}
                    />
                    {validated && !formData.fecha_ingreso && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2 animate-pulse">⚠️ Ingrese la fecha</p>
                    )}
                  </div>

                  <div className="md:col-span-12 lg:col-span-6">
                    <label htmlFor="razon_social" className={labelStyles}>Nombre y Apellidos / RAZÓN SOCIAL *</label>
                    <input
                      id="razon_social"
                      name="razon_social"
                      value={formData.razon_social}
                      placeholder="Ingrese el nombre completo o la razón social de la empresa"
                      className={getInputStyles(formData.razon_social)}
                      onChange={e => handleInputChange('razon_social', e.target.value)}
                    />
                    {validated && !formData.razon_social.trim() && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2 animate-pulse">⚠️ Ingrese el interesado / razón social</p>
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
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2 animate-pulse">⚠️ Ingrese el monto total</p>
                    )}
                  </div>

                  <div className="md:col-span-6 lg:col-span-3">
                    <label htmlFor="registro_siaf" className={labelStyles}>Registro SIAF / CIAF *</label>
                    <input
                      id="registro_siaf"
                      name="registro_siaf"
                      value={formData.registro_siaf}
                      placeholder="N° Registro SIAF"
                      className={getInputStyles(formData.registro_siaf)}
                      onChange={e => handleInputChange('registro_siaf', e.target.value)}
                    />
                    {validated && !formData.registro_siaf.trim() && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2 animate-pulse">⚠️ Ingrese el código SIAF</p>
                    )}
                  </div>
                </>
              ) : (
                <>

                  <div className="md:col-span-3 lg:col-span-4">
                    <label htmlFor="numero_expediente" className={labelStyles}>Número de Expediente *</label>
                    <input
                      id="numero_expediente"
                      name="numero_expediente"
                      value={formData.numero_expediente}
                      placeholder="EXP-2026-XXXX"
                      className={getInputStyles(formData.numero_expediente)}
                      onChange={e => handleInputChange('numero_expediente', e.target.value)}
                    />
                    {validated && !formData.numero_expediente.trim() && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2 animate-pulse">⚠️ Ingrese el código</p>
                    )}
                  </div>

                  <div className="md:col-span-3 lg:col-span-4">
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
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2 animate-pulse">⚠️ Seleccione una fecha</p>
                    )}
                  </div>

                  <div className="md:col-span-12">
                    <label htmlFor="titulo" className={labelStyles}>Título del Expediente *</label>
                    <input
                      id="titulo"
                      name="titulo"
                      value={formData.titulo}
                      placeholder="Título completo del documento"
                      className={getInputStyles(formData.titulo)}
                      onChange={e => handleInputChange('titulo', e.target.value)}
                    />
                    {validated && !formData.titulo.trim() && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2 animate-pulse">⚠️ Ingrese el título del documento</p>
                    )}
                  </div>

                  <div className="md:col-span-12">
                    <label htmlFor="editor_descripcion" className={labelStyles}>Descripción / Asunto</label>
                    <div className="w-full border border-slate-200 rounded-2xl bg-slate-50 overflow-hidden focus-within:ring-4 focus-within:ring-slate-500/10 focus-within:border-slate-400 focus-within:bg-white transition-all duration-300 shadow-inner shadow-slate-100/50">
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

                  <div className="md:col-span-12 lg:col-span-6">
                    <label htmlFor="area_origen_id" className={labelStyles}>Área de origen *</label>
                    <div className={`rounded-2xl transition-all ${validated && !formData.area_origen_id ? 'ring-2 ring-rose-500 bg-rose-50/20' : ''}`}>
                      <CustomDropdown
                        id="area_origen_id"
                        name="area_origen_id"
                        placeholder="Seleccione área"
                        options={areas}
                        selectedValue={formData.area_origen_id}
                        onSelect={(val) => handleInputChange('area_origen_id', val)}
                      />
                    </div>
                    {validated && !formData.area_origen_id && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2 animate-pulse">⚠️ Seleccione una opción</p>
                    )}
                  </div>
                </>
              )}

              <div className="md:col-span-4 lg:col-span-2">
                <label htmlFor="area_actual" className={labelStyles}>Área Actual</label>
                <input id="area_actual" name="area_actual" type="text" value="Archivo Central" readOnly className={readOnlyStyles} />
              </div>

              <div className="md:col-span-4 lg:col-span-2">
                <label htmlFor="estado_documental" className={labelStyles}>Estado Documental</label>
                <input id="estado_documental" name="estado_documental" type="text" value="Activo" readOnly className={readOnlyStyles} />
              </div>

              <div className="md:col-span-4 lg:col-span-2">
                <label htmlFor="numero_folios" className={labelStyles}>N° Folios *</label>
                <input
                  id="numero_folios"
                  name="numero_folios"
                  type="number"
                  min="1"
                  placeholder="Ej. 10"
                  className={getInputStyles(formData.numero_folios)}
                  value={formData.numero_folios}
                  onChange={e => handleInputChange('numero_folios', e.target.value)}
                />
                {validated && !formData.numero_folios && (
                  <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2 animate-pulse">⚠️ Mín 1</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-5 bg-[#FFC107] rounded-full shadow-sm"></div>
                <span className="text-[14px] font-extrabold text-slate-800 uppercase tracking-widest">Clasificación y Conservación Documental *</span>
              </div>

              <button
                type="button"
                onClick={handlePermanenteToggle}
                className={`px-5 py-2.5 text-[12px] font-extrabold uppercase tracking-wide rounded-xl border transition-all duration-300 shadow-sm ${esPermanente ? 'bg-amber-500 text-white border-amber-500 shadow-[0_4px_15px_rgba(245,158,11,0.4)] hover:bg-amber-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                {esPermanente ? '✓ Documento Permanente' : '¿Documento Permanente?'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="tiempo_conservacion" className={labelStyles}>Tiempo de Conservación *</label>
                {esPermanente ? (
                  <input id="tiempo_conservacion" name="tiempo_conservacion" type="text" value="PERMANENTE (No se elimina)" readOnly className="w-full h-[48px] px-4 border border-amber-100 bg-amber-50/50 text-amber-800 font-extrabold rounded-2xl text-[13px] outline-none cursor-not-allowed shadow-inner flex items-center" />
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
                      />
                    </div>
                    {validated && !formData.tiempo_conservacion && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 ml-2 animate-pulse">⚠️ Seleccione una opción</p>
                    )}
                  </>
                )}
              </div>

              <div>
                <label htmlFor="fecha_revision" className={labelStyles}>Fecha de revisión</label>
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

          <div className="flex justify-end gap-4 pt-4 pb-8">
            <button type="button" onClick={handleTryExit} className="px-8 py-3.5 rounded-2xl border-2 border-slate-200 text-[13px] font-bold text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
              Cancelar
            </button>
            <button type="submit" className="px-8 py-3.5 rounded-2xl font-bold text-white text-[13px] uppercase tracking-widest bg-gradient-to-r from-[#0F4C81] to-blue-700 shadow-[0_8px_20px_-6px_rgba(15,76,129,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(15,76,129,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
              Guardar Expediente
            </button>
          </div>
        </form>
      </div>

      {showExitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden transform scale-100 transition-all">
            <div className="h-2 w-full bg-[#FFC107]"></div>
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-5 shadow-inner">
                <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2 tracking-tight">¿Seguro que deseas salir?</h3>
              <p className="text-[13px] text-slate-500 px-2 leading-relaxed font-medium">Tienes datos rellenados en este formulario. Si sales ahora, perderás todos los cambios realizados.</p>
            </div>
            <div className="bg-slate-50/50 px-6 py-5 flex flex-col sm:flex-row justify-center gap-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowExitModal(false)} className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 bg-white hover:bg-slate-50 hover:shadow-sm transition-all order-2 sm:order-1">
                No, continuar
              </button>
              <button type="button" onClick={() => { setShowExitModal(false); setIsDirty(false); setScreen(pendingScreen || { name: 'dashboard', id: null }); }} className="w-full sm:w-auto px-5 py-3 rounded-xl text-white text-[13px] font-bold bg-[#0F4C81] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all order-1 sm:order-2">
                Sí, salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden transform scale-100 transition-all">
            <div className="h-2 w-full bg-rose-500"></div>
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-5 shadow-inner">
                <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2 tracking-tight">Código Duplicado</h3>
              <p className="text-[13px] text-slate-500 px-3 leading-relaxed font-medium">{duplicateMessage}</p>
            </div>
            <div className="bg-slate-50/50 px-6 py-5 flex justify-center border-t border-slate-100">
              <button type="button" onClick={() => setShowDuplicateModal(false)} className="w-full px-5 py-3 text-white text-[13px] font-bold rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-center">
                Entendido, corregir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}