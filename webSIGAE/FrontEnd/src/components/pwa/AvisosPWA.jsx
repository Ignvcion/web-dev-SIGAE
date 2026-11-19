import { useEffect, useRef, useState } from "react";
import { useConexion, usePWA, aplicarActualizacion } from "../../utils/pwa";
import "./pwa.css";

// Avisos globales de la PWA: sin conexión, conexión restablecida y versión nueva disponible.
export default function AvisosPWA() {
  const enLinea = useConexion();
  const { hayActualizacion } = usePWA();
  const [reconectado, setReconectado] = useState(false);
  const estuvoSinConexion = useRef(!enLinea);

  useEffect(() => {
    if (!enLinea) {
      estuvoSinConexion.current = true;
      return undefined;
    }
    if (!estuvoSinConexion.current) return undefined;
    estuvoSinConexion.current = false;
    const mostrar = setTimeout(() => setReconectado(true), 0);
    const ocultar = setTimeout(() => setReconectado(false), 3500);
    return () => {
      clearTimeout(mostrar);
      clearTimeout(ocultar);
    };
  }, [enLinea]);

  return (
    <div className="pwa-avisos" aria-live="polite">
      {!enLinea && (
        <div className="pwa-aviso pwa-aviso-offline" role="status">
          <span className="pwa-aviso-icono" aria-hidden="true">📡</span>
          <span>
            <strong>Sin conexión a internet.</strong> Puedes seguir viendo lo que ya cargaste, pero
            los cambios no se guardarán hasta que vuelvas a conectarte.
          </span>
        </div>
      )}

      {enLinea && reconectado && (
        <div className="pwa-aviso pwa-aviso-ok" role="status">
          <span className="pwa-aviso-icono" aria-hidden="true">✅</span>
          <span>Conexión restablecida.</span>
        </div>
      )}

      {hayActualizacion && (
        <div className="pwa-aviso pwa-aviso-version" role="status">
          <span className="pwa-aviso-icono" aria-hidden="true">✨</span>
          <span>Hay una nueva versión de SIGAE.</span>
          <button type="button" className="pwa-aviso-boton" onClick={aplicarActualizacion}>
            Actualizar
          </button>
        </div>
      )}
    </div>
  );
}
