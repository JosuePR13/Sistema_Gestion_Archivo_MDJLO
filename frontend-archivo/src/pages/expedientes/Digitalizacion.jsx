import { useState, useEffect, useRef } from 'react';
import { useExpedientes } from '../../context/useExpedientes';
import api from '../../services/api';
import { PDFDocument } from 'pdf-lib';

export default function DigitalizacionScreen({ triggerToast }) {
  const { expedientes: dataGlobal, refrescarData } = useExpedientes();
  const expedientes = dataGlobal || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;

  const [selectedExpId, setSelectedExpId] = useState('');
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [showSizeLimitModal, setShowSizeLimitModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFileToDelete, setSelectedFileToDelete] = useState(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingExpId, setPendingExpId] = useState(null);

  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [mismatchData, setMismatchData] = useState({ filename: '', expected: 0, actual: 0 });

  const [gestorModal, setGestorModal] = useState({ isOpen: false, expId: null, code: '', archivos: [], isLoading: false });

  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [busquedaSelect, setBusquedaSelect] = useState('');
  const selectContainerRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectContainerRef.current && !selectContainerRef.current.contains(event.target)) {
        setIsSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentPage(1);
    }, 0);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const safeText = (value, fallback = 'General') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object') return value.nombre || value.descripcion || fallback;
    return fallback;
  };

  const digitalizados = expedientes.filter(e => e.digitalizado === 1 || e.digitalizado === true);
  const pendientes = expedientes.filter(e => e.digitalizado === 0 || e.digitalizado === false || !e.digitalizado);

  const porcentaje = expedientes.length === 0 ? 0 : Math.round((digitalizados.length / expedientes.length) * 100);

  const calcularMemoriaUsada = () => {
    let totalBytes = expedientes.reduce((acc, exp) => {
      let size = 0;
      if (exp.archivos && Array.isArray(exp.archivos)) {
        size = exp.archivos.reduce((sum, a) => sum + (a.tamano_bytes || 0), 0);
      } else if (exp.tamano_total_bytes) {
        size = exp.tamano_total_bytes;
      }
      return acc + size;
    }, 0);
    let megabytes = totalBytes / (1024 * 1024);
    if (megabytes === 0 && digitalizados.length > 0) {
      megabytes = digitalizados.length * 1.85;
    }
    return megabytes.toFixed(2);
  };
  const memoriaUsadaMB = calcularMemoriaUsada();

  const tablaFiltrada = digitalizados.filter(e => {
    const numExp = safeText(e.numero_expediente, '').toLowerCase();
    const tituloExp = safeText(e.titulo, '').toLowerCase();
    const termino = searchTerm.toLowerCase();
    return numExp.includes(termino) || tituloExp.includes(termino);
  });

  const totalPages = Math.ceil(tablaFiltrada.length / ITEMS_PER_PAGE);
  const currentData = tablaFiltrada.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const opcionesDropdown = pendientes.map(exp => ({
    id: exp.id,
    numero: safeText(exp.numero_expediente, 'S/N'),
    titulo: safeText(exp.titulo, 'Sin título'),
    area: safeText(exp.area_origen || exp.area_origen_id, 'Área no especificada')
  }));

  const opcionesFiltradas = opcionesDropdown.filter(opt =>
    opt.numero.toLowerCase().includes(busquedaSelect.toLowerCase()) ||
    opt.titulo.toLowerCase().includes(busquedaSelect.toLowerCase()) ||
    opt.area.toLowerCase().includes(busquedaSelect.toLowerCase())
  );

  const handleDropdownChange = (val) => {
    if (files.length > 0) {
      setPendingExpId(val);
      setShowWarningModal(true);
    } else {
      setSelectedExpId(val);
    }
  };

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

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const validPdfs = selectedFiles.filter(f => f.type === 'application/pdf');
    if (validPdfs.length !== selectedFiles.length) {
      if (typeof triggerToast === 'function') triggerToast("⚠️ Solo se permiten archivos PDF.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

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

  const ejecutarAccionPDF = async (fileTarget, action) => {
    try {
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
      if (action === 'eliminar') {
        setSelectedFileToDelete({ id: fileTarget.id, nombre_original: fileTarget.nombre_original, expId: gestorModal.expId });
        setShowDeleteModal(true);
      }
    } catch {
      alert("Hubo un problema de conexión al intentar acceder al archivo.");
    }
  };

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

  const pesoTotalMB = (files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2);
  const limiteCasiLleno = pesoTotalMB > 4.5;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8 relative selection:bg-blue-200 selection:text-blue-900 pb-24">
      <div className="max-w-screen-xl mx-auto animate-fade-in">

        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-8 bg-[#FFC107] rounded-full shadow-sm"></div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Digitalización Documental</h2>
            <p className="text-[13px] font-medium text-slate-400 mt-0.5">Asociación y almacenamiento digital de expedientes registrados</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-1.5 h-5 bg-[#0F4C81] rounded-full shadow-sm"></div>
              <h3 className="text-[14px] font-extrabold text-slate-800 uppercase tracking-widest">Cargar Archivo Digital</h3>
            </div>

            <div className="mb-6 relative z-30" ref={selectContainerRef}>
              <label className="block text-[11px] font-extrabold text-slate-500 mb-2 tracking-widest uppercase">
                Expediente Físico a Digitalizar *
              </label>

              <div className={`w-full border rounded-2xl bg-slate-50 overflow-hidden transition-all duration-300 ${isSelectOpen ? 'border-[#0F4C81] ring-4 ring-[#0F4C81]/10 bg-white shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-white'}`}>
                <div className="flex items-center px-4 h-[48px]">
                  <span className="text-slate-400 mr-3">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input
                    type="text"
                    className="w-full h-full bg-transparent text-[13px] font-semibold text-slate-700 outline-none placeholder-slate-400"
                    placeholder="Buscar por N° expediente, título o área..."
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
                  <button type="button" onClick={() => setIsSelectOpen(!isSelectOpen)} className="text-slate-400 hover:text-[#0F4C81] ml-2 p-1 transition-colors">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
              </div>

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
                        className={`px-5 py-3 cursor-pointer transition-all border-l-2 border-transparent hover:border-[#0F4C81] hover:bg-blue-50/50 group ${selectedExpId === opt.id ? 'bg-blue-50 border-[#0F4C81]' : ''}`}
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

            <div className={`relative p-8 rounded-3xl border-2 transition-all duration-300 ${!selectedExpId ? 'border-dashed border-slate-200 bg-slate-50/40 opacity-80' : (files.length > 0 ? 'border-solid border-emerald-400 bg-emerald-50/50' : 'border-dashed border-slate-300 bg-slate-50/50 hover:bg-white hover:border-[#0F4C81] z-10')}`}>
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
                  <p className="text-[11px] font-semibold text-slate-400 text-center px-4">Seleccione primero un expediente en el buscador superior para habilitar la digitalización.</p>
                </div>
              ) : files.length === 0 ? (
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full min-h-[140px]">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_2px_15px_rgba(15,76,129,0.08)] mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-[#0F4C81]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
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
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
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
                    <p className={`text-[12px] font-black ${limiteCasiLleno ? 'text-rose-500' : 'text-emerald-600'}`}>Total: {pesoTotalMB} / 5.00 MB</p>
                    <label htmlFor="file-upload" className="cursor-pointer text-[11px] font-extrabold uppercase tracking-wider text-[#0F4C81] bg-blue-50 hover:bg-[#0F4C81] hover:text-white px-4 py-2 rounded-xl transition-colors">+ Agregar más</label>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end relative z-10">
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading || files.length === 0 || !selectedExpId}
                className={`h-[48px] px-8 rounded-2xl text-white text-[13px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${isUploading || files.length === 0 || !selectedExpId ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)] hover:shadow-lg hover:-translate-y-0.5'}`}
              >
                {isUploading ? 'Procesando...' : `📤 Subir ${files.length} documento(s)`}
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-1.5 h-5 bg-[#0F4C81] rounded-full shadow-sm"></div>
                <h3 className="text-[14px] font-extrabold text-slate-800 uppercase tracking-widest">Resumen General</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Expedientes</span>
                  <span className="font-black text-lg text-slate-700">{expedientes.length}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50/50 border border-blue-50 rounded-2xl">
                  <span className="text-[11px] font-extrabold text-[#0F4C81] uppercase tracking-wider">Digitalizados</span>
                  <span className="font-black text-lg text-[#0F4C81]">{digitalizados.length}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-amber-50/50 border border-amber-50 rounded-2xl">
                  <span className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider">En Físico</span>
                  <span className="font-black text-lg text-amber-600">{pendientes.length}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-purple-50/50 border border-purple-50 rounded-2xl">
                  <span className="text-[11px] font-extrabold text-purple-600 uppercase tracking-wider">Memoria Usada</span>
                  <span className="font-black text-lg text-purple-600">{memoriaUsadaMB} MB</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Avance Digital</span>
                <span className="text-sm font-black text-emerald-500">{porcentaje}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${porcentaje}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col relative z-0">
          <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">{tablaFiltrada.length} registro(s) digitalizado(s)</p>
            <div className="relative w-full sm:w-72 group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm transition-colors group-focus-within:text-[#0F4C81]">🔍</span>
              <input
                type="text"
                placeholder="Buscar expediente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[48px] px-4 pl-11 border border-slate-200 bg-white rounded-2xl text-[13px] focus:bg-white focus:border-[#0F4C81] focus:ring-4 focus:ring-[#0F4C81]/10 outline-none transition-all duration-300 font-semibold text-slate-700 placeholder-slate-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest select-none bg-white">
                  <th className="p-5 px-8 w-[20%]">N° Expediente</th>
                  <th className="p-5 px-4 w-[35%]">Título del Documento</th>
                  <th className="p-5 px-4 w-[15%]">Clasificación</th>
                  <th className="p-5 px-4 text-center w-[10%]">Folios</th>
                  <th className="p-5 px-8 text-center w-[20%]">Gestión Documental</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[13px]">
                {currentData.length > 0 ? (
                  currentData.map((d) => (
                    <tr key={d.id} className="hover:bg-blue-50/40 transition-colors h-[72px]">
                      <td className="p-5 px-8 font-black text-[#0F4C81] truncate tracking-wide">{safeText(d.numero_expediente, 'S/N')}</td>
                      <td className="p-5 px-4 font-extrabold text-slate-800 truncate" title={safeText(d.titulo, '')}>{safeText(d.titulo, 'Sin título')}</td>
                      <td className="p-5 px-4 text-slate-500 font-bold truncate lowercase first-letter:uppercase">{safeText(d.tipo_documento || d.tipoDocumento, 'General')}</td>
                      <td className="p-5 px-4 text-center text-slate-500 font-black truncate">{safeText(d.numero_folios, '0')}</td>
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
                    <span className="text-[14px] font-black text-[#0F4C81]">{mismatchData.expected}</span>
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

        {gestorModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Documentos del Expediente</h3>
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

        {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden transform scale-100 transition-all">
              <div className="h-2 w-full bg-rose-500"></div>
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

        {showWarningModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden transform scale-100 transition-all">
              <div className="h-2 w-full bg-amber-500"></div>
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5 shadow-inner border border-amber-100">
                  <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2 tracking-tight">Archivos sin subir</h3>
                <p className="text-[13px] text-slate-500 px-3 leading-relaxed font-medium">Tienes documentos seleccionados que aún no has subido. Si cambias de expediente ahora, <span className="font-bold text-slate-700">se perderán</span>.</p>
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