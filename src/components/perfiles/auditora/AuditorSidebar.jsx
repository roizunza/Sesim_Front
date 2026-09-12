import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, LogOut, ChevronDown, ChevronUp, Map, FileText, ShieldCheck, ChevronLeft, ChevronRight, Search } from 'lucide-react';

import '../capturista/Capturista.css';
import './Auditor.css';
import { getStatusColor } from '../../plataforma/registrosSESIM';
import { useAuth } from '../../../lib/auth';

const AuditorSidebar = ({ isSidebarOpen, setIsSidebarOpen, registros, onSelectCapa, capaActiva, onToggleBitacoraCuentas, bitacoraCuentasActiva }) => {
  const navigate = useNavigate();
  const { user, perfil, signOut } = useAuth();

  const handleCerrarSesion = async () => {
    await signOut();
    navigate('/');
  };

  const [cartografiaOpen, setCartografiaOpen] = useState(true);
  const [instrumentosOpen, setInstrumentosOpen] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Historial derivado del mismo dataset compartido (registrosSESIM)
  // que usan Capturista y Administrador — el Auditor ve TODOS los
  // municipios, en modo solo-lectura, filtrable por texto.
  const coincide = (r) => r.id.toLowerCase().includes(busqueda.toLowerCase());
  const historialCartografia = registros.filter(r => r.tipo === 'cartografia' && coincide(r));
  const historialInstrumentos = registros.filter(r => r.tipo === 'instrumento' && coincide(r));

  return (
    <aside className={`admin-sidebar auditor-sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`} style={{ backgroundColor: '#888B8D' }}>

      <button className="admin-sidebar-toggle" style={{ background: '#53565A' }} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      <div className="admin-profile-section">
        <Eye size={64} className="profile-icon" color="#D1D5DB" />
        <div className="profile-info">
          <span className="profile-greeting">Bienvenid@ Auditor@</span>
          <span className="user-email">{perfil?.nombre || user?.email}</span>
        </div>
      </div>

      <nav className="admin-nav">
        <div className="admin-nav-group">

          <div className="sidebar-search-container">
            <div className="search-input-wrapper">
              <Search size={16} color="rgba(255,255,255,0.6)" />
              <input
                type="text"
                placeholder="Buscar usuario, cartografía o instrumento"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-nav-header">
            <span className="nav-title">ACTIVIDAD</span>
          </div>

          <div style={{ padding: '0 20px', marginBottom: '16px', display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Desde</label>
              <input type="date" style={{ width: '100%', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '4px', color: '#fff', padding: '6px 8px', fontSize: '12px', outline: 'none', fontFamily: 'var(--font-body)', colorScheme: 'dark' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Hasta</label>
              <input type="date" style={{ width: '100%', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '4px', color: '#fff', padding: '6px 8px', fontSize: '12px', outline: 'none', fontFamily: 'var(--font-body)', colorScheme: 'dark' }} />
            </div>
          </div>

          <button className={`admin-nav-link ${cartografiaOpen ? 'active' : ''}`} onClick={() => setCartografiaOpen(!cartografiaOpen)} style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <Map size={18} />
            <span>Historial de Cartografía</span>
            {cartografiaOpen ? <ChevronUp size={16} className="nav-chevron" /> : <ChevronDown size={16} className="nav-chevron" />}
          </button>

          <div className={`admin-nav-submenu ${cartografiaOpen ? 'open' : ''}`} style={{ background: 'transparent', maxHeight: cartografiaOpen ? '800px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
            <div className="box-container" style={{ padding: '8px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {historialCartografia.length > 0 ? historialCartografia.map((r) => (
                  <div key={r.id} onClick={() => onSelectCapa(r.id)} title={r.comentario ? `Rechazado: ${r.comentario}` : r.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 8px', borderRadius: '4px', background: capaActiva === r.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(r.estatus), flexShrink: 0 }}></div>
                    <span className="bandeja-item" style={{ color: capaActiva === r.id ? '#fff' : '#D1D5DB', fontSize: '13px', fontWeight: '500' }}>{r.id}</span>
                  </div>
                )) : (
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Sin resultados</span>
                )}
              </div>
            </div>
          </div>

          <button className={`admin-nav-link ${instrumentosOpen ? 'active' : ''}`} onClick={() => setInstrumentosOpen(!instrumentosOpen)} style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <FileText size={18} />
            <span>Historial de Instrumentos</span>
            {instrumentosOpen ? <ChevronUp size={16} className="nav-chevron" /> : <ChevronDown size={16} className="nav-chevron" />}
          </button>

          <div className={`admin-nav-submenu ${instrumentosOpen ? 'open' : ''}`} style={{ background: 'transparent', maxHeight: instrumentosOpen ? '800px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
            <div className="box-container" style={{ padding: '8px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {historialInstrumentos.length > 0 ? historialInstrumentos.map((r) => (
                  <div key={r.id} onClick={() => onSelectCapa(r.id)} title={r.comentario ? `Rechazado: ${r.comentario}` : r.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 8px', borderRadius: '4px', background: capaActiva === r.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(r.estatus), flexShrink: 0 }}></div>
                    <span className="bandeja-item" style={{ color: capaActiva === r.id ? '#fff' : '#D1D5DB', fontSize: '13px', fontWeight: '500' }}>{r.id}</span>
                  </div>
                )) : (
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Sin resultados</span>
                )}
              </div>
            </div>
          </div>

        </div>

        <div className="admin-nav-group">
          <button
            className={`admin-nav-link ${bitacoraCuentasActiva ? 'active' : ''}`}
            onClick={onToggleBitacoraCuentas}
            style={{ backgroundColor: bitacoraCuentasActiva ? 'rgba(0, 0, 0, 0.05)' : 'transparent' }}
          >
            <ShieldCheck size={18} />
            <span>Bitácora de cuentas</span>
          </button>
        </div>

        <div className="admin-nav-group" style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <button className="admin-nav-link text-logout" onClick={handleCerrarSesion}>
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default AuditorSidebar;
