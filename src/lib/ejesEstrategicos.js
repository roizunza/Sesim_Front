/**
 * Estrategias de la Estrategia Estatal de Movilidad y Seguridad Vial (EEMSV)
 * de Campeche, 2024-2040.
 *
 * Solo las 5 fichas de abajo (`EJES_ESTRATEGICOS`) son texto curado a mano:
 * título corto, color, ícono y descripción de una línea — contenido
 * editorial que el propio usuario dictó, no un dato. Las 38 capas (qué
 * archivos son, su etiqueta, su geometría, su simbología real) vienen del
 * manifiesto que genera `PYTHON/migrar_capas.py` a partir del CSV de QA/QC
 * de `02_CAPAS/05_GEOJSON/` — nada de eso está escrito a mano aquí.
 *
 * Módulo puro: no importa Leaflet ni React, igual que mapaBase.js.
 */
import { cargarCategoria, estiloPorGeometria } from './loaderCapas'

const BASE = '/Datos/EjesEstrategicos'

/**
 * Las 5 Estrategias, en su orden oficial. `tituloCorto`/`descripcionCorta`/
 * `icono` alimentan tanto la tarjeta "Estrategias EEMSV" de Inicio.jsx como
 * el switch maestro del sidebar del Geovisualizador — una sola fuente de la
 * verdad para no repetir el texto en dos componentes. `icono` es una clave de
 * texto (no un componente: este módulo no importa React) que cada consumidor
 * resuelve contra su propio mapa de íconos de `lucide-react`. `color` es el
 * respaldo de estilo para las capas de ese Eje que no tengan `.qml` real.
 *
 * Este array NO trae `capas` — eso lo agrega `cargarEjesEstrategicos()` al
 * vuelo desde el manifiesto, para que Inicio.jsx pueda mostrar las 5 tarjetas
 * sin tener que descargar los ~38 GeoJSON de datos.
 *
 * `sinopsis`, `kpiIndicadores` y `kpiCapas` alimentan la tarjeta que se
 * despliega en hover sobre cada porción isométrica de Inicio.jsx (ver
 * EstrategiasIsometricas.jsx). `kpiIndicadores`/`kpiCapas` NO son cifras
 * inventadas — se calcularon el 2026-09-13 así:
 *   - kpiIndicadores: conteo de filas de public/Datos/Tablas/Indicadores.csv
 *     cuya columna "Eje(s) vinculado(s)" incluye el número de este eje (un
 *     indicador puede estar vinculado a más de un eje, p. ej. "1, 5" cuenta
 *     para ambos — por eso la suma de los 5 valores, 127, es mayor que el
 *     total de 113 indicadores del catálogo).
 *   - kpiCapas: longitud real del arreglo en
 *     public/Datos/EjesEstrategicos/estilos/Eje_{numero}_manifest.json
 *     (8+11+7+6+6 = 38 capas, coincide con lo ya documentado en el proyecto).
 * Si el CSV o los manifiestos cambian, hay que recalcular estos 10 números a
 * mano con el mismo método — no hay un paso de build que los mantenga
 * sincronizados.
 */
export const EJES_ESTRATEGICOS = [
  {
    id: 'eje1',
    numero: 1,
    tituloCorto: '1. Desarrollo Económico Territorial',
    descripcionCorta: 'Redes logísticas y territorio.',
    sinopsis: 'Vialidades y corredores logísticos que conectan al territorio con el desarrollo económico estatal.',
    icono: 'TrendingUp',
    label: 'Estrategia 1 · Desarrollo Económico Territorial',
    color: '#F97316', // ámbar
    carpeta: 'Eje_1',
    kpiIndicadores: 37,
    kpiCapas: 8,
  },
  {
    id: 'eje2',
    numero: 2,
    tituloCorto: '2. Transporte Público de Personas',
    descripcionCorta: 'Calidad, eficiencia y tecnología.',
    sinopsis: 'Calidad, eficiencia y modernización tecnológica del transporte público de personas.',
    icono: 'Bus',
    label: 'Estrategia 2 · Transporte Público de Personas',
    color: '#0E6EC5', // azul primario
    carpeta: 'Eje_2',
    kpiIndicadores: 28,
    kpiCapas: 11,
  },
  {
    id: 'eje3',
    numero: 3,
    tituloCorto: '3. Movilidad Activa',
    descripcionCorta: 'Infraestructura ciclista y peatonal.',
    sinopsis: 'Infraestructura ciclista y peatonal para una movilidad activa y segura.',
    icono: 'Bike',
    label: 'Estrategia 3 · Movilidad Activa',
    color: '#0FCE9A', // verde/teal
    carpeta: 'Eje_3',
    kpiIndicadores: 15,
    kpiCapas: 7,
  },
  {
    id: 'eje4',
    numero: 4,
    tituloCorto: '4. Seguridad Vial',
    descripcionCorta: 'Enfoque de Sistema Seguro.',
    sinopsis: 'Enfoque de Sistema Seguro para reducir siniestros y proteger a toda persona usuaria de la vía.',
    icono: 'ShieldAlert',
    label: 'Estrategia 4 · Seguridad Vial',
    color: '#C00000', // rojo
    carpeta: 'Eje_4',
    kpiIndicadores: 22,
    kpiCapas: 6,
  },
  {
    id: 'eje5',
    numero: 5,
    tituloCorto: '5. Género e Inclusión',
    descripcionCorta: 'Equidad y accesibilidad universal.',
    sinopsis: 'Accesibilidad universal y perspectiva de género en el espacio público y la movilidad.',
    icono: 'Users',
    label: 'Estrategia 5 · Género e Inclusión',
    color: '#9333EA', // púrpura
    carpeta: 'Eje_5',
    kpiIndicadores: 25,
    kpiCapas: 6,
  },
]

// Re-exportado para no romper a quien ya importaba `estiloPorGeometria` desde
// este módulo — vive de verdad en `loaderCapas.js` (lo comparte Diagnóstico).
export { estiloPorGeometria }

/**
 * Carga las capas GeoJSON de las 5 Estrategias junto con su simbología real
 * (cuando existe). Devuelve `EJES_ESTRATEGICOS` con `capas` añadido a cada
 * ficha — `simboloDe` es `null` en las capas sin `.qml`, y quien dibuja cae
 * entonces a `estiloPorGeometria(eje.color, capa.geom)`.
 */
export async function cargarEjesEstrategicos() {
  return Promise.all(
    EJES_ESTRATEGICOS.map(async (eje) => ({
      ...eje,
      capas: await cargarCategoria({
        carpetaDatos: `${BASE}/${eje.carpeta}`,
        manifestUrl: `${BASE}/estilos/Eje_${eje.numero}_manifest.json`,
        simbologiaUrl: `${BASE}/estilos/Eje_${eje.numero}_simbologia.json`,
      }),
    }))
  )
}
