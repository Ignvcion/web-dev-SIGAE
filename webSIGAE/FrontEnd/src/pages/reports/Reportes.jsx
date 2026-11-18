import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getApoderados,
  getCitaciones,
  getCursos,
  getDocentes,
  getEstudiantes,
  getHorarioMaestro,
} from "../../services/api";
import { getEstadoPeriodo } from "../../services/promocion";
import {
  construirContextoReportes,
  construirReportes,
  extraerLista,
  filtrarCursosPorPeriodo,
  generarContenidoExcel,
  generarReportePdfBytes,
  nombreArchivoReporte,
  obtenerPeriodosDisponibles,
} from "../../utils/reportes";

function triggerDownloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Retrasa la revocación para navegadores móviles y PWA instaladas
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function Reportes() {
  const { usuario, rolActivo } = useAuth();
  const rol = rolActivo || usuario?.roles?.[0] || "Administrador";

  const [fuentes, setFuentes] = useState({
    cursos: [],
    estudiantes: [],
    docentes: [],
    apoderados: [],
    citaciones: [],
    horarios: [],
    estadoPeriodo: null,
  });
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [avisoParcial, setAvisoParcial] = useState("");
  const [recargaKey, setRecargaKey] = useState(0);

  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [cursoSeleccionadoId, setCursoSeleccionadoId] = useState("todos");
  const [descargando, setDescargando] = useState("");
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [vistaPreviaId, setVistaPreviaId] = useState(null);

  const timerMensajeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerMensajeRef.current) clearTimeout(timerMensajeRef.current);
    };
  }, []);

  useEffect(() => {
    let activo = true;
    Promise.allSettled([
      getCursos(),
      getEstudiantes(),
      getDocentes(),
      getApoderados(),
      getCitaciones(rol),
      getHorarioMaestro(),
      getEstadoPeriodo(),
    ]).then(([resCursos, resEst, resDoc, resApo, resCit, resHor, resPer]) => {
      if (!activo) return;

      const falloCursos = resCursos.status === "rejected";
      const falloEst = resEst.status === "rejected";
      if (falloCursos && falloEst) {
        setErrorCarga(
          resCursos.reason?.message ||
          resEst.reason?.message ||
          "No fue posible cargar los cursos y datos académicos del establecimiento."
        );
        setCargando(false);
        return;
      }

      const faltantes = [];
      if (falloCursos) faltantes.push("cursos");
      if (falloEst) faltantes.push("estudiantes");
      if (resDoc.status === "rejected") faltantes.push("docentes");
      if (resApo.status === "rejected") faltantes.push("apoderados");
      if (resCit.status === "rejected") faltantes.push("citaciones");
      // Horario Maestro devuelve 404 cuando aún no hay clases asignadas; solo avisar en errores reales de red/servidor
      if (
        resHor.status === "rejected" &&
        resHor.reason?.message &&
        !String(resHor.reason.message).toLowerCase().includes("no es posible generar el horario maestro")
      ) {
        faltantes.push("horarios");
      }

      setErrorCarga("");
      setAvisoParcial(
        faltantes.length > 0
          ? `Algunos módulos no pudieron actualizarse (${faltantes.join(", ")}). Se muestran los datos disponibles.`
          : ""
      );
      setFuentes({
        cursos: resCursos.status === "fulfilled" ? extraerLista(resCursos.value, "cursos") : [],
        estudiantes: resEst.status === "fulfilled" ? extraerLista(resEst.value, "estudiantes") : [],
        docentes: resDoc.status === "fulfilled" ? extraerLista(resDoc.value, "docentes") : [],
        apoderados: resApo.status === "fulfilled" ? extraerLista(resApo.value, "apoderados") : [],
        citaciones: resCit.status === "fulfilled" ? extraerLista(resCit.value, "citaciones") : [],
        horarios: resHor.status === "fulfilled" ? extraerLista(resHor.value, "horarios") : [],
        estadoPeriodo: resPer.status === "fulfilled" ? resPer.value : null,
      });
      setCargando(false);
    });

    return () => {
      activo = false;
    };
  }, [rol, recargaKey]);

  const { periodos, periodoDefecto } = useMemo(
    () => obtenerPeriodosDisponibles(fuentes.cursos, fuentes.estadoPeriodo),
    [fuentes.cursos, fuentes.estadoPeriodo]
  );

  const periodoEfectivo = useMemo(() => {
    if (periodoSeleccionado === "todos") return "todos";
    if (periodoSeleccionado && periodos.includes(periodoSeleccionado)) return periodoSeleccionado;
    return periodoDefecto;
  }, [periodoSeleccionado, periodos, periodoDefecto]);

  const cursosDelPeriodo = useMemo(
    () => filtrarCursosPorPeriodo(fuentes.cursos, periodoEfectivo),
    [fuentes.cursos, periodoEfectivo]
  );

  const cursoEfectivo = useMemo(() => {
    if (cursoSeleccionadoId === "todos") return "todos";
    const existe = cursosDelPeriodo.some((c) => String(c.Curso_Id) === String(cursoSeleccionadoId));
    return existe ? String(cursoSeleccionadoId) : "todos";
  }, [cursoSeleccionadoId, cursosDelPeriodo]);

  const contexto = useMemo(
    () =>
      construirContextoReportes({
        ...fuentes,
        periodo: periodoEfectivo,
        cursoId: cursoEfectivo,
      }),
    [fuentes, periodoEfectivo, cursoEfectivo]
  );

  const reportes = useMemo(() => construirReportes(contexto), [contexto]);

  const periodoLabel = periodoEfectivo === "todos" ? "Todos los períodos" : `Período ${periodoEfectivo}`;
  const cursoLabel = contexto.cursoSeleccionado
    ? contexto.cursoSeleccionado.Curso_Nombre
    : "Todos los cursos";

  const vistaPreviaReporte = useMemo(
    () => (vistaPreviaId ? reportes.find((r) => r.id === vistaPreviaId) || null : null),
    [reportes, vistaPreviaId]
  );

  const mostrarMensaje = (tipo, texto) => {
    if (timerMensajeRef.current) clearTimeout(timerMensajeRef.current);
    setMensaje({ tipo, texto });
    timerMensajeRef.current = setTimeout(() => setMensaje({ tipo: "", texto: "" }), 4500);
  };

  const handlePeriodoChange = (nuevoPeriodo) => {
    setPeriodoSeleccionado(nuevoPeriodo);
    const cursosCompatibles = filtrarCursosPorPeriodo(fuentes.cursos, nuevoPeriodo);
    if (
      cursoSeleccionadoId !== "todos" &&
      !cursosCompatibles.some((c) => String(c.Curso_Id) === String(cursoSeleccionadoId))
    ) {
      setCursoSeleccionadoId("todos");
    }
  };

  const limpiarFiltros = () => {
    setPeriodoSeleccionado(periodoDefecto);
    setCursoSeleccionadoId("todos");
  };

  const reintentarCarga = () => {
    setCargando(true);
    setErrorCarga("");
    setRecargaKey((k) => k + 1);
  };

  const handleDescargar = (reporte, formato) => {
    if (!reporte || reporte.totalRegistros === 0) {
      mostrarMensaje("error", `${reporte?.titulo || "El reporte"} no tiene registros para el filtro actual.`);
      return;
    }

    const key = `${reporte.id}-${formato}`;
    setDescargando(key);
    try {
      const meta = { periodoLabel, cursoLabel };
      if (formato === "pdf") {
        const pdfBytes = generarReportePdfBytes(reporte, meta);
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        triggerDownloadBlob(blob, nombreArchivoReporte(reporte.id, periodoLabel, cursoLabel, "pdf"));
      } else {
        const htmlExcel = generarContenidoExcel(reporte, meta);
        const blob = new Blob([htmlExcel], { type: "application/vnd.ms-excel;charset=utf-8" });
        triggerDownloadBlob(blob, nombreArchivoReporte(reporte.id, periodoLabel, cursoLabel, "xls"));
      }
      mostrarMensaje(
        "exito",
        `${reporte.titulo} descargado (${reporte.totalRegistros} registro(s), ${cursoLabel}, ${periodoLabel}) en ${formato.toUpperCase()}.`
      );
    } catch (error) {
      mostrarMensaje("error", error?.message || `No fue posible generar ${reporte.titulo}.`);
    } finally {
      setDescargando("");
    }
  };

  const hayFiltroPersonalizado = periodoEfectivo !== periodoDefecto || cursoEfectivo !== "todos";
  const { metricas } = contexto;

  return (
    <div className="usuarios-container">
      <div className="rep-header">
        <div>
          <h1>Reportes Institucionales</h1>
          <p>Consulta, previsualiza y exporta información académica consolidada y filtrada por curso</p>
        </div>
        <button
          type="button"
          className="btn-roles"
          onClick={reintentarCarga}
          disabled={cargando}
        >
          {cargando ? "Actualizando..." : "↻ Actualizar datos"}
        </button>
      </div>

      {mensaje.texto && (
        <div
          className={mensaje.tipo === "error" ? "msg-error-form" : "msg-exito"}
          style={{ marginBottom: "1rem" }}
          role="status"
        >
          {mensaje.texto}
        </div>
      )}

      {avisoParcial && !errorCarga && (
        <div className="error-message" style={{ marginBottom: "1rem" }}>
          {avisoParcial}
        </div>
      )}

      {errorCarga ? (
        <div className="usuarios-empty">
          <div className="msg-error-form" style={{ marginBottom: "12px" }}>{errorCarga}</div>
          <button type="button" className="btn-roles" onClick={reintentarCarga}>
            Reintentar
          </button>
        </div>
      ) : cargando ? (
        <p className="empty-state-text">Cargando cursos y datos institucionales...</p>
      ) : (
        <>
          {/* KPIs reales calculados según el período y curso filtrados */}
          <div className="rep-kpi-grid">
            <div className="rep-kpi-card">
              <span className="rep-kpi-label">
                {contexto.cursoSeleccionado ? "Curso Seleccionado" : "Cursos"}
              </span>
              <p className="rep-kpi-valor rep-kpi-valor--green">{metricas.totalCursos}</p>
              <span className="rep-kpi-sub">
                {contexto.cursoSeleccionado
                  ? `Jefe: ${contexto.cursoSeleccionado.Profesor_Jefe_Nombre || "Sin asignar"}`
                  : `${metricas.jefaturasAsignadas} con profesor jefe`}
              </span>
            </div>

            <div className="rep-kpi-card">
              <span className="rep-kpi-label">Matrícula</span>
              <p className="rep-kpi-valor rep-kpi-valor--blue">{metricas.totalEstudiantes}</p>
              <span className="rep-kpi-sub">
                {metricas.totalEstudiantes === 0
                  ? "Sin estudiantes asignados"
                  : `${metricas.estudiantesRegulares} regular(es) · ${metricas.conApoderado} con apoderado`}
              </span>
            </div>

            <div className="rep-kpi-card">
              <span className="rep-kpi-label">Docentes</span>
              <p className="rep-kpi-valor rep-kpi-valor--purple">{metricas.totalDocentesFiltro}</p>
              <span className="rep-kpi-sub">
                {contexto.cursoSeleccionado
                  ? `${metricas.bloquesActivos} bloque(s) en el curso`
                  : `${metricas.docentesConCarga} con bloques asignados`}
              </span>
            </div>

            <div className="rep-kpi-card">
              <span className="rep-kpi-label">Citaciones</span>
              <p className="rep-kpi-valor rep-kpi-valor--amber">{metricas.totalCitaciones}</p>
              <span className="rep-kpi-sub">
                {metricas.totalCitaciones === 0
                  ? "Sin citaciones registradas"
                  : `${metricas.citConfirmadas} confirmada(s) · ${metricas.citPendientes} pendiente(s)`}
              </span>
            </div>
          </div>

          {/* Filtros dinámicos conectados a API / Store */}
          <div className="rep-filtros">
            <div className="rep-filtro-campo">
              <label htmlFor="rep-periodo">Año Académico:</label>
              <select
                id="rep-periodo"
                className="usuarios-select"
                value={periodoEfectivo}
                onChange={(e) => handlePeriodoChange(e.target.value)}
                aria-label="Filtrar por año académico"
              >
                <option value="todos">Todos los períodos ({fuentes.cursos.length} cursos)</option>
                {periodos.map((p) => (
                  <option key={p} value={p}>
                    Período {p}{fuentes.estadoPeriodo?.periodos?.vigente === p ? " (vigente)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="rep-filtro-campo">
              <label htmlFor="rep-curso">Filtrar por Curso ({cursosDelPeriodo.length}):</label>
              <select
                id="rep-curso"
                className="usuarios-select"
                value={cursoEfectivo}
                onChange={(e) => setCursoSeleccionadoId(e.target.value)}
                disabled={cursosDelPeriodo.length === 0}
                aria-label="Filtrar por curso"
              >
                {cursosDelPeriodo.length === 0 ? (
                  <option value="todos">Sin cursos registrados en este período</option>
                ) : (
                  <option value="todos">Todos los cursos ({cursosDelPeriodo.length})</option>
                )}
                {cursosDelPeriodo.map((c) => (
                  <option key={c.Curso_Id} value={String(c.Curso_Id)}>
                    {c.Curso_Nombre || c.curso}
                    {periodoEfectivo === "todos" && (c.Curso_Periodo_Lectivo || c.periodo)
                      ? ` (${c.Curso_Periodo_Lectivo || c.periodo})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {hayFiltroPersonalizado && (
              <div className="rep-filtro-acciones">
                <button type="button" className="btn-roles" onClick={limpiarFiltros}>
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          <div className="rep-resumen-activo">
            <span>
              Mostrando datos reales para <strong>{cursoLabel}</strong> · <strong>{periodoLabel}</strong>
            </span>
          </div>

          {/* Tarjetas de Reportes */}
          <div className="rep-grid">
            {reportes.map((r) => {
              const descargandoPdf = descargando === `${r.id}-pdf`;
              const descargandoExcel = descargando === `${r.id}-excel`;
              const sinDatos = r.totalRegistros === 0;

              return (
                <div key={r.id} className="rep-card">
                  <div>
                    <div className="rep-card-top">
                      <span className="rep-card-icono" aria-hidden="true">{r.icono}</span>
                      <div className="rep-card-badges">
                        <span className="rep-card-tag">{r.etiqueta}</span>
                        <span className={`rep-card-count${sinDatos ? " rep-card-count--empty" : ""}`}>
                          {r.totalRegistros} {r.totalRegistros === 1 ? "registro" : "registros"}
                        </span>
                      </div>
                    </div>
                    <h3>{r.titulo}</h3>
                    <p>{r.descripcion}</p>
                    {sinDatos && <div className="rep-card-vacio">{r.emptyTexto}</div>}
                  </div>

                  <div className="rep-card-actions">
                    <button
                      type="button"
                      className="rep-btn-preview"
                      onClick={() => setVistaPreviaId(r.id)}
                      disabled={sinDatos}
                    >
                      👁️ Vista previa
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleDescargar(r, "pdf")}
                      disabled={sinDatos || descargandoPdf}
                    >
                      {descargandoPdf ? "Generando..." : "📄 Descargar PDF"}
                    </button>
                    <button
                      type="button"
                      className="rep-btn-excel"
                      onClick={() => handleDescargar(r, "excel")}
                      disabled={sinDatos || descargandoExcel}
                    >
                      {descargandoExcel ? "Generando..." : "📊 Descargar Excel"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {vistaPreviaReporte && (
        <div className="modal-overlay" onClick={() => setVistaPreviaId(null)}>
          <div
            className="modal-card rep-modal-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-preview-reporte"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 id="titulo-preview-reporte">{vistaPreviaReporte.titulo}</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                  {cursoLabel} · {periodoLabel} · {vistaPreviaReporte.totalRegistros} registro(s)
                </p>
              </div>
              <button
                type="button"
                className="btn-cerrar"
                onClick={() => setVistaPreviaId(null)}
                aria-label="Cerrar vista previa"
              >
                ✕
              </button>
            </div>

            {vistaPreviaReporte.totalRegistros === 0 ? (
              <div className="usuarios-empty">{vistaPreviaReporte.emptyTexto}</div>
            ) : (
              <div className="rep-preview-wrap">
                <table className="tabla-usuarios">
                  <thead>
                    <tr>
                      {vistaPreviaReporte.columnas.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vistaPreviaReporte.filas.map((fila, idx) => (
                      <tr key={idx}>
                        {fila.map((celda, cIdx) => (
                          <td key={cIdx}>{celda}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: "16px", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleDescargar(vistaPreviaReporte, "pdf")}
                disabled={vistaPreviaReporte.totalRegistros === 0}
              >
                📄 Descargar PDF
              </button>
              <button
                type="button"
                className="btn-roles"
                onClick={() => handleDescargar(vistaPreviaReporte, "excel")}
                disabled={vistaPreviaReporte.totalRegistros === 0}
              >
                📊 Descargar Excel
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setVistaPreviaId(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reportes;
