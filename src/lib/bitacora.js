/**
 * Bitácora de CUENTAS (Ciclo 1, paso 6): alta/cambio_rol/cambio_ambito/
 * baja/reactivación sobre `core.perfil`, expuesta como `api.bitacora`.
 *
 * No confundir con `solicitudes.js` (bitácora de SOLICITUDES de
 * cartografía, Ciclo 5, todavía sin tabla propia): esta sí tiene tabla real
 * desde el día uno, y la visibilidad de cada fila la decide por completo la
 * RLS del backend (ver `sesim-backend/db/migrations/105_rls_bitacora.sql`)
 * — este módulo no filtra nada por su cuenta, solo pide y devuelve lo que
 * Supabase ya decidió que esta sesión puede ver.
 */
import { supabase } from './supabaseClient';

export async function listarBitacoraCuentas() {
  const { data, error } = await supabase
    .schema('api')
    .from('bitacora')
    .select('id, creado_en, accion, detalle, objetivo_id_usuario, objetivo_rol, objetivo_nombre, actor_id_usuario, actor_rol, actor_nombre')
    .order('creado_en', { ascending: false });

  if (error) {
    console.error('[bitacora] No se pudo leer api.bitacora:', error.message);
    return [];
  }
  return data ?? [];
}

export const ACCION_BITACORA_LABEL = {
  alta: 'Alta de cuenta',
  cambio_rol: 'Cambio de rol',
  cambio_ambito: 'Cambio de ámbito',
  baja: 'Baja lógica',
  reactivacion: 'Reactivación',
};
