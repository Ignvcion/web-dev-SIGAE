// Restaura la ruta de la app si se llegó redirigido desde 404.html (hosting
// estático sin respaldo a index.html, como GitHub Pages). Va en un archivo
// aparte porque la política de seguridad (CSP) del backend no permite
// scripts escritos dentro del HTML.
(function (l) {
  if (l.search[1] === "/") {
    var ruta = l.search
      .slice(1)
      .split("&")
      .map(function (s) {
        return s.replace(/~and~/g, "&");
      })
      .join("?");
    window.history.replaceState(null, null, l.pathname.slice(0, -1) + ruta + l.hash);
  }
})(window.location);
