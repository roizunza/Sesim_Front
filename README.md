# SESIM · Front (React)

Este proyecto reemplaza el scaffold vanilla JS que vivía antes en esta misma
ruta. Es una consolidación de lo que sí funcionaba en `SESIM_Frontend-main`
(las maquetas de React ya construidas), refactorizado para no depender de
datos ni autenticación simulados, y conectado a Supabase Auth real.

## Arranque

```bash
npm install
cp .env.example .env   # y pon la URL + anon key de tu Supabase autoalojado
npm run dev
```

## Qué está conectado hoy (Ciclo 1)

- **Autenticación real** (`src/lib/auth.jsx`, `src/lib/supabaseClient.js`):
  login/logout contra Supabase Auth (GoTrue), el rol de negocio se resuelve
  leyendo `core.perfil` (expuesta como `api.perfil`), no un claim del JWT.
- **Perfil de Capturista** (`src/components/perfiles/capturista/`): único
  perfil habilitado en el router (`src/App.jsx` → `/app`). Cartografía e
  Instrumentos se pueden capturar en el wizard, pero las bandejas se ven
  vacías porque el backend todavía no expone una tabla de solicitudes
  (ver "Qué falta" abajo) — es un vacío honesto, no un bug.
- **Geovisualizador público** (`src/components/geovisor/MapViewer.jsx`): se
  dejó tal cual estaba (ArcGIS/`@arcgis/core`), a pedido explícito, para que
  siga funcionando mientras se decide la base de teselas propia.

## Qué está a propósito sin conectar todavía

- `src/components/perfiles/administradora/` y `.../auditora/` — se trajeron
  los archivos porque el diseño vale la pena, pero **no están importados en
  ningún lado** (revísalo con un `grep -r "AdministradorLayout\|AuditorLayout" src/App.jsx` — no aparece). Siguen dependiendo de datos simulados. Se
  desbloquean (se importan + se enrutan) cuando les toque su incremento.
- `src/components/Bitacora/BitacoraLogs.jsx` — 100% datos de ejemplo
  (`mockLogsAuditora`/`mockLogsCapturista`), no enrutado.
- `src/components/perfiles/administradora/{DashboardKPIs,DashboardAdmin,PanelIndicadoresInferior,AdminMap}.jsx`
  — gráficas con datos inventados / código huérfano, no enrutados.
- `catalogos_sesim.json` → `cat_indicadores` está vacío a propósito: no hay
  todavía un catálogo real de los indicadores SESIM en este repo. **Falta
  que alguien provea ese catálogo real** (CSV/JSON/tabla) para poblarlo.
- `src/lib/mapaBase.js` + `qgisSymbology.ts` + `leafletSymbology.ts` — el
  traductor de simbología QGIS→web, la pieza más valiosa del proyecto
  anterior. Se trae completo pero todavía no se usa en ningún componente
  activo (el mapa de Capturista usa `TileBasemap.jsx`, un mapa base simple,
  no la simbología real de las capas). Se conecta cuando se muestre
  cartografía real sobre el mapa.

## Pendiente manual (no lo puede hacer Claude por el puente de archivos)

Los datasets geoespaciales grandes de `public/Datos/` (Red_vial.geojson
~25MB, Loc_rur.geojson ~12MB, etc.) **no se copiaron** a este proyecto: son
demasiado grandes para moverlos de forma práctica por el puente
archivo-por-archivo. Cópialos directo en tu máquina desde
`SESIM_Frontend-main/public/Datos/` a `public/Datos/` de este proyecto (un
copy-paste normal de Windows, o `robocopy`/`xcopy`) — el geovisualizador
público (`MapViewer.jsx`) los necesita para pintar de verdad. Ya se trajeron
los dos archivos chicos (`Lim_Est_Base.json`, `Lim_Mun_Base.json`).

## Estructura

```
src/
  lib/            módulos puros (Supabase, auth, catálogo de solicitudes,
                   simbología QGIS→Leaflet)
  components/
    plataforma/   header, nav, footer, layout público y autenticado
    geovisor/     mapa público (ArcGIS) y mapa base libre para Leaflet
    matriz/       KPICard (genérico, sin datos falsos)
    perfiles/     capturista (activo), administradora/auditora (pendientes)
    Bitacora/     pendiente
  pages/          Inicio, Login, MonitoreoIndicadores
```

Ver `claude/front-purga-react-existente.md` (proyecto SESIM FRONT en
Claude) para el diagnóstico completo de qué se conservó, qué se adaptó y
qué se descartó del proyecto anterior.
