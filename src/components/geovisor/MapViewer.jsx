import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, GeoJSON, useMap } from 'react-leaflet';
import { ChevronLeft, ChevronRight, ChevronDown, Layers, Info, Camera } from 'lucide-react';
import L from 'leaflet';
import html2canvas from 'html2canvas';
import 'leaflet/dist/leaflet.css';
import './MapViewer.css';
import { cargarMapaBase, colorDeTema } from '../../lib/mapaBase';
import { toPathOptions, toPointLayer, toSwatchSvg } from '../../lib/leafletSymbology';
import { resolveLegend } from '../../lib/qgisSymbology';
import { cargarEjesEstrategicos, estiloPorGeometria } from '../../lib/ejesEstrategicos';
import { cargarDiagnostico, COLOR_RESPALDO_DIAGNOSTICO } from '../../lib/diagnostico';
import EsriBasemap from './EsriBasemap';
import CapaMetadataModal from './CapaMetadataModal';

/**
 * Control de opacidad de una capa (Mapa Base, Estrategias o Diagnóstico):
 * va debajo del nombre de la capa, no a su lado — de ancho completo, con una
 * etiqueta tenue arriba para no competir con el nombre. El botón de
 * metadatos vive aparte, en la fila del encabezado junto al nombre (ver
 * `capa-fila`); la simbología de cada capa activa se ve siempre en el
 * cuadro flotante de la esquina inferior derecha del mapa (ver
 * `leyenda-flotante` más abajo), no hace falta "seleccionar" una capa para
 * verla.
 */
const CapaControles = ({ opacidad, onOpacidad, etiqueta }) => (
  <div className="capa-opacidad-fila">
    <span className="capa-opacidad-etiqueta">Modificar transparencia</span>
    <input
      type="range"
      min="0"
      max="1"
      step="0.05"
      value={opacidad}
      onChange={(e) => onOpacidad(Number(e.target.value))}
      className="capa-opacidad-slider"
      aria-label={`Opacidad de ${etiqueta}`}
    />
  </div>
);

/**
 * Dibuja una capa activa: pide sus datos perezosamente (`capa.cargarDatos()`,
 * ver loaderCapas.js) recién al montarse — no antes, para no descargar de
 * un tirón las decenas de capas que pesan cientos de MB sin recortar — y
 * mientras tanto no dibuja nada. Con simbología real usa `capa.simboloDe`;
 * sin ella, cae al color de respaldo que le pase quien la use (por
 * Estrategia, por tema de Mapa Base, o el único de Diagnóstico).
 *
 * Único punto para las tres categorías (Mapa Base, Estrategias, Diagnóstico):
 * antes esta misma rama simbología-real-vs-respaldo estaba repetida tres
 * veces en el render de MapViewer.
 */
const CapaGeoJSON = ({ capa, categoria, opacidad, colorRespaldo, onSeleccionarFeature, campoEtiqueta }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelado = false;
    capa.cargarDatos().then((d) => {
      if (!cancelado) setData(d);
    });
    return () => {
      cancelado = true;
    };
  }, [capa]);

  if (!data) return null;

  const onEachFeature = (feature, layer) => {
    layer.on('click', () =>
      onSeleccionarFeature({ archivo: capa.archivo, categoria, propiedades: feature.properties })
    );
    // Etiqueta de texto permanente sobre el mapa (p. ej. "NOMGEO" en
    // Municipios) — solo para las capas puntuales que lo piden vía
    // `campoEtiqueta` (ver `CAMPO_ETIQUETA_POR_CAPA`), no todas.
    const texto = campoEtiqueta ? feature.properties?.[campoEtiqueta] : null;
    if (texto) {
      layer.bindTooltip(String(texto), {
        permanent: true,
        direction: 'center',
        className: 'capa-etiqueta-mapa',
      });
    }
  };

  if (capa.tieneSimbologia ?? true) {
    return (
      <GeoJSON
        data={data}
        filter={(feature) => capa.simboloDe(feature.properties) !== null}
        style={(feature) => toPathOptions(capa.simboloDe(feature.properties), opacidad)}
        pointToLayer={(feature, latlng) =>
          toPointLayer(capa.simboloDe(feature.properties), latlng, opacidad)}
        onEachFeature={onEachFeature}
      />
    );
  }

  const opciones = estiloPorGeometria(colorRespaldo, capa.geom, opacidad);
  return (
    <GeoJSON
      data={data}
      style={() => opciones}
      pointToLayer={
        capa.geom === 'point'
          ? (feature, latlng) => L.circleMarker(latlng, opciones)
          : undefined
      }
      onEachFeature={onEachFeature}
    />
  );
};

// Helper component to capture Leaflet map instance
const MapInstanceCapture = ({ setMapInstance }) => {
  const map = useMap();
  useEffect(() => {
    setMapInstance(map);
  }, [map, setMapInstance]);
  return null;
};

// Prioridad de dibujo por geometría: polígonos al fondo, líneas después,
// puntos hasta arriba — jerarquía cartográfica fija, no depende de la capa.
const ORDEN_GEOMETRIA = { polygon: 0, line: 1, point: 2 };

// Este grupo de Mapa Base (ver `ETIQUETA_POR_GRUPO` en mapaBase.js) se
// mantiene siempre encendido — a pedido explícito del usuario, el contexto
// de límites administrativos nunca debe poder apagarse.
const GRUPO_MAPA_BASE_FIJO = 'limites_administrativos';

// Capas de Mapa Base cuyas features llevan una etiqueta de texto permanente
// sobre el mapa (nombre del campo de sus `properties` a mostrar) — decisión
// editorial puntual pedida por el usuario, no algo derivable del CSV de
// QA/QC ni aplicable a todas las capas.
const CAMPO_ETIQUETA_POR_CAPA = {
  c04_municiipios_inegi_2024: 'nomgeo',
};

const CAMPECHE_BOUNDS = [
  [13.5, -97.0], // Amplio límite Sudoeste (Chiapas/Oaxaca/Golfo)
  [25.0, -83.0]  // Amplio límite Noreste (Yucatán/Caribe)
];

const MapViewer = () => {
  const [searchParams] = useSearchParams();
  const [mapInstance, setMapInstance] = useState(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [activeBaseLayer, setActiveBaseLayer] = useState('claro');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Mapa Base: 24 capas agrupadas en 4 subcategorías, tal cual el árbol de
  // capas del usuario (ver mapaBase.js) — mismo patrón que Diagnóstico:
  // ninguna activa por defecto (varias pesan cientos de MB sin recortar;
  // activarlas todas de un tirón agotaría la memoria del navegador) salvo
  // "Límites Administrativos", que se enciende sola y no se puede apagar
  // (ver `idsLimitesAdministrativos` y el useEffect más abajo) — el usuario
  // prende el resto de grupos o capas puntuales que necesite.
  const [mapaBase, setMapaBase] = useState(null);
  const [capasMapaBaseActivas, setCapasMapaBaseActivas] = useState(() => new Set());
  const [gruposMapaBaseAbiertos, setGruposMapaBaseAbiertos] = useState(() => new Set());

  // Ids de las capas de "Límites Administrativos" — siempre encendidas, no
  // se pueden apagar ni por su switch de grupo ni por el de cada capa.
  const idsLimitesAdministrativos = useMemo(() => {
    if (!mapaBase) return new Set();
    const grupo = mapaBase.find((g) => g.id === GRUPO_MAPA_BASE_FIJO);
    return new Set(grupo ? grupo.capas.map((c) => c.id) : []);
  }, [mapaBase]);

  // En cuanto el manifiesto de Mapa Base carga, se enciende el grupo fijo —
  // sin esperar a que el usuario lo active a mano.
  useEffect(() => {
    if (idsLimitesAdministrativos.size === 0) return;
    setCapasMapaBaseActivas((prev) => {
      const next = new Set(prev);
      idsLimitesAdministrativos.forEach((id) => next.add(id));
      return next;
    });
  }, [idsLimitesAdministrativos]);

  // Ejes Estratégicos de la EEMSV: 5 grupos, cada uno con sus capas GeoJSON.
  const [ejesEstrategicos, setEjesEstrategicos] = useState(null);
  // Ids de capa activas (únicos entre ejes: cada uno trae su prefijo, p.ej. "1det_…").
  const [capasEjeActivas, setCapasEjeActivas] = useState(() => new Set());
  // Qué grupos de Eje están expandidos en el panel (solo estado de UI).
  const [ejesAbiertos, setEjesAbiertos] = useState(() => new Set());

  // Diagnóstico de la EEMSV: 6 subcategorías, cada una con sus capas GeoJSON
  // (ver diagnostico.js — el agrupamiento viene 100% del manifiesto, no hay
  // ninguna lista de capas escrita a mano).
  const [diagnostico, setDiagnostico] = useState(null);
  const [capasDiagActivas, setCapasDiagActivas] = useState(() => new Set());
  const [subcategoriasAbiertas, setSubcategoriasAbiertas] = useState(() => new Set());

  const toggleCapaDiag = (capaId) => {
    setCapasDiagActivas((prev) => {
      const next = new Set(prev);
      if (next.has(capaId)) next.delete(capaId);
      else next.add(capaId);
      return next;
    });
  };

  const toggleSubcategoria = (subcategoria) => {
    const ids = subcategoria.capas.map((c) => c.id);
    const algunaActiva = ids.some((id) => capasDiagActivas.has(id));
    setCapasDiagActivas((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (algunaActiva ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const toggleSubcategoriaAbierta = (id) => {
    setSubcategoriasAbiertas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Opacidad por capa (0..1), tanto de Mapa Base como de Estrategias — clave
  // es el `id` de la capa. Por defecto 1 (opaca) si no se ha tocado el slider.
  const [opacidadPorCapa, setOpacidadPorCapa] = useState({});
  const getOpacidad = (id) => opacidadPorCapa[id] ?? 1;
  const setOpacidad = (id, valor) => setOpacidadPorCapa((prev) => ({ ...prev, [id]: valor }));

  // Properties del feature/capa que muestra el modal de metadatos; `null` = cerrado.
  const [capaParaModal, setCapaParaModal] = useState(null);

  const toggleCapaMapaBase = (capaId) => {
    if (idsLimitesAdministrativos.has(capaId)) return; // permanentemente encendida
    setCapasMapaBaseActivas((prev) => {
      const next = new Set(prev);
      if (next.has(capaId)) next.delete(capaId);
      else next.add(capaId);
      return next;
    });
  };

  // El switch de cada grupo (Localidades y Asentamientos, etc.) enciende sus
  // capas si ninguna estaba activa, y las apaga todas si al menos una lo
  // estaba — mismo patrón que `toggleEje` y `toggleSubcategoria` de
  // Diagnóstico: cada grupo del árbol se prende por separado, no hay un
  // único interruptor maestro que active las 25 de golpe. "Límites
  // Administrativos" es la excepción: permanece siempre encendido (ver
  // `GRUPO_MAPA_BASE_FIJO`), su switch de grupo no hace nada.
  const toggleGrupoMapaBase = (grupo) => {
    if (grupo.id === GRUPO_MAPA_BASE_FIJO) return;
    const ids = grupo.capas.map((c) => c.id);
    const algunaActiva = ids.some((id) => capasMapaBaseActivas.has(id));
    setCapasMapaBaseActivas((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (algunaActiva ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const toggleGrupoMapaBaseAbierto = (grupoId) => {
    setGruposMapaBaseAbiertos((prev) => {
      const next = new Set(prev);
      if (next.has(grupoId)) next.delete(grupoId);
      else next.add(grupoId);
      return next;
    });
  };

  // `categoria` es el grupo/Estrategia/subcategoría al que pertenece la capa
  // (el mismo texto que ya se ve en el sidebar) — la ficha de metadatos lo
  // muestra como campo "Estrategia" junto con archivo/propósito/fuente.
  const abrirModal = (capa, categoria) => {
    capa.cargarDatos().then((data) => {
      setCapaParaModal({ archivo: capa.archivo, categoria, propiedades: data?.features?.[0]?.properties ?? null });
    });
  };

  const toggleCapaEje = (capaId) => {
    setCapasEjeActivas((prev) => {
      const next = new Set(prev);
      if (next.has(capaId)) next.delete(capaId);
      else next.add(capaId);
      return next;
    });
  };

  // El switch maestro del Eje enciende todas sus capas si ninguna estaba
  // activa, y las apaga todas si al menos una lo estaba.
  const toggleEje = (eje) => {
    const idsDelEje = eje.capas.map((c) => c.id);
    const algunaActiva = idsDelEje.some((id) => capasEjeActivas.has(id));
    setCapasEjeActivas((prev) => {
      const next = new Set(prev);
      idsDelEje.forEach((id) => (algunaActiva ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const toggleEjeAbierto = (ejeId) => {
    setEjesAbiertos((prev) => {
      const next = new Set(prev);
      if (next.has(ejeId)) next.delete(ejeId);
      else next.add(ejeId);
      return next;
    });
  };

  // Con cualquier capa de Estrategia activa, el Mapa Base (las capas GeoJSON
  // de abajo, no los tiles de Esri) se opaca al 30% para darle protagonismo
  // a los datos vectoriales de la Estrategia; sin ninguna activa vuelve a su
  // opacidad completa. (Corregido: la primera versión opacaba el mapa base
  // de Esri por confusión de nombres — "mapa base" se refería a las capas
  // GeoJSON, no al tile.)
  const mapaBaseGeoJsonOpacidad = useMemo(
    () => (capasEjeActivas.size > 0 ? 0.3 : 1),
    [capasEjeActivas]
  );

  // Orden de dibujo en el mapa: polígonos hasta abajo, líneas después,
  // puntos hasta arriba — sin importar de qué categoría venga cada capa
  // (Mapa Base, Estrategias o Diagnóstico), para que un polígono de una
  // categoría nunca tape una calle o un punto de otra solo por haberse
  // montado después. Se junta lo activo de las 3 categorías en una sola
  // lista y se ordena por geometría antes de dibujar — un único punto de
  // render en vez de 3 bloques independientes por categoría.
  const capasActivasOrdenadas = useMemo(() => {
    const lista = [];

    if (mapaBase) {
      for (const grupo of mapaBase) {
        for (const capa of grupo.capas) {
          if (capasMapaBaseActivas.has(capa.id)) {
            lista.push({
              key: `mb-${capa.id}`,
              capa,
              categoria: grupo.label,
              colorRespaldo: colorDeTema(capa.tema),
              opacidad: getOpacidad(capa.id) * mapaBaseGeoJsonOpacidad,
              campoEtiqueta: CAMPO_ETIQUETA_POR_CAPA[capa.id],
            });
          }
        }
      }
    }

    if (ejesEstrategicos) {
      for (const eje of ejesEstrategicos) {
        for (const capa of eje.capas) {
          if (capasEjeActivas.has(capa.id)) {
            lista.push({
              key: `eje-${capa.id}`,
              capa,
              categoria: eje.label,
              colorRespaldo: eje.color,
              opacidad: getOpacidad(capa.id),
            });
          }
        }
      }
    }

    if (diagnostico) {
      for (const subcategoria of diagnostico) {
        for (const capa of subcategoria.capas) {
          if (capasDiagActivas.has(capa.id)) {
            lista.push({
              key: `diag-${capa.id}`,
              capa,
              categoria: subcategoria.label,
              colorRespaldo: COLOR_RESPALDO_DIAGNOSTICO,
              opacidad: getOpacidad(capa.id),
            });
          }
        }
      }
    }

    return lista.sort(
      (x, y) => (ORDEN_GEOMETRIA[x.capa.geom] ?? 1) - (ORDEN_GEOMETRIA[y.capa.geom] ?? 1)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mapaBase,
    capasMapaBaseActivas,
    mapaBaseGeoJsonOpacidad,
    ejesEstrategicos,
    capasEjeActivas,
    diagnostico,
    capasDiagActivas,
    opacidadPorCapa,
  ]);

  // Deep-link desde las tarjetas de Estrategia en Inicio (`/geovisor?estrategia=ejeN`):
  // aísla esa Estrategia — apaga Mapa Base (salvo Límites Administrativos,
  // que permanece encendido siempre), prende solo las capas de esa
  // Estrategia y expande su grupo para que se vea de una vez. Depende de
  // `ejesEstrategicos` (el estado cargado, no el manifiesto estático) porque
  // necesita la lista real de ids de capa de ese Eje.
  useEffect(() => {
    const estrategiaId = searchParams.get('estrategia');
    if (!estrategiaId || !ejesEstrategicos) return;
    const eje = ejesEstrategicos.find((e) => e.id === estrategiaId);
    if (!eje) return;

    setCapasMapaBaseActivas(new Set(idsLimitesAdministrativos));
    setCapasEjeActivas(new Set(eje.capas.map((c) => c.id)));
    setEjesAbiertos(new Set([eje.id]));
    // Solo debe aplicarse al entrar con el parámetro, no en cada cambio de
    // searchParams por otras interacciones del usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, ejesEstrategicos]);

  // Descarga mock: hoy solo produce un .gpkg de relleno (no hay export real
  // de geodatos desde el navegador todavía), pero nombra el archivo según
  // cuántas capas activas hay en cada categoría para que el nombre diga algo.
  const handleDownloadActiveLayers = () => {
    try {
      const activeLayersList = [];
      if (capasMapaBaseActivas.size > 0) activeLayersList.push(`mapabase_${capasMapaBaseActivas.size}`);
      if (capasEjeActivas.size > 0) activeLayersList.push(`estrategias_${capasEjeActivas.size}`);
      if (capasDiagActivas.size > 0) activeLayersList.push(`diagnostico_${capasDiagActivas.size}`);

      const mockContent = new Uint8Array([0x47, 0x50, 0x4b, 0x47]);
      const blob = new Blob([mockContent], { type: 'application/geopackage+sqlite3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const layersString = activeLayersList.length > 0 ? activeLayersList.join('_') : 'capas_campeche';
      a.download = `capas_${layersString}.gpkg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar capas:", error);
    }
  };

  // Captura real del mapa (mapa base + todas las capas activas, tal cual se
  // ven en pantalla): html2canvas compone el DOM completo del contenedor de
  // Leaflet — tiles de Esri (imágenes), el canvas de las capas GeoJSON
  // (`preferCanvas`) y cualquier marcador — en un único PNG. `useCORS` es
  // necesario para que las imágenes de tiles de Esri no "manchen" el lienzo
  // resultante (si algún proveedor de tiles no manda cabeceras CORS, la
  // captura puede fallar; se reporta en consola en vez de fallar en
  // silencio, igual que la descarga de arriba).
  const handleScreenshot = async () => {
    if (!mapInstance) return;
    try {
      const contenedor = mapInstance.getContainer();
      const lienzo = await html2canvas(contenedor, { useCORS: true, logging: false });
      lienzo.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sesim_captura_mapa_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      console.error('Error al generar la captura del mapa:', error);
    }
  };

  useEffect(() => {
    cargarMapaBase()
      .then(capas => setMapaBase(capas))
      .catch(err => console.error("Error loading Mapa Base:", err));

    cargarEjesEstrategicos()
      .then(ejes => setEjesEstrategicos(ejes))
      .catch(err => console.error("Error loading Ejes Estratégicos:", err));

    cargarDiagnostico()
      .then(grupos => setDiagnostico(grupos))
      .catch(err => console.error("Error loading Diagnóstico:", err));
  }, []);

  return (
    <div className="map-container-wrapper">
      {/* Floating custom layers sidebar on the left */}
      <div className={`map-sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
        <button
          className="sidebar-toggle-btn"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Contraer panel" : "Expandir panel"}
        >
          {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>

        <div className="sidebar-header">
          <Layers size={20} className="header-icon" />
          <h3>Control de Capas</h3>
        </div>

        <div className="sidebar-section">
          <div className="section-title">
            <Layers size={14} />
            <span>Mapa Base</span>
          </div>
          <div className="overlay-options">
            {!mapaBase && <p className="text-muted">Cargando…</p>}
            {/* 4 grupos del árbol de capas (Límites Administrativos,
                Localidades y Asentamientos, Red de Transportes e
                Infraestructura, Medio Físico y Conservación) — cada uno se
                prende por separado, igual que Estrategias y Diagnóstico: no
                hay un único interruptor maestro que active las 24 de golpe. */}
            {mapaBase && mapaBase.map((grupo) => {
              const ids = grupo.capas.map((c) => c.id);
              const activo = ids.some((id) => capasMapaBaseActivas.has(id));
              const abierto = gruposMapaBaseAbiertos.has(grupo.id);
              const fijo = grupo.id === GRUPO_MAPA_BASE_FIJO;
              return (
                <div key={grupo.id} className="eje-group">
                  <div className="eje-group-header">
                    <label
                      className="switch-container"
                      title={fijo ? `${grupo.label} (siempre encendida)` : grupo.label}
                    >
                      <input
                        type="checkbox"
                        checked={activo}
                        disabled={fijo}
                        onChange={() => toggleGrupoMapaBase(grupo)}
                      />
                      <span className="switch-slider"></span>
                      <span className="switch-label">{grupo.label}</span>
                    </label>
                    <button
                      type="button"
                      className="eje-expand-btn"
                      onClick={() => toggleGrupoMapaBaseAbierto(grupo.id)}
                      aria-label={abierto ? 'Contraer capas' : 'Ver capas'}
                      title={abierto ? 'Contraer capas' : 'Ver capas'}
                    >
                      <ChevronDown size={14} style={{ transform: abierto ? 'rotate(180deg)' : 'none' }} />
                    </button>
                  </div>

                  {abierto && (
                    <div className="eje-sublayers">
                      {grupo.capas.map((capa) => (
                        <div key={capa.id} className="capa-fila">
                          <div className="capa-fila-encabezado">
                            <label
                              className="switch-container compact"
                              title={fijo ? `${capa.label} (siempre encendida)` : undefined}
                            >
                              <input
                                type="checkbox"
                                checked={capasMapaBaseActivas.has(capa.id)}
                                disabled={fijo}
                                onChange={() => toggleCapaMapaBase(capa.id)}
                              />
                              <span className="switch-slider"></span>
                              <span className="switch-label">{capa.label}</span>
                            </label>
                            <button
                              type="button"
                              className="capa-info-btn"
                              onClick={() => abrirModal(capa, grupo.label)}
                              title="Ver descripción y metadatos"
                              aria-label={`Ver descripción y metadatos de ${capa.label}`}
                            >
                              <Info size={13} />
                            </button>
                          </div>
                          <CapaControles
                            etiqueta={capa.label}
                            opacidad={getOpacidad(capa.id)}
                            onOpacidad={(v) => setOpacidad(capa.id, v)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Orden del control de capas: Mapa Base, Diagnóstico, Estrategias
            (Estrategias va al final, a pedido explícito del usuario). */}
        <div className="sidebar-section">
          <div className="section-title">
            <Layers size={14} />
            <span>Diagnóstico</span>
          </div>
          <div className="overlay-options">
            {!diagnostico && <p className="text-muted">Cargando…</p>}
            {diagnostico && diagnostico.map((subcategoria) => {
              const ids = subcategoria.capas.map((c) => c.id);
              const activa = ids.some((id) => capasDiagActivas.has(id));
              const abierta = subcategoriasAbiertas.has(subcategoria.id);
              return (
                <div key={subcategoria.id} className="eje-group">
                  <div className="eje-group-header">
                    <label className="switch-container" title={subcategoria.label}>
                      <input
                        type="checkbox"
                        checked={activa}
                        onChange={() => toggleSubcategoria(subcategoria)}
                      />
                      <span className="switch-slider"></span>
                      <span className="switch-label">{subcategoria.label}</span>
                    </label>
                    <button
                      type="button"
                      className="eje-expand-btn"
                      onClick={() => toggleSubcategoriaAbierta(subcategoria.id)}
                      aria-label={abierta ? 'Contraer capas' : 'Ver capas'}
                      title={abierta ? 'Contraer capas' : 'Ver capas'}
                    >
                      <ChevronDown size={14} style={{ transform: abierta ? 'rotate(180deg)' : 'none' }} />
                    </button>
                  </div>

                  {abierta && (
                    <div className="eje-sublayers">
                      {subcategoria.capas.map((capa) => (
                        <div key={capa.id} className="capa-fila">
                          <div className="capa-fila-encabezado">
                            <label className="switch-container compact">
                              <input
                                type="checkbox"
                                checked={capasDiagActivas.has(capa.id)}
                                onChange={() => toggleCapaDiag(capa.id)}
                              />
                              <span className="switch-slider"></span>
                              <span className="switch-label">{capa.label}</span>
                            </label>
                            <button
                              type="button"
                              className="capa-info-btn"
                              onClick={() => abrirModal(capa, subcategoria.label)}
                              title="Ver descripción y metadatos"
                              aria-label={`Ver descripción y metadatos de ${capa.label}`}
                            >
                              <Info size={13} />
                            </button>
                          </div>
                          <CapaControles
                            etiqueta={capa.label}
                            opacidad={getOpacidad(capa.id)}
                            onOpacidad={(v) => setOpacidad(capa.id, v)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="section-title">
            <Layers size={14} />
            <span>Estrategias</span>
          </div>
          <div className="overlay-options">
            {!ejesEstrategicos && <p className="text-muted">Cargando…</p>}
            {ejesEstrategicos && ejesEstrategicos.map((eje) => {
              const idsDelEje = eje.capas.map((c) => c.id);
              const ejeActivo = idsDelEje.some((id) => capasEjeActivas.has(id));
              const abierto = ejesAbiertos.has(eje.id);
              return (
                <div key={eje.id} className="eje-group">
                  <div className="eje-group-header">
                    <label className="switch-container" title={eje.label}>
                      <input
                        type="checkbox"
                        checked={ejeActivo}
                        onChange={() => toggleEje(eje)}
                      />
                      <span className="switch-slider"></span>
                      <span className="switch-label">{eje.tituloCorto}</span>
                    </label>
                    <button
                      type="button"
                      className="eje-expand-btn"
                      onClick={() => toggleEjeAbierto(eje.id)}
                      aria-label={abierto ? 'Contraer capas' : 'Ver capas'}
                      title={abierto ? 'Contraer capas' : 'Ver capas'}
                    >
                      <ChevronDown size={14} style={{ transform: abierto ? 'rotate(180deg)' : 'none' }} />
                    </button>
                  </div>

                  {abierto && (
                    <div className="eje-sublayers">
                      {eje.capas.map((capa) => (
                        <div key={capa.id} className="capa-fila">
                          <div className="capa-fila-encabezado">
                            <label className="switch-container compact">
                              <input
                                type="checkbox"
                                checked={capasEjeActivas.has(capa.id)}
                                onChange={() => toggleCapaEje(capa.id)}
                              />
                              <span className="switch-slider"></span>
                              <span className="switch-label">{capa.label}</span>
                            </label>
                            <button
                              type="button"
                              className="capa-info-btn"
                              onClick={() => abrirModal(capa, eje.label)}
                              title="Ver descripción y metadatos"
                              aria-label={`Ver descripción y metadatos de ${capa.label}`}
                            >
                              <Info size={13} />
                            </button>
                          </div>
                          <CapaControles
                            etiqueta={capa.label}
                            opacidad={getOpacidad(capa.id)}
                            onOpacidad={(v) => setOpacidad(capa.id, v)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {capaParaModal && (
        <CapaMetadataModal datos={capaParaModal} onClose={() => setCapaParaModal(null)} />
      )}

      {/* Simbología de todas las capas activas, agrupada por archivo — fija
          en la esquina inferior derecha del mapa, con scroll propio para
          cuando hay muchas capas activas a la vez. Reemplaza el panel de
          "capa seleccionada" del sidebar: ya no hace falta elegir una capa
          para ver su leyenda, se ven todas las activas de un vistazo. */}
      {capasActivasOrdenadas.length > 0 && (
        <div className="leyenda-flotante">
          <div className="leyenda-flotante-header">Simbología</div>
          <div className="leyenda-flotante-scroll">
            {capasActivasOrdenadas.map(({ key, capa, colorRespaldo }) => {
              const muestras = capa.simbologia ? resolveLegend(capa.simbologia) : [];
              return (
                <div key={key} className="leyenda-flotante-capa">
                  <span className="leyenda-flotante-nombre">{capa.label}</span>
                  <div className="capa-legend-muestras">
                    {muestras.length === 0 ? (
                      <div className="capa-legend-muestra">
                        <span
                          className="capa-legend-swatch-plano"
                          style={{ backgroundColor: colorRespaldo }}
                        />
                        <span className="capa-legend-muestra-label">Color de referencia (sin simbología QGIS)</span>
                      </div>
                    ) : (
                      muestras.map((m, i) => (
                        <div key={i} className="capa-legend-muestra">
                          <span
                            className="capa-legend-swatch"
                            dangerouslySetInnerHTML={{ __html: toSwatchSvg(m.symbol) ?? '' }}
                          />
                          {m.label && <span className="capa-legend-muestra-label">{m.label}</span>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controles flotantes en la esquina superior derecha */}
      <div className="map-custom-controls">
        {/* Selector de Mapa Base */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setSelectorOpen(!selectorOpen)}
            className="map-ctrl-btn"
            aria-label="Cambiar mapa base"
            title="Mapa base"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </button>

          {selectorOpen && (
            <div className="capa-base-popover">
              <h5>CAPA BASE</h5>
              <button
                onClick={() => {
                  setActiveBaseLayer('claro');
                  setSelectorOpen(false);
                }}
                className={`capa-base-option ${activeBaseLayer === 'claro' ? 'active' : ''}`}
              >
                Mapa Claro
              </button>
              <button
                onClick={() => {
                  setActiveBaseLayer('satelite');
                  setSelectorOpen(false);
                }}
                className={`capa-base-option ${activeBaseLayer === 'satelite' ? 'active' : ''}`}
              >
                Vista Satelital
              </button>
            </div>
          )}
        </div>

        {/* Botones de Zoom y Descarga */}
        <div className="map-ctrl-stack">
          <button
            onClick={() => mapInstance && mapInstance.zoomIn()}
            className="map-ctrl-btn"
            aria-label="Acercar"
            title="Zoom in"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button
            onClick={() => mapInstance && mapInstance.zoomOut()}
            className="map-ctrl-btn"
            aria-label="Alejar"
            title="Zoom out"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button
            onClick={handleDownloadActiveLayers}
            className="map-ctrl-btn"
            aria-label="Descargar capas activas (.gpkg)"
            title="Descargar capas activas"
          >
            <svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor">
              <path d="M256 0C114.6 0 0 114.6 0 256c0 141.4 114.6 256 256 256s256-114.6 256-256C512 114.6 397.4 0 256 0zM256 362.7c-7.5 0-14.7-3-20-8.3L129.3 247.7c-11-11-11-29 0-40s29-11 40 0l58.7 58.7V117.3c0-15.6 12.7-28.3 28.3-28.3s28.3 12.7 28.3 28.3v149.1l58.7-58.7c11-11 29-11 40 0s11 29 0 40L276 354.3C270.7 359.7 263.5 362.7 256 362.7z" />
            </svg>
          </button>
          <button
            onClick={handleScreenshot}
            className="map-ctrl-btn"
            aria-label="Tomar captura de pantalla del mapa"
            title="Tomar captura de pantalla"
          >
            <Camera size={16} />
          </button>
        </div>
      </div>

      <MapContainer
        center={[19.3, -90.5]}
        zoom={8}
        minZoom={7}
        maxBounds={CAMPECHE_BOUNDS}
        maxBoundsViscosity={0.8}
        zoomControl={false}
        className="leaflet-map"
        /* Canvas en vez de SVG: con el Mapa Base completo el mapa montaba
           ~78 000 nodos en el DOM. Los marcadores en divIcon siguen siendo
           DOM; canvas solo afecta a líneas y polígonos. */
        preferCanvas={true}
      >
        <MapInstanceCapture setMapInstance={setMapInstance} />

        {/* Mapa base servido por Esri (ver EsriBasemap.jsx): opacidad fija,
            no se opaca con las Estrategias — eso le toca al Mapa Base
            GeoJSON de abajo (ver `mapaBaseGeoJsonOpacidad`). */}
        <EsriBasemap type={activeBaseLayer} opacity={1} />

        {/* Las 3 categorías (Mapa Base, Estrategias, Diagnóstico) en un solo
            punto de render, ya ordenadas por geometría — ver
            `capasActivasOrdenadas`: polígonos al fondo, líneas después,
            puntos hasta arriba, sin importar de qué categoría venga cada
            una. Solo se montan (y solo entonces piden sus datos,
            perezosamente) las capas que el usuario activó. */}
        {capasActivasOrdenadas.map(({ key, capa, categoria, colorRespaldo, opacidad, campoEtiqueta }) => (
          <CapaGeoJSON
            key={key}
            capa={capa}
            categoria={categoria}
            opacidad={opacidad}
            colorRespaldo={colorRespaldo}
            campoEtiqueta={campoEtiqueta}
            onSeleccionarFeature={setCapaParaModal}
          />
        ))}

      </MapContainer>
    </div>
  );
};

export default MapViewer;
