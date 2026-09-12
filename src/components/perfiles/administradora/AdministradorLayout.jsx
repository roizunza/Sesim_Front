/**
 * Desbloqueado (Ciclo de "ajustes transversales" — ver
 * `claude/front-consolidacion-react-d-sim-front.md`): ya se importa y
 * enruta desde `AdminMapViewer.jsx` para el rol `administrador`.
 *
 * Mismo criterio de honestidad que Capturista: el usuario actual sale de
 * `useAuth()` (ya no `CURRENT_USER` simulado) y las solicitudes se piden
 * con `listarSolicitudes()` (ya no `REGISTROS_INICIALES` hardcodeado) —
 * hoy vuelve `[]` porque el backend de Ciclo 8 (flujos de
 * captura/revisión/dictamen) todavía no existe, así que "aprobar/rechazar"
 * aquí abajo solo actualiza el estado en memoria del navegador, no
 * persiste en Supabase todavía.
 */

import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, ScaleControl, Polyline, Marker, Tooltip, useMapEvents, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import AdministradorSidebar from './AdministradorSidebar';
import EsriBasemap from '../../geovisor/EsriBasemap';
import DashboardKPIs from './DashboardKPIs';
import PanelDictamen from './PanelDictamen';
import BitacoraCuentas from '../../bitacora/BitacoraCuentas';
import GestionUsuarios from './GestionUsuarios';
import { Download, Table, Play, Map, List, Plus, Minus, Ruler, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import '../../geovisor/AdminMapViewer.css';
import '../capturista/Capturista.css';
import './Admin.css';
import catalogos from '../../plataforma/catalogos_sesim.json';
import { getIndicadorLabel } from '../../plataforma/registrosSESIM';
import { ESTATUS, listarSolicitudes } from '../../../lib/solicitudes';
import { useAuth } from '../../../lib/auth';

const MapInstanceCapture = ({ setMapInstance }) => {
  const map = useMap();
  useEffect(() => { setMapInstance(map); }, [map, setMapInstance]);
  return null;
};

const MeasureTool = ({ isMeasuring }) => {
  const [points, setPoints] = useState([]);
  const [distance, setDistance] = useState(0);

  useMapEvents({
    click(e) {
      if (!isMeasuring) return;
      const newPoints = [...points, e.latlng];
      setPoints(newPoints);
      if (newPoints.length > 1) {
        let dist = 0;
        for (let i = 0; i < newPoints.length - 1; i++) {
          dist += newPoints[i].distanceTo(newPoints[i + 1]);
        }
        setDistance(dist);
      }
    }
  });

  useEffect(() => { if (!isMeasuring) { setPoints([]); setDistance(0); } }, [isMeasuring]);

  if (!isMeasuring || points.length === 0) return null;
  const dotIcon = L.divIcon({ className: 'measure-dot', iconSize: [10, 10] });

  return (
    <>
      <Polyline positions={points} color="#6b1428" weight={3} dashArray="5, 10" />
      {points.map((p, i) => (
        <Marker key={i} position={p} icon={dotIcon}>
          {i === points.length - 1 && points.length > 1 && (
            <Tooltip permanent direction="right" offset={[10, 0]} className="measure-tooltip">
              {(distance / 1000).toFixed(2)} km
            </Tooltip>
          )}
        </Marker>
      ))}
    </>
  );
};

// Previsualización de referencia (mismo patrón que CapturistaLayout): un
// polígono fijo de ejemplo que solo marca "aquí aparecería la capa
// seleccionada/generada" en el mapa mientras se audita un registro o se
// genera un tablero — no es la geometría real de ningún registro (todavía
// no hay backend de solicitudes/reportes, Ciclo 8) ni se leen sus
// `properties` en ningún lado de esta pantalla.
const mockGeoJSONData = {
  type: "FeatureCollection",
  features: [{
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [[[-90.58, 19.82], [-90.48, 19.82], [-90.48, 19.88], [-90.58, 19.88], [-90.58, 19.82]]] }
  }]
};

const CAMPECHE_BOUNDS = [[13.5, -97.0], [25.0, -83.0]];

const AdministradorLayout = () => {
  const { user, perfil } = useAuth();
  const nombreAdministrador = perfil?.nombre || user?.email || 'Administrador';
  const [mapInstance, setMapInstance] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dashboardActivo, setDashboardActivo] = useState(false);
  const [isDictamenOpen, setIsDictamenOpen] = useState(false);
  // Nuevas pantallas (ver claude/ciclo-1-reporte-avance.md, paso 9):
  // gestión de usuarios (alta/edición de rol/baja) y bitácora de cuentas.
  // Corrección de Ismael: "Gestión de usuarios" es EXCLUSIVA de
  // administrador_vip (no solo el alta dentro de ella, como se pensó al
  // principio) — el administrador normal ya no tiene ni el botón en el
  // sidebar (ver AdministradorSidebar.jsx) ni, por si acaso llegara a
  // activarse el estado, el render de abajo. "Bitácora de cuentas" sí sigue
  // visible para ambos.
  const esVip = perfil?.rol === 'administrador_vip';
  const [gestionUsuariosActiva, setGestionUsuariosActiva] = useState(false);
  const [bitacoraCuentasActiva, setBitacoraCuentasActiva] = useState(false);

  const [indicadorFiltro, setIndicadorFiltro] = useState('');
  const [capaSimulada, setCapaSimulada] = useState('');
  const [capaActivaAuditoria, setCapaActivaAuditoria] = useState('');

  // El Administrador tiene ámbito institucional: ve TODOS los
  // municipios (a diferencia del Capturista, que solo ve el suyo). Mismo
  // origen de datos (`listarSolicitudes()`, ver src/lib/solicitudes.js)
  // que usa Capturista — hoy vuelve vacío honestamente porque el backend
  // de solicitudes/dictamen (Ciclo 8) todavía no existe.
  const [registros, setRegistros] = useState([]);

  useEffect(() => {
    listarSolicitudes().then(setRegistros);
  }, []);

  const cartografiaList = registros.filter(r => r.tipo === 'cartografia');
  const instrumentosList = registros.filter(r => r.tipo === 'instrumento');
  const registroActivo = registros.find(r => r.id === capaActivaAuditoria) || null;

  const [mapaBaseOpen, setMapaBaseOpen] = useState(false);
  // 'claro' | 'satelite' — servidas por Esri (EsriBasemap), sin API key.
  const [activeBaseMap, setActiveBaseMap] = useState('claro');
  const [isMeasuring, setIsMeasuring] = useState(false);

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


  const handleGenerarTablero = () => {
    // El tablero generado refleja el indicador SESIM elegido en el
    // filtro inferior; si no se eligió ninguno, cae en un rótulo
    // genérico de referencia estatal.
    setCapaSimulada(indicadorFiltro ? getIndicadorLabel(indicadorFiltro) : 'Red de Movilidad Estatal');
    setDashboardActivo(true);
  };

  const handleSelectCapaAuditoria = (id) => {
    setCapaActivaAuditoria(id);
    setIsDictamenOpen(true);
    if (mapInstance) mapInstance.flyTo([19.85, -90.53], 12, { duration: 1.5 });
  };

  const procesarDictamen = (decision, comentario) => {
    const nuevoEstatus = decision === 'aprobar' ? ESTATUS.APROBADO : ESTATUS.RECHAZADO;
    setRegistros(prev => prev.map(r => {
      if (r.id !== capaActivaAuditoria) return r;
      return {
        ...r,
        estatus: nuevoEstatus,
        // El comentario de rechazo se conserva en el propio registro
        // (no se descarta) para que quede visible como motivo del
        // dictamen en la bandeja del Capturista.
        comentario: comentario || undefined,
        bitacora: [
          ...r.bitacora,
          {
            fecha: new Date().toISOString(),
            usuario: `Administrador (${nombreAdministrador})`,
            rol: 'Administrador',
            accion: decision === 'aprobar' ? 'aprobacion' : 'rechazo',
            comentario: comentario || (decision === 'aprobar' ? 'Elemento aprobado y publicado en el tablero operativo.' : 'Elemento rechazado.'),
          },
        ],
      };
    }));
    setIsDictamenOpen(false);
    setCapaActivaAuditoria('');
  };

  return (
    <div className="dashboard-fullscreen-container">

      <div className={`dashboard-map-area ${isMeasuring ? 'measuring-mode' : ''}`}>

        <div className="draggable-wrapper" style={{ left: `${herramientasPos.x}px`, top: `${herramientasPos.y}px`, position: 'absolute', zIndex: 1000, display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '8px' }}>

          <div className="floating-panel" style={{ position: 'relative', top: 'auto', left: 'auto', width: '280px', margin: 0 }}>
            <div className="panel-header drag-handle" onMouseDown={handleMouseDown}>
              <List size={18} /><h4>Herramientas del Mapa</h4>
            </div>

            <div className="panel-content" style={{ borderBottom: '1px solid var(--surface-border)' }}>
              <h5 className="panel-section-title">Simbología Activa</h5>
              {capaActivaAuditoria || capaSimulada ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <div style={{ width: '16px', height: '16px', backgroundColor: 'rgba(245, 158, 11, 0.4)', border: '2px solid #F59E0B', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {capaActivaAuditoria || capaSimulada}
                  </span>
                </div>
              ) : (
                <p className="text-muted" style={{ margin: 0 }}>Seleccione o genere una capa.</p>
              )}
            </div>

            <div style={{ padding: '16px', borderBottom: '1px solid var(--surface-border)' }}>
              <button className="btn-base btn-tertiary">
                <Printer size={16} /> Imprimir Plano
              </button>
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

          <div className="external-toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button onClick={() => mapInstance?.zoomIn()} title="Acercar"><Plus size={16} /></button>
            <button onClick={() => mapInstance?.zoomOut()} title="Alejar"><Minus size={16} /></button>
            <button className={isMeasuring ? 'active' : ''} onClick={() => setIsMeasuring(!isMeasuring)} title="Medir distancia"><Ruler size={16} /></button>
          </div>
        </div>

        <MapContainer center={[19.3, -90.5]} zoom={8} minZoom={7} maxBounds={CAMPECHE_BOUNDS} zoomControl={false} style={{ width: '100%', height: '100%', zIndex: 1 }} preferCanvas={true}>
          <MapInstanceCapture setMapInstance={setMapInstance} />
          <EsriBasemap type={activeBaseMap} opacity={1} />
          {(capaActivaAuditoria || dashboardActivo) && (
            <GeoJSON
              key={capaActivaAuditoria || capaSimulada}
              data={mockGeoJSONData}
              pathOptions={{ color: '#F59E0B', weight: 4, fillColor: '#F59E0B', fillOpacity: 0.3 }}
            />
          )}
          <ScaleControl position="bottomleft" imperial={false} />
          <MeasureTool isMeasuring={isMeasuring} />
        </MapContainer>
      </div>

      <div className="floating-sidebar-wrapper">
        <AdministradorSidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          cartografiaList={cartografiaList}
          instrumentosList={instrumentosList}
          onSelectCapa={handleSelectCapaAuditoria}
          capaActiva={capaActivaAuditoria}
          onToggleGestionUsuarios={() => setGestionUsuariosActiva((v) => !v)}
          gestionUsuariosActiva={gestionUsuariosActiva}
          onToggleBitacoraCuentas={() => setBitacoraCuentasActiva((v) => !v)}
          bitacoraCuentasActiva={bitacoraCuentasActiva}
        />
      </div>

      {esVip && gestionUsuariosActiva && (
        <GestionUsuarios onClose={() => setGestionUsuariosActiva(false)} />
      )}

      {bitacoraCuentasActiva && (
        <BitacoraCuentas
          onClose={() => setBitacoraCuentasActiva(false)}
          descripcion="Altas, cambios de rol/ámbito y bajas de cuentas capturista y las tuyas propias."
        />
      )}

      <PanelDictamen
        registro={registroActivo}
        isOpen={isDictamenOpen}
        onClose={() => setIsDictamenOpen(false)}
        onDictamen={procesarDictamen}
      />

      {dashboardActivo && (
        <div className="floating-right-panel" style={{ background: 'transparent', border: 'none', backdropFilter: 'none', boxShadow: 'none' }}>
          <DashboardKPIs indicador={capaSimulada} />
        </div>
      )}

      <div className="fullwidth-bottom-banner" style={{ left: isSidebarOpen ? '280px' : '0', transition: 'left 0.3s ease' }}>
        <div className="banner-filter-row">

          <div className="filter-group">
            <label>Instrumento Normativo</label>
            <select>
              <option value="">Seleccione instrumento...</option>
              {catalogos.cat_instrumento.map(item => (<option key={item.id} value={item.id}>{item.etiqueta}</option>))}
            </select>
          </div>

          <div className="filter-group">
            <label>Escala Territorial</label>
            <select>
              <option value="">Seleccione escala...</option>
              {catalogos.cat_cobertura.map(item => (<option key={item.id} value={item.id}>{item.etiqueta}</option>))}
            </select>
          </div>

          <div className="filter-group">
            <label>Eje de Evaluación</label>
            <select>
              <option value="">Seleccione eje...</option>
              {catalogos.cat_eje_evaluacion.map(item => (<option key={item.id} value={item.id}>{item.etiqueta}</option>))}
            </select>
          </div>

          <div className="filter-group">
            <label>Indicador</label>
            <select value={indicadorFiltro} onChange={(e) => setIndicadorFiltro(e.target.value)}>
              <option value="">Seleccione indicador...</option>
              {catalogos.cat_indicadores.map(item => (<option key={item.id} value={item.id}>{item.etiqueta}</option>))}
            </select>
          </div>

          <div className="filter-buttons-column">
            <button className="btn-base btn-primary" onClick={handleGenerarTablero}>
              <Play size={16} fill="currentColor" /> Generar
            </button>
            <button className="btn-base btn-secondary">
              <Table size={16} /> Ver tabla de atributos
            </button>
            <button className="btn-base btn-tertiary">
              <Download size={16} /> Exportar
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

export default AdministradorLayout;
