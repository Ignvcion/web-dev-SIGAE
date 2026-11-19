// Aplica el modo oscuro antes de que cargue la app, para que no se vea un destello
// blanco. Va en un archivo aparte porque la política de seguridad (CSP) del backend
// no permite scripts dentro del HTML. La lógica completa está en src/utils/tema.js.
(function () {
  try {
    var tema = window.localStorage.getItem("SIGAE_TEMA");
    if (!tema && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) tema = "oscuro";
    if (tema === "oscuro") {
      var raiz = document.documentElement;
      raiz.setAttribute("data-tema", "oscuro");
      raiz.style.backgroundColor = "#191e28";
      raiz.style.colorScheme = "dark";
    }
  } catch {
    /* sin almacenamiento: se usa el modo claro */
  }
})();
