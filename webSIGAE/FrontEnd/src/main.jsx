import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { AuthProvider } from "./pages/context/AuthContext";
import { iniciarPWA } from "./utils/pwa";
import { iniciarTema } from "./utils/tema";

import "./index.css";

// Modo oscuro: antes de dibujar la app, con las hojas de estilo ya cargadas
iniciarTema();

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// PWA: service worker (solo en producción), instalación y aviso de versión nueva
iniciarPWA();
