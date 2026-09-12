/**
 * Desbloqueado junto con `AdministradorLayout.jsx` — ver
 * `claude/front-consolidacion-react-d-sim-front.md`.
 *
 * La maqueta original traía estas tres tarjetas con cifras inventadas
 * (68%/32% de cobertura, "Carmen 124 km", puntos de dispersión fijos) como
 * si fueran datos reales del indicador elegido. Eso se quitó a propósito:
 * no existe todavía un backend que calcule estos agregados por indicador
 * (Ciclo 8+ del TDR — vistas materializadas de reportes/tableros), así que
 * en vez de mostrar números falsos se deja el mismo esqueleto visual (las
 * tres tarjetas, mismos íconos) con un aviso honesto de "sin datos
 * todavía". Cuando exista esa vista agregada en Supabase, cada tarjeta se
 * cambia para leerla en vez de mostrar el aviso.
 */

import React from 'react';
import { Target, PieChart, BarChart2 } from 'lucide-react';

const SinDatos = () => (
  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
    Sin datos agregados todavía para este indicador.
  </p>
);

const DashboardKPIs = ({ indicador }) => {
  if (!indicador) return null;

  return (
    <div className="kpi-dashboard-panel" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>

      {/* Título dinámico que muestra el Indicador actual */}
      <h4 style={{
        margin: '0 0 16px',
        fontSize: '15px',
        color: 'var(--c-guinda-dk)',
        background: 'var(--c-white)',
        padding: '12px 16px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        borderLeft: '4px solid var(--c-guinda)'
      }}>
        {indicador}
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* 1. CAJA: Dispersión Municipal */}
        <div className="geo-card">
          <div className="geo-card-header">
            <Target size={14} color="var(--c-guinda)" />
            <span>Dispersión Municipal</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 4px' }}>
            Densidad vs. Población
          </p>
          <SinDatos />
        </div>

        {/* 2. CAJA: Proporción Territorial (Dona) */}
        <div className="geo-card">
          <div className="geo-card-header">
            <PieChart size={14} color="var(--c-guinda)" />
            <span>Cobertura Territorial</span>
          </div>
          <SinDatos />
        </div>

        {/* 3. CAJA: Ranking (Barras Horizontales) */}
        <div className="geo-card">
          <div className="geo-card-header">
            <BarChart2 size={14} color="var(--c-guinda)" />
            <span>Top 3 Concentración</span>
          </div>
          <SinDatos />
        </div>

      </div>
    </div>
  );
};

export default DashboardKPIs;