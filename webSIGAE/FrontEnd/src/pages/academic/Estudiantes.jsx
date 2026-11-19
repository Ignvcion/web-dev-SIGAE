import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getEstudiantes,
  buscarEstudiantes,
  getCursos,
  editarEstudiante,
  getApoderados,
} from "../../services/api";
import ApoderadosEstudianteModal from "../../components/ApoderadosEstudianteModal";
import {
  validarDireccion,
  formatearDireccion,
  COLUMNAS_DIRECCION_ESTUDIANTE,
} from "../../utils/validaciones";
import { textoPeriodo } from "../../components/horarios/EtiquetaPeriodo";
import { esAdministradorCompleto, puedeGestionAcademica } from "../../utils/permisos";

// Campos de la dirección separada del estudiante (Incremento 3)
const CAMPOS_DIRECCION_FICHA = [
  { clave: "calle",  label: "Calle",                  maxLength: 100 },
  { clave: "numero", label: "Número",                 maxLength: 7 },
  { clave: "depto",  label: "Depto./Casa (opcional)", maxLength: 20 },
  { clave: "comuna", label: "Comuna",                 maxLength: 60 },
];

// CU35, CU37 y CU38: estados de registro académico. Egresado, En práctica y Retirado
// resultan de aplicar la situación final (RF61); CU38 permite pasar de En práctica a Egresado.
const ESTADOS_ACADEMICOS = ["Regular", "Irregular", "En práctica", "Egresado", "Retirado"];
// CU105: rutas de formación (la Técnica es solo una marca)
const RUTAS_FORMACION = ["Científica", "Humanística", "Técnica"];

function Estudiantes() {
  const { usuario, rolActivo } = useAuth();
  // Edición de la ficha: administración y etiqueta UTP. La UTP asigna estudiantes a
  // cursos: solo cambia curso, estado académico y ruta (sin dirección ni apoderados).
  const esAdmin = puedeGestionAcademica(usuario, rolActivo);
  const esAdminCompleto = esAdministradorCompleto(usuario, rolActivo);

  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCurso, setFiltroCurso] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [estadosDisponibles, setEstadosDisponibles] = useState([]);
  const [orden, setOrden] = useState({ campo: "Estudiante_Nombre_Completo", ascendente: true });
  const [mensajeInfo, setMensajeInfo] = useState("");
  const [errorCarga, setErrorCarga] = useState("");

  // CU38: edición de curso asociado y estado académico — exclusivo de Administrador/Super Admin
  const [cursosOpciones, setCursosOpciones] = useState([]);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    Curso_Id: "", Estudiante_Estado_Academico: "", Estudiante_Ruta_Formacion: "", calle: "", numero: "", depto: "", comuna: "",
  });
  const [guardando, setGuardando] = useState(false);
  const [msgErrorForm, setMsgErrorForm] = useState("");
  const [msgExitoForm, setMsgExitoForm] = useState("");

  // CU39: editar asociaciones (apoderado) sin modificar los datos personales
  const [apoderadosOpciones, setApoderadosOpciones] = useState([]);
  const [errorApoderados, setErrorApoderados] = useState("");
  // RF57 / CU90: titular y hasta 4 suplentes (incluye el flujo de CU39)
  const [editandoAsociacion, setEditandoAsociacion] = useState(null);
  const [msgExitoAsociacion, setMsgExitoAsociacion] = useState("");

  const cargarApoderados = () =>
    getApoderados()
      .then((data) => {
        setErrorApoderados("");
        setApoderadosOpciones(Array.isArray(data) ? data : (data?.apoderados || []));
      })
      .catch((error) => setErrorApoderados(error.message || "No fue posible cargar la lista de apoderados"));

  // Pide el listado; el estado cambia solo al llegar la respuesta (callbacks), así el efecto
  // de montaje no provoca renders en cascada.
  const pedirEstudiantesInicial = () =>
    getEstudiantes({})
      .then((data) => {
        if (Array.isArray(data)) {
          setEstudiantes(data);
          // Las opciones de los selects se fijan solo en la carga inicial (sin filtros),
          // para que no se reduzcan a medida que se aplican filtros posteriores.
          setCursosDisponibles([...new Set(data.map((e) => e.Curso_Nombre).filter(Boolean))].sort());
          const presentes = data.map((e) => e.Estudiante_Estado_Academico).filter(Boolean);
          setEstadosDisponibles([...new Set([...ESTADOS_ACADEMICOS, ...presentes])]);
        } else {
          setEstudiantes(data.estudiantes || []);
          setMensajeInfo(data.mensaje || "No hay estudiantes registrados.");
        }
      })
      .catch((error) => setErrorCarga(error.message || "No fue posible recuperar los registros"))
      .finally(() => setLoading(false));

  // Consulta unificada (CU34, CU35, CU36): combina búsqueda por criterio con filtros activos
  // para que la tabla coincida siempre con los controles visibles en pantalla.
  const consultarEstudiantes = async ({ curso = "", estado = "", criterio = "" } = {}) => {
    setLoading(true);
    setErrorCarga("");
    setMensajeInfo("");
    const crit = criterio.trim();
    try {
      const data = crit
        ? await buscarEstudiantes(crit)
        : await getEstudiantes({ curso, estado });
      if (Array.isArray(data)) {
        const filtrados = data.filter((e) =>
          (!curso || e.Curso_Nombre === curso)
          && (!estado || e.Estudiante_Estado_Academico === estado)
        );
        setEstudiantes(filtrados);
        if (filtrados.length === 0) {
          setMensajeInfo("No se encontraron estudiantes que coincidan con el criterio y los filtros aplicados.");
        }
      } else {
        setEstudiantes(data.estudiantes || []);
        setMensajeInfo(
          data.mensaje || (crit ? "No se encontraron estudiantes con el criterio ingresado" : "No hay estudiantes registrados.")
        );
      }
    } catch (error) {
      setErrorCarga(error.message || "No fue posible completar la consulta, reintente más tarde");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    pedirEstudiantesInicial();
    if (esAdmin) {
      getCursos().then((data) => setCursosOpciones(Array.isArray(data) ? data : [])).catch(() => {});
    }
    if (esAdminCompleto) {
      cargarApoderados();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alternarOrden = (campo) => {
    setOrden((prev) => ({
      campo,
      ascendente: prev.campo === campo ? !prev.ascendente : true,
    }));
  };

  const aplicarFiltros = () =>
    consultarEstudiantes({ curso: filtroCurso, estado: filtroEstado, criterio: busqueda });

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroCurso("");
    setFiltroEstado("");
    consultarEstudiantes({});
  };

  const buscarPorCriterio = () =>
    consultarEstudiantes({ curso: filtroCurso, estado: filtroEstado, criterio: busqueda });

  const recargarVistaActual = () =>
    consultarEstudiantes({ curso: filtroCurso, estado: filtroEstado, criterio: busqueda });

  // El filtro por curso/estado y la búsqueda por criterio ya los resuelve el backend (CU35/CU36)
  const estudiantesFiltrados = [...estudiantes].sort((a, b) => {
    const factor = orden.ascendente ? 1 : -1;
    const valorA = a[orden.campo] ?? "";
    const valorB = b[orden.campo] ?? "";
    return String(valorA).localeCompare(String(valorB)) * factor;
  });

  const flechaOrden = (campo) => (orden.campo === campo ? (orden.ascendente ? " ↑" : " ↓") : "");

  // CU38: editar curso asociado y estado académico
  const abrirEdicion = (estudiante) => {
    setEditando(estudiante);
    setForm({
      Curso_Id: estudiante.Curso_Id ?? "",
      Estudiante_Estado_Academico: estudiante.Estudiante_Estado_Academico ?? "",
      Estudiante_Ruta_Formacion: estudiante.Estudiante_Ruta_Formacion ?? "",
      calle:  estudiante.Estudiante_Calle  ?? "",
      numero: estudiante.Estudiante_Numero ?? "",
      depto:  estudiante.Estudiante_Depto  ?? "",
      comuna: estudiante.Estudiante_Comuna ?? "",
    });
    setMsgErrorForm("");
    setMsgExitoForm("");
  };

  const cerrarEdicion = () => setEditando(null);

  const handleSubmitEdicion = async (e) => {
    e.preventDefault();
    setMsgErrorForm("");
    setMsgExitoForm("");

    // Dirección: se valida y envía si se ingresó (fichas antiguas pueden no tenerla).
    // La etiqueta UTP no edita la dirección.
    const incluyeDireccion = esAdminCompleto && CAMPOS_DIRECCION_FICHA.some(({ clave }) => String(form[clave]).trim() !== "");
    if (incluyeDireccion) {
      const erroresDireccion = Object.values(validarDireccion(form));
      if (erroresDireccion.length > 0) {
        setMsgErrorForm(erroresDireccion[0]);
        return;
      }
    }

    if (!form.Curso_Id) {
      setMsgErrorForm("Selecciona un curso asociado");
      return;
    }

    setGuardando(true);
    try {
      const data = await editarEstudiante(editando.Estudiante_Id, {
        Curso_Id: Number(form.Curso_Id),
        Estudiante_Estado_Academico: form.Estudiante_Estado_Academico,
        Estudiante_Ruta_Formacion: form.Estudiante_Ruta_Formacion || null,
        ...(incluyeDireccion && Object.fromEntries(
          CAMPOS_DIRECCION_FICHA.map(({ clave }) => [COLUMNAS_DIRECCION_ESTUDIANTE[clave], form[clave]])
        )),
      });
      // CU38 - Excepción "Sin modificaciones": el backend responde sin objeto "estudiante"
      setMsgExitoForm(data.mensaje || "Ficha actualizada correctamente");
      await recargarVistaActual();
    } catch (error) {
      // CU38 - Excepción "Curso no existe o inactivo"
      setMsgErrorForm(error.message || "No fue posible actualizar la ficha");
    } finally {
      setGuardando(false);
    }
  };

  // CU39 / CU90: editar los apoderados asociados sin modificar los datos personales del estudiante
  const abrirEdicionAsociacion = (estudiante) => {
    setMsgExitoAsociacion("");
    setEditandoAsociacion(estudiante);
  };

  const alGuardarAsociacion = async (mensaje) => {
    setEditandoAsociacion(null);
    setMsgExitoAsociacion(mensaje);
    await recargarVistaActual();
  };

  if (loading) {
    return (
      <div className="usuarios-container">
        <p>Cargando estudiantes...</p>
      </div>
    );
  }

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <h1>Estudiantes</h1>
        <p>Listado de estudiantes registrados en el sistema</p>
      </div>

      {/* CU36: búsqueda por nombre completo o RUT */}
      <form
        className="usuarios-filtros estudiantes-search-bar"
        onSubmit={(e) => { e.preventDefault(); buscarPorCriterio(); }}
      >
        <input
          type="search"
          className="usuarios-search"
          placeholder="Buscar por nombre o RUT..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button type="submit" className="btn-roles">Buscar</button>
      </form>

      {/* CU35: filtro por curso y estado académico */}
      <div className="usuarios-filtros estudiantes-filtros-bar">
        <select
          aria-label="Filtrar por curso"
          className="usuarios-select"
          value={filtroCurso}
          onChange={(e) => setFiltroCurso(e.target.value)}
        >
          <option value="">Todos los cursos</option>
          {cursosDisponibles.map((curso) => (
            <option key={curso} value={curso}>{curso}</option>
          ))}
        </select>
        <select
          aria-label="Filtrar por estado académico"
          className="usuarios-select"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {estadosDisponibles.map((estado) => (
            <option key={estado} value={estado}>{estado}</option>
          ))}
        </select>
        <div className="estudiantes-filtros-acciones">
          <button type="button" className="btn-roles" onClick={aplicarFiltros}>
            Filtrar
          </button>
          <button type="button" className="btn-roles" onClick={limpiarFiltros}>
            Limpiar
          </button>
        </div>
      </div>

      {msgExitoAsociacion && (
        <div className="success-message cit-exito">
          <span>{msgExitoAsociacion}</span>
          <button type="button" className="btn-cerrar" onClick={() => setMsgExitoAsociacion("")} aria-label="Cerrar aviso">✕</button>
        </div>
      )}

      {errorCarga && (
        <div className="usuarios-empty" style={{ color: "#dc2626" }}>
          {errorCarga}
        </div>
      )}

      {!errorCarga && mensajeInfo && (
        <div className="usuarios-empty">{mensajeInfo}</div>
      )}

      {!errorCarga && !mensajeInfo && (
        <>
          {estudiantesFiltrados.length === 0 ? (
            <div className="usuarios-empty">No se encontraron estudiantes</div>
          ) : (
            <div className="tabla-responsive-container tabla-responsive-container--cards">
              <table className="tabla-usuarios tabla-estudiantes">
                <thead>
                  <tr>
                    <th>#</th>
                    <th style={{ cursor: "pointer" }} onClick={() => alternarOrden("Estudiante_Nombre_Completo")}>
                      Nombre{flechaOrden("Estudiante_Nombre_Completo")}
                    </th>
                    <th style={{ cursor: "pointer" }} onClick={() => alternarOrden("Estudiante_RUT")}>
                      RUT{flechaOrden("Estudiante_RUT")}
                    </th>
                    <th style={{ cursor: "pointer" }} onClick={() => alternarOrden("Curso_Nombre")}>
                      Curso{flechaOrden("Curso_Nombre")}
                    </th>
                    <th style={{ cursor: "pointer" }} onClick={() => alternarOrden("Estudiante_Estado_Academico")}>
                      Estado{flechaOrden("Estudiante_Estado_Academico")}
                    </th>
                    <th>Dirección</th>
                    {esAdmin && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {estudiantesFiltrados.map((e, idx) => (
                    <tr key={e.Estudiante_Id}>
                      <td data-label="#" className="est-col-num">{idx + 1}</td>
                      <td data-label="Nombre" className="est-col-nombre">{e.Estudiante_Nombre_Completo}</td>
                      <td data-label="RUT">{e.Estudiante_RUT}</td>
                      <td data-label="Curso">{e.Curso_Nombre}</td>
                      <td data-label="Estado" className="est-col-estado">
                        {e.Estudiante_Estado_Academico === "Regular" ? (
                          <span className="badge-activo">Regular</span>
                        ) : (
                          <span className="badge-inactivo">{e.Estudiante_Estado_Academico}</span>
                        )}
                      </td>
                      <td data-label="Dirección">{formatearDireccion(e, COLUMNAS_DIRECCION_ESTUDIANTE) || "—"}</td>
                      {esAdmin && (
                        <td data-label="Acciones" className="est-col-acciones">
                          <div className="acciones-grupo est-acciones">
                            <button type="button" className="btn-roles" onClick={() => abrirEdicion(e)}>
                              Editar ficha
                            </button>
                            {esAdminCompleto && (
                              <button type="button" className="btn-roles" onClick={() => abrirEdicionAsociacion(e)}>
                                Apoderados
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* CU38: modal de edición de curso asociado y estado académico */}
      {editando && (
        <div className="modal-overlay">
          <div className="modal-card" role="dialog" aria-labelledby="titulo-editar-ficha">
            <div className="modal-header">
              <h2 id="titulo-editar-ficha">Editar ficha del estudiante</h2>
              <button
                type="button"
                className="btn-cerrar"
                onClick={cerrarEdicion}
                aria-label="Cerrar"
                disabled={guardando}
              >
                ✕
              </button>
            </div>
            <p className="modal-subtitulo">
              <strong>{editando.Estudiante_Nombre_Completo}</strong>
            </p>

            <form onSubmit={handleSubmitEdicion} className="cambiar-pwd-form">
              <div className="campo-pwd">
                <label>Curso asociado</label>
                <select
                  className="usuarios-select"
                  value={form.Curso_Id}
                  onChange={(e) => setForm((f) => ({ ...f, Curso_Id: e.target.value }))}
                  style={{ width: "100%" }}
                >
                  <option value="">Selecciona un curso...</option>
                  {cursosOpciones.map((c) => (
                    <option key={c.Curso_Id} value={c.Curso_Id}>{c.Curso_Nombre}{textoPeriodo(c.Curso_Periodo_Lectivo, c.Curso_Periodo_Estado)}</option>
                  ))}
                </select>
              </div>

              <div className="campo-pwd">
                <label>Estado académico</label>
                <select
                  className="usuarios-select"
                  value={form.Estudiante_Estado_Academico}
                  onChange={(e) => setForm((f) => ({ ...f, Estudiante_Estado_Academico: e.target.value }))}
                  style={{ width: "100%" }}
                >
                  {ESTADOS_ACADEMICOS.map((estado) => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>

              {/* RF23 / CU105: ruta de formación, decidida en 2° medio */}
              <div className="campo-pwd">
                <label>Ruta de formación</label>
                <select
                  className="usuarios-select"
                  value={form.Estudiante_Ruta_Formacion}
                  onChange={(e) => setForm((f) => ({ ...f, Estudiante_Ruta_Formacion: e.target.value }))}
                  style={{ width: "100%" }}
                >
                  <option value="">Sin ruta</option>
                  {RUTAS_FORMACION.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <span className="etiquetas-ayuda">Solo para 2°, 3° y 4° medio. La Técnica no afecta horarios ni electivos.</span>
              </div>

              {/* Incremento 3: dirección separada del estudiante (no la edita la etiqueta UTP) */}
              {esAdminCompleto && CAMPOS_DIRECCION_FICHA.map(({ clave, label, maxLength }) => (
                <div className="campo-pwd" key={clave}>
                  <label>{label}</label>
                  <input
                    maxLength={maxLength}
                    value={form[clave]}
                    onChange={(e) => setForm((f) => ({ ...f, [clave]: e.target.value }))}
                  />
                </div>
              ))}

              {msgExitoForm && <div className="msg-exito">{msgExitoForm}</div>}
              {msgErrorForm && <div className="msg-error-form">{msgErrorForm}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarEdicion}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primario" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CU39 / CU90: apoderado titular y suplentes, sin modificar datos personales */}
      {editandoAsociacion && (
        <ApoderadosEstudianteModal
          estudiante={editandoAsociacion}
          apoderados={apoderadosOpciones}
          errorApoderados={errorApoderados}
          onRecargarApoderados={cargarApoderados}
          onClose={() => setEditandoAsociacion(null)}
          onGuardado={alGuardarAsociacion}
        />
      )}
    </div>
  );
}

export default Estudiantes;
