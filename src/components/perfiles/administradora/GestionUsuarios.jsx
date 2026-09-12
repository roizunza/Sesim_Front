import React, { useEffect, useState } from 'react';
import { ArrowLeft, Users, UserPlus, Check, X } from 'lucide-react';
import { useAuth } from '../../../lib/auth';
import { listarPerfiles, actualizarPerfil, darDeAltaUsuario, ROLES_DISPONIBLES } from '../../../lib/gestionUsuarios';

/**
 * "Gestión de usuarios" — la pantalla que Ciclo 1 (paso 9) pedía y que
 * seguía sin construirse (ver `claude/ciclo-1-reporte-avance.md`).
 *
 * Corrección de Ismael (posterior a la primera versión): esta pantalla
 * completa es EXCLUSIVA de administrador_vip — no solo el alta de cuentas.
 * Un administrador normal ya no ve el botón en el sidebar ni el render en
 * AdministradorLayout.jsx; el `esVip` de abajo es una tercera capa de
 * defensa por si este componente se llegara a montar sin ese filtro. El
 * candado real, de todos modos, está en el backend: la policy RLS
 * `perfil_update_administracion` (ver
 * sesim-backend/db/migrations/109_rls_perfil_update_solo_vip.sql) ahora
 * solo permite UPDATE sobre core.perfil a administrador_vip, y
 * servicio-procesos ya rechazaba el alta con 403 a cualquiera que no lo
 * fuera — así que aunque alguien forzara la pantalla a mano desde el
 * navegador, el servidor lo rechazaría igual.
 */
const inputStyle = {
  padding: '8px 10px',
  border: '1px solid #D1D5DB',
  borderRadius: '6px',
  fontSize: '13px',
  fontFamily: 'var(--font-body)',
  width: '100%',
  boxSizing: 'border-box',
};

const AltaUsuarioForm = ({ onCreado }) => {
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({ correo: '', password: '', nombre: '', rol: 'capturista', dependencia: '' });
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const actualizarCampo = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje(null);
    const { error, data } = await darDeAltaUsuario({
      correo: form.correo,
      password: form.password,
      nombre: form.nombre,
      rol: form.rol,
      ambito: 'estatal',
      dependencia: form.dependencia || null,
    });
    setEnviando(false);

    if (error) {
      setMensaje({ tipo: 'error', texto: error.detail || error.message || 'No se pudo dar de alta la cuenta.' });
      return;
    }
    setMensaje({ tipo: 'ok', texto: `Cuenta creada correctamente (id ${data.id_perfil}).` });
    setForm({ correo: '', password: '', nombre: '', rol: 'capturista', dependencia: '' });
    onCreado?.();
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '20px', overflow: 'hidden' }}>
      <button
        onClick={() => setAbierto(!abierto)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 16px', background: '#9F2241', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
      >
        <UserPlus size={16} /> Dar de alta una cuenta nueva
      </button>

      {abierto && (
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>CORREO</label>
            <input type="email" required style={inputStyle} value={form.correo} onChange={(e) => actualizarCampo('correo', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>CONTRASEÑA TEMPORAL</label>
            <input type="text" required style={inputStyle} value={form.password} onChange={(e) => actualizarCampo('password', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>NOMBRE COMPLETO</label>
            <input type="text" required style={inputStyle} value={form.nombre} onChange={(e) => actualizarCampo('nombre', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>ROL</label>
            <select style={inputStyle} value={form.rol} onChange={(e) => actualizarCampo('rol', e.target.value)}>
              {ROLES_DISPONIBLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>DEPENDENCIA (OPCIONAL)</label>
            <input type="text" style={inputStyle} value={form.dependencia} onChange={(e) => actualizarCampo('dependencia', e.target.value)} />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" disabled={enviando} style={{ background: '#183B33', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 18px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', width: '100%' }}>
              {enviando ? 'Creando…' : 'Crear cuenta'}
            </button>
          </div>

          {mensaje && (
            <div style={{ gridColumn: '1 / -1', fontSize: '13px', color: mensaje.tipo === 'error' ? '#DC2626' : '#166534' }}>
              {mensaje.texto}
            </div>
          )}
        </form>
      )}
    </div>
  );
};

const GestionUsuarios = ({ onClose }) => {
  const { perfil } = useAuth();
  const esVip = perfil?.rol === 'administrador_vip';

  const [perfiles, setPerfiles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [edicion, setEdicion] = useState({}); // { [id]: { rol, dependencia } }

  const cargar = () => {
    if (!esVip) return;
    setCargando(true);
    listarPerfiles().then((data) => {
      setPerfiles(data);
      setCargando(false);
    });
  };

  useEffect(cargar, [esVip]);

  const iniciarEdicion = (fila) => setEdicion((e) => ({ ...e, [fila.id]: { rol: fila.rol, dependencia: fila.dependencia ?? '' } }));
  const cancelarEdicion = (id) => setEdicion((e) => { const { [id]: _, ...resto } = e; return resto; });

  const guardarEdicion = async (id) => {
    const cambios = edicion[id];
    if (!cambios) return;
    const { error } = await actualizarPerfil(id, cambios);
    if (!error) {
      cancelarEdicion(id);
      cargar();
    }
  };

  const toggleActivo = async (fila) => {
    await actualizarPerfil(fila.id, { activo: !fila.activo });
    cargar();
  };

  // Tercera capa de defensa (ver comentario de arriba del archivo): si por
  // lo que sea este componente se monta para alguien que no es
  // administrador_vip, no muestra nada en vez de la pantalla completa.
  if (!esVip) {
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 1200, background: '#F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6B7280', marginBottom: '16px' }}>Esta sección es exclusiva de administrador VIP.</p>
          <button onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#9F2241', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
            <ArrowLeft size={16} /> Regresar al mapa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1200, background: '#F4F5F7', overflowY: 'auto', fontFamily: 'var(--font-body)' }}>
      <div style={{ padding: '32px 40px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#9F2241', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
            <ArrowLeft size={16} /> Regresar al mapa
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', color: '#691C32', fontFamily: 'var(--font-heading)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} /> Gestión de usuarios
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#6B7280', fontSize: '13px' }}>
              Como administrador VIP puedes dar de alta cuentas nuevas, editar rol/dependencia y dar de baja o reactivar cualquier cuenta.
            </p>
          </div>
        </div>

        {esVip && <AltaUsuarioForm onCreado={cargar} />}

        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <tr>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: '700', color: '#4B5563' }}>NOMBRE</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: '700', color: '#4B5563' }}>ROL</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: '700', color: '#4B5563' }}>DEPENDENCIA</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: '700', color: '#4B5563' }}>ESTATUS</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: '700', color: '#4B5563' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic', fontSize: '13px' }}>Cargando…</td></tr>
              ) : perfiles.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic', fontSize: '13px' }}>No hay cuentas para mostrar.</td></tr>
              ) : (
                perfiles.map((fila) => {
                  const enEdicion = edicion[fila.id];
                  return (
                    <tr key={fila.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: '#1F2937' }}>{fila.nombre}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                        {enEdicion ? (
                          <select style={inputStyle} value={enEdicion.rol} onChange={(e) => setEdicion((ed) => ({ ...ed, [fila.id]: { ...ed[fila.id], rol: e.target.value } }))}>
                            {ROLES_DISPONIBLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          <span style={{ color: '#374151' }}>{fila.rol}</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                        {enEdicion ? (
                          <input style={inputStyle} value={enEdicion.dependencia} onChange={(e) => setEdicion((ed) => ({ ...ed, [fila.id]: { ...ed[fila.id], dependencia: e.target.value } }))} />
                        ) : (
                          <span style={{ color: '#6B7280' }}>{fila.dependencia || '—'}</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '999px', background: fila.activo ? '#DCFCE7' : '#FEE2E2', color: fila.activo ? '#166534' : '#991B1B' }}>
                          {fila.activo ? 'Activo' : 'Baja'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        {enEdicion ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => guardarEdicion(fila.id)} title="Guardar" style={{ background: '#166534', border: 'none', color: '#fff', borderRadius: '4px', padding: '6px', cursor: 'pointer' }}><Check size={14} /></button>
                            <button onClick={() => cancelarEdicion(fila.id)} title="Cancelar" style={{ background: '#6B7280', border: 'none', color: '#fff', borderRadius: '4px', padding: '6px', cursor: 'pointer' }}><X size={14} /></button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => iniciarEdicion(fila)} style={{ background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '4px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>Editar</button>
                            <button onClick={() => toggleActivo(fila)} style={{ background: fila.activo ? '#FEE2E2' : '#DCFCE7', color: fila.activo ? '#991B1B' : '#166534', border: 'none', borderRadius: '4px', padding: '6px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                              {fila.activo ? 'Dar de baja' : 'Reactivar'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GestionUsuarios;
