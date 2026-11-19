import { useState } from "react";
import {
  usePWA,
  instalarApp,
  puedeOfrecerInstalacion,
  cerrarInstruccionesIOS,
  invitacionDescartada,
  descartarInvitacion,
} from "../../utils/pwa";
import "./pwa.css";

// Botón "Instalar app" para el menú lateral
export function BotonInstalarApp() {
  const { puedeInstalar } = usePWA();
  if (!puedeOfrecerInstalacion(puedeInstalar)) return null;
  return (
    <button type="button" className="pwa-menu-instalar" onClick={instalarApp}>
      <span aria-hidden="true">📲</span> Instalar app
    </button>
  );
}

// Invitación (una vez, se puede descartar por 30 días) e instrucciones para iPhone/iPad.
// Va fuera de la barra lateral: dentro de ella, "position: fixed" quedaría atrapado en móvil.
export default function InvitacionInstalarApp() {
  const { puedeInstalar, verInstruccionesIOS } = usePWA();
  const [descartada, setDescartada] = useState(invitacionDescartada);
  const ofrecer = puedeOfrecerInstalacion(puedeInstalar);

  const cerrar = () => {
    descartarInvitacion();
    setDescartada(true);
  };

  const instalar = async () => {
    await instalarApp();
    setDescartada(true);
  };

  return (
    <>
      {ofrecer && !descartada && !verInstruccionesIOS && (
        <div className="pwa-invitacion" role="dialog" aria-label="Instalar SIGAE">
          <img
            src={`${import.meta.env.BASE_URL}icons/icon-192x192.png`}
            alt=""
            className="pwa-invitacion-icono"
          />
          <div className="pwa-invitacion-texto">
            <strong>Instala SIGAE</strong>
            <span>Ábrela como una app desde tu pantalla de inicio, más rápido y a pantalla completa.</span>
          </div>
          <div className="pwa-invitacion-acciones">
            <button type="button" className="pwa-boton-secundario" onClick={cerrar}>
              Ahora no
            </button>
            <button type="button" className="pwa-boton-primario" onClick={instalar}>
              Instalar
            </button>
          </div>
        </div>
      )}

      {verInstruccionesIOS && (
        <div className="pwa-modal-fondo" onClick={cerrarInstruccionesIOS}>
          <div
            className="pwa-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-ios-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="pwa-ios-titulo">Instalar SIGAE en iPhone o iPad</h2>
            <ol>
              <li>
                Abre SIGAE en <strong>Safari</strong>.
              </li>
              <li>
                Toca el botón <strong>Compartir</strong> (el cuadrado con una flecha hacia arriba).
              </li>
              <li>
                Elige <strong>Agregar a inicio</strong> y luego <strong>Agregar</strong>.
              </li>
            </ol>
            <button type="button" className="pwa-boton-primario" onClick={cerrarInstruccionesIOS}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
