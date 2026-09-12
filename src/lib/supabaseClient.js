/**
 * Cliente único de Supabase para todo el front.
 *
 * Las credenciales NUNCA se hardcodean aquí: vienen de variables de entorno
 * de Vite (`.env`, que no se sube a git — ver `.env.example`). Solo se usa
 * la clave `anon`, nunca la `service_role` (esa se queda exclusivamente en
 * `servicio-procesos`, del lado del servidor).
 */
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  // `createClient` revienta con un throw duro si la URL viene vacía o mal
  // formada (no es un error silencioso) — eso tumbaba toda la app con
  // pantalla en blanco antes de que existiera el .env. Por eso, si falta la
  // configuración, se le pasa una URL con formato válido pero inservible:
  // la app carga y se ve el aviso de login/error, en vez de un crash.
  console.error(
    '[supabaseClient] Falta VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. ' +
      'Copia .env.example a .env, pon la URL/anon key de tu Supabase autoalojado ' +
      'y reinicia `npm run dev` (Vite solo lee el .env al arrancar).'
  )
}

export const supabase = createClient(
  isSupabaseConfigured ? url : 'https://supabase-no-configurado.invalid',
  isSupabaseConfigured ? anonKey : 'anon-key-no-configurada',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)
