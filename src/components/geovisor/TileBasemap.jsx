import React from 'react'
import { TileLayer } from 'react-leaflet'

/**
 * Reemplaza al `EsriBasemap.jsx` que faltaba en el proyecto anterior.
 *
 * Requisito de los TDR: acceso libre, sin llave de API (por eso se dejó de
 * usar el proveedor de teselas que la pedía). Las dos capas de aquí son
 * gratuitas y no requieren key:
 *   - 'claro'    → CARTO Voyager (mismo proveedor que ya usaba AdminMap.jsx)
 *   - 'satelite' → Esri World Imagery, servicio REST público clásico
 *     (server.arcgisonline.com), distinto del servicio de "basemap styles"
 *     más nuevo de Esri que sí exige API key.
 *
 * Esto es un puente, no el destino: según lo acordado, la idea a mediano
 * plazo es servir "nuestra propia base en teselas" (Ciclo 9 del backend:
 * Martin o pg_tileserv sobre el propio PostGIS) en vez de depender de un
 * proveedor externo. Cuando ese servicio exista, solo hay que cambiar la
 * URL de este componente — nadie más en el front debería tener que
 * cambiar, porque todos consumen `<TileBasemap type="..." />`.
 */
const PROVEEDORES = {
  claro: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  satelite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19,
  },
}

const TileBasemap = ({ type = 'claro', opacity = 1 }) => {
  const proveedor = PROVEEDORES[type] ?? PROVEEDORES.claro
  return (
    <TileLayer
      url={proveedor.url}
      attribution={proveedor.attribution}
      maxZoom={proveedor.maxZoom}
      opacity={opacity}
    />
  )
}

export default TileBasemap
