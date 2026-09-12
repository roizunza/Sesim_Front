import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, LogOut, ChevronDown, ChevronUp, Map, ShieldCheck, ChevronLeft, ChevronRight, Plus, CheckCircle2 } from 'lucide-react';

import './Capturista.css';
import { getStatusColor } from '../../../lib/solicitudes';
import { useAuth } from '../../../lib/auth';

// El SESIM no requiere que el capturista suba instrumentos normativos (esa
// captura es exclusiva del administrador, ver TDR — CRUD de catálogo e
// instrumentos, "escritura solo del administrador"): por eso este sidebar ya
// no tiene botón ni bandeja de "Instrumentos", solo Cartografía.
const CapturistaSidebar = ({ isSidebarOpen, setIsSidebarOpen, onOpenModal, isVerifying, onFinalSubmit, registros, actionLog, cuentaActiva, onToggleCuenta }) => {
  const navigate = useNavigate();
  const { user, perfil, signOut } = useAuth();

  const [cartografiaOpen, setCartografiaOpen] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmitAndReset = () => {
    onFinalSubmit();
    setTermsAccepted(false);
  };

  const handleCerrarSesion = async () => {
    await signOut();
    navigate('/');
  };

  // Todos los items provienen del mismo dataset compartido
  // (src/lib/solicitudes.js) — nada hardcodeado aquí. Hoy vuelve vacío
  // porque el backend aún no tiene una tabla de solicitudes (ver Ciclo 1),
  // así que las bandejas se ven honestamente vacías.
  const cartografia = registros.filter(r => r.tipo === 'cartografia');

  const porEstatus = (lista, estatus) => lista.filter(r => r.estatus === estatus);

  const renderItem = (item) => (
    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }} title={item.comentario ? `Rechazado: ${item.comentario}` : item.id}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(item.estatus), flexShrink: 0 }}></div>
      <span className="bandeja-item" style={{ fontWeight: '600' }}>{item.id}</span>
    </div>
  );

  const renderLista = (lista) => (
    lista.length > 0 ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        {lista.map(renderItem)}
      </div>
    ) : (
      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Bandeja vacía</span>
    )
  );

  return (
    <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
      <button
        className="admin-sidebar-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        title={isSidebarOpen ? "Ocultar panel" : "Mostrar panel"}
      >
        {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      <div className="admin-profile-section">
        <UserCircle size={64} className="profile-icon" />
        <div className="profile-info">
          <span className="profile-greeting">Bienvenid@</span>
          <span className="profile-role">Capturista</span>
          <span className="user-email">{perfil?.nombre || user?.email}</span>
        </div>
      </div>

      <nav className="admin-nav">
        <div className="admin-nav-group">

          <div className="admin-nav-header" style={{ marginBottom: '8px' }}>
            <span className="nav-title">SUBIR AL SISTEMA</span>
          </div>

          <div style={{ padding: '0 20px', marginBottom: '24px' }}>
            <button
              className="btn-base btn-white"
              onClick={() => onOpenModal('cartografia')}
              disabled={isVerifying}
              style={{ opacity: isVerifying ? 0.5 : 1, width: '100%', display: 'flex', justifyContent: 'flex-start', color: '#9F2241', padding: '10px 16px' }}
            >
              <Plus size={18} /> Cartografía
            </button>
          </div>

          {isVerifying && (
            <div style={{ margin: '0 20px 24px', padding: '16px', background: 'var(--c-white)', border: '1px solid var(--border-color)', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
              <h5 style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 8px', color: 'var(--c-guinda)', fontSize: '14px', fontWeight: '700' }}>
                <CheckCircle2 size={18} color="#10B981" /> Último paso.
              </h5>
              <p style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: '1.4' }}>
                Asegúrese de que la capa no tenga errores o desplazamientos no deseados con relación al geovisualizador antes de enviarla a revisión.
              </p>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{ marginTop: '2px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', fontWeight: '500' }}>
                  Estoy de acuerdo con enviar la capa geoespacial a la Etapa de Revisión Administrativa.
                </span>
              </label>
              <button
                className="btn-base btn-primary"
                onClick={handleSubmitAndReset}
                disabled={!termsAccepted}
                style={{ width: '100%', background: termsAccepted ? '#10B981' : '#E5E7EB', color: termsAccepted ? '#ffffff' : '#9CA3AF', cursor: termsAccepted ? 'pointer' : 'not-allowed', border: 'none', transition: 'all 0.2s ease-in-out' }}
              >
                Enviar a revisión
              </button>
            </div>
          )}

          {actionLog && (
            <div style={{ margin: '0 20px 16px', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>
              {actionLog}
            </div>
          )}

          <div className="admin-nav-header" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <span className="nav-title">BANDEJA DE ENTRADA</span>
          </div>

          <button className={`admin-nav-link ${cartografiaOpen ? 'active' : ''}`} onClick={() => setCartografiaOpen(!cartografiaOpen)} style={{ backgroundColor: cartografiaOpen ? 'rgba(0, 0, 0, 0.05)' : 'transparent' }}>
            <Map size={18} />
            <span>Cartografía</span>
            {cartografiaOpen ? <ChevronUp size={16} className="nav-chevron" /> : <ChevronDown size={16} className="nav-chevron" />}
          </button>

          <div className={`admin-nav-submenu ${cartografiaOpen ? 'open' : ''}`} style={{ background: 'transparent', maxHeight: cartografiaOpen ? '800px' : '0' }}>
            <div className="box-container" style={{ padding: '10px 20px 16px 44px' }}>

              <div style={{ width: '100%', overflow: 'hidden', marginBottom: '12px' }}>
                <h5 className="bandeja-category-title" style={{ color: '#BCA986' }}>EN BORRADORES</h5>
                {renderLista(porEstatus(cartografia, 'borrador'))}
              </div>

              <div style={{ width: '100%', overflow: 'hidden', marginBottom: '12px' }}>
                <h5 className="bandeja-category-title" style={{ color: '#BCA986' }}>EN REVISIÓN</h5>
                {renderLista(porEstatus(cartografia, 'revision'))}
              </div>

              <div style={{ width: '100%', overflow: 'hidden', marginBottom: '12px' }}>
                <h5 className="bandeja-category-title" style={{ color: '#BCA986' }}>APROBADOS</h5>
                {renderLista(porEstatus(cartografia, 'aprobado'))}
              </div>

              <div style={{ width: '100%', overflow: 'hidden' }}>
                <h5 className="bandeja-category-title" style={{ color: '#BCA986' }}>RECHAZADOS</h5>
                {renderLista(porEstatus(cartografia, 'rechazado'))}
              </div>

            </div>
          </div>

          <div className="admin-nav-header" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <span className="nav-title">MI ACTIVIDAD</span>
          </div>

          {/* Historial de la propia CUENTA (alta/cambio de rol o
              ámbito/baja) — mismo componente compartido (BitacoraCuentas)
              que usan administrador/administrador_vip/auditor, así que el
              nombre del botón se alinea con el de esos perfiles. */}
          <button
            className={`admin-nav-link ${cuentaActiva ? 'active' : ''}`}
            onClick={onToggleCuenta}
            style={{ backgroundColor: cuentaActiva ? 'rgba(0, 0, 0, 0.05)' : 'transparent' }}
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

export default CapturistaSidebar;
