import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../lib/auth';

// Refactor: la sesión ya no se lee de localStorage ('sim_role'/'sim_user_id',
// falsa y sin verificar) sino de la sesión real de Supabase Auth vía
// useAuth(). El botón de "Historial de Actividades" (bitácora) se retira
// por ahora: esa pantalla (BitacoraLogs.jsx) sigue siendo datos simulados y
// no está enrutada todavía en este incremento.
export default function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuth();

  const handleImgError = (e) => {
    e.currentTarget.style.display = 'none';
    const placeholder = e.currentTarget.nextElementSibling;
    if (placeholder) placeholder.style.display = 'flex';
  };

  const handleUserAction = async () => {
    if (isAuthenticated) {
      await signOut();
      navigate('/');
    } else {
      navigate('/login');
    }
  };

  return (
    <header className="header" role="banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', backgroundColor: 'var(--c-white)', borderBottom: '1px solid var(--border-color)' }}>
      <div className="header__inner" style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>

        <Link to="/" className="header__logos" aria-label="Ir al inicio" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', height: 56, display: 'flex', alignItems: 'center' }}>
            <img src="/gobiernoparatodos.png" alt="Escudo del Estado de Campeche" className="header__logo-img header__logo-img--campeche" onError={handleImgError} style={{ height: '40px' }} />
          </div>

          <div className="header__logo-divider" aria-hidden="true" style={{ width: '1px', height: '32px', backgroundColor: 'var(--border-color)' }} />

          <div style={{ position: 'relative', height: 56, display: 'flex', alignItems: 'center' }}>
            <img src="/logocampeche.png" alt="Gobierno para Todos" className="header__logo-img header__logo-img--gobierno" onError={handleImgError} style={{ height: '40px' }} />
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="header__user-btn"
            aria-label={isAuthenticated ? "Cerrar sesión" : "Iniciar sesión"}
            onClick={handleUserAction}
            title={isAuthenticated ? "Cerrar sesión" : "Iniciar sesión"}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isAuthenticated ? <LogOut size={20} /> : <User size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
