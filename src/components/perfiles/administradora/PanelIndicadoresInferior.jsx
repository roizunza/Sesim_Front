/**
 * PENDIENTE — no está enganchado en App.jsx todavía.
 *
 * Se trae tal cual desde el proyecto anterior porque el diseño/UX vale la
 * pena conservarlo, pero SIGUE dependiendo de módulos que ya no existen en
 * este proyecto (`registrosSESIM`, `EsriBasemap`) y de datos simulados.
 * Solo el perfil de Capturista está probado contra el backend real por
 * ahora — este archivo se corrige y se "desbloquea" (se importa y se
 * enruta) cuando toque ese perfil.
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Database } from 'lucide-react';

const PanelIndicadoresInferior = ({ capaActiva, datos, onDictamen, isSidebarOpen }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Auto-abrir cuando se selecciona una capa
  useEffect(() => {
    if (capaActiva) setIsOpen(true);
    else setIsOpen(false);
  }, [capaActiva]);

  if (!capaActiva) return null;

  const columnas = datos && datos.length > 0 ? Object.keys(datos[0].properties) : [];

  return (
    <div className="admin-bottom-banner" style={{ left: isSidebarOpen ? '280px' : '0' }}>
      
      <div className="banner-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="banner-title">
          <Database size={16} color="var(--c-guinda)" />
          <span className="label">Indicador:</span>
          <span>{capaActiva}</span>
          {isOpen ? <ChevronDown size={16} color="var(--text-secondary)" style={{ marginLeft: '8px' }}/> : <ChevronUp size={16} color="var(--text-secondary)" style={{ marginLeft: '8px' }}/>}
        </div>
        
        <div className="banner-actions" onClick={(e) => e.stopPropagation()}>
          <button className="btn-dictamen btn-rechazar" onClick={() => onDictamen('rechazar')}>
            <XCircle size={14} /> Rechazar
          </button>
          <button className="btn-dictamen btn-aprobar" onClick={() => onDictamen('aprobar')}>
            <CheckCircle size={14} /> Aprobar
          </button>
        </div>
      </div>

      <div className={`banner-content ${isOpen ? 'open' : ''}`}>
        <div className="data-grid-container" style={{ height: '100%' }}>
          <table className="data-grid-table">
            <thead>
              <tr>
                {columnas.map(col => <th key={col}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {datos?.map((row, index) => (
                <tr key={index}>
                  {columnas.map(col => <td key={col}>{row.properties[col]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default PanelIndicadoresInferior;