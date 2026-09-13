import React from 'react';
import StreetLinesBackground from '../components/plataforma/StreetLinesBackground';
import EstrategiasIsometricas from '../components/plataforma/EstrategiasIsometricas';
import './Inicio.css';

const Inicio = () => {
  return (
    <div className="inicio-page">
      <section className="vista vista-intro" aria-label="Introducción">
        <div className="vista-intro__container">
          
          <div className="vista-intro__texto">
            <h1>Sistema Estatal de Seguimiento a Indicadores de Movilidad y Seguridad Vial</h1>
            
            <p className="vista-intro__sinopsis">
              Plataforma que vincula información normativa, estratégica y estadística para operar en
              tres niveles: estatal, municipal y por instrumento de planeación. 
            </p>

            <p className="vista-intro__sinopsis">
              Su objetivo es contribuir a la consolidación de un modelo de gestión pública eficiente, 
              orientado al cumplimiento de los objetivos en materia de movilidad y seguridad vial, 
              así como de los Planes Integrales de Movilidad Urbana Sustentable (PIMUS) municipales.
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