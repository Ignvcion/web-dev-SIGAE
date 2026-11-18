// Utilidades de filtrado, consolidación y exportación para Reportes Institucionales

const ORDEN_DIAS = {
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
  domingo: 7,
};

const LATIN1_FALLBACKS = {
  "—": "-",
  "–": "-",
  "•": "*",
  "·": "-",
  "“": '"',
  "”": '"',
  "‘": "'",
  "’": "'",
  "…": "...",
  "→": "->",
  "←": "<-",
  "€": "EUR",
};

const RE_NON_LATIN1 = /[^\x20-\x7e\xa0-\xff]/g;

export function extraerLista(res, clave) {
  if (Array.isArray(res)) return res;
  if (res && clave && Array.isArray(res[clave])) return res[clave];
  return [];
}

export function ordenarCursos(cursos = []) {
  return [...cursos].sort((a, b) => {
    const perA = String(a?.Curso_Periodo_Lectivo || a?.periodo || "");
    const perB = String(b?.Curso_Periodo_Lectivo || b?.periodo || "");
    if (perA !== perB) return perB.localeCompare(perA, "es");

    const ordA = Number(a?.Nivel_Educativo_Orden ?? a?.Nivel_Educativo_Id ?? 999);
    const ordB = Number(b?.Nivel_Educativo_Orden ?? b?.Nivel_Educativo_Id ?? 999);
    if (!Number.isNaN(ordA) && !Number.isNaN(ordB) && ordA !== ordB) {
      return ordA - ordB;
    }

    const nomA = String(a?.Curso_Nombre || a?.curso || "");
    const nomB = String(b?.Curso_Nombre || b?.curso || "");
    return nomA.localeCompare(nomB, "es");
  });
}

export function obtenerPeriodosDisponibles(cursos = [], estadoPeriodo = null) {
  const set = new Set();
  for (const c of cursos) {
    const p = String(c?.Curso_Periodo_Lectivo || c?.periodo || "").trim();
    if (p) set.add(p);
  }
  const candVigente = String(estadoPeriodo?.periodos?.vigente || estadoPeriodo?.periodoActual || "").trim();
  const candSiguiente = String(estadoPeriodo?.periodos?.siguiente || "").trim();
  if (candVigente) set.add(candVigente);
  if (candSiguiente) set.add(candSiguiente);

  const periodos = [...set].sort((a, b) => b.localeCompare(a, "es"));
  const periodoDefecto = (candVigente && set.has(candVigente))
    ? candVigente
    : (periodos[0] || "todos");

  return { periodos, periodoDefecto };
}

export function filtrarCursosPorPeriodo(cursos = [], periodo = "todos") {
  const ordenados = ordenarCursos(cursos);
  if (!periodo || periodo === "todos") return ordenados;
  return ordenados.filter(
    (c) => String(c?.Curso_Periodo_Lectivo || c?.periodo || "").trim() === String(periodo)
  );
}

function esHorarioActivo(h) {
  const estado = String(h?.estado || h?.Horario_Estado || "Activo").toLowerCase();
  return estado === "activo" && Number(h?.eliminado || 0) !== 1;
}

function tramoHorario(h) {
  const ini = String(h?.horaInicio || h?.hora_inicio || "").slice(0, 5);
  const fin = String(h?.horaFin || h?.hora_fin || "").slice(0, 5);
  if (ini && fin) return `${ini} - ${fin}`;
  return ini || "—";
}

function formatFechaCorta(iso) {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
  if (!m) return String(iso);
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/**
 * Consolida cursos, estudiantes, docentes, apoderados, citaciones y horarios
 * aplicando el período y curso seleccionados de forma consistente.
 */
export function construirContextoReportes({
  cursos = [],
  estudiantes = [],
  docentes = [],
  apoderados = [],
  citaciones = [],
  horarios = [],
  periodo = "todos",
  cursoId = "todos",
}) {
  const cursosMap = new Map(cursos.map((c) => [Number(c.Curso_Id), c]));
  const apoderadosMap = new Map(apoderados.map((a) => [Number(a.Usuario_Id), a]));
  const estudiantesMap = new Map(estudiantes.map((e) => [Number(e.Estudiante_Id), e]));

  const cursosPeriodo = filtrarCursosPorPeriodo(cursos, periodo);
  const cursoSeleccionado = cursoId && cursoId !== "todos"
    ? cursosPeriodo.find((c) => String(c.Curso_Id) === String(cursoId)) || null
    : null;
  const cursosActivos = cursoSeleccionado ? [cursoSeleccionado] : cursosPeriodo;
  const cursoIdsSet = new Set(cursosActivos.map((c) => Number(c.Curso_Id)));
  const nombresCursosActivos = new Set(cursosActivos.map((c) => String(c.Curso_Nombre || c.curso || "").trim()));

  let estudiantesFiltrados;
  if (cursoSeleccionado) {
    estudiantesFiltrados = estudiantes.filter(
      (e) => Number(e.Curso_Id) === Number(cursoSeleccionado.Curso_Id)
    );
  } else if (periodo === "todos") {
    estudiantesFiltrados = cursos.length > 0
      ? estudiantes.filter((e) => !e.Curso_Id || cursoIdsSet.has(Number(e.Curso_Id)))
      : estudiantes;
  } else {
    estudiantesFiltrados = cursosPeriodo.length > 0
      ? estudiantes.filter((e) => cursoIdsSet.has(Number(e.Curso_Id)))
      : [];
  }

  const horariosActivos = horarios.filter(esHorarioActivo);
  const horariosFiltrados = horariosActivos.filter((h) => {
    if (cursoSeleccionado) return Number(h.Curso_Id) === Number(cursoSeleccionado.Curso_Id);
    if (periodo === "todos") return cursos.length > 0 ? cursoIdsSet.has(Number(h.Curso_Id)) : true;
    return cursoIdsSet.has(Number(h.Curso_Id));
  });

  const citacionesFiltradas = citaciones.filter((c) => {
    const est = estudiantesMap.get(Number(c.Estudiante_Id));
    const cCursoId = Number(c.Curso_Id || est?.Curso_Id || 0);
    if (cCursoId && cursoIdsSet.has(cCursoId)) return true;
    if (!cCursoId && c.Curso_Nombre && nombresCursosActivos.has(String(c.Curso_Nombre).trim())) {
      if (periodo === "todos") return true;
      const anioCit = String(c.Citacion_Fecha || "").slice(0, 4);
      if (anioCit === String(periodo) || cursosActivos.some((cu) => String(cu.Curso_Periodo_Lectivo || cu.periodo || "") === String(periodo))) {
        return true;
      }
    }
    return periodo === "todos" && !cursoSeleccionado && cursos.length === 0;
  });

  const cargaPorDocente = new Map();
  for (const h of horariosFiltrados) {
    const docId = Number(h.Usuario_Id || h.docente_id || 0);
    const key = docId > 0 ? `id:${docId}` : `nom:${String(h.Docente_Nombre || h.docente || "").trim().toLowerCase()}`;
    if (!key || key === "nom:") continue;
    const prev = cargaPorDocente.get(key) || { bloques: 0, cursos: new Set(), asignaturas: new Set() };
    prev.bloques += 1;
    const cNom = cursosMap.get(Number(h.Curso_Id))?.Curso_Nombre || h.Curso_Nombre || h.curso;
    if (cNom) prev.cursos.add(cNom);
    const aNom = h.Asignatura_Nombre || h.asignatura;
    if (aNom) prev.asignaturas.add(aNom);
    cargaPorDocente.set(key, prev);
  }

  const docentesActivos = docentes.filter((d) => Number(d.Usuario_Estado_Cuenta ?? 1) === 1);
  const jefeIdSeleccionado = Number(cursoSeleccionado?.Curso_Profesor_Jefe_Usuario_Id || cursoSeleccionado?.Profesor_Jefe_Id || 0);

  const docentesFiltrados = docentes.filter((d) => {
    const uid = Number(d.Usuario_Id || d.id || 0);
    const info = cargaPorDocente.get(`id:${uid}`);
    if (cursoSeleccionado) {
      return Boolean(info) || (jefeIdSeleccionado > 0 && uid === jefeIdSeleccionado);
    }
    if (periodo !== "todos" && cursosPeriodo.length === 0) return false;
    return Number(d.Usuario_Estado_Cuenta ?? 1) === 1 || Boolean(info);
  });

  const docentesCarga = [...docentesFiltrados]
    .map((d) => {
      const uid = Number(d.Usuario_Id || d.id || 0);
      const info = cargaPorDocente.get(`id:${uid}`) || { bloques: 0, cursos: new Set(), asignaturas: new Set() };
      return {
        ...d,
        bloques: info.bloques,
        cursosLista: [...info.cursos].sort((a, b) => a.localeCompare(b, "es")),
        asignaturasLista: [...info.asignaturas].sort((a, b) => a.localeCompare(b, "es")),
      };
    })
    .sort((a, b) => b.bloques - a.bloques || String(a.Usuario_Nombre_Completo || "").localeCompare(String(b.Usuario_Nombre_Completo || ""), "es"));

  const regulares = estudiantesFiltrados.filter(
    (e) => String(e.Estudiante_Estado_Academico || "Regular") === "Regular"
  ).length;
  const conApoderado = estudiantesFiltrados.filter((e) => Boolean(e.Apoderado_Usuario_Id)).length;
  const citConfirmadas = citacionesFiltradas.filter(
    (c) => String(c.Citacion_Estado || "").toLowerCase() === "confirmada" || String(c.Citacion_Estado || "").toLowerCase() === "futura"
  ).length;
  const citPendientes = citacionesFiltradas.filter(
    (c) => String(c.Citacion_Estado || "").toLowerCase().startsWith("pendiente")
  ).length;
  const jefaturasAsignadas = cursosActivos.filter(
    (c) => Boolean(c.Profesor_Jefe_Nombre || c.Curso_Profesor_Jefe_Usuario_Id || c.Profesor_Jefe_Id)
  ).length;

  return {
    cursosMap,
    apoderadosMap,
    estudiantesMap,
    cursosPeriodo,
    cursoSeleccionado,
    cursosActivos,
    estudiantesFiltrados,
    horariosFiltrados,
    citacionesFiltradas,
    docentesCarga,
    metricas: {
      totalCursos: cursosActivos.length,
      jefaturasAsignadas,
      totalEstudiantes: estudiantesFiltrados.length,
      estudiantesRegulares: regulares,
      conApoderado,
      totalDocentesFiltro: cursoSeleccionado
        ? docentesCarga.filter((d) => Number(d.Usuario_Estado_Cuenta ?? 1) === 1).length
        : docentesActivos.length,
      totalDocentesActivos: docentesActivos.length,
      docentesConCarga: docentesCarga.filter((d) => d.bloques > 0).length,
      bloquesActivos: horariosFiltrados.length,
      totalCitaciones: citacionesFiltradas.length,
      citConfirmadas,
      citPendientes,
    },
  };
}

export function construirReportes(contexto) {
  const {
    cursosMap,
    apoderadosMap,
    estudiantesMap,
    cursosActivos,
    estudiantesFiltrados,
    horariosFiltrados,
    citacionesFiltradas,
    docentesCarga,
  } = contexto;

  const estOrdenados = [...estudiantesFiltrados].sort((a, b) => {
    const cA = cursosMap.get(Number(a.Curso_Id))?.Curso_Nombre || a.Curso_Nombre || "";
    const cB = cursosMap.get(Number(b.Curso_Id))?.Curso_Nombre || b.Curso_Nombre || "";
    const cmpCurso = cA.localeCompare(cB, "es");
    if (cmpCurso !== 0) return cmpCurso;
    return String(a.Estudiante_Nombre_Completo || "").localeCompare(String(b.Estudiante_Nombre_Completo || ""), "es");
  });

  const matriculaFilas = estOrdenados.map((e, i) => {
    const cNom = cursosMap.get(Number(e.Curso_Id))?.Curso_Nombre || e.Curso_Nombre || "Sin curso";
    const apo = apoderadosMap.get(Number(e.Apoderado_Usuario_Id));
    return [
      String(i + 1),
      e.Estudiante_Nombre_Completo || "—",
      e.Estudiante_RUT || "—",
      cNom,
      e.Estudiante_Estado_Academico || "Regular",
      apo?.Usuario_Nombre_Completo || e.Apoderado_Nombre || "Sin asignar",
      apo?.Usuario_Telefono || e.Usuario_Telefono || "—",
      apo?.Apoderado_Correo_Natural || apo?.Usuario_Correo || e.Usuario_Correo || "—",
    ];
  });

  const conteoPorCurso = new Map();
  const regularesPorCurso = new Map();
  for (const e of estOrdenados) {
    const cid = Number(e.Curso_Id || 0);
    conteoPorCurso.set(cid, (conteoPorCurso.get(cid) || 0) + 1);
    if (String(e.Estudiante_Estado_Academico || "Regular") === "Regular") {
      regularesPorCurso.set(cid, (regularesPorCurso.get(cid) || 0) + 1);
    }
  }
  const bloquesPorCurso = new Map();
  for (const h of horariosFiltrados) {
    const cid = Number(h.Curso_Id || 0);
    bloquesPorCurso.set(cid, (bloquesPorCurso.get(cid) || 0) + 1);
  }

  const cursosFilas = cursosActivos.map((c, i) => {
    const cid = Number(c.Curso_Id);
    const totalAsig = c.Total_Asignaturas_Activas !== undefined
      ? Number(c.Total_Asignaturas_Activas)
      : (Array.isArray(c.asignaturas) ? c.asignaturas.length : 0);
    return [
      String(i + 1),
      c.Curso_Nombre || c.curso || "—",
      String(c.Curso_Periodo_Lectivo || c.periodo || "—"),
      c.Nivel_Educativo_Nombre || "—",
      c.Curso_Seccion || c.seccion || "—",
      c.Profesor_Jefe_Nombre || "Sin asignar",
      String(conteoPorCurso.get(cid) || 0),
      String(regularesPorCurso.get(cid) || 0),
      String(totalAsig),
      String(bloquesPorCurso.get(cid) || 0),
    ];
  });

  const citOrdenadas = [...citacionesFiltradas].sort((a, b) =>
    `${b.Citacion_Fecha || ""} ${b.Citacion_Tramo_Horario || ""}`.localeCompare(
      `${a.Citacion_Fecha || ""} ${a.Citacion_Tramo_Horario || ""}`
    )
  );
  const citacionesFilas = citOrdenadas.map((c, i) => {
    const est = estudiantesMap.get(Number(c.Estudiante_Id));
    const cNom = c.Curso_Nombre || cursosMap.get(Number(c.Curso_Id || est?.Curso_Id))?.Curso_Nombre || est?.Curso_Nombre || "—";
    return [
      String(i + 1),
      formatFechaCorta(c.Citacion_Fecha),
      c.Citacion_Tramo_Horario || tramoHorario({ horaInicio: c.Citacion_Hora_Inicio, horaFin: c.Citacion_Hora_Fin }),
      c.Estudiante_Nombre_Completo || est?.Estudiante_Nombre_Completo || "—",
      cNom,
      c.Docente_Nombre || "—",
      c.Apoderado_Nombre || "—",
      c.Citacion_Modalidad || "—",
      c.Citacion_Estado || "—",
      c.Citacion_Motivo || "—",
    ];
  });

  const cargaDocenteFilas = docentesCarga.map((d, i) => [
    String(i + 1),
    d.Usuario_Nombre_Completo || "—",
    d.Docente_Especialidad || "General",
    Number(d.Usuario_Estado_Cuenta ?? 1) === 1 ? "Activo" : "Inactivo",
    String(d.bloques),
    d.cursosLista.length > 0 ? d.cursosLista.join(", ") : "Sin bloques",
    d.asignaturasLista.length > 0 ? d.asignaturasLista.join(", ") : "—",
    String(d.Carga_Horaria_Maxima ?? d.Docente_Carga_Horaria_Maxima ?? 36),
  ]);

  const horariosOrdenados = [...horariosFiltrados].sort((a, b) => {
    const dA = ORDEN_DIAS[String(a.dia || "").toLowerCase()] || 99;
    const dB = ORDEN_DIAS[String(b.dia || "").toLowerCase()] || 99;
    if (dA !== dB) return dA - dB;
    const hA = String(a.horaInicio || a.hora_inicio || "");
    const hB = String(b.horaInicio || b.hora_inicio || "");
    if (hA !== hB) return hA.localeCompare(hB);
    return String(a.Curso_Nombre || a.curso || "").localeCompare(String(b.Curso_Nombre || b.curso || ""), "es");
  });
  const horarioFilas = horariosOrdenados.map((h, i) => [
    String(i + 1),
    h.dia || "—",
    tramoHorario(h),
    h.jornada || "—",
    cursosMap.get(Number(h.Curso_Id))?.Curso_Nombre || h.Curso_Nombre || h.curso || "—",
    h.Asignatura_Nombre || h.asignatura || "—",
    h.Docente_Nombre || h.docente || "Sin docente",
  ]);

  const apoderadosFilas = estOrdenados.map((e, i) => {
    const cNom = cursosMap.get(Number(e.Curso_Id))?.Curso_Nombre || e.Curso_Nombre || "Sin curso";
    const apo = apoderadosMap.get(Number(e.Apoderado_Usuario_Id));
    const tieneApo = Boolean(e.Apoderado_Usuario_Id);
    return [
      String(i + 1),
      e.Estudiante_Nombre_Completo || "—",
      e.Estudiante_RUT || "—",
      cNom,
      e.Estudiante_Estado_Academico || "Regular",
      tieneApo ? (apo?.Usuario_Nombre_Completo || e.Apoderado_Nombre || "Asignado") : "Sin apoderado",
      tieneApo ? (apo?.Usuario_Telefono || e.Usuario_Telefono || "—") : "—",
      tieneApo ? (apo?.Apoderado_Correo_Natural || apo?.Usuario_Correo || e.Usuario_Correo || "—") : "—",
      tieneApo ? "Con apoderado" : "Pendiente de asignar",
    ];
  });

  return [
    {
      id: "matricula",
      titulo: "Nómina Oficial de Matrícula",
      etiqueta: "Matrícula",
      icono: "📋",
      descripcion: "Listado oficial de estudiantes matriculados, RUT, curso, estado académico y contacto de apoderado.",
      columnas: ["#", "Estudiante", "RUT", "Curso", "Estado", "Apoderado Titular", "Teléfono", "Correo"],
      filas: matriculaFilas,
      emptyTexto: "No hay estudiantes registrados para el período y curso seleccionados.",
    },
    {
      id: "cursos",
      titulo: "Estructura de Cursos y Jefaturas",
      etiqueta: "Académico",
      icono: "🏫",
      descripcion: "Consolidado de todos los cursos vigentes, profesor jefe, matrícula actual, asignaturas y bloques.",
      columnas: ["#", "Curso", "Período", "Nivel", "Sección", "Profesor Jefe", "Estudiantes", "Regulares", "Asignaturas", "Bloques"],
      filas: cursosFilas,
      emptyTexto: "No existen cursos registrados en el período seleccionado.",
    },
    {
      id: "citaciones",
      titulo: "Historial y Estado de Citaciones",
      etiqueta: "Convivencia",
      icono: "🤝",
      descripcion: "Registro cronológico de citaciones por estudiante, docente, apoderado, modalidad, estado y motivo.",
      columnas: ["#", "Fecha", "Tramo", "Estudiante", "Curso", "Docente", "Apoderado", "Modalidad", "Estado", "Motivo"],
      filas: citacionesFilas,
      emptyTexto: "No hay citaciones registradas para la selección actual.",
    },
    {
      id: "carga-docente",
      titulo: "Distribución de Carga Horaria Docente",
      etiqueta: "Docencia",
      icono: "🕐",
      descripcion: "Bloques semanales asignados en horario maestro, especialidad, cursos e historial de carga máxima.",
      columnas: ["#", "Docente", "Especialidad", "Estado", "Bloques", "Cursos", "Asignaturas", "Carga Máx."],
      filas: cargaDocenteFilas,
      emptyTexto: "No hay docentes con actividad en el filtro seleccionado.",
    },
    {
      id: "horario-clases",
      titulo: "Planificación Horaria de Clases",
      etiqueta: "Horarios",
      icono: "🗓️",
      descripcion: "Detalle completo de bloques activos por día, horario, curso, asignatura y docente asignado.",
      columnas: ["#", "Día", "Horario", "Jornada", "Curso", "Asignatura", "Docente"],
      filas: horarioFilas,
      emptyTexto: "No hay bloques horarios asignados para la selección actual.",
    },
    {
      id: "apoderados",
      titulo: "Apoderados e Integridad de Vínculos",
      etiqueta: "Comunidad",
      icono: "👨‍👩‍👧",
      descripcion: "Control de estudiantes con apoderado titular asignado, datos de contacto y pendientes de vinculación.",
      columnas: ["#", "Estudiante", "RUT", "Curso", "Estado Académico", "Apoderado Titular", "Teléfono", "Correo", "Vínculo"],
      filas: apoderadosFilas,
      emptyTexto: "No hay registros de estudiantes para validar vínculos en esta selección.",
    },
  ].map((r) => ({ ...r, totalRegistros: r.filas.length }));
}

function escapeHtml(val) {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugArchivo(texto) {
  return String(texto || "todos")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "todos";
}

export function nombreArchivoReporte(reporteId, periodoLabel, cursoLabel, extension) {
  return `sigae_${reporteId}_${slugArchivo(periodoLabel)}_${slugArchivo(cursoLabel)}.${extension}`;
}

export function generarContenidoExcel(reporte, { periodoLabel, cursoLabel }) {
  const fechaEmision = new Date().toLocaleDateString("es-CL");
  const colSpan = Math.max(1, reporte.columnas.length);
  const ths = reporte.columnas.map((col) => `<th style="background:#e2e8f0;color:#0f172a;padding:6px;">${escapeHtml(col)}</th>`).join("");
  const trs = reporte.filas.map((fila) =>
    `<tr>${fila.map((celda) => `<td style="padding:5px;">${escapeHtml(celda)}</td>`).join("")}</tr>`
  ).join("\n");

  return `\uFEFF<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"/></head>
<body>
<table border="1" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;">
  <tr><th colspan="${colSpan}" style="background:#1e3a5f;color:#ffffff;font-size:15px;height:34px;">COLEGIO JACQUES COUSTEAU - ${escapeHtml(reporte.titulo.toUpperCase())}</th></tr>
  <tr><th colspan="${colSpan}" style="background:#f8fafc;font-size:11px;color:#475569;text-align:left;padding:6px;">Período Académico: ${escapeHtml(periodoLabel)} · Curso: ${escapeHtml(cursoLabel)} · Registros: ${reporte.filas.length} · Emitido: ${escapeHtml(fechaEmision)}</th></tr>
  <tr>${ths}</tr>
  ${trs}
  <tr><td colspan="${colSpan}" style="background:#f8fafc;font-weight:bold;padding:6px;">Total registros exportados: ${reporte.filas.length}</td></tr>
</table>
</body>
</html>`;
}

function normalizarLatin1(str) {
  let text = String(str ?? "");
  for (const [k, v] of Object.entries(LATIN1_FALLBACKS)) {
    text = text.split(k).join(v);
  }
  return text.replace(RE_NON_LATIN1, " ");
}

function toLatin1Bytes(str) {
  const text = String(str ?? "");
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    out[i] = code <= 255 ? code : 63;
  }
  return out;
}

function escapePdfLiteral(str) {
  return normalizarLatin1(str)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ");
}

function ajustarTexto(str, maxLen) {
  const text = normalizarLatin1(str).replace(/\s+/g, " ").trim();
  if (text.length <= maxLen) return text;
  if (maxLen <= 2) return text.slice(0, maxLen);
  return `${text.slice(0, maxLen - 2)}..`;
}

function calcularAnchosColumnas(columnas, filas, maxTotalChars = 116) {
  const numCols = columnas.length;
  const minAncho = 4;
  const maxPermitido = Math.max(12, Math.floor(maxTotalChars / Math.max(1, numCols)) + 10);
  const crudos = columnas.map((col, idx) => {
    let maxLen = normalizarLatin1(col).length;
    for (const fila of filas) {
      const len = normalizarLatin1(fila[idx] ?? "").length;
      if (len > maxLen) maxLen = len;
    }
    return Math.min(idx === 0 ? 4 : maxPermitido, Math.max(idx === 0 ? 3 : minAncho, maxLen));
  });

  const gaps = Math.max(0, (numCols - 1) * 2);
  let suma = crudos.reduce((a, b) => a + b, 0) + gaps;
  while (suma > maxTotalChars) {
    let idxMayor = -1;
    let mayor = minAncho + 1;
    for (let i = 0; i < crudos.length; i++) {
      if (crudos[i] > mayor) {
        mayor = crudos[i];
        idxMayor = i;
      }
    }
    if (idxMayor === -1) break;
    crudos[idxMayor] -= 1;
    suma -= 1;
  }
  return crudos;
}

function formatearFilaTabla(celdas, anchos) {
  return celdas
    .map((c, i) => ajustarTexto(c, anchos[i]).padEnd(anchos[i], " "))
    .join("  ");
}

function dividirLineasAncho(texto, maxChars) {
  const palabras = normalizarLatin1(texto).replace(/\s+/g, " ").trim().split(" ");
  const lineas = [];
  let actual = "";
  for (const p of palabras) {
    if (!actual) {
      actual = p;
    } else if (`${actual} ${p}`.length <= maxChars) {
      actual = `${actual} ${p}`;
    } else {
      lineas.push(actual);
      actual = p;
    }
  }
  if (actual) lineas.push(actual);
  return lineas.length ? lineas : [""];
}

function concatBytes(chunks) {
  const total = chunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/**
 * Genera un PDF A4 horizontal válido (ISO 32000-1) con codificación WinAnsiEncoding,
 * multipágina automática y offsets xref medidos exactamente en bytes.
 */
export function generarReportePdfBytes(reporte, { periodoLabel, cursoLabel }) {
  const anchos = calcularAnchosColumnas(reporte.columnas, reporte.filas, 118);
  const lineaCabecera = formatearFilaTabla(reporte.columnas, anchos);
  const separador = "-".repeat(Math.min(118, lineaCabecera.length));
  const filasTexto = reporte.filas.map((f) => formatearFilaTabla(f, anchos));
  const infoFiltro = `Periodo: ${periodoLabel} | Curso: ${cursoLabel} | Registros: ${reporte.filas.length} | Emitido: ${new Date().toLocaleDateString("es-CL")}`;
  const infoLineas = dividirLineasAncho(infoFiltro, 118);

  const FILAS_POR_PAGINA = 25;
  const paginasFilas = [];
  for (let i = 0; i < Math.max(1, filasTexto.length); i += FILAS_POR_PAGINA) {
    paginasFilas.push(filasTexto.slice(i, i + FILAS_POR_PAGINA));
  }
  const totalPaginas = paginasFilas.length;

  const pageObjNums = [];
  const contentObjNums = [];
  let nextObj = 3; // 1 = Catalog, 2 = Pages, 3/4 = Fonts
  const fontBoldId = nextObj++;
  const fontMonoId = nextObj++;

  const pageStreams = paginasFilas.map((bloqueFilas, pageIndex) => {
    const pObj = nextObj++;
    const cObj = nextObj++;
    pageObjNums.push(pObj);
    contentObjNums.push(cObj);

    const ops = [
      "BT",
      `/F1 14 Tf`,
      `40 555 Td`,
      `(${escapePdfLiteral(`Colegio Jacques Cousteau - ${reporte.titulo}`)}) Tj`,
      `/F2 8.5 Tf`,
    ];

    for (const ln of infoLineas) {
      ops.push("0 -15 Td");
      ops.push(`(${escapePdfLiteral(ln)}) Tj`);
    }

    ops.push("0 -18 Td");
    ops.push(`(${escapePdfLiteral(separador)}) Tj`);
    ops.push("0 -13 Td");
    ops.push(`(${escapePdfLiteral(lineaCabecera)}) Tj`);
    ops.push("0 -12 Td");
    ops.push(`(${escapePdfLiteral(separador)}) Tj`);

    for (const rowLine of bloqueFilas) {
      ops.push("0 -14 Td");
      ops.push(`(${escapePdfLiteral(rowLine)}) Tj`);
    }

    ops.push("0 -20 Td");
    ops.push(`(${escapePdfLiteral(separador)}) Tj`);
    ops.push("0 -14 Td");
    ops.push(`(${escapePdfLiteral(`SIGAE · Documento institucional | Pagina ${pageIndex + 1} de ${totalPaginas}`)}) Tj`);
    ops.push("ET");

    return toLatin1Bytes(ops.join("\n"));
  });

  const objetos = [];
  objetos.push({
    id: 1,
    bytes: toLatin1Bytes("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"),
  });
  objetos.push({
    id: 2,
    bytes: toLatin1Bytes(`2 0 obj\n<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(" ")}] /Count ${totalPaginas} >>\nendobj\n`),
  });
  objetos.push({
    id: fontBoldId,
    bytes: toLatin1Bytes(`${fontBoldId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`),
  });
  objetos.push({
    id: fontMonoId,
    bytes: toLatin1Bytes(`${fontMonoId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>\nendobj\n`),
  });

  for (let i = 0; i < totalPaginas; i++) {
    const pId = pageObjNums[i];
    const cId = contentObjNums[i];
    const streamBytes = pageStreams[i];

    objetos.push({
      id: pId,
      bytes: toLatin1Bytes(
        `${pId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Contents ${cId} 0 R /Resources << /Font << /F1 ${fontBoldId} 0 R /F2 ${fontMonoId} 0 R >> >> >>\nendobj\n`
      ),
    });

    const head = toLatin1Bytes(`${cId} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`);
    const tail = toLatin1Bytes("\nendstream\nendobj\n");
    objetos.push({
      id: cId,
      bytes: concatBytes([head, streamBytes, tail]),
    });
  }

  objetos.sort((a, b) => a.id - b.id);
  const header = toLatin1Bytes("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const chunks = [header];
  let cursor = header.length;
  const offsets = new Map();

  for (const obj of objetos) {
    offsets.set(obj.id, cursor);
    chunks.push(obj.bytes);
    cursor += obj.bytes.length;
  }

  const xrefPos = cursor;
  const maxId = objetos[objetos.length - 1].id;
  const xrefLines = [`xref\n0 ${maxId + 1}\n0000000000 65535 f \n`];
  for (let id = 1; id <= maxId; id++) {
    const pos = offsets.get(id) ?? 0;
    xrefLines.push(`${String(pos).padStart(10, "0")} 00000 n \n`);
  }
  xrefLines.push(`trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`);
  chunks.push(toLatin1Bytes(xrefLines.join("")));

  return concatBytes(chunks);
}
