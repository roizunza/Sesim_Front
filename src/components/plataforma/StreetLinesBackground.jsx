import React, { useEffect, useRef } from 'react';
import { geoMercator, geoPath } from 'd3-geo';

const ASSET_URL = '/assets/campeche-roads.json';
const LIMITE_URL = '/Datos/Lim_Est_Base.json';

// --- FUNCIONES GEOMÉTRICAS ORIGINALES ---
function bboxDeGeoJSON(geojson) {
  let lonMin = Infinity, lonMax = -Infinity, latMin = Infinity, latMax = -Infinity;
  function visitar(coords, profundidad) {
    if (profundidad === 0) {
      const [lon, lat] = coords;
      if (lon < lonMin) lonMin = lon;
      if (lon > lonMax) lonMax = lon;
      if (lat < latMin) latMin = lat;
      if (lat > latMax) latMax = lat;
    } else {
      for (const c of coords) visitar(c, profundidad - 1);
    }
  }
  const PROFUNDIDAD_POR_TIPO = { MultiPolygon: 3, Polygon: 2, MultiLineString: 2, LineString: 1, Point: 0 };
  for (const feat of geojson.features) {
    const { type, coordinates } = feat.geometry;
    visitar(coordinates, PROFUNDIDAD_POR_TIPO[type] ?? 1);
  }
  return [[lonMin, latMin], [lonMax, latMax]];
}

function proyeccionAjustadaABbox(bbox, rectDestino) {
  const [[lonMin, latMin], [lonMax, latMax]] = bbox;
  const base = geoMercator().scale(1).translate([0, 0]);
  const [x0, y0] = base([lonMin, latMax]);
  const [x1, y1] = base([lonMax, latMin]);
  const [[rx0, ry0], [rx1, ry1]] = rectDestino;
  const escala = Math.min((rx1 - rx0) / (x1 - x0), (ry1 - ry0) / (y1 - y0));
  const centroX = (x0 + x1) / 2;
  const centroY = (y0 + y1) / 2;
  const centroDestinoX = (rx0 + rx1) / 2;
  const centroDestinoY = (ry0 + ry1) / 2;
  return base
    .scale(escala)
    .translate([centroDestinoX - centroX * escala, centroDestinoY - centroY * escala]);
}

const StreetLinesBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });

    let animationFrameId;
    let hexGrid = [];
    let stateBounds = null;
    let roadsData = null;
    let cancelado = false;

    // --- ESTÉTICA TECH CLARA (INSTITUCIONAL) ---
    const HEX_SIZE = 5.5; 
    const HEX_GAP = 1.5;  
    
    // Contraste ajustado para la silueta tech
    const COLOR_ESTADO = 'rgba(148, 163, 184, 0.35)'; // Gris tenue
    const COLOR_VIAL = 'rgba(138, 21, 56, 0.7)';      // Guinda Institucional

    const drawHexagon = (context, x, y, size, fillStyle, opacity) => {
      context.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 180) * (60 * i - 30);
        const hx = x + size * Math.cos(angle);
        const hy = y + size * Math.sin(angle);
        if (i === 0) context.moveTo(hx, hy);
        else context.lineTo(hx, hy);
      }
      context.closePath();
      context.globalAlpha = opacity;
      context.fillStyle = fillStyle;
      context.fill();
    };

    const initGrid = async () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const W = Math.ceil(rect.width);
      const H = Math.ceil(rect.height);

      const dpr = window.devicePixelRatio || 1;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      try {
        if (!stateBounds || !roadsData) {
          const [roadsRes, limiteRes] = await Promise.all([
            fetch(ASSET_URL),
            fetch(LIMITE_URL)
          ]);
          roadsData = await roadsRes.json();
          stateBounds = await limiteRes.json();
        }

        if (cancelado) return;

        // 1. Proyección exacta usando la BBox del Estado
        const projection = proyeccionAjustadaABbox(bboxDeGeoJSON(stateBounds), [
          [20, 20],
          [W - 20, H - 20],
        ]);

        // 2. CANVAS INVISIBLE PARA MUESTREO
        const offscreen = document.createElement('canvas');
        offscreen.width = W;
        offscreen.height = H;
        const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
        
        const pathGenerator = geoPath().projection(projection).context(offCtx);

        // Fondo negro (vacío)
        offCtx.fillStyle = '#000000';
        offCtx.fillRect(0, 0, W, H);

        // Dibujar Silueta de Campeche en Azul
        offCtx.fillStyle = '#0000ff';
        stateBounds.features.forEach(feature => {
            offCtx.beginPath();
            pathGenerator(feature);
            offCtx.fill('evenodd');
        });

        // Dibujar Carreteras en Rojo usando el formato compactado {c, g}
        offCtx.strokeStyle = '#ff0000';
        offCtx.lineWidth = HEX_SIZE * 1.2; // Grosor para atrapar el muestreo
        offCtx.lineCap = 'round';
        offCtx.lineJoin = 'round';
        
        roadsData.forEach(calle => {
          calle.g.forEach(linea => {
            offCtx.beginPath();
            linea.forEach((coords, i) => {
              const [x, y] = projection(coords);
              if (i === 0) offCtx.moveTo(x, y);
              else offCtx.lineTo(x, y);
            });
            offCtx.stroke();
          });
        });

        // 3. GENERAR MALLA DE MUESTREO
        const imageData = offCtx.getImageData(0, 0, W, H).data;

        const hexWidth = HEX_SIZE * Math.sqrt(3);
        const hexHeight = HEX_SIZE * 2;
        const xOffset = hexWidth + HEX_GAP;
        const yOffset = (hexHeight * 0.75) + HEX_GAP;
        
        hexGrid = [];
        let row = 0;

        for (let y = 0; y < H + HEX_SIZE; y += yOffset) {
          for (let x = 0; x < W + HEX_SIZE; x += xOffset) {
            const hexX = x + (row % 2 === 0 ? 0 : hexWidth / 2);
            const hexY = y;
            
            const px = Math.floor(hexX);
            const py = Math.floor(hexY);

            if (px < 0 || px >= W || py < 0 || py >= H) continue;

            const idx = (py * W + px) * 4;
            const r = imageData[idx];     // Carretera
            const b = imageData[idx + 2]; // Estado

            const isRoad = r > 128;
            const isState = b > 128;

            if (isRoad || isState) {
              hexGrid.push({
                x: hexX,
                y: hexY,
                isRoad: isRoad,
                phase: Math.random() * Math.PI * 2, 
                speed: 0.5 + Math.random() * 1.0
              });
            }
          }
          row++;
        }

      } catch (error) {
        console.error("Error cargando los datos espaciales:", error);
      }
    };

    // 4. ANIMACIÓN SUTIL
    let startTime = Date.now();
    const render = () => {
      if (cancelado) return;
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      const currentTime = (Date.now() - startTime) / 1000;

      hexGrid.forEach(hex => {
        const sineWave = Math.sin(currentTime * hex.speed + hex.phase);
        
        if (hex.isRoad) {
          const opacity = 0.4 + (sineWave * 0.4); 
          drawHexagon(ctx, hex.x, hex.y, HEX_SIZE + 0.5, COLOR_VIAL, opacity);
        } else {
          const opacity = 0.15 + (sineWave * 0.25); 
          drawHexagon(ctx, hex.x, hex.y, HEX_SIZE, COLOR_ESTADO, opacity);
        }
      });

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    initGrid().then(() => {
      if (!cancelado && !reduceMotion) render();
    });

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        initGrid().then(() => {
           if (!cancelado && !reduceMotion) render();
        });
      }, 200);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelado = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="street-lines-background"
      aria-hidden="true" 
    />
  );
};

export default StreetLinesBackground;