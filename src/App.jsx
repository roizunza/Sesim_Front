import { Routes, Route, Navigate } from 'react-router-dom';

import Plataforma from './components/plataforma/Plataforma';
import AppLayout from './components/plataforma/AppLayout';
import RutaProtegida from './components/plataforma/RutaProtegida';

import Inicio from './pages/Inicio';
import Login from './pages/Login';
import MonitoreoIndicadores from './pages/MonitoreoIndicadores';
import MapViewer from './components/geovisor/MapViewer';
import AdminMapViewer from './components/geovisor/AdminMapViewer';

// Nota sobre rutas que TODAVÍA no existen aquí (a propósito, ver
// claude/front-consolidacion-react-d-sim-front.md):
//   - Administrador y Auditor NO tienen su propia ruta (p. ej.
//     /admin-control del proyecto anterior): comparten /app con Capturista,
//     `AdminMapViewer` decide qué layout montar según `rol` (core.perfil).
//   - /logs/* (BitacoraLogs, bitácora institucional global) sigue sin
//     traerse: depende de datos 100% simulados y es su propio incremento
//     pendiente.
function App() {
  return (
    <Routes>
      <Route path="/" element={<Plataforma />}>
        <Route index element={<Inicio />} />
        <Route path="geovisor" element={<MapViewer />} />
        <Route path="monitoreo" element={<MonitoreoIndicadores />} />
        <Route path="login" element={<Login />} />
      </Route>

      <Route
        path="/app"
        element={
          <RutaProtegida>
            <AppLayout />
          </RutaProtegida>
        }
      >
        <Route index element={<AdminMapViewer />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
