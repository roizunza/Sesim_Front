import React, { useMemo } from 'react';
import { ArrowLeft, ClipboardList, Clock } from 'lucide-react';
import { getStatusColor } from '../../../lib/solicitudes';

/**
 * "Mi Bitácora" del Capturista.
 *
 * Per el TDR (Ciclo 5, matriz de permisos): "Ver la bitácora completa" es
 * Parcial para el capturista — ve su propio historial, no el de los demás
 * municipios/usuarios (eso es exclusivo de administrador/auditor, que ven
 * "Completa"). Por eso este panel NO es la bitácora global de
 * `src/components/Bitacora/BitacoraLogs.jsx` (esa sigue pendiente de
 * desbloquear para esos otros perfiles, con datos simulados) — aquí se
 * listan solo las entradas ya adjuntas a los `registros` que el propio
 * capturista fue creando en esta sesión (ver CapturistaLayout), cada una
 * con su propio arreglo `bitacora` (fecha, acción, comentario).
 *
 * Honesto sobre el estado del backend: todavía no existe una tabla
 * `core.bitacora` expuesta al front (ver src/lib/solicitudes.js), así que
 * esto no es más que la traza de lo que el capturista hizo en esta misma
 * sesión de navegador. Cuando exista esa tabla, esto se vuelve una consulta
 * real filtrada por `actor = auth.uid()` vía RLS, en vez de derivarse de
 * `registros`.
 */
const ACCION_LABEL = {
  carga: 'Carga inicial',
  envio: 'Enviado a revisión',
};

const CapturistaBitacora = ({ registros, nombreCapturista, onClose }) => {
  const entradas = useMemo(() => {
    return registros
      .filter((r) => r.tipo === 'cartografia')
      .flatMap((r) => (r.bitacora || []).map((entrada) => ({ ...entrada, recurso: r.id, estatusActual: r.estatus })))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [registros]);

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
                <ClipboardList size={20} /> Mi Bitácora
              </h1>
              <p style={{ margin: '4px 0 0 0', color: '#6B7280', fontSize: '13px' }}>
                Historial propio de {nombreCapturista}: cargas y envíos a revisión de cartografía. No incluye actividad de otros usuarios ni de otros municipios.
              </p>
            </div>
          </div>
        </div>

        <div className="table-responsive" style={{ background: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <tr>
                <th style={{ padding: '16px', fontSize: '11px', fontWeight: '700', color: '#4B5563', whiteSpace: 'nowrap' }}>FECHA</th>
                <th style={{ padding: '16px', fontSize: '11px', fontWeight: '700', color: '#4B5563', whiteSpace: 'nowrap' }}>RECURSO</th>
                <th style={{ padding: '16px', fontSize: '11px', fontWeight: '700', color: '#4B5563', whiteSpace: 'nowrap' }}>ACCIÓN</th>
                <th style={{ padding: '16px', fontSize: '11px', fontWeight: '700', color: '#4B5563' }}>COMENTARIO</th>
                <th style={{ padding: '16px', fontSize: '11px', fontWeight: '700', color: '#4B5563', whiteSpace: 'nowrap' }}>ESTATUS ACTUAL</th>
              </tr>
            </thead>
            <tbody>
              {entradas.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>
                    Aún no tienes actividad registrada. En cuanto cargues o envíes una capa a revisión, aparecerá aquí.
                  </td>
                </tr>
              ) : (
                entradas.map((entrada, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={13} /> {new Date(entrada.fecha).toLocaleString('es-MX')}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#1F2937', fontWeight: '600' }}>{entrada.recurso}</td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#374151' }}>{ACCION_LABEL[entrada.accion] ?? entrada.accion}</td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#4B5563' }}>{entrada.comentario}</td>
                    <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(entrada.estatusActual) }} />
                        {entrada.estatusActual}
                      </span>
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

export default CapturistaBitacora;
