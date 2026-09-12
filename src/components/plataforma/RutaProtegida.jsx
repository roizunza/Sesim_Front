import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

/**
 * Reemplaza el "cae a capturista por default si no hay nada en
 * localStorage" del proyecto anterior (inseguro: cualquiera sin sesión
 * terminaba viendo la vista de Capturista). Ahora: sin sesión real de
 * Supabase Auth, no se entra.
 */
export default function RutaProtegida({ children }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: '14px' }}>
        Verificando sesión…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
