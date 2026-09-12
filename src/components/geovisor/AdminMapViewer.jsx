import React from 'react';
import CapturistaLayout from '../perfiles/capturista/CapturistaLayout';
import AdministradorLayout from '../perfiles/administradora/AdministradorLayout';
import AuditorLayout from '../perfiles/auditora/AuditorLayout';
import { useAuth } from '../../lib/auth';

// Reemplaza el switch por `localStorage.getItem('sim_role') || 'capturista'`
// del proyecto anterior (inseguro y, además, con un rol equivocado por
// default). El rol ahora sale de `core.perfil` vía useAuth().
//
// Los tres perfiles institucionales (Capturista, Administrador/
// Administrador VIP, Auditor) ya están conectados al backend real. Los
// tres consumían datos 100% simulados en el proyecto anterior
// (`registrosSESIM`/`EsriBasemap`, que no existían aquí) — se
// reconstruyeron con el mismo criterio de honestidad que ya tenía
// Capturista: usuario real vía `useAuth()`, solicitudes vía
// `listarSolicitudes()` (vacío hasta que exista el backend de Ciclo 8), ver
// `claude/front-consolidacion-react-d-sim-front.md`.
const AdminMapViewer = () => {
  const { rol } = useAuth();

  switch (rol) {
    case 'capturista':
      return <CapturistaLayout />;

    case 'administrador':
    case 'administrador_vip':
      return <AdministradorLayout />;

    case 'auditor':
      return <AuditorLayout />;

    default:
      return (
        <div style={{ padding: '40px', color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '480px', margin: '0 auto' }}>
          <p>
            Tu perfil (<strong>{rol ?? 'sin rol asignado'}</strong>) todavía no tiene una
            vista habilitada en este front. Si esperabas ver algo distinto,
            confirma con tu administrador que tu cuenta tenga un rol
            asignado en <code>core.perfil</code>.
          </p>
        </div>
      );
  }
};

export default AdminMapViewer;
