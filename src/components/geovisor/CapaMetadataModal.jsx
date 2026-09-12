import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/**
 * Ficha de una capa: 4 campos destacados (archivo, propósito, Estrategia/
 * categoría a la que pertenece, fuente) y, debajo de Fuente, un botón
 * "Consultar todos los metadatos" que — en la misma ventana, sin abrir nada
 * aparte — despliega el resto de las properties crudas de la capa. Antes
 * ese volcado completo se mostraba siempre; se escondió detrás del botón a
 * pedido del usuario para no alargar la ficha rápida por defecto, pero
 * sigue disponible con un clic.
 *
 * `datos` viene armado por MapViewer.jsx (`abrirModal` / el clic sobre un
 * feature en el mapa): `{ archivo, categoria, propiedades }` — `propiedades`
 * son las `properties` crudas del primer feature de la capa (para leer
 * `proposito`/`fuente` y para el volcado completo), `archivo` y `categoria`
 * son metadatos de la propia capa, no del feature.
 */

function valorDePropiedad(propiedades, claves) {
  for (const clave of claves) {
    const valor = propiedades?.[clave];
    if (valor !== undefined && valor !== null && String(valor).trim() !== '') return String(valor);
  }
  return null;
}

function tituloDe(propiedades) {
  return (
    propiedades?.NOMBRE ||
    propiedades?.NOMGEO ||
    propiedades?.etiqueta ||
    propiedades?.nombre_orig ||
    propiedades?.nombre ||
    'Capa sin nombre'
  );
}

const CapaMetadataModal = ({ datos, onClose }) => {
  const [mostrarTodo, setMostrarTodo] = useState(false);

  // Si se abre la ficha de otra capa mientras el modal ya está montado (el
  // usuario hace clic en una capa distinta sin cerrar antes), el volcado
  // completo debe volver a esconderse — no arrastrar el estado expandido de
  // la capa anterior.
  useEffect(() => {
    setMostrarTodo(false);
  }, [datos?.archivo, datos?.categoria]);

  if (!datos) return null;

  const { archivo, categoria, propiedades } = datos;
  const titulo = tituloDe(propiedades);

  const campos = [
    { etiqueta: 'Archivo', valor: archivo ?? null },
    { etiqueta: 'Propósito', valor: valorDePropiedad(propiedades, ['proposito']) },
    { etiqueta: 'Estrategia', valor: categoria ?? null },
    { etiqueta: 'Fuente', valor: valorDePropiedad(propiedades, ['fuente', 'fuente_custodio', 'cita']) },
  ];

  const otrasClaves = Object.keys(propiedades ?? {})
    .filter((clave) => propiedades[clave] !== '' && propiedades[clave] !== null && propiedades[clave] !== undefined)
    .sort();

  return (
    <>
      <div className="capa-modal-overlay" onClick={onClose}></div>
      <div className="capa-modal-drawer" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="capa-modal-header">
          <h3>{titulo}</h3>
          <button className="capa-modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="capa-modal-content">
          <div className="capa-modal-destacados">
            {campos.map((campo) => (
              <div key={campo.etiqueta} className="capa-modal-campo">
                <span className="capa-modal-campo-etiqueta">{campo.etiqueta}</span>
                <p className="capa-modal-campo-valor">{campo.valor ?? 'No disponible'}</p>
              </div>
            ))}
          </div>

          {!mostrarTodo ? (
            <button
              type="button"
              className="capa-modal-ver-todo-btn"
              onClick={() => setMostrarTodo(true)}
            >
              Consultar todos los metadatos
            </button>
          ) : (
            <div className="capa-modal-tabla-wrap">
              <span className="capa-modal-campo-etiqueta">Todos los metadatos</span>
              <table className="capa-modal-tabla">
                <tbody>
                  {otrasClaves.map((clave) => (
                    <tr key={clave}>
                      <th>{clave}</th>
                      <td>{String(propiedades[clave])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CapaMetadataModal;
