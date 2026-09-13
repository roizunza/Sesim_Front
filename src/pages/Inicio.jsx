import React from 'react';
import StreetLinesBackground from '../components/plataforma/StreetLinesBackground';
import EstrategiasIsometricas from '../components/plataforma/EstrategiasIsometricas';
import './Inicio.css';

/**
 * Landing page: 2 "vistas" de scroll-snap (CSS puro, sin scroll-jacking en
 * JS) dentro de `.inicio-page` — la única región que se desliza; Header,
 * Navbar, Footer y Underfooter quedan fijos por fuera (ver Plataforma.jsx).
 *
 * Vista 1 (intro): título + sinopsis a la izquierda (la sinopsis absorbe el
 * contenido de la antigua sección "Introducción"), y a la derecha el panel
 * de StreetLinesBackground con la red vial real de todo Campeche, encuadrada
 * para que se observe el estado completo.
 *
 * Vista 2 (ejes): la sección "Estrategias EEMSV" ya existente
 * (EstrategiasIsometricas), sin cambios.
 *
 * Se quitaron por instrucción explícita: "Objetivos del Sistema" (3
 * tarjetas), "Clasificación de Indicadores" (34+39) y "Módulos del Sistema".
 * La caja de preguntas frecuentes que se discutió para esta vista también se
 * dejó fuera de este alcance ("por ahora quita la caja de preguntas").
 */
const Inicio = () => {
  return (
    <div className="inicio-page">
      <section className="vista vista-intro" aria-label="Introducción">
        <div className="vista-intro__grid">
          <div className="vista-intro__texto">
            <h1>Sistema Estatal de Seguimiento a Indicadores de Movilidad y Seguridad Vial</h1>
            <p className="vista-intro__sinopsis">
              El SESIM vincula información normativa, estratégica y estadística para operar en
              tres niveles: estatal, municipal y por instrumento de planeación. Contribuye a
              consolidar un modelo de gestión pública eficiente, orientado al cumplimiento de los
              objetivos en materia de movilidad y seguridad vial, así como de los Planes Integrales
              de Movilidad Urbana Sustentable (PIMUS) municipales.
            </p>
          </div>
          <div className="vista-intro__mapa">
            <StreetLinesBackground />
          </div>
        </div>
      </section>

      <section className="vista vista-ejes" aria-label="Estrategias EEMSV">
        <h2>Estrategias EEMSV</h2>
        <p className="ejes-ee-subtitle">
          Evaluación transversal del desempeño institucional en materia de movilidad.
        </p>
        <EstrategiasIsometricas />
      </section>
    </div>
  );
};

export default Inicio;
