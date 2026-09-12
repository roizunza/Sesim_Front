/**
 * Mapa Base: 24 capas agrupadas en 4 subcategorías, exactamente como lo dio
 * el usuario en su árbol de capas —
 *
 *   00 MAPA BASE
 *   ├── Límites Administrativos (2)
 *   ├── Localidades y Asentamientos (4)
 *   ├── Red de Transportes e Infraestructura (13)
 *   └── Medio Físico y Conservación (5)
 *
 * (24 = 26 del árbol original menos `00_100PAISES` y menos
 * `c00_entidades_inegi_2024` — "Entidades Federativas" —, ambas eliminadas
 * a pedido explícito del usuario). El manifiesto
 * (`public/Datos/MapaBase/estilos/manifest.json`, generado por
 * `PYTHON/migrar_capas.py`) ya trae 35 filas — todas las que el export de
 * `05_GEOJSON/MAPA-BASE` producía —, así que aquí se filtra a mano a los 24
 * ids de ese árbol: es una decisión editorial del usuario (qué entra al
 * árbol), no un dato que se pueda derivar del CSV de QA/QC.
 *
 * El sistema anterior de 13 capas "legado" (con simbología de dos volcados
 * de QGIS sin `.qml` real detrás) se retiró: ninguna de esas 13 aparece en
 * el árbol del usuario — varias (Zonas Metropolitanas, Búfer Estatal) se
 * quitaron a propósito, y el resto ya tiene equivalente en las 24 nuevas
 * (p. ej. "Puntos Int" consolida puertos + aeropuertos + pistas aéreas).
 *
 * Mismo patrón que `diagnostico.js`: el agrupamiento real (`tema`) viene del
 * manifiesto: solo la etiqueta bonita de cada grupo es texto curado a mano.
 *
 * Módulo puro: no importa Leaflet ni React, igual que diagnostico.js.
 */
import { cargarCategoria } from './loaderCapas'

const BASE = '/Datos/MapaBase'

/** Los 24 ids del árbol de capas del usuario — todo lo demás que trae el
 * manifiesto (35 filas) se descarta. (`c00_entidades_inegi_2024` —
 * "Entidades Federativas" — se quitó a pedido explícito del usuario.) */
const IDS_DEL_ARBOL = new Set([
  'c04_lim_edo_2024_inegi_2024',
  'c04_municiipios_inegi_2024',
  'c04_localidades_2024',
  'c04_localidades_rurales_2024',
  'c04_localidades_urbanas_inegi_ai1500_2024',
  'c04_manzanas_imt_inegi_2024',
  'c04_red_campeche_imt_inegi_2024',
  'c04_red_regional_imt_inegi_2024',
  'C03_00_rfn_artf_2023_sesim_2026',
  'C11_c04004_tren_ligero_infocam_2025_sesim_2026',
  'C10_c04002_paraderos_tren_ligero_sedumop_2025_sesim_2026',
  'c00_emisor_senal_imt_inegi_2024',
  'c00_ruta_tren_maya_peot_2023',
  'c04_estacionestm_sedatu_2024',
  'c04_linea_transmision_imt_inegi_2024',
  'c04_acueductos_imt_inegi_2024',
  'c04_ductos_champoton_2023',
  'c04_puente_imt_inegi_2024',
  'c04_puntos_int_imt_inegi_2024',
  'c00_anp_conanp_2025',
  'c00_rpt_conabio_2008',
  'c04_areaboscosa_inegi_2018',
  'c04_cuerpos_agua_inegi_2024',
  'c04_corrientesagua_area_inegi_2024',
])

/** Slug de `tema` (dato real, del CSV de QA/QC) -> nombre del grupo, tal
 * cual lo tituló el usuario en su árbol. */
const ETIQUETA_POR_GRUPO = {
  limites_administrativos: 'Límites Administrativos',
  localidades_y_asentamientos: 'Localidades y Asentamientos',
  red_de_transportes_e_infraestructura: 'Red de Transportes e Infraestructura',
  conservacion: 'Medio Físico y Conservación',
}

const ORDEN_GRUPOS = Object.keys(ETIQUETA_POR_GRUPO)

/**
 * Carga las 25 capas de Mapa Base y las agrupa en los 4 grupos del árbol.
 * @returns {Promise<Array<{ id: string, label: string, capas: Array }>>}
 */
export async function cargarMapaBase() {
  const capas = (
    await cargarCategoria({
      carpetaDatos: BASE,
      manifestUrl: `${BASE}/estilos/manifest.json`,
      simbologiaUrl: `${BASE}/estilos/simbologia.json`,
    })
  ).filter((capa) => IDS_DEL_ARBOL.has(capa.id))

  const porGrupo = new Map()
  for (const capa of capas) {
    const clave = capa.tema
    if (!porGrupo.has(clave)) porGrupo.set(clave, [])
    porGrupo.get(clave).push(capa)
  }

  const claves = [
    ...ORDEN_GRUPOS.filter((c) => porGrupo.has(c)),
    ...Array.from(porGrupo.keys()).filter((c) => !ORDEN_GRUPOS.includes(c)),
  ]

  return claves.map((slug) => ({
    id: slug,
    label: ETIQUETA_POR_GRUPO[slug] ?? slug,
    capas: porGrupo.get(slug),
  }))
}

/** Color de respaldo por grupo, para las capas sin `.qml` real (ver
 * `estiloPorGeometria` en loaderCapas.js). */
export const COLOR_POR_TEMA = {
  limites_administrativos: '#1F2937', // gris oscuro / negro
  conservacion: '#16A34A', // verde
  red_de_transportes_e_infraestructura: '#78716C', // gris pardo
  localidades_y_asentamientos: '#F97316', // ámbar
}
const COLOR_TEMA_RESPALDO = '#64748B' // gris azulado, tema no catalogado

export function colorDeTema(tema) {
  return COLOR_POR_TEMA[tema] ?? COLOR_TEMA_RESPALDO
}
