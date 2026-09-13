import React, { useEffect, useRef } from 'react';
import { geoMercator, geoPath } from 'd3-geo';

const LIMITE_URL = '/Datos/Lim_Est_Base.json';
const VIAS_URL = '/Datos/Red_Carreteras_Campeche.geojson';

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

    // --- ESTÉTICA TECH CLARA (INSTITUCIONAL) ---
    const HEX_SIZE = 5.5; // Tamaño del hexágono
    const HEX_GAP = 1.5;  // Espaciado
    
    // Colores para el "Digital Twin" en modo claro
    const COLOR_ESTADO = 'rgba(203, 213, 225, 0.6)'; // Gris tech (Slate 300)
    const COLOR_VIAL = 'rgba(138, 21, 56, 0.85)';    // Guinda Institucional

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
          const [limiteRes, viasRes] = await Promise.all([
            fetch(LIMITE_URL),
            fetch(VIAS_URL)
          ]);
          stateBounds = await limiteRes.json();
          roadsData = await viasRes.json();
        }

        // 1. EL TRUCO: Usar las líneas de carretera para calcular la escala
        // D3 nunca falla al procesar líneas, a diferencia de los multipolígonos complejos.
        const projection = geoMercator().fitExtent(
          [[0, 0], [W, H]], 
          roadsData 
        );

        // Forzamos un Zoom para que el estado se vea EN SU PLENITUD y no como un cuadro chiquito
        const zoomFactor = 1.35; 
        const [tx, ty] = projection.translate();
        projection
          .scale(projection.scale() * zoomFactor)
          .translate([
            (W / 2) + (tx - W / 2) * zoomFactor,
            (H / 2) + (ty - H / 2) * zoomFactor
          ]);

        // 2. CANVAS INVISIBLE PARA MUESTREO (Rasterización)
        const offscreen = document.createElement('canvas');
        offscreen.width = W;
        offscreen.height = H;
        const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
        
        // El generador de trazos de D3
        const pathGenerator = geoPath().projection(projection).context(offCtx);

        // Limpiar fondo a negro puro
        offCtx.fillStyle = '#000000';
        offCtx.fillRect(0, 0, W, H);

        // Dibujar Silueta de Campeche en Azul Puro
        offCtx.fillStyle = '#0000ff';
        stateBounds.features.forEach(feature => {
            offCtx.beginPath();
            pathGenerator(feature);
            offCtx.fill();
        });

        // Dibujar Carreteras en Rojo Puro (Más gruesas para atrapar hexágonos)
        offCtx.strokeStyle = '#ff0000';
        offCtx.lineWidth = Math.max(HEX_SIZE * 1.5, 4); 
        offCtx.lineCap = 'round';
        offCtx.lineJoin = 'round';
        roadsData.features.forEach(feature => {
          offCtx.beginPath();
          pathGenerator(feature);
          offCtx.stroke();
        });

        // 3. LEER PÍXELES Y GENERAR MALLA (La Matriz)
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

            // Ignorar fuera de pantalla
            if (px < 0 || px >= W || py < 0 || py >= H) continue;

            // Índice matemático exacto del píxel
            const idx = (py * W + px) * 4;
            const r = imageData[idx];     // Rojo = Carretera
            const b = imageData[idx + 2]; // Azul = Estado

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
        console.error("Error cargando los GeoJSON:", error);
      }
    };

    // 4. ANIMACIÓN SUTIL (Data Processing effect)
    let startTime = Date.now();
    const render = () => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      const currentTime = (Date.now() - startTime) / 1000;

      hexGrid.forEach(hex => {
        const sineWave = Math.sin(currentTime * hex.speed + hex.phase);
        
        if (hex.isRoad) {
          const opacity = 0.4 + (sineWave * 0.4); 
          // Hacemos el hexágono de carretera 1px más grande para que resalte en la malla
          drawHexagon(ctx, hex.x, hex.y, HEX_SIZE + 0.5, COLOR_VIAL, opacity);
        } else {
          const opacity = 0.15 + (sineWave * 0.25); 
          drawHexagon(ctx, hex.x, hex.y, HEX_SIZE, COLOR_ESTADO, opacity);
        }
      });

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    initGrid().then(() => render());

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        initGrid().then(() => render());
      }, 200);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
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