import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  filtrarHorarios,
  getBloquesLibres,
  getListaDocentes,
  getCursosHorario,
  getAsignaturasHorario,
  getBloquesInstitucionales,
  getNivelesEducativos,
} from "../../services/api";
import DetalleBloqueModal from "../../components/horarios/DetalleBloqueModal";
import EtiquetaPeriodo, { textoPeriodo } from "../../components/horarios/EtiquetaPeriodo";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const FILTROS_VACIOS = {
  docente_id: "",
  curso_id: "",
  nivel_educativo_id: "",
  asignatura_id: "",
  jornada: "",
  dia_semana: "",
  estado: "Activo",
};

const LIBRES_VACIOS = { curso_id: "", docente_id: "", dia_semana: "", jornada: "", fecha: "" };

function hhmm(t) {
  return t ? String(t).slice(0, 5) : "";
}

// "2026-10-05" → "05-10-2026"
function fechaLegible(f) {
  return f ? f.split("-").reverse().join("-") : "";
}

function errorFechaHabil(fecha) {
  if (!fecha) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return "Formato de fecha inválido (usa AAAA-MM-DD).";
  }
  const [y, m, d] = fecha.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return "La fecha ingresada no existe en el calendario.";
  }
  const dia = dt.getDay();
  if (dia === 0 || dia === 6) {
    return "La fecha seleccionada es fin de semana. Elige un día hábil (lunes a viernes).";
  }
  return "";
}

const lista = (resultado) =>
  resultado.status === "fulfilled" && Array.isArray(resultado.value) ? resultado.value : [];

// CU67 (bloques libres), CU68 (filtrado de horarios) y CU69 (detalle de bloque).
// Las consultas no modifican la planificación institucional.
function ConsultaHorarios() {
  const { usuario, rolActivo } = useAuth();
  const rolEfectivo = rolActivo || usuario?.roles?.[0];
  const esAdmin = rolEfectivo === "Administrador" || usuario?.administradorTipo === "Super Admin";

  const [pestana, setPestana] = useState("filtrar");

  // Criterios disponibles
  const [opciones, setOpciones] = useState({ docentes: [], cursos: [], niveles: [], asignaturas: [], jornadas: [] });
  const [cargandoOpciones, setCargandoOpciones] = useState(true);
  const [errorCargaOpciones, setErrorCargaOpciones] = useState("");
  const [intentoCarga, setIntentoCarga] = useState(0);

  // CU68
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [horarios, setHorarios] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [mensajeFiltro, setMensajeFiltro] = useState("");
  const [errorFiltro, setErrorFiltro] = useState("");

  // CU67
  const [criteriosLibres, setCriteriosLibres] = useState(LIBRES_VACIOS);
  const [bloquesLibres, setBloquesLibres] = useState([]);
  const [consultandoLibres, setConsultandoLibres] = useState(false);
  const [consultadoLibres, setConsultadoLibres] = useState(false);
  const [mensajeLibres, setMensajeLibres] = useState("");
  const [errorLibres, setErrorLibres] = useState("");

  // CU69
  const [detalleId, setDetalleId] = useState(null);

  useEffect(() => {
    let activo = true;
    Promise.allSettled([
      getListaDocentes(),
      getCursosHorario(),
      getNivelesEducativos(),
      getAsignaturasHorario(),
      getBloquesInstitucionales(),
    ]).then((resultados) => {
      if (!activo) return;
      const [docentes, cursos, niveles, asignaturas, bloques] = resultados;
      const todasFallaron = resultados.every((r) => r.status === "rejected");
      if (todasFallaron) {
        setErrorCargaOpciones("No se pudieron cargar los criterios de búsqueda. Verifica tu conexión e intenta nuevamente.");
      } else {
        setErrorCargaOpciones("");
      }
      const jornadas = [...new Set(lista(bloques).map((b) => b.Bloque_Horario_Jornada).filter(Boolean))];
      setOpciones({
        docentes: lista(docentes),
        cursos: lista(cursos),
        niveles: lista(niveles),
        asignaturas: lista(asignaturas),
        jornadas,
      });
      setCargandoOpciones(false);
    });
    return () => { activo = false; };
  }, [intentoCarga]);

  const reintentarCargaOpciones = () => {
    setCargandoOpciones(true);
    setErrorCargaOpciones("");
    setIntentoCarga((n) => n + 1);
  };

  // CU68 Excepción 1: no existen filtros disponibles por falta de datos asociados
  const sinFiltrosDisponibles =
    !cargandoOpciones &&
    !errorCargaOpciones &&
    opciones.docentes.length === 0 &&
    opciones.cursos.length === 0 &&
    opciones.asignaturas.length === 0;

  const avisoFechaLibre = useMemo(
    () => errorFechaHabil(criteriosLibres.fecha),
    [criteriosLibres.fecha]
  );

  const cambiarFiltro = (campo) => (e) => {
    setErrorFiltro("");
    setFiltros((prev) => ({ ...prev, [campo]: e.target.value }));
  };

  const cambiarCriterioLibre = (campo) => (e) => {
    const valor = e.target.value;
    setErrorLibres("");
    setMensajeLibres("");
    setCriteriosLibres((prev) => {
      if (campo === "fecha") {
        // Al seleccionar fecha puntual, el día de semana queda fijado por esa fecha
        return { ...prev, fecha: valor, ...(valor ? { dia_semana: "" } : {}) };
      }
      return { ...prev, [campo]: valor };
    });
  };

  const quitarFechaLibre = () => {
    setErrorLibres("");
    setMensajeLibres("");
    setCriteriosLibres((prev) => ({ ...prev, fecha: "" }));
  };

  const buscarHorarios = async (e) => {
    e?.preventDefault();
    setBuscando(true);
    setBuscado(true);
    setErrorFiltro("");
    setMensajeFiltro("");
    try {
      const data = await filtrarHorarios(filtros);
      if (Array.isArray(data) && data.length > 0) {
        setHorarios(data);
      } else {
        // Excepción 2: sin resultados coincidentes
        setHorarios([]);
        setMensajeFiltro(data?.mensaje || "No se encontraron horarios coincidentes con los filtros seleccionados");
      }
    } catch (error) {
      setHorarios([]);
      setErrorFiltro(error.message || "Error al filtrar horarios, intente nuevamente");
    } finally {
      setBuscando(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros(FILTROS_VACIOS);
    setHorarios([]);
    setBuscado(false);
    setMensajeFiltro("");
    setErrorFiltro("");
  };

  const consultarLibres = async (e) => {
    e?.preventDefault();
    const errorFecha = errorFechaHabil(criteriosLibres.fecha);
    if (errorFecha) {
      setConsultadoLibres(true);
      setBloquesLibres([]);
      setMensajeLibres("");
      setErrorLibres(errorFecha);
      return;
    }
    setConsultandoLibres(true);
    setConsultadoLibres(true);
    setErrorLibres("");
    setMensajeLibres("");
    try {
      const data = await getBloquesLibres(criteriosLibres);
      if (Array.isArray(data) && data.length > 0) {
        setBloquesLibres(data);
      } else {
        // CU67 Excepción 1: no existen bloques libres
        setBloquesLibres([]);
        setMensajeLibres(data?.mensaje || "No existen bloques libres disponibles para los criterios indicados");
      }
    } catch (error) {
      // CU67 Excepciones 2 y 3: error al consultar la base de datos
      setBloquesLibres([]);
      setErrorLibres(error.message || "Error al consultar disponibilidad de bloques libres");
    } finally {
      setConsultandoLibres(false);
    }
  };

  const limpiarLibres = () => {
    setCriteriosLibres(LIBRES_VACIOS);
    setBloquesLibres([]);
    setConsultadoLibres(false);
    setMensajeLibres("");
    setErrorLibres("");
  };

  // Bloques libres agrupados por día para leerlos como una agenda semanal
  const libresPorDia = useMemo(() => {
    const grupos = new Map();
    bloquesLibres.forEach((b) => {
      const diaNorm = b.dia === "Miercoles" ? "Miércoles" : b.dia;
      if (!grupos.has(diaNorm)) grupos.set(diaNorm, []);
      grupos.get(diaNorm).push(b);
    });
    return DIAS.filter((d) => grupos.has(d)).map((d) => {
      const listaDia = [...grupos.get(d)].sort((a, b) =>
        String(a.horaInicio || "").localeCompare(String(b.horaInicio || ""))
      );
      return { dia: d, fecha: listaDia[0].fecha, bloques: listaDia };
    });
  }, [bloquesLibres]);

  const campoSelect = (id, etiqueta, valor, onChange, opcionesSelect, textoVacio, disabled = false) => (
    <div className="ch-campo">
      <label htmlFor={id}>{etiqueta}:</label>
      <select
        id={id}
        className="usuarios-select"
        style={{ width: "100%" }}
        aria-label={etiqueta}
        value={valor}
        onChange={onChange}
        disabled={disabled}
      >
        {textoVacio !== null && <option value="">{textoVacio}</option>}
        {opcionesSelect}
      </select>
    </div>
  );

  const opcionesDocentes = opciones.docentes.map((d) => (
    <option key={d.Usuario_Id} value={d.Usuario_Id}>{d.Usuario_Nombre_Completo}</option>
  ));
  const opcionesCursos = opciones.cursos.map((c) => (
    <option key={c.Curso_Id} value={c.Curso_Id}>
      {c.Curso_Nombre}{textoPeriodo(c.Curso_Periodo_Lectivo, c.Curso_Periodo_Estado)}
    </option>
  ));
  const opcionesJornadas = opciones.jornadas.map((j) => <option key={j} value={j}>{j}</option>);
  const opcionesDias = DIAS.map((d) => <option key={d} value={d}>{d}</option>);

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <h1>Consulta de Horarios</h1>
        <p>Filtra los horarios institucionales, consulta bloques libres y revisa el detalle de cada bloque</p>
      </div>

      <div className="ch-tabs">
        <button
          type="button"
          className={`ch-tab-btn${pestana === "filtrar" ? " ch-tab-btn--activa" : ""}`}
          onClick={() => setPestana("filtrar")}
        >
          Filtrar horarios
        </button>
        {esAdmin && (
          <button
            type="button"
            className={`ch-tab-btn${pestana === "libres" ? " ch-tab-btn--activa" : ""}`}
            onClick={() => setPestana("libres")}
          >
            Bloques libres
          </button>
        )}
      </div>

      {cargandoOpciones && <p>Cargando criterios de búsqueda...</p>}

      {!cargandoOpciones && errorCargaOpciones && (
        <div className="usuarios-empty" style={{ color: "#dc2626" }}>
          <p style={{ margin: "0 0 10px" }}>{errorCargaOpciones}</p>
          <button type="button" className="btn-secondary" onClick={reintentarCargaOpciones}>
            Reintentar
          </button>
        </div>
      )}

      {/* ── CU68: Filtrando horarios ── */}
      {!cargandoOpciones && !errorCargaOpciones && pestana === "filtrar" && (
        <>
          {sinFiltrosDisponibles ? (
            <div className="usuarios-empty">
              No existen filtros disponibles por falta de datos asociados en el sistema.
            </div>
          ) : (
            <form className="ch-filtros-grid" onSubmit={buscarHorarios}>
              {campoSelect("ch-filtro-docente", "Docente", filtros.docente_id, cambiarFiltro("docente_id"), opcionesDocentes, "Todos los docentes")}
              {campoSelect("ch-filtro-curso", "Curso", filtros.curso_id, cambiarFiltro("curso_id"), opcionesCursos, "Todos los cursos")}
              {campoSelect(
                "ch-filtro-nivel",
                "Nivel educativo",
                filtros.nivel_educativo_id,
                cambiarFiltro("nivel_educativo_id"),
                opciones.niveles.map((n) => (
                  <option key={n.Nivel_Educativo_Id} value={n.Nivel_Educativo_Id}>{n.Nivel_Educativo_Nombre}</option>
                )),
                "Todos los niveles"
              )}
              {campoSelect(
                "ch-filtro-asig",
                "Asignatura",
                filtros.asignatura_id,
                cambiarFiltro("asignatura_id"),
                opciones.asignaturas.map((a) => (
                  <option key={a.Asignatura_Id} value={a.Asignatura_Id}>{a.Asignatura_Nombre}</option>
                )),
                "Todas las asignaturas"
              )}
              {campoSelect("ch-filtro-jornada", "Jornada", filtros.jornada, cambiarFiltro("jornada"), opcionesJornadas, "Todas las jornadas")}
              {campoSelect("ch-filtro-dia", "Día", filtros.dia_semana, cambiarFiltro("dia_semana"), opcionesDias, "Todos los días")}
              {campoSelect(
                "ch-filtro-estado",
                "Estado",
                filtros.estado,
                cambiarFiltro("estado"),
                <>
                  <option value="Activo">Activos</option>
                  <option value="Suspendido">Suspendidos</option>
                  <option value="Todos">Todos los estados</option>
                </>,
                null
              )}
              <div className="ch-acciones">
                <button type="submit" className="btn-primary" disabled={buscando}>
                  {buscando ? "Buscando..." : "Buscar"}
                </button>
                <button type="button" className="btn-secondary" onClick={limpiarFiltros} disabled={buscando}>
                  Limpiar
                </button>
              </div>
            </form>
          )}

          {errorFiltro && <div className="usuarios-empty" style={{ color: "#dc2626" }}>{errorFiltro}</div>}
          {!errorFiltro && mensajeFiltro && <div className="usuarios-empty">{mensajeFiltro}</div>}
          {!buscado && !sinFiltrosDisponibles && (
            <div className="usuarios-empty">Selecciona uno o más filtros y presiona "Buscar".</div>
          )}

          {horarios.length > 0 && (
            <>
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>{horarios.length} bloque(s) encontrado(s)</p>
              <div className="tabla-responsive-container tabla-responsive-container--cards">
                <table className="tabla-usuarios tabla-estudiantes ch-tabla-filtrar">
                  <thead>
                    <tr>
                      <th>Día</th>
                      <th>Horario</th>
                      <th>Jornada</th>
                      <th>Curso</th>
                      <th>Asignatura</th>
                      <th>Docente</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horarios.map((h) => (
                      <tr key={h.Horario_Asignatura_Id}>
                        <td className="est-col-nombre" data-label="Día">{h.dia}</td>
                        <td data-label="Horario" style={{ whiteSpace: "nowrap" }}>{hhmm(h.horaInicio)} - {hhmm(h.horaFin)}</td>
                        <td data-label="Jornada">{h.jornada}</td>
                        <td data-label="Curso">
                          <span className="ch-curso-cell">
                            <span>{h.curso}</span>
                            <EtiquetaPeriodo periodo={h.periodo} estado={h.periodoEstado} />
                          </span>
                        </td>
                        <td data-label="Asignatura">{h.asignatura}</td>
                        <td data-label="Docente">{h.docente}</td>
                        <td className="est-col-estado" data-label="Estado">
                          <span className={h.estado === "Suspendido" || h.estado === "Inactivo" ? "badge-inactivo" : "badge-activo"}>
                            {h.estado || "Activo"}
                          </span>
                        </td>
                        <td className="est-col-acciones" data-label="Acción">
                          {/* Los electivos (CU106) se gestionan en la pantalla de Electivos */}
                          {Number(h.electivo) === 1 ? (
                            <Link to="/electivos" style={{ fontSize: "0.85rem", color: "#5b21b6", fontWeight: 600 }}>
                              Ver en Electivos
                            </Link>
                          ) : (
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => setDetalleId(h.Horario_Asignatura_Id)}
                            >
                              Ver detalle
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ── CU67: Visualizando disponibilidad de bloques libres ── */}
      {!cargandoOpciones && !errorCargaOpciones && pestana === "libres" && esAdmin && (
        <>
          <form className="ch-filtros-grid" onSubmit={consultarLibres}>
            {campoSelect("ch-libres-curso", "Curso", criteriosLibres.curso_id, cambiarCriterioLibre("curso_id"), opcionesCursos, "Toda la institución")}
            {campoSelect("ch-libres-docente", "Docente", criteriosLibres.docente_id, cambiarCriterioLibre("docente_id"), opcionesDocentes, "Cualquier docente")}
            {/* Con una fecha puntual, el día de la semana queda definido por ella */}
            {criteriosLibres.fecha
              ? campoSelect(
                  "ch-libres-dia",
                  "Día",
                  "",
                  () => {},
                  <option value="">Día según la fecha</option>,
                  null,
                  true
                )
              : campoSelect("ch-libres-dia", "Día", criteriosLibres.dia_semana, cambiarCriterioLibre("dia_semana"), opcionesDias, "Todos los días")}
            {campoSelect("ch-libres-jornada", "Jornada", criteriosLibres.jornada, cambiarCriterioLibre("jornada"), opcionesJornadas, "Todas las jornadas")}
            <div className="ch-campo">
              <label htmlFor="ch-libres-fecha">Fecha (opcional):</label>
              <div className="ch-fecha-wrap">
                <input
                  id="ch-libres-fecha"
                  type="date"
                  className="ch-input-date"
                  aria-label="Fecha (opcional)"
                  title="Fecha a evaluar (opcional)"
                  value={criteriosLibres.fecha}
                  onChange={cambiarCriterioLibre("fecha")}
                />
                {criteriosLibres.fecha && (
                  <button
                    type="button"
                    className="ch-btn-quitar-fecha"
                    onClick={quitarFechaLibre}
                    aria-label="Quitar fecha"
                    title="Quitar fecha"
                  >
                    ✕
                  </button>
                )}
              </div>
              {avisoFechaLibre && <span className="ch-campo-error">{avisoFechaLibre}</span>}
            </div>
            <div className="ch-acciones">
              <button type="submit" className="btn-primary" disabled={consultandoLibres}>
                {consultandoLibres ? "Consultando..." : "Consultar disponibilidad"}
              </button>
              <button type="button" className="btn-secondary" onClick={limpiarLibres} disabled={consultandoLibres}>
                Limpiar
              </button>
            </div>
          </form>

          <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: 0 }}>
            Un bloque está libre cuando no tiene asignaciones activas del curso o docente seleccionados
            (o de ningún curso, si no se selecciona ninguno) ni actividades institucionales en la fecha
            evaluada. Sin fecha, se evalúa la próxima ocurrencia de cada día.
          </p>

          {errorLibres && <div className="usuarios-empty" style={{ color: "#dc2626" }}>{errorLibres}</div>}
          {!errorLibres && mensajeLibres && <div className="usuarios-empty">{mensajeLibres}</div>}
          {!consultadoLibres && (
            <div className="usuarios-empty">Define los criterios y presiona "Consultar disponibilidad".</div>
          )}

          {libresPorDia.length > 0 && (
            <>
              <p style={{ color: "#065f46", fontSize: "0.88rem", fontWeight: 700, margin: "0.75rem 0 0.5rem" }}>
                ✓ {bloquesLibres.length} bloque(s) libre(s) disponible(s)
              </p>
              <div className="ch-libres-grid">
                {libresPorDia.map(({ dia, fecha, bloques }) => (
                  <div key={dia} className="ch-libre-card">
                    <div className="ch-libre-card-head">
                      <span className="ch-libre-dia">{dia}</span>
                      {fecha && <span className="ch-libre-fecha">{fechaLegible(fecha)}</span>}
                    </div>
                    <div className="ch-libre-pills">
                      {bloques.map((b) => (
                        <span
                          key={`${dia}-${b.bloqueId}`}
                          className="ch-libre-pill"
                          title={`${b.jornada} · ${b.tipo}`}
                        >
                          {hhmm(b.horaInicio)} - {hhmm(b.horaFin)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {detalleId && <DetalleBloqueModal horarioId={detalleId} onClose={() => setDetalleId(null)} />}
    </div>
  );
}

export default ConsultaHorarios;
