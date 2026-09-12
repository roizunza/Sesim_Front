/**
 * Desbloqueado (Ciclo de "ajustes transversales" — ver
 * `claude/front-consolidacion-react-d-sim-front.md`): ya se importa y
 * enruta desde `AdminMapViewer.jsx` para los roles `auditor`.
 *
 * Mismo criterio de honestidad que Capturista y Administrador: las
 * solicitudes se piden con `listarSolicitudes()` (ver
 * src/lib/solicitudes.js) — hoy vuelve `[]` porque el backend de Ciclo 8
 * (flujos de captura/revisión/dictamen) todavía no existe, así que la
 * bandeja y la línea de tiempo se ven honestamente vacías hasta entonces.
 */

import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, ScaleControl, GeoJSON, useMap } from 'react-leaflet';
import AuditorSidebar from './AuditorSidebar';
import EsriBasemap from '../../geovisor/EsriBasemap';
import BitacoraCuentas from '../../bitacora/BitacoraCuentas';
import { Download, UploadCloud, XCircle, CheckCircle, RefreshCw, List, Map, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import '../../geovisor/AdminMapViewer.css';
import '../capturista/Capturista.css';
import '../administradora/Admin.css';
import './Auditor.css';
import { listarSolicitudes } from '../../../lib/solicitudes';

/* Helper para capturar la instancia del mapa */
const MapInstanceCapture = ({ setMapInstance }) => {
  const map = useMap();
  useEffect(() => { setMapInstance(map); }, [map, setMapInstance]);
  return null;
};

const MapFlyTo = ({ capaActiva }) => {
  const map = useMap();
  useEffect(() => {
    if (capaActiva) map.flyTo([19.83, -90.54], 11, { duration: 1.5 });
  }, [capaActiva, map]);
  return null;
};

const ICONO_POR_ACCION = {
  aprobacion: { Icono: CheckCircle, clase: 'approve' },
  rechazo: { Icono: XCircle, clase: 'reject' },
  carga: { Icono: UploadCloud, clase: 'upload' },
  envio: { Icono: UploadCloud, clase: 'upload' },
  correccion: { Icono: RefreshCw, clase: 'upload' },
};

const CAMPECHE_BOUNDS = [[13.5, -97.0], [25.0, -83.0]];

const AuditorLayout = () => {
  const [mapInstance, setMapInstance] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // El Auditor tiene visibilidad total (todos los municipios, todos los
  // registros), en modo solo-lectura. Mismo origen de datos
  // (`listarSolicitudes()`) que Capturista y Administrador consumen —
  // sin filtro de ámbito aquí porque el Auditor ve todo.
  const [registros, setRegistros] = useState([]);
  const [capaActivaAuditoria, setCapaActivaAuditoria] = useState('');
  // Bitácora de CUENTAS (Ciclo 1, paso 6) — solo lectura para el auditor:
  // ve capturista + administrador/administrador_vip + la suya (ver
  // sesim-backend/db/migrations/105_rls_bitacora.sql).
  const [bitacoraCuentasActiva, setBitacoraCuentasActiva] = useState(false);

  useEffect(() => {
    listarSolicitudes().then(setRegistros);
  }, []);

  const registroActivo = registros.find(r => r.id === capaActivaAuditoria) || null;

  /* Herramientas de Mapa */
  const [mapaBaseOpen, setMapaBaseOpen] = useState(false);
  // 'claro' | 'satelite' — servidas por Esri (EsriBasemap), sin API key.
  const [activeBaseMap, setActiveBaseMap] = useState('claro');

  /* Logica de arrastre de la caja de herramientas */
  const [herramientasPos, setHerramientasPos] = useState({ x: 300, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ startX: 0, startY: 0, x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartPos.current = { startX: e.clientX, startY: e.clientY, x: herramientasPos.x, y: herramientasPos.y };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setHerramientasPos({
        x: dragStartPos.current.x + (e.clientX - dragStartPos.current.startX),
        y: dragStartPos.current.y + (e.clientY - dragStartPos.current.startY)
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging]);

  const handleSelectCapa = (id) => {
    setCapaActivaAuditoria(id);
  };

  // La bitácora se ordena de más reciente a más antigua para la línea
  // de tiempo (mismo orden que ya tenía la maqueta original).
  const bitacoraOrdenada = registroActivo ? [...registroActivo.bitacora].reverse() : [];

  const formatearFecha = (isoString) => {
    try {
      return new Date(isoString).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="dashboard-fullscreen-container">

      {/* CAPA 1: MAPA MODO LECTURA */}
      <div className="dashboard-map-area">

        {/* CAJA DE HERRAMIENTAS UNIFICADA */}
        <div className="draggable-wrapper" style={{ left: `${herramientasPos.x}px`, top: `${herramientasPos.y}px`, position: 'absolute', zIndex: 1000, display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '8px' }}>

          <div className="floating-panel" style={{ position: 'relative', top: 'auto', left: 'auto', width: '280px', margin: 0 }}>
            <div className="panel-header drag-handle" onMouseDown={handleMouseDown}>
              <List size={18} /><h4>Herramientas del Mapa</h4>
            </div>

            <div className="panel-content" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h5 className="panel-section-title">Simbología Activa</h5>
              {registroActivo ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    <div style={{ width: '16px', height: '16px', backgroundColor: 'rgba(107, 114, 128, 0.4)', border: '2px solid #6B7280', borderRadius: '2px' }}></div>
                    <span style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={registroActivo.id}>
                      {registroActivo.id}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '24px' }}>Capa Histórica (Auditoría)</span>
                </div>
              ) : (
                <p className="text-muted" style={{ margin: 0 }}>Seleccione una capa para auditar.</p>
              )}
            </div>

            <div className="accordion-section">
              <button className="accordion-header" onClick={() => setMapaBaseOpen(!mapaBaseOpen)}>
                <div className="header-title"><Map size={16} /><span>Mapa Base</span></div>
                {mapaBaseOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <div className={`accordion-content ${mapaBaseOpen ? 'open' : ''}`}>
                <div className="base-map-grid" style={{ marginTop: '8px' }}>
                  <button className={`base-map-btn ${activeBaseMap === 'claro' ? 'active' : ''}`} onClick={() => setActiveBaseMap('claro')}>Mapa Claro</button>
                  <button className={`base-map-btn ${activeBaseMap === 'satelite' ? 'active' : ''}`} onClick={() => setActiveBaseMap('satelite')}>Vista Satelital</button>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de zoom */}
          <div className="external-toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button onClick={() => mapInstance?.zoomIn()} title="Acercar"><Plus size={16} /></button>
            <button onClick={() => mapInstance?.zoomOut()} title="Alejar"><Minus size={16} /></button>
          </div>
        </div>

        <MapContainer center={[19.3, -90.5]} zoom={8} minZoom={7} maxBounds={CAMPECHE_BOUNDS} zoomControl={false} style={{ width: '100%', height: '100%', zIndex: 1 }} preferCanvas={true}>
          <MapInstanceCapture setMapInstance={setMapInstance} />
          <EsriBasemap type={activeBaseMap} opacity={1} />
          <MapFlyTo capaActiva={capaActivaAuditoria} />
          {capaActivaAuditoria && (
            <GeoJSON
              key={capaActivaAuditoria}
              data={{ type: "Feature", geometry: { type: "Polygon", coordinates: [[[-90.58, 19.82], [-90.48, 19.82], [-90.48, 19.88], [-90.58, 19.88], [-90.58, 19.82]]] } }}
              pathOptions={{ color: '#6B7280', weight: 2, fillColor: '#6B7280', fillOpacity: 0.2 }}
            />
          )}
          <ScaleControl position="bottomleft" imperial={false} />
        </MapContainer>
      </div>

      {/* CAPA 2: SIDEBAR */}
      <div className="floating-sidebar-wrapper">
        <AuditorSidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          registros={registros}
          onSelectCapa={handleSelectCapa}
          capaActiva={capaActivaAuditoria}
          onToggleBitacoraCuentas={() => setBitacoraCuentasActiva((v) => !v)}
          bitacoraCuentasActiva={bitacoraCuentasActiva}
        />
      </div>

      {bitacoraCuentasActiva && (
        <BitacoraCuentas
          onClose={() => setBitacoraCuentasActiva(false)}
          descripcion="Altas, cambios de rol/ámbito y bajas de cuentas capturista, administrador y administrador VIP, además de la tuya propia."
        />
      )}

      {/* CAPA 3: PANEL DE TRAZABILIDAD (Línea de Tiempo) */}
      {registroActivo && (
        <div className="floating-right-panel" style={{ width: '400px', height: 'calc(100% - 48px)', bottom: '24px' }}>

          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="panel-section-title" style={{ margin: 0 }}>LOG DE ACTIVIDAD</span>
              <h3 style={{ margin: '4px 0 0', fontSize: '15px', color: 'var(--text-primary)' }}>{registroActivo.id}</h3>
            </div>
            {/* Aplicación del botón normalizado */}
            <button className="btn-base btn-tertiary" style={{ width: 'auto', padding: '0 12px', height: '36px' }}>
              <Download size={14} /> PDF
            </button>
          </div>

          <div className="timeline-container">
            {bitacoraOrdenada.map((entrada, i) => {
              const { Icono, clase } = ICONO_POR_ACCION[entrada.accion] || { Icono: UploadCloud, clase: 'upload' };
              return (
                <div className="timeline-item" key={i}>
                  <div className={`timeline-icon ${clase}`}><Icono size={16} /></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-user">{entrada.usuario}</span>
                      <span className="timeline-date">{formatearFecha(entrada.fecha)}</span>
                    </div>
                    {clase === 'reject' ? (
                      <p className="timeline-comment">"{entrada.comentario}"</p>
                    ) : (
                      <p style={{ margin: 0, fontSize: '13px' }}>{entrada.comentario}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default AuditorLayout;
