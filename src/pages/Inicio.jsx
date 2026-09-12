import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FileSpreadsheet,
  MapPin,
  Activity,
  Bus,
  ShieldCheck,
  TrendingUp,
  Bike,
  ShieldAlert,
  Users
} from 'lucide-react';
import { EJES_ESTRATEGICOS } from '../lib/ejesEstrategicos';
import StreetLinesBackground from '../components/plataforma/StreetLinesBackground';
import './Inicio.css';

// Resuelve la clave de texto `icono` de cada Eje (ver ejesEstrategicos.js,
// que no importa React) contra los componentes reales de lucide-react.
const EJE_ICONOS = { TrendingUp, Bus, Bike, ShieldAlert, Users };

const Inicio = () => {
  return (
    <div className="inicio-page">
      <div className="hero-section">
        <StreetLinesBackground />
        <div className="hero-content">
          <h1>Sistema Estatal de Seguimiento a Indicadores de Movilidad y Seguridad Vial</h1>
          <p className="hero-subtitle">
            SESIM del Estado de Campeche
          </p>
        </div>
      </div>

      <div className="intro-section no-container">
        <h2>Introducción</h2>
        <div className="intro-content">
          <p>
            El SESIM es un mecanismo que vincula información normativa, estratégica y estadística para operar en tres niveles: estatal, municipal y por instrumento de planeación. 
          </p>
          <p>
            Contribuye a consolidar un modelo de gestión pública eficiente, orientado al cumplimiento de los objetivos en materia de movilidad y seguridad vial, así como de los Planes Integrales de Movilidad Urbana Sustentable (PIMUS) municipales.
          </p>
        </div>
      </div>

      <div className="objectives-section">
        <h2>Objetivos del Sistema</h2>
        <div className="objectives-grid">
          <div className="objective-card">
            <Bus size={28} className="objective-icon" />
            <p>Organizar, homologar y territorializar indicadores derivados de la legislación aplicable, la ENAMOV y estrategias estatales.</p>
          </div>
          
          <div className="objective-card">
            <Activity size={28} className="objective-icon" />
            <p>Visualizar el comportamiento de los indicadores, su estatus de cumplimiento y sus patrones territoriales para la toma de decisiones.</p>
          </div>
          
          <div className="objective-card">
            <ShieldCheck size={28} className="objective-icon" />
            <p>Preservar la trazabilidad de origen, asociando cada indicador con su instrumento normativo, metas y medios de verificación.</p>
          </div>
        </div>
      </div>

      <div className="ejes-ee-section">
        <h2>Estrategias EEMSV</h2>
        <p className="ejes-ee-subtitle">
          Evaluación transversal del desempeño institucional en materia de movilidad.
        </p>
        <div className="ejes-ee-grid">
          {EJES_ESTRATEGICOS.map((eje) => {
            const Icono = EJE_ICONOS[eje.icono];
            return (
              <Link
                key={eje.id}
                to={`/geovisor?estrategia=${eje.id}`}
                className="eje-ee-card"
                title={`Ver ${eje.label} en el Geovisualizador`}
              >
                <Icono size={28} className="eje-ee-icon" />
                <h4>{eje.tituloCorto}</h4>
                <p>{eje.descripcionCorta}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="methodology-section">
        <h2>Clasificación de Indicadores</h2>
        <div className="methodology-intro">
          <p>
            El modelo conceptual estructura el catálogo maestro en dos vertientes principales de evaluación institucional.
          </p>
        </div>
        
        <div className="methodology-sub">
          <div className="methodology-cards">
            <div className="methodology-card">
              <span className="card-badge">34 Indicadores</span>
              <h4>Sectoriales</h4>
              <p>
                Monitorean y evalúan los resultados de las dependencias que integran el Sistema Estatal de Movilidad y Seguridad Vial. Sectores de medición:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <li>Gobierno y Administración.</li>
                <li>Ambiente, Cambio Climático y Gestión Integral de Riesgos.</li>
                <li>Observatorios Ciudadanos.</li>
                <li>Inclusión y Género.</li>
              </ul>
            </div>
            
            <div className="methodology-card">
              <span className="card-badge">39 Indicadores</span>
              <h4>Desempeño</h4>
              <p>
                Permiten medir los logros obtenidos conforme a los objetivos planteados al final de la ejecución de la EEMSV. Horizontes de planeación:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <li>Inmediato y Corto plazo.</li>
                <li>Mediano plazo.</li>
                <li>Largo plazo.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="modules-section">
        <h2>Módulos del Sistema</h2>
        <div className="module-cards">
          <div className="module-card">
            <MapPin size={32} className="card-icon" />
            <h3>Geovisualizador SIG</h3>
            <p>Explora métricas globales y visualiza capas territoriales en el mapa interactivo.</p>
            <Link to="/geovisor" className="card-link">
              Ir al Geovisualizador <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="module-card">
            <FileSpreadsheet size={32} className="card-icon" />
            <h3>Monitoreo de Indicadores</h3>
            <p>Consulta el estatus de cumplimiento y la trazabilidad normativa del Estado.</p>
            <Link to="/monitoreo" className="card-link">
              Ir al Monitoreo <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inicio;