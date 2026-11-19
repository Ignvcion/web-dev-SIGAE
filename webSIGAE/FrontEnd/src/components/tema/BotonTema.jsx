import { useTema, alternarTema } from "../../utils/tema";
import "./tema.css";

// Botón para cambiar entre modo claro y oscuro.
// variante "menu": fila del menú lateral; "flotante": esquina de la pantalla (inicio de sesión).
export default function BotonTema({ variante = "menu" }) {
  const tema = useTema();
  const oscuro = tema === "oscuro";
  const texto = oscuro ? "Modo claro" : "Modo oscuro";
  return (
    <button
      type="button"
      className={variante === "flotante" ? "tema-boton-flotante" : "tema-boton-menu"}
      onClick={alternarTema}
      aria-label={`Cambiar a ${texto.toLowerCase()}`}
      title={`Cambiar a ${texto.toLowerCase()}`}
    >
      <span aria-hidden="true">{oscuro ? "☀️" : "🌙"}</span>
      {variante === "menu" && <span>{texto}</span>}
    </button>
  );
}
