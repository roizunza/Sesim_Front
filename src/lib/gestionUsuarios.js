/**
 * Pantalla de "Gestión de usuarios" (Ciclo 1, paso 9 — la pieza que seguía
 * pendiente en `claude/ciclo-1-reporte-avance.md`).
 *
 * `listarPerfiles`/`actualizarPerfil` van contra `api.perfil` (RLS decide
 * quién ve/edita qué fila — ver `core.perfil` en el backend). `darDeAlta`
 * es la única operación que NO pasa por PostgREST: llama directo a
 * `servicio-procesos` (`POST /admin/alta-usuario`), porque crear una cuenta
 * nueva en `auth.users` necesita la Admin API de Supabase, algo que ningún
 * rol de Postgres puede hacer por su cuenta. El backend ya rechaza con 403
 * a cualquiera que no sea `administrador_vip` — aquí, en el front, solo se
 * OCULTA el botón para los demás roles (ver GestionUsuarios.jsx); el
 * candado real vive en el servidor, no en esconder el botón.
 */
import { supabase } from './supabaseClient';

const SERVICIO_PROCESOS_URL = import.meta.env.VITE_SERVICIO_PROCESOS_URL || 'http://localhost:8001';

export async function listarPerfiles() {
  const { data, error } = await supabase
    .schema('api')
    .from('perfil')
    .select('id, id_usuario, nombre, rol, ambito, cve_mun, dependencia, activo, creado_en')
    .order('creado_en', { ascending: true });

  if (error) {
    console.error('[gestionUsuarios] No se pudo leer api.perfil:', error.message);
    return [];
  }
  return data ?? [];
}

export async function actualizarPerfil(id, cambios) {
  const { data, error } = await supabase
    .schema('api')
    .from('perfil')
    .update(cambios)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[gestionUsuarios] No se pudo actualizar el perfil:', error.message);
    return { error };
  }
  return { data };
}

/**
 * POST /admin/alta-usuario. Necesita el access_token de la sesión ACTUAL
 * (de quien está dando de alta, no de la cuenta nueva) — servicio-procesos
 * valida ahí mismo que sea un administrador_vip activo.
 */
export async function darDeAltaUsuario(payload) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    return { error: { message: 'No hay sesión activa.' } };
  }

  try {
    const respuesta = await fetch(`${SERVICIO_PROCESOS_URL}/admin/alta-usuario`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const cuerpo = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
      return { error: { status: respuesta.status, detail: cuerpo?.detail ?? 'Error desconocido' } };
    }
    return { data: cuerpo };
  } catch (err) {
    return { error: { message: `No se pudo contactar servicio-procesos (${SERVICIO_PROCESOS_URL}): ${err.message}` } };
  }
}

export const ROLES_DISPONIBLES = ['capturista', 'administrador', 'administrador_vip', 'auditor'];
