import React from 'react';
import { Link } from 'react-router-dom';
import { EJES_ESTRATEGICOS } from '../../lib/ejesEstrategicos';
import './EstrategiasIsometricas.css';

/**
 * Bloque "Estrategias EEMSV" de Inicio.jsx: 5 porciones iguales, una por
 * eje. Cada porción trae dos ilustraciones isométricas servidas desde
 * public/ (Ismael las coloca ahí directo):
 *   - E{numero}.png    → base, siempre visible.
 *   - E{numero}_1.png  → capa de "animación", pegada exactamente encima con
 *     opacity:0 y revelada con opacity:1 en hover/foco (transición pura en
 *     CSS, ver EstrategiasIsometricas.css).
 *
 * Debajo de la ilustración, el título del eje queda siempre visible. En
 * hover/foco se despliega además una tarjeta con la sinopsis, el número de
 * indicadores y de capas geoespaciales de ese eje (datos reales — ver el
 * comentario de `EJES_ESTRATEGICOS` en ejesEstrategicos.js) y el botón
 * "Explorar Territorio", que manda al Geovisualizador público con las capas
 * de ese eje ya encendidas (`MapViewer.jsx` ya resuelve `?estrategia=ejeN`).
 *
 * En pantallas angostas no hay hover real, así que la tarjeta queda siempre
 * visible ahí (ver el media query en el CSS) en vez de depender de un gesto
 * que no existe en touch.
 */
export default function EstrategiasIsometricas() {
  return (
    <div className="iso-grid">
      {EJES_ESTRATEGICOS.map((eje) => (
        <Link
          key={eje.id}
          to={`/geovisor?estrategia=${eje.id}`}
          className="iso-quad"
          title={`Ver ${eje.label} en el Geovisualizador`}
        >
          <div className="iso-shell">
            <img className="iso-base" src={`/E${eje.numero}.png`} alt={eje.tituloCorto} />
            <img className="iso-overlay" src={`/E${eje.numero}_1.png`} alt="" aria-hidden="true" />
          </div>

          <h4 className="iso-title">{eje.tituloCorto.replace(/^\d+\.\s*/, '')}</h4>

          <div className="iso-kpi-panel" style={{ borderTopColor: eje.color }}>
            <p className="iso-synopsis">{eje.sinopsis}</p>
            <div className="iso-kpi-tags">
              <span className="iso-kpi-tag">{eje.kpiIndicadores} Indicadores</span>
              <span className="iso-kpi-tag">{eje.kpiCapas} Capas Geográficas</span>
            </div>
            <span className="iso-cta">
              Explorar Territorio <span aria-hidden="true">→</span>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
