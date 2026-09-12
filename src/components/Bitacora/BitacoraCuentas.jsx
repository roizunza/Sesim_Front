import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ShieldCheck, Clock } from 'lucide-react';
import { listarBitacoraCuentas, ACCION_BITACORA_LABEL } from '../../lib/bitacora';

/**
 * "Bitácora de cuentas" (Ciclo 1, paso 6): alta/cambio de rol/cambio de
 * ámbito/baja/reactivación sobre `core.perfil`.
 *
 * Componente COMPARTIDO por los cuatro roles (Capturista, Administrador,
 * Administrador VIP, Auditor): la visibilidad de cada fila ya la decidió
 * por completo la RLS del backend antes de que este componente reciba un
 * solo dato (ver `sesim-backend/db/migrations/105_rls_bitacora.sql`), así
 * que aquí no se filtra nada por rol — cada perfil simplemente ve lo que
 * `api.bitacora` le devolvió. Esto es DISTINTO de "Mi Bitácora" del
 * Capturista (`CapturistaBitacora.jsx`, historial de sus propias
 * solicitudes de cartografía — Ciclo 5): esta pantalla es sobre altas,
 * cambios y bajas de CUENTAS, no sobre solicitudes.
 */
const RENGLON_DETALLE = {
  cambio_rol: (d) => `${d.rol_anterior ?? '—'} → ${d.rol_nuevo ?? '—'}`,
  cambio_ambito: (d) => `${d.ambito_anterior ?? '—'}${d.cve_mun_anterior ? ` (${d.cve_mun_anterior})` : ''} → ${d.ambito_nuevo ?? '—'}${d.cve_mun_nuevo ? ` (${d.cve_mun_nuevo})` : ''}`,
  alta: (d) => `Rol inicial: ${d.rol ?? '—'}`,
};

const BitacoraCuentas = ({ onClose, descripcion }) => {
  const [entradas, setEntradas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    listarBitacoraCuentas().then((data) => {
      if (vivo) {
        setEntradas(data);
        setCargando(false);
      }
    });
    return () => {
      vivo = false;
    };
  }, []);

  const filas = useMemo(() => entradas, [entradas]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1200,
        background: '#F4F5F7',
        overflowY: 'auto',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{ padding: '32px 40px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#9F2241', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
            >
              <ArrowLeft size={16} /> Regresar al mapa
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', color: '#691C32', fontFamily: 'var(--font-heading)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} /> Bitácora de cuentas
              </h1>
              <p style={{ margin: '4px 0 0 0', color: '#6B7280', fontSize: '13px', maxWidth: '640px' }}>
                {descripcion ?? 'Altas, cambios de rol/ámbito y bajas de cuentas. Lo que ves aquí ya está filtrado por tu rol.'}
              </p>
            </div>
          </div>
        </div>

        <div className="table-responsive" style={{ background: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <tr>
                <th style={{ padding: '16px', fontSize: '11px', fontWeight: '700', color: '#4B5563', whiteSpace: 'nowrap' }}>FECHA</th>
                <th style={{ padding: '16px', fontSize: '11px', fontWeight: '700', color: '#4B5563', whiteSpace: 'nowrap' }}>CUENTA AFECTADA</th>
                <th style={{ padding: '16px', fontSize: '11px', fontWeight: '700', color: '#4B5563', whiteSpace: 'nowrap' }}>ACCIÓN</th>
                <th style={{ padding: '16px', fontSize: '11px', fontWeight: '700', color: '#4B5563' }}>DETALLE</th>
                <th style={{ padding: '16px', fontSize: '11px', fontWeight: '700', color: '#4B5563', whiteSpace: 'nowrap' }}>REALIZADO POR</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>
                    Cargando…
                  </td>
                </tr>
              ) : filas.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>
                    Todavía no hay actividad registrada aquí.
                  </td>
                </tr>
              ) : (
                filas.map((entrada) => (
                  <tr key={entrada.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={13} /> {new Date(entrada.creado_en).toLocaleString('es-MX')}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#1F2937', fontWeight: '600' }}>
                      {entrada.objetivo_nombre ?? entrada.objetivo_id_usuario}
                      <span style={{ display: 'block', fontSize: '11px', color: '#9CA3AF', fontWeight: '500' }}>{entrada.objetivo_rol}</span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#374151' }}>
                      {ACCION_BITACORA_LABEL[entrada.accion] ?? entrada.accion}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#4B5563' }}>
                      {RENGLON_DETALLE[entrada.accion]?.(entrada.detalle ?? {}) ?? '—'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#4B5563' }}>
                      {entrada.actor_nombre ?? 'Sistema'}
                      {entrada.actor_rol ? <span style={{ display: 'block', fontSize: '11px', color: '#9CA3AF' }}>{entrada.actor_rol}</span> : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BitacoraCuentas;
