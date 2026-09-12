/**
 * Sesión real de Supabase Auth + resolución del rol de negocio.
 *
 * Reemplaza el patrón anterior (`localStorage.getItem('sim_role')`) por una
 * sesión real de GoTrue. La AUTORIZACIÓN real de cada operación la sigue
 * haciendo Postgres (RLS vía `core.rol_actual()`) y servicio-procesos, no
 * este componente — lo que cambia con el hook de `108_hook_custom_access_
 * token.sql` es que el JWT AHORA también trae el rol como claim de
 * conveniencia (`rolClaim` más abajo), para que el front no tenga que
 * esperar la consulta a `api.perfil` nada más para decidir qué layout
 * mostrar. `perfil`/`rol` (de `api.perfil`) siguen siendo la fuente de
 * verdad para todo lo demás: `rolClaim` puede quedar desactualizado hasta
 * el próximo refresh de sesión si a alguien le cambian el rol o lo dan de
 * baja, exactamente igual que cualquier JWT — por diseño, ver el archivo de
 * migración citado arriba.
 */
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { decodeJwtClaims } from './jwt'

const AuthContext = createContext(null)

async function fetchPerfil(userId) {
  if (!userId) return null
  // `core.perfil` se expone como `api.perfil` (ver ciclo-1-reporte-avance.md,
  // paso 7). Si tu Supabase expone el esquema con otro nombre, ajusta aquí.
  const { data, error } = await supabase
    .schema('api')
    .from('perfil')
    .select('id_usuario, nombre, rol, ambito, cve_mun, dependencia, activo')
    .eq('id_usuario', userId)
    .maybeSingle()

  if (error) {
    console.error('[auth] No se pudo leer el perfil de core.perfil:', error.message)
    return null
  }
  return data
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = aún cargando
  const [perfil, setPerfil] = useState(null)
  const [loadingPerfil, setLoadingPerfil] = useState(false)

  const loadPerfil = useCallback(async (userId) => {
    setLoadingPerfil(true)
    const p = await fetchPerfil(userId)
    setPerfil(p)
    setLoadingPerfil(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user?.id) loadPerfil(data.session.user.id)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user?.id) {
        loadPerfil(newSession.user.id)
      } else {
        setPerfil(null)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [loadPerfil])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    perfil,
    // Mientras la sesión no se resolvió (undefined) o el perfil sigue
    // cargando después de que sí hay sesión, se considera "cargando" para
    // que las rutas protegidas no parpadeen a la pantalla de login.
    isLoading: session === undefined || (!!session && loadingPerfil && !perfil),
    isAuthenticated: !!session,
    rol: perfil?.rol ?? null,
    // Claim de CONVENIENCIA leído directo del JWT (ver jwt.js y
    // 108_hook_custom_access_token.sql) — nunca la fuente de verdad. Sirve
    // para, por ejemplo, evitar un parpadeo mientras `perfil` sigue
    // cargando; para decidir un permiso siempre se usa `rol` (de
    // `api.perfil`, ya con RLS aplicada) o, mejor aún, se deja que RLS
    // decida del lado del servidor.
    rolClaim: decodeJwtClaims(session?.access_token)?.rol ?? null,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
