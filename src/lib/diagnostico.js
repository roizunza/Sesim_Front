/**
 * Diagnóstico de la EEMSV: 19 capas agrupadas en 6 subcategorías temáticas.
 *
 * A diferencia de Estrategias (donde cada Eje es una decisión editorial:
 * título corto, color, ícono), aquí el agrupamiento es 100% un dato: el
 * propio `tema` de cada capa en el manifiesto (generado por
 * `PYTHON/migrar_capas.py` a partir de `tema_subgrupo` del CSV de QA/QC) YA
 * es su subcategoría real (`eemsv_disponibilidad_de_transporte_publico`,
 * etc. — el mismo nombre de las carpetas de `05_SIMBOLOGIA/QML/01
 * DIAGNÓSTICO/`). No hay ninguna capa ni agrupación escrita a mano en este
 * módulo — el único texto curado es la traducción de cada slug a una
 * etiqueta legible para el sidebar.
 *
 * Módulo puro: no importa Leaflet ni React, igual que mapaBase.js.
 */
import { cargarCategoria } from './loaderCapas'

const BASE = '/Datos/Diagnostico'

/** Color de respaldo para las 3/19 capas sin `.qml` real — ver `estiloPorGeometria`
 * en `loaderCapas.js`. Gris azulado neutro: Diagnóstico es informativo, no
 * necesita la misma jerarquía visual por eje que sí tienen las Estrategias. */
export const COLOR_RESPALDO_DIAGNOSTICO = '#64748B'

/** Slug de `tema` (dato real, viene del CSV) -> etiqueta de UI (texto curado). */
const ETIQUETA_POR_SUBCATEGORIA = {
  eemsv_disponibilidad_de_transporte_publico: 'Disponibilidad de Transporte Público',
  eemsv_gacp_y_distancia_tridimensional: 'GACP y Distancia Tridimensional',
  eemsv_infraestructura_de_transporte: 'Infraestructura de Transporte',
  eemsv_recubrimiento_de_la_red_carretera: 'Recubrimiento de la Red Carretera',
  eemsv_tiempo_de_traslado_al_centro_de_servicio_mas_cercano: 'Tiempo de Traslado al Centro de Servicio más Cercano',
  eemsv_transporte_de_carga: 'Transporte de Carga',
}

/** Orden de despliegue de las subcategorías en el sidebar — el único otro
 * texto curado a mano: qué tan arriba aparece cada grupo. */
const ORDEN_SUBCATEGORIAS = Object.keys(ETIQUETA_POR_SUBCATEGORIA)

function etiquetaDe(slug) {
  return ETIQUETA_POR_SUBCATEGORIA[slug] ?? slug
}

/**
 * Carga las 19 capas y las agrupa por subcategoría.
 * @returns {Promise<Array<{ id: string, label: string, capas: Array }>>}
 */
export async function cargarDiagnostico() {
  const capas = await cargarCategoria({
    carpetaDatos: BASE,
    manifestUrl: `${BASE}/estilos/manifest.json`,
    simbologiaUrl: `${BASE}/estilos/simbologia.json`,
  })

  const porSubcategoria = new Map()
  for (const capa of capas) {
    const clave = capa.tema
    if (!porSubcategoria.has(clave)) porSubcategoria.set(clave, [])
    porSubcategoria.get(clave).push(capa)
  }

  // Subcategorías conocidas primero (en el orden curado), cualquier otra que
  // aparezca en datos futuros no se pierde: se agrega al final.
  const claves = [
    ...ORDEN_SUBCATEGORIAS.filter((c) => porSubcategoria.has(c)),
    ...Array.from(porSubcategoria.keys()).filter((c) => !ORDEN_SUBCATEGORIAS.includes(c)),
  ]

  return claves.map((slug) => ({
    id: slug,
    label: etiquetaDe(slug),
    capas: porSubcategoria.get(slug),
  }))
}
