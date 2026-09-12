/**
 * Decodifica (sin verificar firma) el payload de un JWT.
 *
 * La firma YA fue verificada por GoTrue al emitir el token y por PostgREST
 * en cada request; el front solo necesita LEER un claim de conveniencia
 * (`rol`, agregado por el Custom Access Token Hook — ver
 * `sesim-backend/db/migrations/108_hook_custom_access_token.sql`), nunca
 * usarlo para decidir un permiso por su cuenta. Ninguna verificación de
 * autorización real depende de esto: RLS y servicio-procesos siguen
 * resolviendo el rol consultando `core.perfil` en cada request.
 */
export function decodeJwtClaims(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    // JWT usa base64url: hay que revertir a base64 estándar antes de atob.
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch (err) {
    console.error('[jwt] No se pudo decodificar el token:', err.message);
    return null;
  }
}
