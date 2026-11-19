import { categoriaCitacion, etiquetaCategoria, esConfirmada } from "../../utils/citaciones";

// CU78: estado visible de la citación (pendiente, confirmada o cancelada)
function EstadoCitacionBadge({ citacion }) {
  const cat = categoriaCitacion(citacion);
  const texto = esConfirmada(citacion) ? "Confirmada" : etiquetaCategoria(citacion);
  return (
    <span className={`cit-badge cit-badge-${cat}`} title={citacion?.Citacion_Estado || texto}>
      {texto}
    </span>
  );
}

export default EstadoCitacionBadge;
