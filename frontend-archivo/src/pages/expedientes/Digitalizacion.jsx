import { useState, useEffect, useRef, useMemo } from 'react';
import { useExpedientes } from '../../context/useExpedientes';
import api from '../../services/api';
import { PDFDocument } from 'pdf-lib';
import { Chart } from 'chart.js/auto';

export default function DigitalizacionScreen({ triggerToast }) {
  // --- CONSUMO DE ESTADO GLOBAL MEDIANTE CONTEXTO CENTRALIZADO ---
  const { expedientes: dataGlobal, refrescarData } = useExpedientes();
  const expedientes = useMemo(() => dataGlobal || [], [dataGlobal]);

  // --- ESTADOS DE CONTROL DE PAGINACIÓN Y CONTROL FILTRADO ---
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // --- ESTADOS DE GESTIÓN Y CARGA DE NUEVOS ARCHIVOS LOCALES ---
  const [selectedExpId, setSelectedExpId] = useState('');
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // --- CONTROL DE VENTANAS MODALES DE ADVERTENCIA Y ELIMINACIÓN ---
  const [showSizeLimitModal, setShowSizeLimitModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFileToDelete, setSelectedFileToDelete] = useState(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingExpId, setPendingExpId] = useState(null);

  // --- ESTADO PARA CONTROL DE DISCREPANCIA DE FOLIOS (AUDITORÍA PDF) ---
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [mismatchData, setMismatchData] = useState({ filename: '', expected: 0, actual: 0 });

  // --- GESTOR DE VISUALIZACIÓN Y ACCIÓN DE ARCHIVOS EXISTENTES ---
  const [gestorModal, setGestorModal] = useState({ isOpen: false, expId: null, code: '', archivos: [], isLoading: false });

  // --- CONTROL DEL COMPONENTE SELECTOR DE BÚSQUEDA INTEGRADO ---
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [busquedaSelect, setBusquedaSelect] = useState('');
  const selectContainerRef = useRef(null);

  // --- REFERENCIAS PARA RENDERIZADO REACTIVO DE GRÁFICOS (CHART.JS) ---
  const chartAvanceRef = useRef(null);
  const instanceAvanceRef = useRef(null);

  // ==========================================================================
  // CICLOS DE VIDA INTERNOS (EFFECTS)
  // ==========================================================================

  // Hook Effect: Previene la pérdida accidental de datos si hay PDFs cargados sin subir al servidor
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (files.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [files]);

  // Hook Effect: Cierra el menú desplegable del buscador de expedientes al hacer clic fuera del nodo
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectContainerRef.current && !selectContainerRef.current.contains(event.target)) {
        setIsSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hook Effect: Resetea de forma asíncrona la paginación de la tabla al ingresar un nuevo término de búsqueda
  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentPage(1);
    }, 0);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  // ==========================================================================
  // FUNCIONES AUXILIARES Y CÓMPUTO DE DATASET
  // ==========================================================================

  // Parser preventivo: Evita rupturas en renders de objetos complejos o nulos devolviendo strings planos
  const safeText = (value, fallback = 'General') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object') return value.nombre || value.descripcion || fallback;
    return fallback;
  };

  // Motor de Análisis: Cómputo matemático de métricas de almacenamiento, porcentajes y estructuración de listas
  const metricasYListas = useMemo(() => {
    const digitalizados = expedientes.filter(e => e.digitalizado === 1 || e.digitalizado === true);
    const pendientes = expedientes.filter(e => e.digitalizado === 0 || e.digitalizado === false || !e.digitalizado);

    const porcentaje = expedientes.length === 0 ? 0 : Math.round((digitalizados.length / expedientes.length) * 100);

    // Sumatoria iterativa del peso total consumido en disco por los expedientes
    let totalBytes = expedientes.reduce((acc, exp) => {
      let size = 0;
      if (exp.archivos && Array.isArray(exp.archivos)) {
        size = exp.archivos.reduce((sum, a) => sum + (a.tamano_bytes || 0), 0);
      } else if (exp.tamano_total_bytes) {
        size = exp.tamano_total_bytes;
      }
      return acc + size;
    }, 0);

    // Estimador de respaldo: Si no hay tamaños registrados calcula un promedio ponderado de 1.85 MB por PDF
    let bytesFinales = totalBytes;
    if (totalBytes === 0 && digitalizados.length > 0) {
      bytesFinales = digitalizados.length * 1.85 * 1024 * 1024;
    }

    // Conversor binario de almacenamiento para optimizar la legibilidad en la interfaz
    const formatearAlmacenamiento = (bytes) => {
      if (bytes === 0) return { valor: '0.00', unidad: 'MB' };
      const k = 1024;
      const unidades = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

      let i = Math.floor(Math.log(bytes) / Math.log(k));
      if (i < 2) i = 2; // Fuerza visualización mínima en MB

      const valor = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
      return { valor, unidad: unidades[i] };
    };

    const almacenamiento = formatearAlmacenamiento(bytesFinales);

    // Mapeo estructurado para alimentar el dropdown selector personalizado
    const opcionesDropdown = pendientes.map(exp => ({
      id: exp.id,
      numero: safeText(exp.numero_expediente, 'S/N'),
      titulo: safeText(exp.titulo, 'Sin título'),
      area: safeText(exp.area_origen || exp.area_origen_id, 'Área no especificada')
    }));

    return {
      digitalizados,
      pendientes,
      porcentaje,
      almacenamiento,
      opcionesDropdown
    };
  }, [expedientes]);

  const { digitalizados, pendientes, porcentaje, almacenamiento, opcionesDropdown } = metricasYListas;

  // Filtrado reactivo de la tabla principal de documentos ya digitalizados
  const tablaFiltrada = useMemo(() => {
    return digitalizados.filter(e => {
      const numExp = safeText(e.numero_expediente, '').toLowerCase();
      const tituloExp = safeText(e.titulo, '').toLowerCase();
      const termino = searchTerm.toLowerCase();
      return numExp.includes(termino) || tituloExp.includes(termino);
    });
  }, [digitalizados, searchTerm]);

  // Filtrado reactivo en caliente de los elementos pertenecientes al dropdown de búsqueda
  const opcionesFiltradas = useMemo(() => {
    return opcionesDropdown.filter(opt =>
      opt.numero.toLowerCase().includes(busquedaSelect.toLowerCase()) ||
      opt.titulo.toLowerCase().includes(busquedaSelect.toLowerCase()) ||
      opt.area.toLowerCase().includes(busquedaSelect.toLowerCase())
    );
  }, [opcionesDropdown, busquedaSelect]);

  // Segmentación matemática de registros para bloques de paginación
  const totalPages = Math.ceil(tablaFiltrada.length / ITEMS_PER_PAGE);
  const currentData = tablaFiltrada.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ==========================================================================
  // INTEGRACIÓN REACTIVA CON EL COMPONENTE CHART.JS
  // ==========================================================================
  useEffect(() => {
    if (!chartAvanceRef.current) return;

    if (instanceAvanceRef.current) {
      instanceAvanceRef.current.destroy();
      instanceAvanceRef.current = null;
    }

    const ctx = chartAvanceRef.current.getContext('2d');

    instanceAvanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Digitalizados', 'Restantes en Físico'],
        datasets: [{
          data: [digitalizados.length, pendientes.length],
          backgroundColor: ['#10b981', '#f1f5f9'],
          borderWidth: 0,
          hoverOffset: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '85%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        }
      }
    });

    return () => {
      if (instanceAvanceRef.current) {
        instanceAvanceRef.current.destroy();
        instanceAvanceRef.current = null;
      }
    };
  }, [digitalizados, pendientes]);

  // ==========================================================================
  // MANEJADORES DE LOGICA DE NEGOCIO Y CONTROLADORES EVENTOS
  // ==========================================================================

  // Evalúa cambios en el select disparando alertas si existen archivos pendientes en cola de subida
  const handleDropdownChange = (val) => {
    if (files.length > 0) {
      setPendingExpId(val);
      setShowWarningModal(true);
    } else {
      setSelectedExpId(val);
    }
  };

  // Resetea cola de archivos locales y confirma cambio de expediente objetivo
  const confirmarCambio = () => {
    setFiles([]);
    setSelectedExpId(pendingExpId);
    setShowWarningModal(false);
    setPendingExpId(null);
  };

  const cancelarCambio = () => {
    setShowWarningModal(false);
    setPendingExpId(null);
  };

  // Procesador binario y auditoría estructural de PDFs cargados mediante API nativa del navegador
  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    // Validación preventiva: Sanitización exclusiva de formato pdf
    const validPdfs = selectedFiles.filter(f => f.type === 'application/pdf');
    if (validPdfs.length !== selectedFiles.length) {
      if (typeof triggerToast === 'function') triggerToast("⚠️ Solo se permiten archivos PDF.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validación de peso acumulado en memoria de carga: Límite estricto de 5.00 MB
    const pesoActual = files.reduce((acc, f) => acc + f.size, 0);
    const pesoNuevo = validPdfs.reduce((acc, f) => acc + f.size, 0);
    const limite5MB = 5 * 1024 * 1024;

    if (pesoActual + pesoNuevo > limite5MB) {
      setShowSizeLimitModal(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const expedienteSeleccionado = expedientes.find(exp => exp.id === selectedExpId);
    const foliosRegistrados = parseInt(expedienteSeleccionado?.numero_folios) || 0;

    // Bucle de auditoría avanzada: Lee el binario del PDF para comprobar la consistencia entre páginas físicas y folios en ficha
    for (const file of validPdfs) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const numPages = pdfDoc.getPageCount();

        if (numPages !== foliosRegistrados) {
          setMismatchData({
            filename: file.name,
            expected: foliosRegistrados,
            actual: numPages
          });
          setShowMismatchModal(true);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
      } catch (error) {
        console.error("Error al auditar el PDF:", error);
        alert(`No se pudo auditar la estructura del archivo ${file.name}.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }
    setFiles(prev => [...prev, ...validPdfs]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (indexToRemove) => setFiles(prev => prev.filter((_, i) => i !== indexToRemove));

  // Despliegue de payload multipart/form-data al endpoint del servidor remoto
  const handleUpload = async () => {
    if (!selectedExpId || files.length === 0) return;
    setIsUploading(true);
    try {
      for (const archivoFisico of files) {
        const formData = new FormData();
        formData.append('archivo', archivoFisico);
        await api.post(`/expedientes/${selectedExpId}/archivos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      if (typeof triggerToast === 'function') triggerToast(`¡${files.length} documento(s) digitalizado(s) con éxito!`);
      setFiles([]);
      setSelectedExpId('');
      setBusquedaSelect('');
      refrescarData();
    } catch {
      alert("Error al subir los archivos al servidor.");
    } finally {
      setIsUploading(false);
    }
  };

  // Abre el panel interno de control de documentos vinculados a un expediente
  const abrirGestor = async (expId, expCode) => {
    const localExp = expedientes.find(e => e.id === expId);
    if (localExp && localExp.archivos && localExp.archivos.length > 0) {
      setGestorModal({ isOpen: true, expId, code: expCode, archivos: localExp.archivos, isLoading: false });
      return;
    }

    setGestorModal({ isOpen: true, expId, code: expCode, archivos: [], isLoading: true });
    try {
      const res = await api.get(`/expedientes/${expId}/archivos`);
      setGestorModal(prev => ({ ...prev, archivos: res.data.archivos || [], isLoading: false }));
    } catch {
      setGestorModal(prev => ({ ...prev, isLoading: false }));
      alert("No se pudieron cargar los documentos.");
    }
  };

  // Ejecutor centralizado de operaciones CRUD y de visualización sobre archivos binarios existentes
  const ejecutarAccionPDF = async (fileTarget, action) => {
    try {
      // Acción 'ver': Consume el binario como Blob de lectura e inyecta un iframe dinámico aislado
      if (action === 'ver') {
        const res = await api.get(`/expedientes/${gestorModal.expId}/archivos/${fileTarget.id}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const nuevaVentana = window.open('', '_blank');
        if (nuevaVentana) {
          nuevaVentana.document.write(`
            <html>
              <head>
                <title>${fileTarget.nombre_original || 'Documento.pdf'}</title>
                <style>
                  body { margin: 0; padding: 0; background-color: #2f3542; overflow: hidden; }
                  iframe { border: none; width: 100vw; height: 100vh; }
                </style>
              </head>
              <body>
                <iframe src="${url}"></iframe>
              </body>
            </html>
          `);
          nuevaVentana.document.close();
        }
      }
      // Acción 'descargar': Genera de forma programática un nodo trigger de descarga en el DOM
      if (action === 'descargar') {
        const res = await api.get(`/expedientes/${gestorModal.expId}/archivos/${fileTarget.id}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileTarget.nombre_original);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      // Acción 'eliminar': Configura referencias y despliega confirmación de borrado
      if (action === 'eliminar') {
        setSelectedFileToDelete({ id: fileTarget.id, nombre_original: fileTarget.nombre_original, expId: gestorModal.expId });
        setShowDeleteModal(true);
      }
    } catch {
      alert("Hubo un problema de conexión al intentar acceder al archivo.");
    }
  };

  // Confirmación final y purga destructiva de un archivo del disco duro mediante llamada de API
  const confirmarEliminacion = async () => {
    if (!selectedFileToDelete) return;
    try {
      setIsDeletingFile(true);
      await api.delete(`/expedientes/${selectedFileToDelete.expId}/archivos/${selectedFileToDelete.id}`);

      if (typeof triggerToast === 'function') triggerToast('¡Archivo removido exitosamente!');
      setGestorModal(prev => ({ ...prev, archivos: prev.archivos.filter(f => f.id !== selectedFileToDelete.id) }));
      setShowDeleteModal(false);
      setSelectedFileToDelete(null);
      refrescarData();
    } catch {
      alert("Error del servidor: No se pudo eliminar el documento.");
    } finally {
      setIsDeletingFile(false);
    }
  };

  // Helpers de métricas locales para control inmediato de UI en la cola de carga
  const pesoTotalMB = (files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2);
  const limiteCasiLleno = pesoTotalMB > 4.5;

  // ==========================================================================
  // RENDERIZADO DEL COMPONENTE VISTA INTERFAZ
  // ==========================================================================
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8 relative selection:bg-blue-200 selection:text-blue-900 pb-24 text-left">
      <div className="max-w-screen-xl mx-auto animate-fade-in">

        {/* --- CABECERA PRINCIPAL --- */}
        <div className="relative overflow-hidden bg-gradient-to-r from-lime-500/15 via-lime-100/40 to-transparent p-6 sm:px-8 sm:py-6 rounded-3xl border border-lime-200/60 shadow-[0_4px_25px_rgb(0,0,0,0.01)] flex items-center gap-4 mb-8 z-40">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-30 blur-xl bg-lime-300 pointer-events-none"></div>
          <div className="w-10 h-10 rounded-xl bg-lime-500/15 border border-lime-200/50 flex items-center justify-center text-lime-700 relative z-10 shadow-sm shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div className="flex flex-col relative z-10 text-left">
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Digitalización</h1>
            <span className="text-[11px] font-black text-lime-800 mt-1.5 uppercase tracking-wider">Asociación y almacenamiento de Documentos</span>
          </div>
        </div>

        {/* --- PANEL PRINCIPAL DE TRABAJO --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-stretch">

          {/* SECCIÓN IZQUIERDA: Selector Buscador y Zona de Carga Drag and Drop */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-1.5 h-5 bg-emerald-600 rounded-full shadow-sm"></div>
                <h3 className="text-[14px] font-extrabold text-slate-800 uppercase tracking-widest">Asociar Archivo Digital</h3>
              </div>

              {/* INPUT BUSCADOR ESTRUCTURADO CON LISTADO PENDIENTES */}
              <div className="mb-6 relative z-30" ref={selectContainerRef}>
                <label className="block text-[11px] font-extrabold text-slate-500 mb-2 tracking-widest uppercase">
                  Documento Físico a Digitalizar *
                </label>

                <div className={`w-full border rounded-2xl bg-slate-50 overflow-hidden transition-all duration-300 ${isSelectOpen ? 'border-emerald-600 ring-4 ring-emerald-600/10 bg-white shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-white'}`}>
                  <div className="flex items-center px-4 h-[48px]">
                    <span className="text-slate-400 mr-3">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </span>
                    <input
                      type="text"
                      className="w-full h-full bg-transparent text-[13px] font-semibold text-slate-700 outline-none placeholder-slate-400"
                      placeholder="Buscar por N° Expediente, Documento, Título o Área..."
                      value={isSelectOpen ? busquedaSelect : (selectedExpId ? opcionesDropdown.find(o => o.id === selectedExpId)?.numero + ' — ' + opcionesDropdown.find(o => o.id === selectedExpId)?.titulo : '')}
                      onChange={(e) => {
                        setBusquedaSelect(e.target.value);
                        setIsSelectOpen(true);
                        if (selectedExpId) setSelectedExpId('');
                      }}
                      onClick={() => setIsSelectOpen(true)}
                    />
                    {selectedExpId && !isSelectOpen && (
                      <button type="button" onClick={() => setSelectedExpId('')} className="text-slate-400 hover:text-rose-500 ml-2 p-1 transition-colors">
                        ✕
                      </button>
                    )}
                    <button type="button" onClick={() => setIsSelectOpen(!isSelectOpen)} className="text-slate-400 hover:text-emerald-600 ml-2 p-1 transition-colors">
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                </div>

                {/* MENÚ FLOTANTE: Resultados filtrados de documentos pendientes */}
                {isSelectOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] max-h-[300px] overflow-y-auto py-2 z-50 animate-fade-in scrollbar-hide">
                    <div className="px-4 pb-2 mb-2 border-b border-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      {opcionesFiltradas.length} resultados pendientes
                    </div>
                    {opcionesFiltradas.length > 0 ? (
                      opcionesFiltradas.map(opt => (
                        <div
                          key={opt.id}
                          onClick={() => {
                            handleDropdownChange(opt.id);
                            setIsSelectOpen(false);
                            setBusquedaSelect('');
                          }}
                          className={`px-5 py-3 cursor-pointer transition-all border-l-2 border-transparent hover:border-emerald-600 hover:bg-emerald-50/30 group ${selectedExpId === opt.id ? 'bg-blue-50 border-[#0F4C81]' : ''}`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0">
                              <p className="text-[13px] font-black text-[#0F4C81] truncate">{opt.numero}</p>
                              <p className="text-[12px] font-semibold text-slate-600 truncate mt-0.5 group-hover:text-slate-800" title={opt.titulo}>{opt.titulo}</p>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest truncate">{opt.area}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-5 py-10 text-center flex flex-col items-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3"><span className="text-xl opacity-50">📭</span></div>
                        <p className="text-[13px] font-extrabold text-slate-600">No se encontraron expedientes</p>
                        <p className="text-[11px] font-medium text-slate-400 mt-1">Prueba buscando con otro término o área.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CONTENEDOR INPUT FILE: Área de arrastre de archivos con candado lógico */}
              <div className={`relative p-8 rounded-3xl border-2 transition-all duration-300 ${!selectedExpId ? 'border-dashed border-slate-200 bg-slate-50/40 opacity-80' : (files.length > 0 ? 'border-solid border-emerald-400 bg-emerald-50/50' : 'border-dashed border-slate-300 bg-slate-50/50 hover:bg-white hover:border-emerald-600 z-10')}`}>
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  disabled={!selectedExpId}
                />

                {!selectedExpId ? (
                  <div className="flex flex-col items-center justify-center w-full h-full min-h-[140px] select-none">
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center shadow-sm mb-4">
                      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <p className="text-[14px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Carga Bloqueada</p>
                    <p className="text-[11px] font-semibold text-slate-400 text-center px-4">Seleccione primero un documento en el buscador superior para habilitar la digitalización.</p>
                  </div>
                ) : files.length === 0 ? (
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full min-h-[140px]">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_2px_15px_rgba(16,185,129,0.08)] mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-[14px] font-bold text-slate-600 mb-1">Haga clic o arrastre sus PDFs aquí</p>
                    <p className="text-[11px] font-semibold text-slate-400">Auditoría automática de folios activa. Límite: 5.00 MB</p>
                  </label>
                ) : (
                  <div className="flex flex-col w-full animate-fade-in">
                    <div className="w-full max-h-[180px] overflow-y-auto space-y-3 pr-2 mb-4 scrollbar-hide">
                      {files.map((f, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-emerald-100 shadow-[0_2px_10px_rgba(16,185,129,0.05)] animate-fade-in">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="flex flex-col">
                              <p className="text-[12px] font-extrabold text-slate-700 truncate max-w-[180px] sm:max-w-[300px]" title={f.name}>{f.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{(f.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button type="button" onClick={() => removeFile(i)} className="w-8 h-8 flex items-center justify-center text-rose-400 hover:text-white hover:bg-rose-500 rounded-xl transition-all shadow-sm">✕</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center w-full pt-4 border-t border-emerald-100">
                      <p className={`text-[12px] font-black ${limiteCasiLleno ? 'text-rose-500' : 'text-emerald-700'}`}>
                        Total: {pesoTotalMB} / 5.00 MB
                      </p>
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white px-4 py-2 rounded-xl transition-colors duration-300"
                      >
                        + Agregar más
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BOTÓN DISPARADOR DE CARGA MULTIPART HACIA EL SERVIDOR */}
            <div className="mt-4 flex justify-end relative z-10">
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading || files.length === 0 || !selectedExpId}
                className={`h-[48px] px-8 rounded-2xl text-white text-[13px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${isUploading || files.length === 0 || !selectedExpId
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-[0_8px_20px_-6px_rgba(16,185,129,0.4)] hover:shadow-lg hover:-translate-y-0.5'
                  }`}
              >
                {isUploading ? 'Procesando...' : `Subir ${files.length} documento(s)`}
              </button>
            </div>
          </div>

          {/* SECCIÓN DERECHA: Grid de KPIs Avanzados y Gráfico Doughnut Analítico */}
          <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-1.5 h-5 bg-emerald-600 rounded-full shadow-sm"></div>
                <h3 className="text-[14px] font-extrabold text-slate-800 uppercase tracking-widest">Resumen General</h3>
              </div>

              {/* SUB-GRID: Tarjetas analíticas de volumen y almacenamiento */}
              <div className="grid grid-cols-2 gap-4">
                {/* KPI: Total Expedientes */}
                <div className="relative overflow-hidden bg-gradient-to-r from-blue-500/10 via-blue-50/30 to-transparent p-4 rounded-2xl border border-blue-100/60 shadow-[0_4px_20px_rgba(59,130,246,0.01)] flex items-center justify-between h-[82px]">
                  <div className="absolute -right-4 -top-4 w-16 h-12 rounded-full opacity-10 blur-xl bg-blue-300 pointer-events-none"></div>
                  <div className="flex flex-col text-left justify-center h-full min-w-0">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-wider leading-tight mb-1 truncate">Total Doc.</span>
                    <span className="font-black text-xl text-blue-700 tracking-tight leading-none">{expedientes.length}</span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-[0_2px_8px_rgba(59,130,246,0.06)] border border-blue-50 shrink-0 ml-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                </div>

                {/* KPI: Digitalizados con archivo */}
                <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500/10 via-emerald-50/30 to-transparent p-4 rounded-2xl border border-emerald-100/60 shadow-[0_4px_20px_rgba(16,185,129,0.01)] flex items-center justify-between h-[82px]">
                  <div className="absolute -right-4 -top-4 w-16 h-12 rounded-full opacity-10 blur-xl bg-emerald-300 pointer-events-none"></div>
                  <div className="flex flex-col text-left justify-center h-full min-w-0">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider leading-tight mb-1 truncate">Digitalizados</span>
                    <span className="font-black text-xl text-emerald-700 tracking-tight leading-none">{digitalizados.length}</span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-[0_2px_8px_rgba(16,185,129,0.06)] border border-emerald-50 shrink-0 ml-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                {/* KPI: Restantes en Físico */}
                <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-amber-50/30 to-transparent p-4 rounded-2xl border border-amber-100/60 shadow-[0_4px_20px_rgba(245,158,11,0.01)] flex items-center justify-between h-[82px]">
                  <div className="absolute -right-4 -top-4 w-16 h-12 rounded-full opacity-10 blur-xl bg-amber-300 pointer-events-none"></div>
                  <div className="flex flex-col text-left justify-center h-full min-w-0">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider leading-tight mb-1 truncate">En Físico</span>
                    <span className="font-black text-xl text-amber-700 tracking-tight leading-none">{pendientes.length}</span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-amber-600 shadow-[0_2px_8px_rgba(245,158,11,0.06)] border border-amber-50 shrink-0 ml-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-16.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-16.25v14.25" />
                    </svg>
                  </div>
                </div>

                {/* KPI: Peso total en Almacén Digital */}
                <div className="relative overflow-hidden bg-gradient-to-r from-purple-500/10 via-purple-50/30 to-transparent p-4 rounded-2xl border border-purple-100/60 shadow-[0_4px_20px_rgba(147,51,234,0.01)] flex items-center justify-between h-[82px]">
                  <div className="absolute -right-4 -top-4 w-16 h-12 rounded-full opacity-10 blur-xl bg-purple-300 pointer-events-none"></div>
                  <div className="flex flex-col text-left justify-center h-full min-w-0">
                    <span className="text-[10px] font-black text-purple-500 uppercase tracking-wider leading-tight mb-1 truncate">Almacén</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="font-black text-xl text-purple-700 tracking-tight leading-none">
                        {almacenamiento.valor}
                      </span>
                      <span className="text-[10px] font-bold text-purple-400">
                        {almacenamiento.unidad}
                      </span>
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-purple-600 shadow-[0_2px_8px_rgba(147,51,234,0.06)] border border-purple-50 shrink-0 ml-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75" />
                    </svg>
                  </div>
                </div>

              </div>
            </div>

            {/* CANVAS INTERNO: Renderizado de Dona de Cobertura */}
            <div className="mt-2 flex flex-col items-center">
              <div className="relative w-full h-[140px] flex items-center justify-center">
                <canvas ref={chartAvanceRef}></canvas>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-2xl font-black text-slate-800 leading-none">{porcentaje}%</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Cobertura</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- TABLA DE EXPEDIENTES COMPILADOS --- */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col relative z-0">
          <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/60 border border-emerald-100/80 rounded-xl text-[11px] font-bold text-emerald-700 uppercase tracking-wider shadow-sm select-none">
                <span className="font-black text-emerald-800 text-[11px]">{tablaFiltrada.length}</span>
                REGISTROS
              </span>
            </div>

            <div className="relative w-full sm:w-72 group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[48px] px-4 pl-11 border border-slate-200 bg-white rounded-2xl text-[13px] focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 outline-none transition-all duration-300 font-semibold text-slate-700 placeholder-slate-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto w-full [scrollbar-width:thin]">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest select-none bg-white">
                  <th className="p-5 px-8 text-center w-[210px]">N° Exp / Doc</th>
                  <th className="p-5 px-4 text-center">Título</th>
                  <th className="p-5 px-4 text-center w-[160px]">Clasificación</th>
                  <th className="p-5 px-4 text-center w-[90px]">Folios</th>
                  <th className="p-5 px-8 text-center w-[220px]">Gestión Documental</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[13px]">
                {currentData.length > 0 ? (
                  currentData.map((d) => (
                    <tr key={d.id} className="hover:bg-blue-50/40 transition-colors h-[72px]">
                      <td className="p-5 px-8 text-center font-black text-[#0F4C81] tracking-wide whitespace-nowrap">{safeText(d.numero_expediente, 'S/N')}</td>

                      <td className="p-5 px-4 text-center font-extrabold text-slate-800 text-[12px] max-w-[260px] truncate" title={safeText(d.titulo, '')}>
                        {safeText(d.titulo, 'Sin título')}
                      </td>

                      <td className="p-5 px-4 text-center text-slate-500 font-bold truncate lowercase first-letter:uppercase">{safeText(d.tipo_documento || d.tipoDocumento, 'General')}</td>
                      <td className="p-5 px-4 text-center text-slate-500 font-black whitespace-nowrap">{safeText(d.numero_folios, '0')}</td>
                      <td className="p-5 px-8 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => abrirGestor(d.id, safeText(d.numero_expediente, 'S/N'))}
                          className="flex items-center justify-center gap-2 px-4 py-2 mx-auto text-[11px] uppercase tracking-wider rounded-xl bg-slate-50 text-slate-600 border border-slate-200 hover:bg-[#0F4C81] hover:text-white hover:border-[#0F4C81] font-extrabold transition-all shadow-sm"
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                          Ver Archivos
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-12 text-center bg-slate-50/30 h-[200px]">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3"><span className="text-xl opacity-50">📭</span></div>
                      <p className="text-slate-500 font-extrabold text-[13px]">No se encontraron expedientes digitalizados</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- CAPA DE PAGINACIÓN FLOTANTE CONTROLADA --- */}
        {totalPages > 1 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 p-2 px-6 flex justify-between items-center bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all z-40 w-max min-w-[320px]">
            <span className="text-[12px] text-slate-500 font-extrabold tracking-widest uppercase mr-8">
              Pág. <span className="text-[#0F4C81] text-[14px]">{currentPage}</span> / {totalPages}
            </span>
            <div className="flex gap-2">
              <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 disabled:opacity-40 hover:bg-slate-50 hover:text-[#0F4C81] transition-all shadow-sm">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="w-10 h-10 flex items-center justify-center bg-[#0F4C81] text-white rounded-xl disabled:opacity-50 hover:bg-blue-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* ==========================================================================
            COMPONENTES MODALES
            ========================================================================== */}

        {/* MODAL: Alerta Preventiva por Fallas de Auditoría entre Páginas de PDF y Ficha */}
        {showMismatchModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden transform scale-100 transition-all">
              <div className="h-2 w-full bg-rose-500"></div>
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2 tracking-tight">Discrepancia Documental</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed font-medium mb-4">
                  El archivo <span className="font-extrabold text-slate-700 truncate block max-w-[250px] mx-auto mt-1 mb-1">"{mismatchData.filename}"</span>
                  no coincide con los metadatos registrados.
                </p>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Folios en Ficha:</span>
                    <span className="text-[14px] font-black text-rose-500">{mismatchData.expected}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Páginas del PDF:</span>
                    <span className="text-[14px] font-black text-rose-500">{mismatchData.actual}</span>
                  </div>
                </div>
                <p className="text-[11px] font-bold text-rose-400 mt-4 px-2">Carga abortada automáticamente por seguridad.</p>
              </div>
              <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex justify-center">
                <button type="button" onClick={() => setShowMismatchModal(false)} className="w-full px-5 py-3.5 rounded-xl text-white text-[13px] font-bold uppercase tracking-widest bg-gradient-to-r from-rose-500 to-rose-600 shadow-md hover:-translate-y-0.5 transition-all">Entendido</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL GESTOR: Listado de Archivos del Servidor e Inyección de Blobs de Lectura */}
        {gestorModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Documentos Adjuntos</h3>
                  <p className="text-[12px] text-slate-500 font-bold mt-1 uppercase tracking-wider">Ref: <span className="text-[#0F4C81]">{gestorModal.code}</span></p>
                </div>
                <button onClick={() => setGestorModal({ isOpen: false, expId: null, code: '', archivos: [], isLoading: false })} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 bg-[#F8FAFC]">
                {gestorModal.isLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#0F4C81] mb-4"></div>
                    <div className="text-slate-400 text-[12px] font-bold uppercase tracking-widest animate-pulse">Cargando documentos desde el servidor...</div>
                  </div>
                ) : gestorModal.archivos.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-white">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><span className="text-2xl opacity-50">📭</span></div>
                    <p className="text-[14px] font-extrabold text-slate-600">No existen documentos disponibles</p>
                    <p className="text-[12px] text-slate-400 font-medium mt-1">Este expediente aún no contiene archivos PDF adjuntos.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {gestorModal.archivos.map(file => (
                      <div key={file.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-4 overflow-hidden w-full sm:w-auto">
                          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="text-[13px] font-extrabold text-slate-800 truncate" title={file.nombre_original}>{file.nombre_original}</p>
                            <p className="text-[11px] font-bold text-slate-400 mt-1">
                              Peso: {(file.tamano_bytes / (1024 * 1024)).toFixed(2)} MB <span className="mx-1">•</span> Subido: {new Date(file.uploaded_at).toLocaleDateString('es-PE')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end border-t border-slate-50 pt-3 sm:border-0 sm:pt-0">
                          <button type="button" onClick={() => ejecutarAccionPDF(file, 'ver')} className="px-4 py-2 text-[11px] uppercase tracking-wider rounded-xl bg-blue-50 text-[#0F4C81] border border-blue-100 font-extrabold hover:bg-[#0F4C81] hover:text-white transition-all shadow-sm">
                            Ver PDF
                          </button>
                          <button type="button" onClick={() => ejecutarAccionPDF(file, 'descargar')} className="px-4 py-2 text-[11px] uppercase tracking-wider rounded-xl bg-white text-slate-600 border border-slate-200 font-extrabold hover:bg-slate-50 transition-all shadow-sm">
                            Descargar
                          </button>
                          <button type="button" onClick={() => ejecutarAccionPDF(file, 'eliminar')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Alerta Exceso de Peso de Carga Local (5.00 MB Máx) */}
        {showSizeLimitModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden transform scale-100 transition-all">
              <div className="h-2 w-full bg-amber-500"></div>
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2 tracking-tight">Límite Excedido</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed px-2 font-medium">La suma de los archivos seleccionados excede el límite permitido de <span className="font-bold text-slate-700">5.00 MB</span>.</p>
              </div>
              <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex justify-center">
                <button type="button" onClick={() => setShowSizeLimitModal(false)} className="w-full px-5 py-3.5 rounded-xl text-white text-[13px] font-bold uppercase tracking-widest bg-amber-500 shadow-md hover:-translate-y-0.5 transition-all">Aceptar y Entendido</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Confirmación de purga destructiva de archivos del Servidor */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden transform scale-100 transition-all">
              <div className="h-2 w-full bg-rose-500"></div>
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2 tracking-tight">¿Desea eliminar este PDF?</h3>
                <p className="text-[13px] text-slate-500 px-3 leading-relaxed font-medium">El documento <span className="font-bold text-slate-700">"{selectedFileToDelete?.nombre_original}"</span> se borrará de forma permanente.</p>
              </div>
              <div className="bg-slate-50/50 px-6 py-5 flex flex-col sm:flex-row justify-center gap-3 border-t border-slate-100">
                <button type="button" disabled={isDeletingFile} onClick={() => { setShowDeleteModal(false); setSelectedFileToDelete(null); }} className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all order-2 sm:order-1">No, mantener</button>
                <button type="button" disabled={isDeletingFile} onClick={confirmarEliminacion} className="w-full sm:w-auto px-5 py-3 rounded-xl text-white text-[13px] font-bold bg-rose-600 shadow-md hover:bg-rose-700 transition-all order-1 sm:order-2">{isDeletingFile ? 'Removiendo...' : 'Sí, confirmar'}</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Advertencia de cambio de expediente con cola activa en memoria */}
        {showWarningModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden transform scale-100 transition-all">
              <div className="h-2 w-full bg-amber-500"></div>
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5 shadow-inner border border-amber-100">
                  <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2 tracking-tight">Archivos sin subir</h3>
                <p className="text-[13px] text-slate-500 px-3 leading-relaxed font-medium">Tienes documentos seleccionados que aún no has subido. Si cambias de documento ahora, <span className="font-bold text-slate-700">se perderán</span>.</p>
              </div>
              <div className="bg-slate-50/50 px-6 py-5 flex flex-col sm:flex-row justify-center gap-3 border-t border-slate-100">
                <button type="button" onClick={cancelarCambio} className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all order-2 sm:order-1">No, cancelar</button>
                <button type="button" onClick={confirmarCambio} className="w-full sm:w-auto px-5 py-3 rounded-xl text-white text-[13px] font-bold bg-amber-500 shadow-md hover:-translate-y-0.5 transition-all order-1 sm:order-2">Sí, cambiar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}