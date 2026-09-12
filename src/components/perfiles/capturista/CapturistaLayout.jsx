import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, ScaleControl, Polyline, Marker, Tooltip, useMapEvents, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { Map, List, Plus, Minus, Ruler, ChevronDown, ChevronUp } from 'lucide-react';
import CapturistaSidebar from './CapturistaSidebar';
import CapturistaModal from './CapturistaModal';
import BitacoraCuentas from '../../bitacora/BitacoraCuentas';
import EsriBasemap from '../../geovisor/EsriBasemap';
import { ESTATUS, listarSolicitudes } from '../../../lib/solicitudes';
import { useAuth } from '../../../lib/auth';
import 'leaflet/dist/leaflet.css';
import '../../geovisor/AdminMapViewer.css';
import '../administradora/Admin.css';

/* Helper para capturar la instancia del mapa */
const MapInstanceCapture = ({ setMapInstance }) => {
  const map = useMap();
  useEffect(() => { setMapInstance(map); }, [map, setMapInstance]);
  return null;
};

/* Componente para la herramienta de medicion lineal (sin cambios) */
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
      <Polyline positions={points} color="#9F2241" weight={3} dashArray="5, 10" />
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

// Previsualización temporal de la capa recién cargada mientras se "verifica"
// en el mapa antes de enviarla a revisión. Sigue siendo un polígono fijo de
// ejemplo (no la geometría real del archivo subido) porque todavía no hay
// parseo real de GeoJSON/KML/GPKG del lado del cliente ni backend que lo
// reciba — se deja igual que en la maqueta original, marcado aquí para que
// no se confunda con datos reales.
const mockGeoJSONData = {
  type: "FeatureCollection",
  features: [{
    type: "Feature",
    properties: { id: 1, tipo: "Área de Estudio" },
    geometry: { type: "Polygon", coordinates: [[[-90.58, 19.82], [-90.48, 19.82], [-90.48, 19.88], [-90.58, 19.88], [-90.58, 19.82]]] }
  }]
};

const CAMPECHE_BOUNDS = [[13.5, -97.0], [25.0, -83.0]];

const CapturistaLayout = () => {
  const { user, perfil } = useAuth();
  const [mapInstance, setMapInstance] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [nombreCapaActiva, setNombreCapaActiva] = useState('');
  // Bitácora de cuentas (Ciclo 1, paso 6): historial de altas/cambios de rol
  // o ámbito/bajas SOBRE LA PROPIA CUENTA del capturista. Mismo componente
  // compartido (BitacoraCuentas) que usan administrador/administrador_vip/
  // auditor — RLS en el backend ya garantiza que el capturista solo vea
  // entradas donde él mismo es la cuenta afectada.
  //
  // Antes existía además un botón separado de "Bitácora" (ligado a
  // CapturistaBitacora, el historial de SOLICITUDES de cartografía del
  // Ciclo 5) — Ismael reportó que aparecían dos botones de bitácora
  // duplicados en este perfil; se quitó ese, dejando solo este, que es el
  // que comparte universo/diseño con Administrador y Auditor.
  const [cuentaActiva, setCuentaActiva] = useState(false);

  // El manejo de la plataforma es solo estatal por ahora (Ciclo 1): no hay
  // filtrado por municipio a nivel de credenciales todavía. Ese filtrado
  // vive en los datos (cve_mun de core.observacion/core.capa) y llega en
  // Ciclo 3+; por eso aquí no se filtra por municipio como hacía la
  // maqueta original con `filtrarPorMunicipio`.
  const [registros, setRegistros] = useState([]);
  const [actionLog, setActionLog] = useState('');

  useEffect(() => {
    listarSolicitudes().then(setRegistros);
  }, []);

  const [mapaBaseOpen, setMapaBaseOpen] = useState(false);
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

  const nombreCapturista = perfil?.nombre || user?.email || 'Capturista';

  // Paso final del wizard de Cartografía (CapturistaModal): crea el
  // registro en estatus BORRADOR ligado al indicador SESIM elegido, y lo
  // deja listo para previsualizar en el geovisualizador.
  //
  // Nota: esto sigue viviendo solo en memoria del navegador (useState), no
  // se persiste en Supabase todavía — el backend aún no expone una tabla de
  // solicitudes (ver src/lib/solicitudes.js). En cuanto exista, este handler
  // cambia para hacer un INSERT real en vez de anteponer al arreglo local.
  const handleVerifyLayer = (datosFormulario) => {
    const nombreArchivo = datosFormulario.archivo;
    const nuevoRegistro = {
      id: nombreArchivo,
      tipo: 'cartografia',
      ...datosFormulario,
      capturista: nombreCapturista,
      estatus: ESTATUS.BORRADOR,
      bitacora: [{
        fecha: new Date().toISOString(),
        usuario: `Capturista (${nombreCapturista})`,
        rol: 'Capturista',
        accion: 'carga',
        comentario: `Carga inicial: archivo espacial y expediente técnico de "${nombreArchivo}" retenidos en memoria local.`,
      }],
    };
    setNombreCapaActiva(nombreArchivo);
    setRegistros(prev => [nuevoRegistro, ...prev]);
    setActionLog(`Carga inicial: Archivos físicos y PDF técnico de "${nombreArchivo}" retenidos en memoria local.`);
    setIsModalOpen(false);
    setIsVerifying(true);
    if (mapInstance) mapInstance.flyTo([19.85, -90.53], 12, { duration: 1.5 });
  };

  const handleFinalSubmit = () => {
    if (nombreCapaActiva) {
      setRegistros(prev => prev.map(r => r.id === nombreCapaActiva
        ? {
            ...r,
            estatus: ESTATUS.REVISION,
            bitacora: [...r.bitacora, {
              fecha: new Date().toISOString(),
              usuario: `Capturista (${nombreCapturista})`,
              rol: 'Capturista',
              accion: 'envio',
              comentario: `Confirmación EPSG:4326 y visualización: "${nombreCapaActiva}" enviada a revisión institucional.`,
            }],
          }
        : r
      ));
      setActionLog(`Confirmación EPSG y visualización: "${nombreCapaActiva}" enviada a revisión institucional.`);
    }
    setIsVerifying(false);
    setNombreCapaActiva('');
    if (mapInstance) mapInstance.flyTo([19.3, -90.5], 8, { duration: 1.5 });
  };

  return (
    <div className="dashboard-fullscreen-container">
      <div className={`dashboard-map-area ${isMeasuring ? 'measuring-mode' : ''}`}>

        <div className="draggable-wrapper" style={{ left: `${herramientasPos.x}px`, top: `${herramientasPos.y}px`, position: 'absolute', zIndex: 1000, display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '8px' }}>
          <div className="floating-panel" style={{ position: 'relative', top: 'auto', left: 'auto', width: '280px', margin: 0 }}>
            <div className="panel-header drag-handle" onMouseDown={handleMouseDown}>
              <List size={18} /><h4>Herramientas del Mapa</h4>
            </div>

            <div className="panel-content" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h5 className="panel-section-title">Simbología Activa</h5>
              {isVerifying ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    <div style={{ width: '16px', height: '16px', backgroundColor: 'rgba(159, 34, 65, 0.4)', border: '2px solid var(--c-guinda)', borderRadius: '2px' }}></div>
                    <span style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={nombreCapaActiva}>
                      {nombreCapaActiva}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '24px' }}>Capa Vectorial (EPSG:4326)</span>
                </div>
              ) : (
                <p className="text-muted" style={{ margin: 0 }}>No hay capas cargadas en previsualización.</p>
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

          <div className="external-toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button onClick={() => mapInstance?.zoomIn()} title="Acercar"><Plus size={16} /></button>
            <button onClick={() => mapInstance?.zoomOut()} title="Alejar"><Minus size={16} /></button>
            <button className={isMeasuring ? 'active' : ''} onClick={() => setIsMeasuring(!isMeasuring)} title="Medir distancia"><Ruler size={16} /></button>
          </div>
        </div>

        <MapContainer center={[19.3, -90.5]} zoom={8} minZoom={7} maxBounds={CAMPECHE_BOUNDS} zoomControl={false} style={{ width: '100%', height: '100%', zIndex: 1 }} preferCanvas={true}>
          <MapInstanceCapture setMapInstance={setMapInstance} />
          <EsriBasemap type={activeBaseMap} opacity={1} />
          {isVerifying && (
            <GeoJSON
              key={nombreCapaActiva}
              data={mockGeoJSONData}
              pathOptions={{ color: '#9F2241', weight: 2, fillColor: '#9F2241', fillOpacity: 0.4 }}
            />
          )}
          <ScaleControl position="bottomleft" imperial={false} />
          <MeasureTool isMeasuring={isMeasuring} />
        </MapContainer>
      </div>

      <div className="floating-sidebar-wrapper">
        <CapturistaSidebar
          isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
          onOpenModal={() => setIsModalOpen(true)}
          isVerifying={isVerifying} onFinalSubmit={handleFinalSubmit}
          registros={registros} actionLog={actionLog}
          cuentaActiva={cuentaActiva} onToggleCuenta={() => setCuentaActiva(prev => !prev)}
        />
      </div>

      <CapturistaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onVerify={handleVerifyLayer} />

      {cuentaActiva && (
        <BitacoraCuentas
          onClose={() => setCuentaActiva(false)}
          descripcion="Historial de tu propia cuenta: alta, cambios de rol o ámbito, bajas/reactivaciones. No incluye la actividad de otras cuentas."
        />
      )}

    </div>
  );
};

export default CapturistaLayout;
