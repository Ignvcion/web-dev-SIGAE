// Estado compartido de la PWA: instalación, versión nueva del service worker y conexión.
// Se inicia una sola vez en main.jsx y los componentes lo leen con usePWA() / useConexion().
import { useSyncExternalStore } from "react";

let eventoInstalacion = null; // evento beforeinstallprompt guardado para mostrarlo cuando el usuario quiera
let hayActualizacion = false;
let verInstruccionesIOS = false;
let instantanea = { puedeInstalar: false, hayActualizacion: false, verInstruccionesIOS: false };
const suscriptores = new Set();

function avisar() {
  instantanea = { puedeInstalar: !!eventoInstalacion, hayActualizacion, verInstruccionesIOS };
  suscriptores.forEach((fn) => fn());
}

function suscribir(fn) {
  suscriptores.add(fn);
  return () => suscriptores.delete(fn);
}

export function usePWA() {
  return useSyncExternalStore(suscribir, () => instantanea);
}

// ── Conexión ────────────────────────────────────────────────────────────────
function suscribirConexion(fn) {
  window.addEventListener("online", fn);
  window.addEventListener("offline", fn);
  return () => {
    window.removeEventListener("online", fn);
    window.removeEventListener("offline", fn);
  };
}

export function useConexion() {
  return useSyncExternalStore(suscribirConexion, () => navigator.onLine, () => true);
}

// ── Instalación ─────────────────────────────────────────────────────────────
export function esAppInstalada() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

// iPhone/iPad no tienen beforeinstallprompt: se instala desde Compartir → "Agregar a inicio"
export function esIOS() {
  const ua = window.navigator.userAgent || "";
  return /iphone|ipad|ipod/i.test(ua) || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
}

// Se ofrece instalar si el navegador lo permite, o en iPhone/iPad con las instrucciones
export function puedeOfrecerInstalacion(puedeInstalar) {
  return !esAppInstalada() && (puedeInstalar || esIOS());
}

// Abre el diálogo de instalación del navegador, o las instrucciones en iPhone/iPad
export async function instalarApp() {
  if (!eventoInstalacion) {
    if (esIOS()) {
      verInstruccionesIOS = true;
      avisar();
    }
    return false;
  }
  const evento = eventoInstalacion;
  eventoInstalacion = null;
  avisar();
  evento.prompt();
  const { outcome } = await evento.userChoice;
  return outcome === "accepted";
}

export function cerrarInstruccionesIOS() {
  verInstruccionesIOS = false;
  avisar();
}

// Recordar por 30 días que el usuario no quiere la invitación a instalar
const CLAVE_DESCARTE = "SIGAE_INSTALAR_DESCARTADO";
const TREINTA_DIAS = 30 * 24 * 60 * 60 * 1000;

export function invitacionDescartada() {
  try {
    const fecha = Number(window.localStorage.getItem(CLAVE_DESCARTE));
    return Number.isFinite(fecha) && Date.now() - fecha < TREINTA_DIAS;
  } catch {
    return false;
  }
}

export function descartarInvitacion() {
  try {
    window.localStorage.setItem(CLAVE_DESCARTE, String(Date.now()));
  } catch {
    /* almacenamiento no disponible: se vuelve a ofrecer la próxima vez */
  }
}

// ── Versión nueva ───────────────────────────────────────────────────────────
export function aplicarActualizacion() {
  window.location.reload();
}

export function iniciarPWA() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // se muestra con el botón "Instalar app" de SIGAE
    eventoInstalacion = e;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    eventoInstalacion = null;
    avisar();
  });

  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;

  window.addEventListener("load", () => {
    // Si la página ya tenía service worker, un cambio de controlador es una versión nueva
    const habiaControlador = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!habiaControlador || hayActualizacion) return;
      hayActualizacion = true;
      avisar();
    });

    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registro) => {
        // Buscar versiones nuevas al volver a la app y cada 30 minutos
        const revisar = () => registro.update().catch(() => {});
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") revisar();
        });
        setInterval(revisar, 30 * 60 * 1000);
      })
      .catch((err) => {
        console.error("Error al registrar Service Worker de SIGAE:", err);
      });
  });
}
