import React, { useState } from 'react';
import { X, UploadCloud, ArrowRight, ArrowLeft, CheckCircle, FileText, AlertTriangle, File, Palette } from 'lucide-react';
import './Capturista.css';
import catalogos from '../../plataforma/catalogos_sesim.json';

const FORM_DATA_INICIAL = {
  nombreCapa: '',
  indicador: '',
  categoria: '',
  cobertura: '',
  instrumento: '',
  periodicidad: '',
  eje: '',
  sector: '',
  horizonte: '',
  restriccion: '',
  institucion: '',
  anio: '',
};

const CapturistaModal = ({ isOpen, onClose, onVerify }) => {
  const [step, setStep] = useState(1);
  const [epsgConfirmed, setEpsgConfirmed] = useState(false);

  const [archivo, setArchivo] = useState(null);
  const [estilo, setEstilo] = useState(null);
  const [documento, setDocumento] = useState(null);

  const [dragActive, setDragActive] = useState({ a: false, b: false, c: false });
  const [fileError, setFileError] = useState(null);

  // Ficha técnica: formulario controlado. Cada campo referencia un
  // catálogo real de SESIM (catalogos_sesim.json) — el mismo que usa
  // InstrumentoModal y el filtro de Administrador — para que la
  // captura, el dictamen y la auditoría hablen siempre del mismo
  // indicador y clasificación.
  const [formData, setFormData] = useState(FORM_DATA_INICIAL);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setStep(1);
    setEpsgConfirmed(false);
    setArchivo(null);
    setEstilo(null);
    setDocumento(null);
    setFileError(null);
    setFormData(FORM_DATA_INICIAL);
    onClose();
  };

  const handleNext = () => {
    if (step === 1 && (!epsgConfirmed || !archivo || !documento)) return;
    setStep(prev => Math.min(prev + 1, 3));
    setFileError(null);
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
    setFileError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Al elegir un indicador del catálogo, se auto-completan Categoría,
  // Eje (y Sector/Horizonte) según la ficha del propio catálogo — así
  // el indicador es siempre la fuente de verdad de su clasificación.
  const handleIndicadorChange = (e) => {
    const indicadorId = e.target.value;
    const info = catalogos.cat_indicadores.find(i => i.id === indicadorId);
    setFormData(prev => ({
      ...prev,
      indicador: indicadorId,
      categoria: info?.categoria || prev.categoria,
      eje: info?.eje || prev.eje,
      sector: info?.sector || '',
      horizonte: info?.horizonte || '',
    }));
  };

  const isValidExtension = (fileName, allowedExtensions) => {
    if (!fileName) return false;
    const ext = `.${fileName.split('.').pop().toLowerCase()}`;
    return allowedExtensions.includes(ext);
  };

  const handleDragOver = (e, zone) => {
    e.preventDefault();
    setDragActive({ ...dragActive, [zone]: true });
  };
  const handleDragLeave = (e, zone) => {
    e.preventDefault();
    setDragActive({ ...dragActive, [zone]: false });
  };

  const handleDropArchivo = (e) => {
    e.preventDefault();
    setDragActive({ ...dragActive, a: false });
    const file = e.dataTransfer.files[0];
    if (file && isValidExtension(file.name, ['.geojson', '.kml', '.gpkg', '.zip'])) {
      setArchivo(file);
      setFileError(null);
    } else if (file) {
      setFileError("Intente de nuevo. La capa espacial debe tener extensión .geojson, .kml, .gpkg o .zip");
    }
  };

  const handleDropEstilo = (e) => {
    e.preventDefault();
    setDragActive({ ...dragActive, b: false });
    const file = e.dataTransfer.files[0];
    if (file && isValidExtension(file.name, ['.sld', '.qml'])) {
      setEstilo(file);
      setFileError(null);
    } else if (file) {
      setFileError("Intente de nuevo. El archivo de estilo debe tener extensión .sld o .qml");
    }
  };

  const handleDropDocumento = (e) => {
    e.preventDefault();
    setDragActive({ ...dragActive, c: false });
    const file = e.dataTransfer.files[0];
    if (file && isValidExtension(file.name, ['.pdf'])) {
      setDocumento(file);
      setFileError(null);
    } else if (file) {
      setFileError("Intente de nuevo. El documento técnico debe ser formato .pdf");
    }
  };

  const handleSubmit = () => {
    onVerify({
      archivo: archivo?.name || 'capa_nueva',
      ...formData,
    });
  };

  const etiquetaIndicador = catalogos.cat_indicadores.find(i => i.id === formData.indicador)?.etiqueta;
  const etiquetaCobertura = catalogos.cat_cobertura.find(i => i.id === formData.cobertura)?.etiqueta;
  const etiquetaInstrumento = catalogos.cat_instrumento.find(i => i.id === formData.instrumento)?.etiqueta;
  const etiquetaPeriodicidad = catalogos.cat_periodicidad.find(i => i.id === formData.periodicidad)?.etiqueta;
  const etiquetaEje = catalogos.cat_eje_evaluacion.find(i => i.id === formData.eje)?.etiqueta;
  const etiquetaSector = catalogos.cat_sector.find(i => i.id === formData.sector)?.etiqueta;
  const etiquetaHorizonte = catalogos.cat_horizonte.find(i => i.id === formData.horizonte)?.etiqueta;
  const etiquetaInstitucion = catalogos.cat_instituciones.find(i => i.id === formData.institucion)?.etiqueta;

  return (
    <>
      <div className="modal-drawer-overlay" onClick={resetAndClose}></div>
      <div className="modal-drawer">

        <div className="modal-drawer-header">
          <div>
            <h3 style={{ margin: 0, color: 'var(--c-guinda)', fontFamily: 'var(--font-heading)' }}>
              Registrar Indicador
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Paso {step} de 3</span>
          </div>
          <button className="btn-close-drawer" onClick={resetAndClose}><X size={20} /></button>
        </div>

        <div className="modal-drawer-content">

          {/* PASO 1: CARGA DE ARCHIVOS */}
          {step === 1 && (
            <div className="wizard-step">
              <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--c-guinda-dk)' }}>
                <UploadCloud size={18} /> 1. Carga de Archivos
              </h4>

              {fileError && (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#991B1B', lineHeight: '1.4' }}>
                    <strong><AlertTriangle size={14} style={{ display: 'inline', marginBottom: '-2px', marginRight: '4px' }}/> Error:</strong> {fileError}
                  </span>
                  <button onClick={() => setFileError(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#991B1B' }}>
                    <X size={16} />
                  </button>
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  A. Capa Espacial <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div
                  className="drag-drop-zone"
                  onDrop={handleDropArchivo}
                  onDragOver={(e) => handleDragOver(e, 'a')}
                  onDragLeave={(e) => handleDragLeave(e, 'a')}
                  style={{
                    padding: '20px',
                    borderColor: archivo ? 'var(--c-guinda)' : dragActive.a ? 'var(--c-guinda)' : 'var(--border-color)',
                    background: archivo || dragActive.a ? 'rgba(159, 34, 65, 0.05)' : 'var(--c-bg)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {archivo ? (
                    <>
                      <File size={24} color="var(--c-guinda)" />
                      <p style={{ margin: '8px 0 8px', fontWeight: '600', color: 'var(--c-guinda)', fontSize: '13px' }}>{archivo.name}</p>
                      <button className="btn-base btn-tertiary" onClick={() => setArchivo(null)} style={{ width: 'auto', height: '32px', fontSize: '12px', padding: '0 12px' }}>Quitar</button>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={24} color="var(--text-secondary)" style={{ marginBottom: '8px' }} />
                      <p style={{ fontSize: '12px', color: 'var(--text-primary)', textAlign: 'center', margin: '0 0 4px', fontWeight: '500' }}>Arrastra tus archivos aquí o</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 12px' }}>Formatos: <strong>GeoJSON, KML, GeoPackage o .zip</strong></p>

                      <label className="btn-base btn-secondary" style={{ cursor: 'pointer', width: 'auto', height: '36px', fontSize: '12px' }}>
                        Explorar
                        <input
                          type="file"
                          accept=".geojson,.kml,.gpkg,.zip"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file && isValidExtension(file.name, ['.geojson', '.kml', '.gpkg', '.zip'])) {
                              setArchivo(file);
                              setFileError(null);
                            } else if (file) {
                              setFileError("Intente de nuevo. La capa espacial debe tener extensión .geojson, .kml, .gpkg o .zip");
                            }
                          }}
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '16px', padding: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={epsgConfirmed} onChange={(e) => setEpsgConfirmed(e.target.checked)} style={{ marginTop: '3px', cursor: 'pointer' }} />
                  <span style={{ fontSize: '12px', color: '#991B1B', lineHeight: '1.4' }}>
                    <strong><AlertTriangle size={12} style={{ display: 'inline', marginBottom: '-2px' }}/> Advertencia:</strong> Solo se aceptan archivos con proyección <strong>EPSG:4326</strong>.
                  </span>
                </label>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  B. Archivo de Estilo <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '400' }}>(Opcional)</span>
                </label>
                <div
                  className="drag-drop-zone"
                  onDrop={handleDropEstilo}
                  onDragOver={(e) => handleDragOver(e, 'b')}
                  onDragLeave={(e) => handleDragLeave(e, 'b')}
                  style={{
                    padding: '20px',
                    borderColor: estilo ? 'var(--c-guinda)' : dragActive.b ? 'var(--c-guinda)' : 'var(--border-color)',
                    background: estilo || dragActive.b ? 'rgba(159, 34, 65, 0.05)' : 'var(--c-bg)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {estilo ? (
                    <>
                      <Palette size={24} color="var(--c-guinda)" />
                      <p style={{ margin: '8px 0 8px', fontWeight: '600', color: 'var(--c-guinda)', fontSize: '13px' }}>{estilo.name}</p>
                      <button className="btn-base btn-tertiary" onClick={() => setEstilo(null)} style={{ width: 'auto', height: '32px', fontSize: '12px', padding: '0 12px' }}>Quitar</button>
                    </>
                  ) : (
                    <>
                      <Palette size={24} color="var(--text-secondary)" style={{ marginBottom: '8px' }} />
                      <p style={{ fontSize: '12px', color: 'var(--text-primary)', textAlign: 'center', margin: '0 0 4px', fontWeight: '500' }}>Arrastra tu archivo aquí o</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 12px' }}>Formatos: <strong>.SLD o .QML</strong></p>

                      <label className="btn-base btn-secondary" style={{ cursor: 'pointer', width: 'auto', height: '36px', fontSize: '12px' }}>
                        Explorar
                        <input
                          type="file"
                          accept=".sld,.qml"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file && isValidExtension(file.name, ['.sld', '.qml'])) {
                              setEstilo(file);
                              setFileError(null);
                            } else if (file) {
                              setFileError("Intente de nuevo. El archivo de estilo debe tener extensión .sld o .qml");
                            }
                          }}
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  C. Expediente Técnico / Legal <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div
                  className="drag-drop-zone"
                  onDrop={handleDropDocumento}
                  onDragOver={(e) => handleDragOver(e, 'c')}
                  onDragLeave={(e) => handleDragLeave(e, 'c')}
                  style={{
                    padding: '20px',
                    borderColor: documento ? 'var(--c-guinda)' : dragActive.c ? 'var(--c-guinda)' : 'var(--border-color)',
                    background: documento || dragActive.c ? 'rgba(159, 34, 65, 0.05)' : 'var(--c-bg)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {documento ? (
                    <>
                      <FileText size={24} color="var(--c-guinda)" />
                      <p style={{ margin: '8px 0 8px', fontWeight: '600', color: 'var(--c-guinda)', fontSize: '13px' }}>{documento.name}</p>
                      <button className="btn-base btn-tertiary" onClick={() => setDocumento(null)} style={{ width: 'auto', height: '32px', fontSize: '12px', padding: '0 12px' }}>Quitar</button>
                    </>
                  ) : (
                    <>
                      <FileText size={24} color="var(--text-secondary)" style={{ marginBottom: '8px' }} />
                      <p style={{ fontSize: '12px', color: 'var(--text-primary)', textAlign: 'center', margin: '0 0 4px', fontWeight: '500' }}>Arrastra tu archivo aquí o</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 12px' }}>Formatos: <strong>.PDF</strong></p>

                      <label className="btn-base btn-secondary" style={{ cursor: 'pointer', width: 'auto', height: '36px', fontSize: '12px' }}>
                        Explorar
                        <input
                          type="file"
                          accept=".pdf"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file && isValidExtension(file.name, ['.pdf'])) {
                              setDocumento(file);
                              setFileError(null);
                            } else if (file) {
                              setFileError("Intente de nuevo. El documento técnico debe ser formato .pdf");
                            }
                          }}
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: FICHA TÉCNICA */}
          {step === 2 && (
            <div className="wizard-step">
              <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--c-guinda-dk)' }}><FileText size={18} /> 2. Ficha Técnica Institucional</h4>

              <div className="form-group">
                <label>Nombre de la Capa</label>
                <input type="text" name="nombreCapa" value={formData.nombreCapa} onChange={handleChange} className="form-input" placeholder="Ej. Nomenclatura exacta al catálogo de instrumentos" />
              </div>

              <div className="form-group">
                <label>Indicador SESIM <span style={{ color: '#EF4444' }}>*</span></label>
                <select name="indicador" value={formData.indicador} onChange={handleIndicadorChange} className="form-input">
                  <option value="">Seleccione el indicador que esta capa evidencia...</option>
                  {catalogos.cat_indicadores.map(item => (<option key={item.id} value={item.id}>{item.etiqueta}</option>))}
                </select>
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>Categoría</label>
                  <select name="categoria" value={formData.categoria} onChange={handleChange} className="form-input"><option value="">Seleccione...</option>{catalogos.cat_categoria.map(item => (<option key={item.id} value={item.id}>{item.etiqueta}</option>))}</select>
                </div>
                <div>
                  <label>Escala Territorial</label>
                  <select name="cobertura" value={formData.cobertura} onChange={handleChange} className="form-input"><option value="">Seleccione...</option>{catalogos.cat_cobertura.map(item => (<option key={item.id} value={item.id}>{item.etiqueta}</option>))}</select>
                </div>
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>Instrumento de Origen</label>
                  <select name="instrumento" value={formData.instrumento} onChange={handleChange} className="form-input"><option value="">Seleccione el marco normativo...</option>{catalogos.cat_instrumento.map(item => (<option key={item.id} value={item.id}>{item.etiqueta}</option>))}</select>
                </div>
                <div>
                  <label>Periodicidad</label>
                  <select name="periodicidad" value={formData.periodicidad} onChange={handleChange} className="form-input"><option value="">Seleccione...</option>{catalogos.cat_periodicidad.map(item => (<option key={item.id} value={item.id}>{item.etiqueta}</option>))}</select>
                </div>
              </div>

              <div className="form-group">
                <label>Eje de Evaluación</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  {catalogos.cat_eje_evaluacion.map(item => (
                    <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '400', fontSize: '13px' }}>
                      <input type="radio" name="eje" value={item.id} checked={formData.eje === item.id} onChange={handleChange} /> {item.etiqueta}
                    </label>
                  ))}
                </div>
              </div>

              {formData.eje === 'sectorial' && (
                <div className="form-group">
                  <label>Sector Asociado</label>
                  <select name="sector" value={formData.sector} onChange={handleChange} className="form-input"><option value="">Seleccione sector...</option>{catalogos.cat_sector.map(item => (<option key={item.id} value={item.id}>{item.etiqueta}</option>))}</select>
                </div>
              )}
              {formData.eje === 'desempeno' && (
                <div className="form-group">
                  <label>Horizonte de Planeación</label>
                  <select name="horizonte" value={formData.horizonte} onChange={handleChange} className="form-input"><option value="">Seleccione horizonte...</option>{catalogos.cat_horizonte.map(item => (<option key={item.id} value={item.id}>{item.etiqueta}</option>))}</select>
                </div>
              )}

              <div className="form-group">
                <label>Restricciones de Uso</label>
                <select name="restriccion" value={formData.restriccion} onChange={handleChange} className="form-input"><option value="">Seleccione...</option><option value="publico">Público</option><option value="restringido">Restringido</option></select>
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label>Fuente (Institución Pública)</label>
                  <select name="institucion" value={formData.institucion} onChange={handleChange} className="form-input">
                    <option value="">Seleccione institución...</option>
                    {catalogos.cat_instituciones.map(item => (<option key={item.id} value={item.id}>{item.etiqueta}</option>))}
                  </select>
                </div>
                <div>
                  <label>Año</label>
                  <select name="anio" value={formData.anio} onChange={handleChange} className="form-input">
                    <option value="">Año...</option>
                    {catalogos.cat_anios.map(item => (<option key={item.id} value={item.id}>{item.etiqueta}</option>))}
                  </select>
                </div>
              </div>

            </div>
          )}

          {/* PASO 3: VALIDACIÓN SQL */}
          {step === 3 && (
            <div className="wizard-step">
              <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--c-guinda-dk)' }}><FileText size={18} /> 3. Ficha Técnica y Validación de Datos</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Revise el indicador y la clasificación capturada antes de enviar a revisión institucional.</p>

              <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}><td style={{ padding: '10px 14px', background: '#F9FAFB', width: '38%', fontWeight: '600', color: '#4B5563' }}>Indicador SESIM:</td><td style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--c-guinda)' }}>{etiquetaIndicador || 'No especificado'}</td></tr>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}><td style={{ padding: '10px 14px', background: '#F9FAFB', fontWeight: '600', color: '#4B5563' }}>Nombre de la Capa:</td><td style={{ padding: '10px 14px' }}>{formData.nombreCapa || archivo?.name || 'No especificado'}</td></tr>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}><td style={{ padding: '10px 14px', background: '#F9FAFB', fontWeight: '600', color: '#4B5563' }}>Escala Territorial:</td><td style={{ padding: '10px 14px', color: '#6B7280' }}>{etiquetaCobertura || 'No especificada'}</td></tr>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}><td style={{ padding: '10px 14px', background: '#F9FAFB', fontWeight: '600', color: '#4B5563' }}>Instrumento de Origen:</td><td style={{ padding: '10px 14px', color: '#6B7280' }}>{etiquetaInstrumento || 'No especificado'}</td></tr>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}><td style={{ padding: '10px 14px', background: '#F9FAFB', fontWeight: '600', color: '#4B5563' }}>Periodicidad:</td><td style={{ padding: '10px 14px', color: '#6B7280' }}>{etiquetaPeriodicidad || 'No especificada'}</td></tr>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}><td style={{ padding: '10px 14px', background: '#F9FAFB', fontWeight: '600', color: '#4B5563' }}>Eje de Evaluación:</td><td style={{ padding: '10px 14px', color: '#6B7280' }}>{etiquetaEje || 'No especificado'}{formData.eje === 'sectorial' && etiquetaSector ? ` — ${etiquetaSector}` : ''}{formData.eje === 'desempeno' && etiquetaHorizonte ? ` — ${etiquetaHorizonte}` : ''}</td></tr>
                    <tr><td style={{ padding: '10px 14px', background: '#F9FAFB', fontWeight: '600', color: '#4B5563' }}>Fuente:</td><td style={{ padding: '10px 14px', color: '#6B7280' }}>{etiquetaInstitucion || 'No especificada'}{formData.anio ? `, ${formData.anio}` : ''}</td></tr>
                  </tbody>
                </table>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Para proteger la integridad de la base de datos, su archivo debe cumplir con los lineamientos del diccionario de datos.</p>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead style={{ background: 'var(--c-bg)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                    <tr><th style={{ padding: '10px 12px' }}>Campo</th><th style={{ padding: '10px 12px' }}>Esperado</th><th style={{ padding: '10px 12px' }}>Detectado</th><th style={{ padding: '10px 12px', textAlign: 'center' }}>Estatus</th></tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px dashed #E5E7EB' }}><td style={{ padding: '10px 12px', fontWeight: '600', fontFamily: 'monospace' }}>cve_ent</td><td style={{ padding: '10px 12px', color: '#3B82F6' }}>Texto</td><td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>cve_ent</td><td style={{ padding: '10px 12px', textAlign: 'center', color: '#10B981' }}>✅</td></tr>
                    <tr style={{ background: '#FEF2F2' }}><td style={{ padding: '10px 12px', fontWeight: '600', fontFamily: 'monospace' }}>poblacion</td><td style={{ padding: '10px 12px', color: '#10B981' }}>Numérico</td><td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#DC2626' }}>Texto</td><td style={{ padding: '10px 12px', textAlign: 'center', color: '#DC2626' }}>❌</td></tr>
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '16px', padding: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', fontSize: '12px', color: '#991B1B', lineHeight: '1.4' }}>
                <strong><AlertTriangle size={14} style={{ display: 'inline', marginBottom: '-2px' }}/> Error:</strong> La estructura no coincide. Por favor, <strong>corrija la tabla de atributos</strong> y vuelva a intentarlo.
              </div>
            </div>
          )}
        </div>

        <div className="modal-drawer-footer">
          {step > 1 ? (
            <button className="btn-base btn-secondary" onClick={handleBack} style={{ width: 'auto' }}>
              <ArrowLeft size={16} /> Atrás
            </button>
          ) : <div></div>}

          {step < 3 ? (
            <button
              className="btn-base btn-primary"
              onClick={handleNext}
              disabled={step === 1 && (!epsgConfirmed || !archivo || !documento)}
              style={{ width: 'auto' }}
            >
              Siguiente <ArrowRight size={16} />
            </button>
          ) : (
            <button
              className="btn-base btn-primary"
              onClick={handleSubmit}
              style={{ width: 'auto', background: 'var(--status-aprobado)' }}
            >
              <CheckCircle size={16} /> Verificar en geovisualizador
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default CapturistaModal;
