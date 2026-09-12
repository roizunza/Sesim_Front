/**
 * Acceso a datos de solicitudes (cartografía / instrumentos normativos).
 *
 * Reemplaza al `registrosSESIM.js` que faltaba en el proyecto anterior. La
 * diferencia importante: aquello era un arreglo hardcodeado en memoria que
 * simulaba tener datos; esto es honesto sobre lo que SÍ existe hoy en el
 * backend (Ciclo 1: solo `core.perfil` — usuarios, perfiles y roles) y lo
 * que todavía no (una tabla de solicitudes/bitácora de cartografía e
 * instrumentos — ver "Qué falta para dar el Ciclo 1 por cerrado" en
 * `claude/ciclo-1-reporte-avance.md`, punto 1: la bitácora).
 *
 * Por eso `listarSolicitudes()` devuelve un arreglo vacío en vez de datos de
 * relleno: la bandeja del Capturista se ve honestamente vacía ("Bandeja
 * vacía", ya soportado por CapturistaSidebar) en lugar de mentir con
 * ejemplos falsos. En cuanto el backend tenga la tabla real, solo hay que
 * completar la consulta de Supabase marcada abajo — el resto del front no
 * cambia porque ya consume esta misma función.
 *
 * (El import de `supabase` se deja fuera hasta que la consulta real de
 * abajo se descomente — un import sin uso se marca en el lint.)
 */

export const ESTATUS = {
  BORRADOR: 'borrador',
  REVISION: 'revision',
  APROBADO: 'aprobado',
  RECHAZADO: 'rechazado',
}

// Nota: `catalogos_sesim.json` (real) define 5 estatus, no 4
// (`vigente_admin` y `vigente_publico` como dos aprobados distintos, uno de
// uso interno y otro público). Los layouts de Capturista que se traen en
// este incremento solo necesitan un "aprobado" genérico. Cuando se
// desbloquee el flujo de Administrador (dictamen) habrá que decidir si se
// usan los 5 estatus reales aquí también — no se resuelve en este cambio
// para no tocar de más la maqueta de Capturista que sí está probada.

const COLOR_POR_ESTATUS = {
  [ESTATUS.BORRADOR]: '#9CA3AF',
  [ESTATUS.REVISION]: '#D97706',
  [ESTATUS.APROBADO]: '#10B981',
  [ESTATUS.RECHAZADO]: '#EF4444',
}

export function getStatusColor(estatus) {
  return COLOR_POR_ESTATUS[estatus] ?? '#9CA3AF'
}

/**
 * Trae las solicitudes (cartografía + instrumentos) visibles para el
 * usuario actual.
 *
 * TODO (cuando el backend tenga la tabla, p. ej. `core.solicitud`):
 *
 *   const { data, error } = await supabase
 *     .schema('api')
 *     .from('solicitud')
 *     .select('*')
 *     .order('creado_en', { ascending: false })
 *   if (error) { console.error(error); return [] }
 *   return data
 *
 * RLS ya se encargaría de filtrar por municipio/ámbito del lado del
 * servidor (igual que hace hoy con `core.perfil`), así que este archivo no
 * necesita repetir esa lógica de filtrado en el cliente.
 */
export async function listarSolicitudes() {
  return []
}
