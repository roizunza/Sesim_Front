import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import './Login.css';

/**
 * Adaptado de `Administracion.jsx` del proyecto anterior. Se conserva la UI
 * (incluido el modal de políticas de uso antes de entrar) pero se reemplaza
 * el "simulador de roles por contraseña" (`password === 'administradora'`)
 * por una sesión real de Supabase Auth: `signIn` intenta el login real, y
 * el modal de políticas solo aparece si las credenciales fueron válidas.
 */
const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPoliciesModal, setShowPoliciesModal] = useState(false);

  const { signIn, signOut } = useAuth();
  const navigate = useNavigate();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error: signInError } = await signIn(email, password);
    setIsSubmitting(false);

    if (signInError) {
      setError(
        isSupabaseConfigured
          ? 'Correo o contraseña incorrectos.'
          : 'Falta configurar Supabase: copia .env.example a .env, pon tu URL/anon key real y reinicia npm run dev.'
      );
      return;
    }
    // Credenciales válidas: se intercepta el flujo para mostrar las
    // políticas de uso antes de dejar entrar de verdad.
    setShowPoliciesModal(true);
  };

  const handleAcceptPolicies = () => {
    setShowPoliciesModal(false);
    navigate('/app');
  };

  const handleCancelPolicies = async () => {
    // Ya se había iniciado sesión real para validar las credenciales; si la
    // persona cancela en las políticas, se cierra esa sesión y se regresa
    // al login limpio.
    await signOut();
    setShowPoliciesModal(false);
  };

  return (
    <div className="admin-container">
      <div className="admin-login-card">
        <h1 className="admin-login-title">Inicio de Sesión</h1>

        {!isSupabaseConfigured && (
          <p style={{ background: '#FEF3C7', color: '#92400E', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', margin: '0 0 16px' }}>
            Supabase no está configurado en este entorno: copia <code>.env.example</code> a <code>.env</code>,
            pon la URL y anon key reales, y reinicia <code>npm run dev</code>.
          </p>
        )}

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="ejemplo@gobcampeche.com.mx"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="form-input"
                placeholder="contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p style={{ color: '#DC2626', fontSize: '13px', margin: '-8px 0 4px' }}>{error}</p>
          )}

          <button type="submit" className="admin-login-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>

      {showPoliciesModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">SESIM - Sistema Estatal de Seguimiento a indicadores de Movilidad y Seguridad vial</h2>
            <h3 className="modal-subtitle">Políticas de uso del sitio</h3>

            <div className="modal-text">
              <p>
                La información geoespacial y estadística gestionada en este módulo de la plataforma del Gobierno del Estado de Campeche se encuentra en actualización continua por parte de las unidades administrativas competentes. Debido a la naturaleza dinámica del sistema, los datos pueden contener diferencias en relación al tema o característica que representa.
              </p>
              <p>
                Para fines de estandarización, todas las capas espaciales han sido reproyectadas al sistema EPSG 4326. Es responsabilidad estricta del usuario verificar la exactitud, integridad y vigencia de la información antes de realizar cualquier análisis o alteración en el sistema.
              </p>
              <p>
                Si selecciona la opción <strong>Aceptar</strong> ingresará al SESIM. Si selecciona <strong>Cancelar</strong> permanecerá en la página de inicio de sesión.
              </p>
            </div>

            <div className="modal-actions">
              <button className="modal-btn modal-btn-accept" onClick={handleAcceptPolicies}>
                Aceptar
              </button>
              <button className="modal-btn modal-btn-cancel" onClick={handleCancelPolicies}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
