/**
 * Loader genérico de una categoría de capas (Mapa Base nuevo, Diagnóstico, o
 * una Estrategia): lee su manifiesto + su simbología real (ambos generados
 * por `PYTHON/migrar_capas.py` a partir del CSV de QA/QC) y arma cada capa
 * con su `simboloDe` ya resuelto.
 *
 * Antes esta misma secuencia (fetch manifiesto/lista de capas + fetch
 * simbología + fetch datos + `createSymbolResolver` por capa) vivía repetida
 * a mano en `mapaBase.js` y `ejesEstrategicos.js`. Un manifiesto generado
 * (en vez de un array de capas escrito a mano por archivo) es lo que permite
 * que este loader sea genérico: no necesita saber nada de la categoría en
 * particular, solo las 3 URLs.
 *
 * Módulo puro: no importa Leaflet ni React, igual que qgisSymbology.ts.
 */
import { createSymbolResolver } from './qgisSymbology'

/**
 * @param {{ carpetaDatos: string, manifestUrl: string, simbologiaUrl: string }} args
 * @returns {Promise<Array>} una capa por entrada del manifiesto, con
 *   `simbologia`, `simboloDe` (o `null` si esa capa no tiene `.qml` real) y
 *   `data` (el GeoJSON ya parseado).
 */
export async function cargarCategoria({ carpetaDatos, manifestUrl, simbologiaUrl }) {
  const [manifest, simbologias] = await Promise.all([
    fetch(manifestUrl).then((r) => r.json()),
    fetch(simbologiaUrl).then((r) => r.json()).catch(() => ({})),
  ])

  return manifest.map((capa) => {
    const simbologia = simbologias[capa.id] ?? null
    let promesaDatos = null
    return {
      ...capa,
      simbologia,
      // Siempre una función llamable (createSymbolResolver ya devuelve
      // `() => null` cuando `simbologia` es `null`) — igual que el patrón
      // legado de mapaBase.js. Que exista o no simbología real se consulta
      // por `capa.tieneSimbologia` (viene del manifiesto), no por si
      // `simboloDe` es `null`: llamarla sin verificar no debe tronar nunca.
      simboloDe: createSymbolResolver(simbologia),
      /**
       * Carga perezosa y memoizada del GeoJSON de la capa. Algunas de las 93
       * capas migradas pesan cientos de MB sin recortar (decisión explícita:
       * no se simplifican) — descargarlas TODAS de un tirón al entrar al
       * Geovisor agota la memoria del navegador y tumba la pestaña. Por eso
       * el fetch ocurre recién cuando el usuario activa esa capa puntual
       * (ver `CapaGeoJSON` en MapViewer.jsx), no al cargar la categoría.
       */
      cargarDatos() {
        if (!promesaDatos) {
          promesaDatos = fetch(`${carpetaDatos}/${capa.archivo}`).then((r) => r.json())
        }
        return promesaDatos
      },
    }
  })
}

/**
 * Estilo Leaflet-compatible de respaldo para una capa SIN `.qml` real, según
 * su geometría — un color fijo (por Estrategia, por subcategoría de
 * Diagnóstico, etc., a elección de quien llama). Se usa tal cual como
 * `style` (líneas y polígonos) y como opciones de `L.circleMarker` (puntos):
 * `L.geoJSON` aplica la opción `style` también a los circleMarker que
 * devuelve `pointToLayer` (ver leafletSymbology.ts), así que mantener las
 * mismas claves en las tres formas evita que un estilo pise al otro.
 */
export function estiloPorGeometria(color, geom, userOpacity = 1) {
  switch (geom) {
    case 'polygon':
      return { fillColor: color, fillOpacity: 0.35 * userOpacity, color, weight: 1.5, opacity: 0.9 * userOpacity }
    case 'point':
      return { radius: 5, fillColor: color, fillOpacity: 0.85 * userOpacity, color: '#ffffff', weight: 1, opacity: userOpacity }
    case 'line':
    default:
      return { color, weight: 2.5, opacity: 0.85 * userOpacity }
  }
}
