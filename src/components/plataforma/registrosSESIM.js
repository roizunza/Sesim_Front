/**
 * Helpers de catálogo para las pantallas de Administrador y Auditor
 * (ficha técnica del dictamen, filtros, bandejas de solicitudes).
 *
 * Reemplaza al `registrosSESIM.js` del proyecto anterior, que además de
 * estos helpers de catálogo traía `CURRENT_USER` (usuario simulado) y
 * `REGISTROS_INICIALES` (solicitudes de ejemplo hardcodeadas) — ninguno de
 * los dos se recupera aquí a propósito:
 *
 *   - El usuario actual ya no se simula: sale de `useAuth()` (`perfil`/`user`,
 *     ver `src/lib/auth.jsx`), igual que en `CapturistaLayout.jsx`.
 *   - Las solicitudes iniciales ya no son datos de relleno: se piden con
 *     `listarSolicitudes()` de `src/lib/solicitudes.js` (hoy vuelve `[]`
 *     porque el backend de Ciclo 8 — flujos de captura/revisión/dictamen —
 *     todavía no existe), el mismo patrón "honestamente vacío" que ya usa
 *     el perfil de Capturista.
 *
 * Lo que sí sigue viviendo aquí son los traductores id→etiqueta de los
 * catálogos reales de `catalogos_sesim.json` (`cat_indicadores` — poblado
 * desde `public/Datos/Tablas/Indicadores.csv`, 113 indicadores EEMSV —,
 * `cat_instrumento`, `cat_cobertura`, `cat_eje_evaluacion`, `cat_sector`,
 * `cat_horizonte`, `cat_instituciones`), y `getStatusColor` se re-exporta
 * de `src/lib/solicitudes.js` para que las tres pantallas (Capturista,
 * Administrador, Auditor) sigan compartiendo una sola fuente de verdad
 * para el color de cada estatus.
 */
import catalogos from './catalogos_sesim.json';

export { getStatusColor } from '../../lib/solicitudes';

const buildLookup = (lista) => {
  const mapa = new Map((lista || []).map((item) => [item.id, item.etiqueta]));
  return (id) => (id ? mapa.get(id) ?? id : 'No especificado');
};

export const getIndicadorLabel = buildLookup(catalogos.cat_indicadores);
export const getInstrumentoLabel = buildLookup(catalogos.cat_instrumento);
export const getCoberturaLabel = buildLookup(catalogos.cat_cobertura);
export const getEjeLabel = buildLookup(catalogos.cat_eje_evaluacion);
export const getSectorLabel = buildLookup(catalogos.cat_sector);
export const getHorizonteLabel = buildLookup(catalogos.cat_horizonte);
export const getInstitucionLabel = buildLookup(catalogos.cat_instituciones);
