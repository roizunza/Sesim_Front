import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, LogOut, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Map, FileText, Users, ShieldCheck } from 'lucide-react';

import '../capturista/Capturista.css';
import { getStatusColor } from '../../plataforma/registrosSESIM';
import { useAuth } from '../../../lib/auth';

const AdministradorSidebar = ({
  isSidebarOpen, setIsSidebarOpen, cartografiaList, instrumentosList, onSelectCapa, capaActiva,
  onToggleGestionUsuarios, gestionUsuariosActiva, onToggleBitacoraCuentas, bitacoraCuentasActiva,
}) => {
  const navigate = useNavigate();
  const { user, perfil, signOut } = useAuth();
  const [cartografiaOpen, setCartografiaOpen] = useState(true);
  const [instrumentosOpen, setInstrumentosOpen] = useState(true);
  // Ismael corrigió la definición inicial: la diferencia entre administrador
  // y administrador_vip NO es solo el alta de cuentas — es el acceso a
  // "Gestión de usuarios" completo (ver 109_rls_perfil_update_solo_vip.sql
  // en el backend). Un administrador normal ni siquiera ve el botón. El
  // saludo también es dinámico para que se note a simple vista cuál de los
  // dos eres — antes decía "Administrador@" fijo para ambos, y esa era
  // justo la confusión que Ismael reportó ("en admin vip y admin normal se
  // ve exactamente igual la interfaz").
  const etiquetaRol = perfil?.rol === 'administrador_vip' ? 'Administrador@ VIP' : 'Administrador@';
  const esVip = perfil?.rol === 'administrador_vip';
  // getStatusColor: mismo helper de estatus que usan CapturistaSidebar y
  // AuditorLayout (registrosSESIM.js), para que el punto de color
  // signifique lo mismo en las tres pantallas.

  const handleCerrarSesion = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`} style={{ backgroundColor: '#183B33' }}>
      <button className="admin-sidebar-toggle" style={{ background: '#102A24' }} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      <div className="admin-profile-section" style={{ borderBottom: 'none', paddingBottom: '16px' }}>
        <UserCircle size={64} className="profile-icon" color="#fff" />
        <div className="profile-info">
          <span className="profile-greeting" style={{ fontSize: '16px' }}>Bienvenid@<br/>{etiquetaRol}</span>
          <span className="user-email">{perfil?.nombre || user?.email}</span>
        </div>
      </div>

      <nav className="admin-nav">
        <div className="admin-nav-group">
          
          <div className="admin-nav-header" style={{ background: '#254E45', padding: '8px 20px', marginBottom: '8px' }}>
            <span className="nav-title" style={{ color: '#A7F3D0', fontWeight: 'bold' }}>CONTROL DE SOLICITUDES</span>
          </div>

          {/* ACORDEÓN: CARTOGRAFÍA */}
          <button className={`admin-nav-link ${cartografiaOpen ? 'active' : ''}`} onClick={() => setCartografiaOpen(!cartografiaOpen)} style={{ background: 'transparent' }}>
            <Map size={18} />
            <span style={{ fontWeight: '600' }}>Cartografía</span>
            {cartografiaOpen ? <ChevronUp size={16} className="nav-chevron" /> : <ChevronDown size={16} className="nav-chevron" />}
          </button>

          <div className={`admin-nav-submenu ${cartografiaOpen ? 'open' : ''}`} style={{ background: 'transparent', maxHeight: cartografiaOpen ? '800px' : '0' }}>
            <div className="box-container" style={{ padding: '8px 20px 16px 44px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cartografiaList.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => onSelectCapa(item.id)}
                    title={item.comentario ? `Rechazado: ${item.comentario}` : undefined}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 8px', borderRadius: '4px', background: capaActiva === item.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent' }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(item.estatus), flexShrink: 0 }}></div>
                    <span className="bandeja-item" style={{ color: '#fff', fontSize: '13px', fontWeight: '500' }}>{item.id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ACORDEÓN: INSTRUMENTOS */}
          <button className={`admin-nav-link ${instrumentosOpen ? 'active' : ''}`} onClick={() => setInstrumentosOpen(!instrumentosOpen)} style={{ background: 'rgba(255,255,255,0.05)' }}>
            <FileText size={18} />
            <span style={{ fontWeight: '600' }}>Instrumentos</span>
            {instrumentosOpen ? <ChevronUp size={16} className="nav-chevron" /> : <ChevronDown size={16} className="nav-chevron" />}
          </button>

          <div className={`admin-nav-submenu ${instrumentosOpen ? 'open' : ''}`} style={{ background: 'rgba(255,255,255,0.05)', maxHeight: instrumentosOpen ? '800px' : '0' }}>
            <div className="box-container" style={{ padding: '8px 20px 16px 44px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {instrumentosList.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => onSelectCapa(item.id)}
                    title={item.comentario ? `Rechazado: ${item.comentario}` : undefined}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 8px', borderRadius: '4px', background: capaActiva === item.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent' }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(item.estatus), flexShrink: 0 }}></div>
                    <span className="bandeja-item" style={{ color: '#fff', fontSize: '13px', fontWeight: '500' }}>{item.id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        <div className="admin-nav-group">
          <div className="admin-nav-header" style={{ background: '#254E45', padding: '8px 20px', marginBottom: '8px' }}>
            <span className="nav-title" style={{ color: '#A7F3D0', fontWeight: 'bold' }}>CUENTAS</span>
          </div>

          {esVip && (
            <button
              className={`admin-nav-link ${gestionUsuariosActiva ? 'active' : ''}`}
              onClick={onToggleGestionUsuarios}
              style={{ background: gestionUsuariosActiva ? 'rgba(255,255,255,0.1)' : 'transparent' }}
            >
              <Users size={18} />
              <span>Gestión de usuarios</span>
            </button>
          )}

          <button
            className={`admin-nav-link ${bitacoraCuentasActiva ? 'active' : ''}`}
            onClick={onToggleBitacoraCuentas}
            style={{ background: bitacoraCuentasActiva ? 'rgba(255,255,255,0.1)' : 'transparent' }}
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

export default AdministradorSidebar;