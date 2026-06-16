import { useState, useEffect } from 'react';
import { useExpedientes } from '../context/useExpedientes';
import api from '../services/api';

export default function DetalleExpediente({
  id,
  onBack,
  triggerToast,
  setSearchTerm,
  setFilterTipo,
  setFilterFechaDesde
}) {
  const { expedientes, refrescarData } = useExpedientes();
  const [tab, setTab] = useState('info');
  const [, setLoading] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [historial, setHistorial] = useState([]);

  const [archivosPDF, setArchivosPDF] = useState([]);

  const [showExitModal, setShowExitModal] = useState(false);
  const [modalTexts, setModalTexts] = useState({ title: '', desc: '', actionType: '' });

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFileToDelete, setSelectedFileToDelete] = useState(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  useEffect(() => {
    const sincronizarCamposMuni = async () => {
      try {
        setLoading(true);

        const expLocal = expedientes.find(e => e.id === id);
        if (expLocal) {
          const dataAjustada = { ...expLocal };
          if (dataAjustada.fecha_ingreso && dataAjustada.fecha_ingreso.includes('T')) {
            dataAjustada.fecha_ingreso = dataAjustada.fecha_ingreso.split('T')[0];
          }

          setFormData(dataAjustada);
          setOriginalData(JSON.parse(JSON.stringify(dataAjustada)));
        }

        const [resHist, resArchivos] = await Promise.all([
          api.get(`/expedientes/${id}/historial`),
          api.get(`/expedientes/${id}/archivos`).catch(() => ({ data: { archivos: [] } }))
        ]);

        const histLista = resHist.data.historialesEdiciones || [];
        const listaPdfs = resArchivos.data.archivos || expLocal?.archivos || [];

        setHistorial(Array.isArray(histLista) ? histLista : []);
        setArchivosPDF(Array.isArray(listaPdfs) ? listaPdfs : []);
      } catch {
        alert('Error de conexión: No se pudo recuperar el historial de auditoría de la API.');
      } finally {
        setLoading(false);
      }
    };

    sincronizarCamposMuni();
  }, [id, expedientes]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const tieneCambiosPendientes = () => {
    if (!editMode) return false;
    return (
      formData.numero_expediente !== originalData.numero_expediente ||
      formData.titulo !== originalData.titulo ||
      formData.descripcion !== originalData.descripcion ||
      formData.numero_folios !== originalData.numero_folios ||
      formData.fecha_ingreso !== originalData.fecha_ingreso ||
      formData.razon_social !== originalData.razon_social
    );
  };

  const handleVolverAListado = () => {
    if (tieneCambiosPendientes()) {
      setModalTexts({
        title: '¿Está seguro que desea salir?',
        desc: 'Tiene modificaciones realizadas en esta ficha. Si sale ahora, perderá todos los cambios realizados en los campos.',
        actionType: 'VOLVER'
      });
      setShowExitModal(true);
    } else {
      onBack();
    }
  };

  const handleCancelarEdicion = () => {
    if (tieneCambiosPendientes()) {
      setModalTexts({
        title: '¿Cancelar edición?',
        desc: 'Se perderán las modificaciones realizadas y el registro volverá a su estado original.',
        actionType: 'CANCELAR_EDICION'
      });
      setShowExitModal(true);
    } else {
      setEditMode(false);
    }
  };

  const handleConfirmarSalidaModal = () => {
    setShowExitModal(false);
    if (modalTexts.actionType === 'VOLVER') {
      onBack();
    } else if (modalTexts.actionType === 'CANCELAR_EDICION') {
      setFormData(originalData);
      setEditMode(false);
    }
  };

  const generarTextoAuditoria = () => {
    const cambios = [];
    if (formData.numero_expediente !== originalData.numero_expediente) cambios.push(`N° Registro: "${originalData.numero_expediente || 'N/A'}" ➔ "${formData.numero_expediente}"`);
    if (formData.titulo !== originalData.titulo) cambios.push(`Título: "${originalData.titulo || 'N/A'}" ➔ "${formData.titulo}"`);
    if (formData.descripcion !== originalData.descripcion) cambios.push(`Descripción/Asunto actualizado`);
    if (parseInt(formData.numero_folios) !== parseInt(originalData.numero_folios)) cambios.push(`Folios: ${originalData.numero_folios || 0} ➔ ${formData.numero_folios}`);
    if (formData.fecha_ingreso !== originalData.fecha_ingreso) cambios.push(`Fecha Ingreso: ${originalData.fecha_ingreso || 'N/A'} ➔ ${formData.fecha_ingreso}`);
    if (formData.razon_social !== originalData.razon_social) cambios.push(`Razón Social: "${originalData.razon_social || 'N/A'}" ➔ "${formData.razon_social}"`);

    return cambios.length > 0
      ? `Campos modificados exitosamente: ${cambios.join(' | ')}`
      : 'Actualización general de metadatos de control archivístico.';
  };

  const handleSaveChanges = async () => {
    try {
      const logCambiosExactos = generarTextoAuditoria();

      const payloadValidado = {
        numero_expediente: formData.numero_expediente,
        titulo: formData.titulo,
        descripcion: formData.descripcion || 'Sin descripción.',
        numero_folios: parseInt(formData.numero_folios) || 1,
        fecha_ingreso: formData.fecha_ingreso,
        tiempo_conservacion: formData.tiempo_conservacion || '1 año',
        estado: formData.estado || 'Activo',
        tipo_documento_id: originalData.tipo_documento_id || formData.tipo_documento_id,
        area_origen_id: originalData.area_origen_id || formData.area_origen_id,
        area_actual_id: originalData.area_actual_id || formData.area_actual_id,
        observaciones: logCambiosExactos
      };

      if (formData.razon_social !== undefined && formData.razon_social !== null) {
        payloadValidado.razon_social = formData.razon_social;
      }

      await api.put(`/expedientes/${id}`, payloadValidado);

      refrescarData();
      setEditMode(false);
      triggerToast('¡Ficha actualizada y auditoría sincronizada con éxito!');

      if (typeof setSearchTerm === 'function') setSearchTerm('');
      if (typeof setFilterTipo === 'function') setFilterTipo('');
      if (typeof setFilterFechaDesde === 'function') setFilterFechaDesde('');

      onBack();
    } catch (error) {
      console.error("Error devuelto por Laravel:", error.response?.data || error.message);
      const erroresBackend = error.response?.data?.errors;
      if (erroresBackend && erroresBackend.numero_expediente) {
        setDuplicateMessage(`No se pueden guardar los cambios. El código "${formData.numero_expediente}" ya le pertenece a otro documento registrado en el sistema.`);
        setShowDuplicateModal(true);
      } else if (erroresBackend) {
        const listaErrores = Object.values(erroresBackend).flat().join('\n');
        alert(`Campos rechazados por el servidor:\n${listaErrores}`);
      } else {
        alert("Error de validación del Servidor: Verifique campos obligatorios");
      }
    }
  };

  const ejecutarEliminacionArchivo = async () => {
    if (!selectedFileToDelete) return;
    try {
      setIsDeletingFile(true);
      await api.delete(`/expedientes/${id}/archivos/${selectedFileToDelete.id}`);
      triggerToast('¡Archivo digital removido y auditoría actualizada exitosamente!');
      setShowDeleteModal(false);
      setSelectedFileToDelete(null);
      refrescarData();
    } catch (error) {
      console.error("Error al eliminar archivo digital:", error);
      alert("Error del servidor: No se pudo eliminar el documento del almacenamiento físico.");
    } finally {
      setIsDeletingFile(false);
    }
  };

  const traducirCampoMuni = (campo) => {
    const diccionario = {
      numero_expediente: 'N° EXPEDIENTE REGISTRO',
      titulo: 'TÍTULO DEL DOCUMENTO',
      descripcion: 'DESCRIPCIÓN / ASUNTO',
      numero_folios: 'NÚMERO DE FOLIOS',
      fecha_ingreso: 'FECHA DE INGRESO',
      razon_social: 'RAZÓN SOCIAL / INTERESADO',
      tiempo_conservacion: 'TIEMPO DE CONSERVACIÓN',
      tipo_documento_id: 'TIPO DE DOCUMENTO',
      area_origen_id: 'ÁREA DE ORIGEN',
      area_actual_id: 'ÁREA ACTUAL DE CUSTODIA',
      archivo_digital: 'DOCUMENTO DIGITAL (PDF)'
    };
    return diccionario[campo] || campo.toUpperCase();
  };

  const formatearFechaPeru = (fechaStr) => {
    if (!fechaStr) return 'Reciente';
    try {
      const fechaObj = new Date(fechaStr);
      if (!isNaN(fechaObj.getTime())) {
        return fechaObj.toLocaleString('es-PE', {
          timeZone: 'America/Lima',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).replace('a. m.', 'a.m.').replace('p. m.', 'p.m.').replace('.', '');
      }

      const limpia = fechaStr.replace('T', ' ').split('.')[0];
      const parts = limpia.split(' ');
      if (parts.length === 2) {
        const [ano, mes, dia] = parts[0].split('-');
        const [hora, min] = parts[1].split(':');
        let horaInt = parseInt(hora);
        const ampm = horaInt >= 12 ? 'p.m.' : 'a.m.';
        horaInt = horaInt % 12 || 12;
        const meses = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
        return `${parseInt(dia)} ${meses[parseInt(mes) - 1]} ${ano}, ${horaInt}:${min} ${ampm}`;
      }
      return fechaStr;
    } catch {
      return fechaStr;
    }
  };

  const obtenerNombreTipoDocumento = () => {
    const tipo = formData.tipo_documento || originalData.tipo_documento;
    if (tipo) return typeof tipo === 'object' ? tipo.nombre : tipo;
    const idFiltro = formData.tipo_documento_id || originalData.tipo_documento_id;
    const diccionario = { 1: 'GENERAL', 2: 'CONTRATO', 3: 'RESOLUCIÓN', 4: 'ACTA', 5: 'INFORME', 6: 'OFICIO' };
    return diccionario[idFiltro] || 'GENERAL / ADMINISTRATIVO';
  };

  const obtenerNombreArea = (campoObjeto, campoId) => {
    const area = formData[campoObjeto] || originalData[campoObjeto];
    if (area) return typeof area === 'object' ? area.nombre : area;
    const idFiltro = formData[campoId] || originalData[campoId];
    const diccionario = { 1: 'ARCHIVO CENTRAL', 2: 'ALCALDÍA', 3: 'INFRAESTRUCTURA', 4: 'RENTAS', 11: 'TESORERÍA' };
    return diccionario[idFiltro] || 'ÁREA MUNICIPAL JLO';
  };

  const estadoBadge = (estado) => {
    const st = (estado || 'Activo').toLowerCase();
    if (st.includes('revisión') || st.includes('revision')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (st.includes('depurar') || st.includes('vencido')) return 'bg-rose-100 text-rose-700 border-rose-200';
    if (st.includes('digitalizado')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (st.includes('archivado')) return 'bg-slate-100 text-slate-700 border-slate-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  const inputStyles = "w-full h-[48px] px-4 border border-slate-200 bg-slate-50 rounded-2xl text-[13px] focus:bg-white focus:border-[#0F4C81] focus:ring-4 focus:ring-[#0F4C81]/10 outline-none transition-all duration-300 font-semibold text-slate-700";
  const disabledInputStyles = "w-full h-[48px] px-4 border border-slate-100 bg-slate-50/50 text-slate-400 rounded-2xl text-[13px] font-extrabold outline-none cursor-not-allowed flex items-center";
  const labelStyles = "block text-[11px] font-extrabold text-slate-500 mb-2 tracking-widest uppercase";

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8 relative selection:bg-blue-200 selection:text-blue-900 pb-24">
      <div className="max-w-screen-xl mx-auto animate-fade-in">

        {/* CABECERA DE NAVEGACIÓN PREMIUM */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={handleVolverAListado} className="text-[13px] text-slate-500 hover:text-[#0F4C81] transition-colors font-extrabold flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-200 mr-2">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              Volver
            </button>
            <span className="text-2xl font-black text-slate-800 tracking-tight">{formData.numero_expediente}</span>

            {(() => {
              const fBase = formData.fecha_ingreso || formData.created_at || new Date().toISOString();
              const diffDays = Math.floor(Math.abs(new Date() - new Date(fBase)) / (1000 * 60 * 60 * 24));
              const anosVal = diffDays / 365.25;

              let lim = 5;
              const cStr = (formData.tiempo_conservacion || '5').toLowerCase();
              let esPermanente = cStr.includes('perma') || cStr.includes('indefi');

              const m = cStr.match(/[\d.]+/);
              if (m) lim = cStr.includes('mes') ? parseFloat(m[0]) / 12 : parseFloat(m[0]);

              const estadoReal = (!esPermanente && anosVal >= lim) ? 'Para Depurar' : (formData.estado || 'Activo');

              return (
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${estadoBadge(estadoReal)}`}>
                  {estadoReal}
                </span>
              );
            })()}
            {(formData.digitalizado === 1 || formData.digitalizado === true || archivosPDF.length > 0) && (
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-indigo-50 text-indigo-600 border-indigo-200">
                Digitalizado
              </span>
            )}
          </div>

          <div className="flex gap-3">
            {!editMode ? (
              <button
                type="button"
                onClick={() => {
                  const textoLimpio = (formData.descripcion || '').replace(/<[^>]*>?/gm, '');
                  handleInputChange('descripcion', textoLimpio);
                  setEditMode(true);
                }}
                className="flex items-center gap-2 h-[48px] px-6 text-[13px] font-extrabold rounded-2xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-[#0F4C81] transition-all shadow-sm"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Editar Expediente
              </button>
            ) : (
              <>
                <button type="button" onClick={handleCancelarEdicion} className="h-[48px] px-6 text-[13px] font-bold rounded-2xl border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 hover:text-slate-700 transition-all shadow-sm">
                  Cancelar
                </button>
                <button type="button" onClick={handleSaveChanges} disabled={!formData.numero_expediente?.trim()} className={`h-[48px] px-6 text-[13px] font-bold uppercase tracking-widest rounded-2xl text-white shadow-[0_8px_20px_-6px_rgba(15,76,129,0.5)] transition-all duration-300 ${formData.numero_expediente?.trim() ? 'bg-gradient-to-r from-[#0F4C81] to-blue-700 hover:shadow-[0_12px_25px_-6px_rgba(15,76,129,0.6)] hover:-translate-y-0.5' : 'bg-slate-300 cursor-not-allowed shadow-none'}`}>
                  Guardar Cambios
                </button>
              </>
            )}
          </div>
        </div>

        {/* REJILLA DE INFORMACIÓN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-1.5 h-5 bg-[#FFC107] rounded-full shadow-sm"></div>
              <span className="text-[14px] font-extrabold text-slate-800 uppercase tracking-widest">Campos Generales</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className={labelStyles}>N° Expediente / Registro *</label>
                <input type="text" value={formData.numero_expediente || ''} disabled={!editMode} onChange={e => handleInputChange('numero_expediente', e.target.value)} className={editMode ? inputStyles : disabledInputStyles} />
              </div>
              <div>
                <label className={labelStyles}>Clasificación / Tipo Documental</label>
                <input type="text" value={obtenerNombreTipoDocumento()} readOnly disabled className={`${disabledInputStyles} uppercase`} />
              </div>
              <div>
                <label className={labelStyles}>Fecha de Ingreso *</label>
                <input type="date" value={formData.fecha_ingreso || ''} disabled={!editMode} onChange={e => handleInputChange('fecha_ingreso', e.target.value)} className={editMode ? inputStyles : disabledInputStyles} />
              </div>
              <div>
                <label className={labelStyles}>N° de Folios *</label>
                <input type="number" value={formData.numero_folios || 0} disabled={!editMode} onChange={e => handleInputChange('numero_folios', e.target.value)} className={editMode ? inputStyles : disabledInputStyles} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelStyles}>Título del Documento *</label>
                <input type="text" value={formData.titulo || ''} disabled={!editMode} onChange={e => handleInputChange('titulo', e.target.value)} className={editMode ? inputStyles : disabledInputStyles} />
              </div>
              {(formData.razon_social !== undefined && formData.razon_social !== null) && (
                <div className="sm:col-span-2">
                  <label className={labelStyles}>Nombre / Razón Social *</label>
                  <input type="text" value={formData.razon_social || ''} disabled={!editMode} onChange={e => handleInputChange('razon_social', e.target.value)} className={editMode ? inputStyles : disabledInputStyles} />
                </div>
              )}
              <div className="sm:col-span-2">
                <label className={labelStyles}>Tiempo de Conservación</label>
                <input type="text" value={formData.tiempo_conservacion || 'N/A'} disabled className={disabledInputStyles} />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-1.5 h-5 bg-[#0F4C81] rounded-full shadow-sm"></div>
                <span className="text-[14px] font-extrabold text-slate-800 uppercase tracking-widest">Custodia Institucional</span>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Área de Origen</span>
                  <span className="font-black text-slate-700 uppercase text-[13px]">{obtenerNombreArea('area_origen', 'area_origen_id')}</span>
                </div>
                <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-50">
                  <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Área Actual</span>
                  <span className="font-black text-[#0F4C81] uppercase text-[13px]">{obtenerNombreArea('area_actual', 'area_actual_id')}</span>
                </div>
              </div>
            </div>
            <div className="mt-8 p-4 rounded-2xl text-center bg-gradient-to-br from-slate-800 to-slate-900 shadow-inner">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">Auditoría Criptográfica</p>
              <p className="font-black text-sm text-emerald-400">Archivo Central - JLO</p>
            </div>
          </div>
        </div>

        {/* PESTAÑAS DE INFORMACIÓN */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 overflow-x-auto scrollbar-hide">
            {[
              ['info', 'Descripción / Asunto'],
              ['archivos', 'Archivos Digitales (PDF)'],
              ['historial', 'Historial de Auditoría']
            ].map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`py-4 px-6 text-[13px] font-extrabold border-b-[3px] transition-all whitespace-nowrap ${tab === k ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'}`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="p-8">
            {tab === 'info' && (
              <div className="text-sm text-slate-700 leading-relaxed text-left animate-fade-in">
                {editMode ? (
                  <textarea
                    value={formData.descripcion || ''}
                    onChange={e => handleInputChange('descripcion', e.target.value)}
                    placeholder="Escriba los asuntos y detalles del expediente aquí..."
                    className="w-full p-5 text-[13px] bg-slate-50 border border-slate-200 rounded-2xl outline-none min-h-[160px] resize-y font-medium text-slate-700 focus:bg-white focus:border-[#0F4C81] focus:ring-4 focus:ring-[#0F4C81]/10 transition-all duration-300"
                  />
                ) : (
                  <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 min-h-[120px] text-[13px] font-medium" dangerouslySetInnerHTML={{ __html: formData.descripcion || '<i>Sin descripción registrada.</i>' }} />
                )}
              </div>
            )}

            {tab === 'archivos' && (
              <div className="space-y-6 animate-fade-in">
                {archivosPDF && archivosPDF.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {archivosPDF.map((file) => {
                      const tamanoKB = (file.tamano_bytes / 1024).toFixed(1);
                      const tamanoReal = tamanoKB > 1024 ? (tamanoKB / 1024).toFixed(1) + ' MB' : tamanoKB + ' KB';
                      
                      // 🚀 MODIFICADO EN EXCLUSIVO: Previsualizador con iframe dinámico para forzar título
                      const abrirVisualizadorPDF = async () => {
                        try {
                          const response = await api.get(`/expedientes/${id}/archivos/${file.id}`, { responseType: 'blob' });
                          const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                          
                          const nuevaVentana = window.open('', '_blank');
                          if (nuevaVentana) {
                            nuevaVentana.document.write(`
                              <html>
                                <head>
                                  <title>${file.nombre_original || 'Documento.pdf'}</title>
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
                        } catch { 
                          alert("No se pudo previsualizar el PDF."); 
                        }
                      };

                      const descargarPDF = async () => {
                        try {
                          const response = await api.get(`/expedientes/${id}/archivos/${file.id}`, { responseType: 'blob' });
                          const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', file.nombre_original);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        } catch { alert("No se pudo descargar el archivo."); }
                      };
                      return (
                        <div key={file.id} className="flex flex-col p-5 bg-white rounded-2xl border border-slate-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow group">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            </div>
                            <div className="text-left overflow-hidden">
                              <p className="text-[13px] font-extrabold text-slate-800 truncate" title={file.nombre_original}>{file.nombre_original}</p>
                              <p className="text-[11px] text-slate-400 font-bold mt-1">Peso: {tamanoReal}</p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Por: <span className="text-slate-600">{file.usuario?.name || 'Operador JLO'}</span></p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-auto border-t border-slate-50 pt-4">
                            <button type="button" onClick={abrirVisualizadorPDF} className="flex-1 py-2 text-[11px] uppercase tracking-wider rounded-xl bg-slate-50 text-slate-600 font-extrabold hover:bg-[#0F4C81] hover:text-white transition-colors">Ver PDF</button>
                            <button type="button" onClick={descargarPDF} className="flex-1 py-2 text-[11px] uppercase tracking-wider rounded-xl bg-slate-50 text-slate-600 font-extrabold hover:bg-slate-200 transition-colors">Descargar</button>
                            <button type="button" onClick={() => { setSelectedFileToDelete(file); setShowDeleteModal(true); }} className="w-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors">
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4"><span className="text-2xl">📭</span></div>
                    <p className="text-[13px] font-extrabold text-slate-500">Sin archivos digitales</p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-1">Aún no se han anexado documentos PDF a este expediente.</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'historial' && (
              <div className="animate-fade-in pl-4">
                <div className="relative border-l-2 border-slate-200 ml-4 pl-8 space-y-8 text-left">
                  {historial && historial.length > 0 ? (
                    historial.map((h, i) => (
                      <div key={h.id || i} className="relative group">
                        <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-sm"></div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1 text-sm">
                          <span className="font-extrabold text-slate-800 text-[13px]">Modificación: {traducirCampoMuni(h.campo_modificado)}</span>
                          <span className="hidden sm:inline text-slate-300">·</span>
                          <span className="text-[11px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">{formatearFechaPeru(h.fecha_cambio)}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-semibold mb-3">Operador: <span className="text-slate-700 font-extrabold">{h.usuario?.name || h.usuario?.username || 'Archivero Institucional'}</span></p>

                        <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl border border-slate-800 font-mono text-[12px] max-w-3xl shadow-inner overflow-x-auto">
                          <span className="text-slate-600 select-none mr-2">$&gt;</span>
                          {h.campo_modificado === 'archivo_digital' ? (
                            h.valor_anterior === 'eliminado' ? (
                              <span>Se removió el archivo físico <span className="text-rose-400 font-bold">"{h.valor_anterior}"</span> del repositorio central.</span>
                            ) : (
                              <span>Se indexó y enlazó el nuevo archivo PDF <span className="text-amber-400 font-bold">"{h.valor_nuevo}"</span> de forma exitosa.</span>
                            )
                          ) : (
                            <span>Se detectó alteración de <span className="text-rose-400">"{h.valor_anterior || 'nulo'}"</span> hacia el valor <span className="text-amber-400 font-bold">"{h.valor_nuevo || 'vacío'}"</span>.</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : null}

                  <div className="relative group">
                    <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-[#0F4C81] border-4 border-white shadow-sm"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1 text-sm">
                      <span className="font-extrabold text-slate-800 text-[13px]">Registro Inicial Generado</span>
                      <span className="hidden sm:inline text-slate-300">·</span>
                      <span className="text-[11px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">{originalData.created_at ? formatearFechaPeru(originalData.created_at) : 'Apertura'}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-semibold mb-3">Origen: <span className="text-slate-700 font-extrabold">Sistema SGD - SISGEDO</span></p>
                    <div className="bg-slate-50 text-slate-500 p-4 rounded-2xl border border-slate-200 font-mono text-[12px] max-w-3xl shadow-inner">
                      [INFO]: Indexado correctamente de forma predeterminada como "Activo" en la base de datos de la municipalidad.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODALES GLASSMORPHISM */}
        {showExitModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden transform scale-100 transition-all">
              <div className="h-2 w-full bg-[#FFC107]"></div>
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2 tracking-tight">{modalTexts.title}</h3>
                <p className="text-[13px] text-slate-500 px-2 leading-relaxed font-medium">{modalTexts.desc}</p>
              </div>
              <div className="bg-slate-50/50 px-6 py-5 flex flex-col sm:flex-row justify-center gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowExitModal(false)} className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all order-2 sm:order-1">No, continuar editando</button>
                <button type="button" onClick={handleConfirmarSalidaModal} className="w-full sm:w-auto px-5 py-3 rounded-xl text-white text-[13px] font-bold bg-[#0F4C81] shadow-md hover:-translate-y-0.5 transition-all order-1 sm:order-2">Sí, descartar cambios</button>
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
                  <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2 tracking-tight">Código Duplicado</h3>
                <p className="text-[13px] text-slate-500 px-3 leading-relaxed font-medium">{duplicateMessage}</p>
              </div>
              <div className="bg-slate-50/50 px-6 py-5 flex justify-center border-t border-slate-100">
                <button type="button" onClick={() => setShowDuplicateModal(false)} className="w-full px-5 py-3 text-white text-[13px] font-bold rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 shadow-md hover:-translate-y-0.5 transition-all text-center">Entendido, corregir código</button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden transform scale-100 transition-all">
              <div className="h-2 w-full bg-rose-500"></div>
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2 tracking-tight">¿Eliminar archivo PDF?</h3>
                <p className="text-[13px] text-slate-500 px-3 leading-relaxed font-medium">Esta acción borrará permanentemente <span className="font-bold text-slate-700">"{selectedFileToDelete?.nombre_original}"</span>.</p>
              </div>
              <div className="bg-slate-50/50 px-6 py-5 flex flex-col sm:flex-row justify-center gap-3 border-t border-slate-100">
                <button type="button" disabled={isDeletingFile} onClick={() => { setShowDeleteModal(false); setSelectedFileToDelete(null); }} className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all order-2 sm:order-1">No, mantener archivo</button>
                <button type="button" disabled={isDeletingFile} onClick={ejecutarEliminacionArchivo} className="w-full sm:w-auto px-5 py-3 rounded-xl text-white text-[13px] font-bold bg-rose-600 shadow-md hover:bg-rose-700 transition-all order-1 sm:order-2">{isDeletingFile ? 'Eliminando...' : 'Sí, eliminar archivo'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}