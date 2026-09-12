import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import './MonitoreoIndicadores.css';

const CSV_URL = '/Datos/Tablas/Indicadores.csv';

/**
 * Tabla de indicadores del catálogo maestro EEMSV (114 filas, 14 columnas),
 * leída de `Datos/Tablas/Indicadores.csv`. Se parsea con PapaParse (no a
 * mano) porque varias celdas traen comas y comillas embebidas dentro de su
 * propio valor (p. ej. "1, 5" en "Eje(s) vinculado(s)") — un split(',') a
 * pie las rompería.
 *
 * Solo lectura por ahora: el proyecto no tiene backend (ni Supabase, ni
 * ninguna API propia — confirmado, todo es lectura de archivos estáticos),
 * así que un flujo real de "el capturista edita, el auditor audita" implica
 * dos usuarios en dos navegadores y necesita persistencia real primero.
 */
export default function MonitoreoIndicadores() {
  const [columnas, setColumnas] = useState([]);
  const [filas, setFilas] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (resultado) => {
        setColumnas(resultado.meta.fields ?? []);
        setFilas(resultado.data);
      },
      error: (err) => setError(err.message),
    });
  }, []);

  return (
    <div className="page-content indicadores-page">
      <h1>Monitoreo de Indicadores</h1>
      <p className="text-muted">Sistema Estatal de Seguimiento a Indicadores de Movilidad y Seguridad Vial</p>

      {error && (
        <p className="indicadores-error">No se pudo cargar la tabla de indicadores: {error}</p>
      )}

      {!filas && !error && <p className="text-muted">Cargando indicadores…</p>}

      {filas && (
        <>
          <p className="indicadores-conteo">{filas.length} indicadores del catálogo maestro EEMSV</p>
          <div className="indicadores-scroll">
            <table className="indicadores-tabla">
              <thead>
                <tr>
                  {columnas.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((fila, i) => (
                  <tr key={i}>
                    {columnas.map((col) => (
                      <td key={col}>{fila[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
