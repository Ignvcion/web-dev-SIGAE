import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { AuthProvider } from "./pages/context/AuthContext";
import { BASE_URL } from "./services/api";

import "./index.css";

// ── GLOBAL STATEFUL MOCK STORE (RESILIENT OFFLINE & GH-PAGES DEMO) ───────────
function getInitialMaxId() {
  let max = 1000;
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem("SIGAE_MAX_ID");
      if (raw && !isNaN(Number(raw))) {
        max = Math.max(max, Number(raw));
      }
      const keys = [
        "SIGAE_ESTUDIANTES",
        "SIGAE_USUARIOS",
        "SIGAE_CURSOS",
        "SIGAE_ASIGNATURAS",
        "SIGAE_CITACIONES",
        "SIGAE_BLOQUES",
        "SIGAE_EVENTOS",
      ];
      for (const k of keys) {
        const str = window.localStorage.getItem(k);
        if (str) {
          const arr = JSON.parse(str);
          if (Array.isArray(arr)) {
            for (const item of arr) {
              if (!item || typeof item !== "object") continue;
              for (const val of Object.values(item)) {
                const num = Number(val);
                if (!isNaN(num) && Number.isInteger(num) && num > max && num < 10000000) {
                  max = num;
                }
              }
            }
          }
        }
      }
    }
  } catch { /* ignore */ }
  return max;
}

let _nextIdCounter = getInitialMaxId();

const nextId = () => {
  _nextIdCounter += 1;
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("SIGAE_MAX_ID", String(_nextIdCounter));
    }
  } catch { /* ignore */ }
  return _nextIdCounter;
};

function asegurarIdsUnicos(store, campoId, keyStorage) {
  if (!Array.isArray(store)) return;
  const vistos = new Set();
  let modificado = false;
  for (const item of store) {
    if (!item) continue;
    const val = Number(item[campoId] ?? item.id);
    if (!isNaN(val) && val > _nextIdCounter) {
      _nextIdCounter = val;
    }
  }
  for (const item of store) {
    if (!item) continue;
    const rawVal = item[campoId] !== undefined ? item[campoId] : item.id;
    const val = Number(rawVal);
    if (rawVal === undefined || rawVal === null || isNaN(val) || val <= 0 || vistos.has(val)) {
      const nuevoId = nextId();
      item[campoId] = nuevoId;
      vistos.add(nuevoId);
      modificado = true;
    } else {
      item[campoId] = val;
      vistos.add(val);
    }
  }
  if (modificado && keyStorage) {
    saveStore(keyStorage, store);
  }
}
// ── PERSISTENT STORAGE HELPERS (RETAIN MOCK STATE ACROSS REFRESHES) ─────────
function loadStore(key, fallback) {
  try {
    const raw = typeof window !== "undefined" && window.localStorage ? window.localStorage.getItem(key) : null;
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return fallback;
}

function saveStore(key, data) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(data));
    }
  } catch { /* ignore */ }
}


// 1. Usuarios e Institución
const SEED_USUARIOS = [
  {
    Usuario_Id: 1,
    Usuario_Nombre_Completo: "Esperanza Penelope Gonzales Farias",
    Usuario_RUT: "5682711-0",
    Es_Administrador: 1,
    Es_Docente: 0,
    Es_Apoderado: 0,
    Administrador_Tipo: "Super Admin",
    Administrador_Correo_Institucional: "es.gonzales@jacquescousteau.edu",
    Usuario_Correo: "es.gonzales@jacquescousteau.edu",
    Usuario_Telefono: "+56 9 8765 4321",
    Usuario_Estado_Cuenta: 1,
    Usuario_Direccion_Calle: "Av. El Bosque",
    Usuario_Direccion_Numero: "101",
    Usuario_Direccion_Depto: "Of. 402",
    Usuario_Direccion_Comuna: "Las Condes",
  },
  {
    Usuario_Id: 2,
    Usuario_Nombre_Completo: "Carlos Gonzales Farias",
    Usuario_RUT: "9343727-6",
    Es_Administrador: 1,
    Es_Docente: 0,
    Es_Apoderado: 0,
    Administrador_Tipo: "Administrador Normal",
    Administrador_Correo_Institucional: "c.gonzales@jacquescousteau.edu",
    Usuario_Correo: "c.gonzales@jacquescousteau.edu",
    Usuario_Telefono: "+56 9 1234 5678",
    Usuario_Estado_Cuenta: 1,
    Usuario_Direccion_Calle: "Av. El Bosque",
    Usuario_Direccion_Numero: "101",
    Usuario_Direccion_Depto: "Of. 402",
    Usuario_Direccion_Comuna: "Las Condes",
  },
  {
    Usuario_Id: 3,
    Usuario_Nombre_Completo: "María Morales",
    Usuario_RUT: "3483606-k",
    Es_Administrador: 0,
    Es_Docente: 1,
    Es_Apoderado: 0,
    Docente_Correo_Institucional: "m.morales@jacquescousteau.edu",
    Usuario_Correo: "m.morales@jacquescousteau.edu",
    Docente_Especialidad: "Matemáticas",
    Docente_Carga_Horaria_Maxima: 36,
    Usuario_Telefono: "+56 9 4321 8765",
    Usuario_Estado_Cuenta: 1,
    Usuario_Direccion_Calle: "Los Aromos",
    Usuario_Direccion_Numero: "450",
    Usuario_Direccion_Depto: "",
    Usuario_Direccion_Comuna: "Providencia",
  },
  {
    Usuario_Id: 4,
    Usuario_Nombre_Completo: "Pedro Fernandez",
    Usuario_RUT: "21143956-4",
    Es_Administrador: 0,
    Es_Docente: 0,
    Es_Apoderado: 1,
    Apoderado_Correo_Natural: "p.fernandez@email.cl",
    Usuario_Correo: "p.fernandez@email.cl",
    Usuario_Telefono: "+56 9 3344 5566",
    Usuario_Estado_Cuenta: 1,
    Usuario_Direccion_Calle: "Av. Las Perdices",
    Usuario_Direccion_Numero: "300",
    Usuario_Direccion_Depto: "Casa B",
    Usuario_Direccion_Comuna: "La Florida",
  },
  {
    Usuario_Id: 5,
    Usuario_Nombre_Completo: "Ana Torres",
    Usuario_RUT: "11222333-8",
    Es_Administrador: 0,
    Es_Docente: 1,
    Es_Apoderado: 0,
    Docente_Correo_Institucional: "a.torres@jacquescousteau.edu",
    Usuario_Correo: "a.torres@jacquescousteau.edu",
    Docente_Especialidad: "Lenguaje y Comunicación",
    Docente_Carga_Horaria_Maxima: 36,
    Usuario_Telefono: "+56 9 5566 7788",
    Usuario_Estado_Cuenta: 1,
    Usuario_Direccion_Calle: "San Martín",
    Usuario_Direccion_Numero: "123",
    Usuario_Direccion_Depto: "",
    Usuario_Direccion_Comuna: "Santiago",
  },
  {
    Usuario_Id: 6,
    Usuario_Nombre_Completo: "Roberto Silva",
    Usuario_RUT: "14555666-4",
    Es_Administrador: 0,
    Es_Docente: 1,
    Es_Apoderado: 0,
    Docente_Correo_Institucional: "r.silva@jacquescousteau.edu",
    Usuario_Correo: "r.silva@jacquescousteau.edu",
    Docente_Especialidad: "Ciencias Naturales",
    Docente_Carga_Horaria_Maxima: 36,
    Usuario_Telefono: "+56 9 6677 8899",
    Usuario_Estado_Cuenta: 1,
    Usuario_Direccion_Calle: "Av. Grecia",
    Usuario_Direccion_Numero: "789",
    Usuario_Direccion_Depto: "",
    Usuario_Direccion_Comuna: "Ñuñoa",
  },
  {
    Usuario_Id: 7,
    Usuario_Nombre_Completo: "Francisca Soto",
    Usuario_RUT: "16777888-2",
    Es_Administrador: 0,
    Es_Docente: 0,
    Es_Apoderado: 1,
    Apoderado_Correo_Natural: "f.soto@email.cl",
    Usuario_Correo: "f.soto@email.cl",
    Usuario_Telefono: "+56 9 7788 9900",
    Usuario_Estado_Cuenta: 0, // Inactivo para pruebas
    Usuario_Direccion_Calle: "Av. Las Perdices",
    Usuario_Direccion_Numero: "340",
    Usuario_Direccion_Depto: "",
    Usuario_Direccion_Comuna: "La Florida",
  },
  {
    Usuario_Id: 8,
    Usuario_Nombre_Completo: "Gonzalo Andres Ramos Herrera",
    Usuario_RUT: "15888999-2",
    Es_Administrador: 0,
    Es_Docente: 1,
    Es_Apoderado: 0,
    Docente_Correo_Institucional: "g.ramos@jacquescousteau.edu",
    Usuario_Correo: "g.ramos@jacquescousteau.edu",
    Docente_Especialidad: "Historia y Geografía",
    Docente_Carga_Horaria_Maxima: 36,
    Usuario_Telefono: "+56 9 7788 9900",
    Usuario_Estado_Cuenta: 0, // Inactivo para pruebas
    Usuario_Direccion_Calle: "Vicuña Mackenna",
    Usuario_Direccion_Numero: "555",
    Usuario_Direccion_Depto: "",
    Usuario_Direccion_Comuna: "La Florida",
  },
];

let STORE_USUARIOS = loadStore("SIGAE_USUARIOS", SEED_USUARIOS).map(u => {
  const seed = SEED_USUARIOS.find(s => s.Usuario_Id === u.Usuario_Id);
  return {
    ...seed,
    ...u,
    Usuario_Direccion_Calle: u.Usuario_Direccion_Calle || seed?.Usuario_Direccion_Calle || "Av. Las Perdices",
    Usuario_Direccion_Numero: u.Usuario_Direccion_Numero || seed?.Usuario_Direccion_Numero || "100",
    Usuario_Direccion_Depto: u.Usuario_Direccion_Depto || seed?.Usuario_Direccion_Depto || "",
    Usuario_Direccion_Comuna: u.Usuario_Direccion_Comuna || seed?.Usuario_Direccion_Comuna || "La Florida",
    Administrador_Correo_Institucional: u.Administrador_Correo_Institucional || seed?.Administrador_Correo_Institucional || (u.Es_Administrador ? u.Usuario_Correo : null),
    Docente_Correo_Institucional: u.Docente_Correo_Institucional || seed?.Docente_Correo_Institucional || (u.Es_Docente ? u.Usuario_Correo : null),
    Apoderado_Correo_Natural: u.Apoderado_Correo_Natural || seed?.Apoderado_Correo_Natural || (u.Es_Apoderado ? u.Usuario_Correo : null),
  };
});

// Reclasificación, consolidación y saneamiento inteligente de cuentas
let storeUsuariosModificado = false;

// 1. Purga total de cuentas corruptas o temporales generadas por bugs previos
const cantAntes = STORE_USUARIOS.length;
STORE_USUARIOS = STORE_USUARIOS.filter(u =>
  !(u.Usuario_Nombre_Completo === "Administrador Nuevo" && (u.Usuario_Correo === "admin.nuevo@jacquescousteau.edu" || u.Administrador_Correo_Institucional === "admin.nuevo@jacquescousteau.edu"))
);
if (STORE_USUARIOS.length !== cantAntes) {
  storeUsuariosModificado = true;
}

// 2. Consolidación inteligente de cuentas por RUT (un único usuario por RUT en el sistema)
const usuariosPorRut = new Map();
const usuariosUnicos = [];

for (const u of STORE_USUARIOS) {
  const normRut = (u.Usuario_RUT || "").replace(/[.\-\s]/g, "").toUpperCase();
  if (!normRut) {
    usuariosUnicos.push(u);
    continue;
  }
  if (!usuariosPorRut.has(normRut)) {
    const copia = { ...u };
    usuariosPorRut.set(normRut, copia);
    usuariosUnicos.push(copia);
  } else {
    // Si ya existía una cuenta previa con ese RUT, unificar datos y roles en la cuenta principal
    const principal = usuariosPorRut.get(normRut);
    storeUsuariosModificado = true;
    if (u.Es_Administrador) {
      principal.Es_Administrador = 1;
      principal.Administrador_Tipo = principal.Administrador_Tipo || u.Administrador_Tipo || "Administrador Normal";
      principal.Administrador_Correo_Institucional = principal.Administrador_Correo_Institucional || u.Administrador_Correo_Institucional;
    }
    if (u.Es_Docente) {
      principal.Es_Docente = 1;
      principal.Docente_Correo_Institucional = principal.Docente_Correo_Institucional || u.Docente_Correo_Institucional;
      principal.Docente_Especialidad = principal.Docente_Especialidad || u.Docente_Especialidad;
      principal.Docente_Carga_Horaria_Maxima = principal.Docente_Carga_Horaria_Maxima || u.Docente_Carga_Horaria_Maxima;
    }
    if (u.Es_Apoderado) {
      principal.Es_Apoderado = 1;
      principal.Apoderado_Correo_Natural = principal.Apoderado_Correo_Natural || u.Apoderado_Correo_Natural;
    }
    principal.Usuario_Direccion_Calle = principal.Usuario_Direccion_Calle || u.Usuario_Direccion_Calle;
    principal.Usuario_Direccion_Numero = principal.Usuario_Direccion_Numero || u.Usuario_Direccion_Numero;
    principal.Usuario_Direccion_Depto = principal.Usuario_Direccion_Depto || u.Usuario_Direccion_Depto;
    principal.Usuario_Direccion_Comuna = principal.Usuario_Direccion_Comuna || u.Usuario_Direccion_Comuna;
    principal.Usuario_Telefono = principal.Usuario_Telefono || u.Usuario_Telefono;
  }
}
STORE_USUARIOS = usuariosUnicos;

// 3. Saneamiento estricto de Usuario_Id duplicados: asegurar que CADA usuario tenga un ID numérico único
asegurarIdsUnicos(STORE_USUARIOS, "Usuario_Id", "SIGAE_USUARIOS");

if (storeUsuariosModificado) {
  saveStore("SIGAE_USUARIOS", STORE_USUARIOS);
}


// Asegurar que el docente inactivo esté presente en STORE_USUARIOS
if (!STORE_USUARIOS.some(u => u.Usuario_Id === 8)) {
  STORE_USUARIOS.push({
    Usuario_Id: 8,
    Usuario_Nombre_Completo: "Gonzalo Andres Ramos Herrera",
    Usuario_RUT: "15888999-2",
    Es_Administrador: 0,
    Es_Docente: 1,
    Es_Apoderado: 0,
    Docente_Correo_Institucional: "g.ramos@jacquescousteau.edu",
    Usuario_Correo: "g.ramos@jacquescousteau.edu",
    Docente_Especialidad: "Historia y Geografía",
    Usuario_Telefono: "+56 9 7788 9900",
    Usuario_Estado_Cuenta: 0,
  });
  saveStore("SIGAE_USUARIOS", STORE_USUARIOS);
}

// 2. Eventos Institucionales
const SEED_EVENTOS = [
  {
    Evento_Institucional_Id: 1,
    Evento_Institucional_Nombre: "Jornada Pedagógica Institucional",
    Evento_Institucional_Fecha: "2026-11-20",
    Evento_Institucional_Impacto_Clases: "Suspensión total",
    Evento_Institucional_Descripcion: "Jornada de capacitación docente y planificación semestral.",
    bloques_afectados_count: 2,
    bloques: [
      { Afecta_Id: 1, Bloque_Horario_Hora_Inicio: "08:00:00", Bloque_Horario_Hora_Fin: "08:45:00", Bloque_Horario_Jornada: "Mañana" },
      { Afecta_Id: 2, Bloque_Horario_Hora_Inicio: "08:45:00", Bloque_Horario_Hora_Fin: "09:30:00", Bloque_Horario_Jornada: "Mañana" },
    ],
    clases: [
      { Horario_Asignatura_Id: 1, curso: "1° Básico A", Curso_Nombre: "1° Básico A", asignatura: "Lenguaje y Comunicación", Asignatura_Nombre: "Lenguaje y Comunicación", docente: "Ana Torres", Docente_Nombre: "Ana Torres", hora_inicio: "08:00:00", hora_fin: "08:45:00" },
      { Horario_Asignatura_Id: 2, curso: "1° Básico A", Curso_Nombre: "1° Básico A", asignatura: "Lenguaje y Comunicación", Asignatura_Nombre: "Lenguaje y Comunicación", docente: "Ana Torres", Docente_Nombre: "Ana Torres", hora_inicio: "08:45:00", hora_fin: "09:30:00" },
    ],
    dia_semana: "Viernes",
  },
  {
    Evento_Institucional_Id: 2,
    Evento_Institucional_Nombre: "Olimpiadas Escolares Jacques Cousteau",
    Evento_Institucional_Fecha: "2026-11-27",
    Evento_Institucional_Impacto_Clases: "Suspensión jornada mañana",
    Evento_Institucional_Descripcion: "Competencias deportivas de atletismo y fútbol entre alianzas.",
    bloques_afectados_count: 3,
    bloques: [
      { Afecta_Id: 3, Bloque_Horario_Hora_Inicio: "09:45:00", Bloque_Horario_Hora_Fin: "10:30:00", Bloque_Horario_Jornada: "Mañana" },
    ],
    clases: [],
    dia_semana: "Viernes",
  },
  {
    Evento_Institucional_Id: 3,
    Evento_Institucional_Nombre: "Feria de Ciencias y Tecnología",
    Evento_Institucional_Fecha: "2026-12-04",
    Evento_Institucional_Impacto_Clases: "Salida anticipada",
    Evento_Institucional_Descripcion: "Muestra de proyectos científicos en el gimnasio del colegio.",
    bloques_afectados_count: 1,
    bloques: [],
    clases: [],
    dia_semana: "Viernes",
  },
  {
    Evento_Institucional_Id: 4,
    Evento_Institucional_Nombre: "Día del Profesor",
    Evento_Institucional_Fecha: "2026-10-16",
    Evento_Institucional_Impacto_Clases: "Suspensión total",
    Evento_Institucional_Descripcion: "Celebración y acto conmemorativo del Día del Profesor.",
    bloques_afectados_count: 0,
    bloques: [],
    clases: [],
    dia_semana: "Viernes",
  },
  {
    Evento_Institucional_Id: 5,
    Evento_Institucional_Nombre: "Aniversario del Colegio Jacques Cousteau",
    Evento_Institucional_Fecha: "2026-10-02",
    Evento_Institucional_Impacto_Clases: "Suspensión total",
    Evento_Institucional_Descripcion: "Acto solemne por el aniversario de la fundación del colegio.",
    bloques_afectados_count: 0,
    bloques: [],
    clases: [],
    dia_semana: "Viernes",
  },
];

let STORE_EVENTOS = loadStore("SIGAE_EVENTOS", SEED_EVENTOS);

// 3. Bloques Horarios Institucionales
const SEED_BLOQUES = [
  {
    Bloque_Horario_Id: 1,
    Bloque_Horario_Hora_Inicio: "08:00:00",
    Bloque_Horario_Hora_Fin: "08:45:00",
    Bloque_Horario_Jornada: "Mañana",
    Bloque_Horario_Tipo: "Clase",
    clases: 4,
    eventos: 1,
    activo: 1,
  },
  {
    Bloque_Horario_Id: 2,
    Bloque_Horario_Hora_Inicio: "08:45:00",
    Bloque_Horario_Hora_Fin: "09:30:00",
    Bloque_Horario_Jornada: "Mañana",
    Bloque_Horario_Tipo: "Clase",
    clases: 4,
    eventos: 1,
    activo: 1,
  },
  {
    Bloque_Horario_Id: 3,
    Bloque_Horario_Hora_Inicio: "09:30:00",
    Bloque_Horario_Hora_Fin: "09:45:00",
    Bloque_Horario_Jornada: "Mañana",
    Bloque_Horario_Tipo: "Recreo",
    clases: 0,
    eventos: 0,
    activo: 1,
  },
  {
    Bloque_Horario_Id: 4,
    Bloque_Horario_Hora_Inicio: "09:45:00",
    Bloque_Horario_Hora_Fin: "10:30:00",
    Bloque_Horario_Jornada: "Mañana",
    Bloque_Horario_Tipo: "Clase",
    clases: 3,
    eventos: 0,
    activo: 1,
  },
  {
    Bloque_Horario_Id: 5,
    Bloque_Horario_Hora_Inicio: "10:30:00",
    Bloque_Horario_Hora_Fin: "11:15:00",
    Bloque_Horario_Jornada: "Mañana",
    Bloque_Horario_Tipo: "Clase",
    clases: 3,
    eventos: 0,
    activo: 1,
  },
];

let STORE_BLOQUES = loadStore("SIGAE_BLOQUES", SEED_BLOQUES);

// 4. Catálogo de Asignaturas
const SEED_ASIGNATURAS = [
  { Asignatura_Id: 1, Asignatura_Nombre: "Lenguaje y Comunicación", Asignatura_Prioridad_Academica: "Alta" },
  { Asignatura_Id: 2, Asignatura_Nombre: "Matemáticas", Asignatura_Prioridad_Academica: "Alta" },
  { Asignatura_Id: 3, Asignatura_Nombre: "Ciencias Naturales", Asignatura_Prioridad_Academica: "Media" },
  { Asignatura_Id: 4, Asignatura_Nombre: "Historia y Geografía", Asignatura_Prioridad_Academica: "Media" },
  { Asignatura_Id: 5, Asignatura_Nombre: "Inglés", Asignatura_Prioridad_Academica: "Media" },
  { Asignatura_Id: 6, Asignatura_Nombre: "Educación Física", Asignatura_Prioridad_Academica: "Baja" },
  { Asignatura_Id: 7, Asignatura_Nombre: "Artes Visuales", Asignatura_Prioridad_Academica: "Baja" },
  { Asignatura_Id: 8, Asignatura_Nombre: "Música", Asignatura_Prioridad_Academica: "Baja" },
];

let STORE_ASIGNATURAS = loadStore("SIGAE_ASIGNATURAS", SEED_ASIGNATURAS);

// 4.1 Catálogo de Niveles y Planes Educativos
const SEED_PARAMETROS = {
  Parametro_Institucional_Id: 1,
  Parametro_Institucional_Nombre_Colegio: "Colegio Jacques Cousteau",
  nombre_colegio: "Colegio Jacques Cousteau",
  Parametro_Institucional_Inicio_Jornada: "08:00:00",
  Parametro_Institucional_Fin_Jornada: "16:00:00",
  Parametro_Institucional_Duracion_Bloque: 45,
  Parametro_Institucional_Duracion_Recreo: 15,
  Parametro_Institucional_Bloques_Maximos_Diarios: 8,
};
let STORE_PARAMETROS = loadStore("SIGAE_PARAMETROS", SEED_PARAMETROS);

function normHora8(h) {
  if (!h) return "";
  const [hh = "00", mm = "00", ss = "00"] = String(h).trim().split(":");
  return `${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:${ss.padStart(2, "0")}`;
}

function esHoraMockValida(h) {
  return typeof h === "string" && /^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(h.trim());
}

function bloqueEnUsoEvento(bId) {
  return (STORE_EVENTOS || []).some((ev) =>
    Array.isArray(ev.bloques) && ev.bloques.some((af) => Number(af.Bloque_Horario_Id || af.Afecta_Id || af.id) === Number(bId))
  );
}

function contarClasesActivasBloque(bId) {
  return STORE_HORARIOS.filter((h) =>
    Number(h.Bloque_Horario_Id) === Number(bId) &&
    (h.estado || h.Horario_Estado || "Activo") !== "Eliminado" &&
    h.eliminado !== 1
  ).length;
}

function enriquecerBloquesMock() {
  const pIni = normHora8(STORE_PARAMETROS?.Parametro_Institucional_Inicio_Jornada || "08:00:00");
  const pFin = normHora8(STORE_PARAMETROS?.Parametro_Institucional_Fin_Jornada || "16:00:00");

  return [...STORE_BLOQUES]
    .map((b) => {
      const hIni = normHora8(b.Bloque_Horario_Hora_Inicio || b.hora_inicio || "08:00:00");
      const hFin = normHora8(b.Bloque_Horario_Hora_Fin || b.hora_fin || "08:45:00");
      const fuera = hIni < pIni || hFin > pFin;
      const reemplazado = STORE_BLOQUES.some((r) =>
        r.Bloque_Horario_Jornada === b.Bloque_Horario_Jornada &&
        Number(r.Bloque_Horario_Id) > Number(b.Bloque_Horario_Id) &&
        normHora8(r.Bloque_Horario_Hora_Inicio) < hFin &&
        normHora8(r.Bloque_Horario_Hora_Fin) > hIni
      );
      const desajustado = fuera || reemplazado ? 1 : 0;
      const motivo_desajuste = fuera ? "Fuera de la jornada" : reemplazado ? "Bloque reemplazado" : null;
      return {
        ...b,
        Bloque_Horario_Hora_Inicio: hIni,
        Bloque_Horario_Hora_Fin: hFin,
        jornada_inicio: pIni,
        jornada_fin: pFin,
        desajustado,
        motivo_desajuste,
        clases: contarClasesActivasBloque(b.Bloque_Horario_Id),
      };
    })
    .sort((a, b) => a.Bloque_Horario_Hora_Inicio.localeCompare(b.Bloque_Horario_Hora_Inicio));
}

const NIVELES_EDUCATIVOS = [
  { Nivel_Educativo_Id: 1, Nivel_Educativo_Nombre: "1° Básico" },
  { Nivel_Educativo_Id: 2, Nivel_Educativo_Nombre: "2° Básico" },
  { Nivel_Educativo_Id: 3, Nivel_Educativo_Nombre: "3° Básico" },
  { Nivel_Educativo_Id: 4, Nivel_Educativo_Nombre: "4° Básico" },
  { Nivel_Educativo_Id: 5, Nivel_Educativo_Nombre: "5° Básico" },
  { Nivel_Educativo_Id: 6, Nivel_Educativo_Nombre: "6° Básico" },
];

function normalizarPlan(plan) {
  const asigs = Array.isArray(plan.asignaturas) ? plan.asignaturas : [];
  let totalOblig = 0;
  let totalCompl = 0;
  let totalHoras = 0;

  const asigsNormalizadas = asigs.map((a, idx) => {
    const asigInfo = STORE_ASIGNATURAS.find(as => as.Asignatura_Id === (a.Asignatura_Id || a.asignatura_id)) || {};
    const nombre = a.Asignatura_Nombre || asigInfo.Asignatura_Nombre || "Asignatura";
    const prioridad = a.Asignatura_Prioridad_Academica || asigInfo.Asignatura_Prioridad_Academica || "Media";
    const tipo = a.Tipo || a.tipo || a.Plan_Asignatura_Tipo || "Obligatorio";
    const horas = Number(a.Horas_Semanales_Requeridas ?? a.horas_semanales ?? a.Plan_Asignatura_Horas_Semanales ?? a.horas ?? 2);

    if (tipo === "Obligatorio" || tipo === "Obligatoria") totalOblig++;
    else totalCompl++;
    totalHoras += horas;

    return {
      IncluyeAsig_Id: a.IncluyeAsig_Id || idx + 1,
      Asignatura_Id: a.Asignatura_Id || a.asignatura_id || idx + 1,
      Asignatura_Nombre: nombre,
      Asignatura_Prioridad_Academica: prioridad,
      Tipo: tipo,
      tipo: tipo,
      Plan_Asignatura_Tipo: tipo,
      Horas_Semanales_Requeridas: horas,
      horas_semanales: horas,
      Plan_Asignatura_Horas_Semanales: horas,
      horas: horas,
    };
  });

  const nivelInfo = NIVELES_EDUCATIVOS.find(n => n.Nivel_Educativo_Id === Number(plan.Nivel_Educativo_Id || plan.nivel_educativo_id)) || {};
  const periodo = String(plan.Plan_Educativo_Periodo_Lectivo || plan.periodo_lectivo || plan.nuevo_periodo_lectivo || "2026");

  return {
    Plan_Educativo_Id: Number(plan.Plan_Educativo_Id || plan.id || nextId()),
    Plan_Educativo_Nombre: plan.Plan_Educativo_Nombre || `Plan ${nivelInfo.Nivel_Educativo_Nombre || "Nivel"} ${periodo}`,
    Nivel_Educativo_Id: Number(plan.Nivel_Educativo_Id || plan.nivel_educativo_id || 1),
    Nivel_Educativo_Nombre: plan.Nivel_Educativo_Nombre || nivelInfo.Nivel_Educativo_Nombre || "1° Básico",
    Plan_Educativo_Periodo_Lectivo: periodo,
    periodo_lectivo: periodo,
    total_obligatorias: totalOblig,
    total_complementarias: totalCompl,
    total_horas_semanales: totalHoras,
    total_asignaturas: asigsNormalizadas.length,
    asignaturas: asigsNormalizadas,
  };
}

const SEED_PLANES = [
  normalizarPlan({
    Plan_Educativo_Id: 1,
    Plan_Educativo_Nombre: "Plan 1° Básico 2026",
    Nivel_Educativo_Id: 1,
    Nivel_Educativo_Nombre: "1° Básico",
    Plan_Educativo_Periodo_Lectivo: "2026",
    asignaturas: [
      { Asignatura_Id: 1, Asignatura_Nombre: "Lenguaje y Comunicación", Horas_Semanales_Requeridas: 8, Asignatura_Prioridad_Academica: "Alta", Tipo: "Obligatorio" },
      { Asignatura_Id: 2, Asignatura_Nombre: "Matemáticas", Horas_Semanales_Requeridas: 8, Asignatura_Prioridad_Academica: "Alta", Tipo: "Obligatorio" },
      { Asignatura_Id: 3, Asignatura_Nombre: "Ciencias Naturales", Horas_Semanales_Requeridas: 4, Asignatura_Prioridad_Academica: "Media", Tipo: "Obligatorio" },
      { Asignatura_Id: 4, Asignatura_Nombre: "Historia y Geografía", Horas_Semanales_Requeridas: 4, Asignatura_Prioridad_Academica: "Media", Tipo: "Obligatorio" },
    ]
  })
];

let STORE_PLANES = loadStore("SIGAE_PLANES", SEED_PLANES).map(normalizarPlan);
saveStore("SIGAE_PLANES", STORE_PLANES);

// 5. Citaciones
const SEED_CITACIONES = [
  {
    Citacion_Id: 1,
    Citacion_Fecha: "2026-11-12",
    Citacion_Hora_Inicio: "10:00:00",
    Citacion_Hora_Fin: "10:45:00",
    Citacion_Tramo_Horario: "10:00 - 10:45",
    Citacion_Estado: "Confirmada",
    Citacion_Fecha_Confirmacion: "2026-11-03",
    Citacion_Motivo: "Revisión de rendimiento académico y apoyo en lenguaje.",
    Citacion_Modalidad: "Presencial",
    Estudiante_Id: 1,
    Docente_Usuario_Id: 3,
    Apoderado_Usuario_Id: 4,
    Citacion_Solicitante_Rol: "Docente",
    Estudiante_Nombre_Completo: "Lucas Mateo Fernandez Vera",
    Curso_Nombre: "1° Básico A",
    Docente_Nombre: "María Morales",
    Apoderado_Nombre: "Pedro Fernandez",
    historial: [
      { Historial_Id: 1, Historial_Fecha_Registro: "2026-11-02", Historial_Hora_Registro: "09:00:00", Accion: "Citación coordinada", Historial_Descripcion_Cambio: "Citación coordinada" },
      { Historial_Id: 11, Historial_Fecha_Registro: "2026-11-03", Historial_Hora_Registro: "10:15:00", Accion: "Confirmación de citación", Historial_Descripcion_Cambio: "Confirmación de citación" }
    ],
  },
  {
    Citacion_Id: 2,
    Citacion_Fecha: "2026-11-16",
    Citacion_Hora_Inicio: "11:30:00",
    Citacion_Hora_Fin: "12:15:00",
    Citacion_Tramo_Horario: "11:30 - 12:15",
    Citacion_Estado: "Pendiente de confirmación",
    Citacion_Motivo: "Coordinación de plan de apoyo pedagógico.",
    Citacion_Modalidad: "Online",
    Estudiante_Id: 2,
    Docente_Usuario_Id: 3,
    Apoderado_Usuario_Id: 4,
    Citacion_Solicitante_Rol: "Docente",
    Estudiante_Nombre_Completo: "Sofia Valentina Gonzalez Morales",
    Curso_Nombre: "2° Básico A",
    Docente_Nombre: "María Morales",
    Apoderado_Nombre: "Pedro Fernandez",
    historial: [
      { Historial_Id: 2, Historial_Fecha_Registro: "2026-11-04", Historial_Hora_Registro: "14:15:00", Accion: "Citación creada por docente", Historial_Descripcion_Cambio: "Citación agendada en estado Pendiente de confirmación" }
    ],
  },
  {
    Citacion_Id: 3,
    Citacion_Fecha: "2026-11-05",
    Citacion_Hora_Inicio: "08:45:00",
    Citacion_Hora_Fin: "09:30:00",
    Citacion_Tramo_Horario: "08:45 - 09:30",
    Citacion_Estado: "Confirmada",
    Citacion_Fecha_Confirmacion: "2026-10-28",
    Citacion_Motivo: "Entrevista de seguimiento primer semestre.",
    Citacion_Modalidad: "Presencial",
    Estudiante_Id: 1,
    Docente_Usuario_Id: 5,
    Apoderado_Usuario_Id: 4,
    Citacion_Solicitante_Rol: "Docente",
    Estudiante_Nombre_Completo: "Lucas Mateo Fernandez Vera",
    Curso_Nombre: "1° Básico A",
    Docente_Nombre: "Ana Torres",
    Apoderado_Nombre: "Pedro Fernandez",
    historial: [
      { Historial_Id: 3, Historial_Fecha_Registro: "2026-10-28", Historial_Hora_Registro: "11:00:00", Accion: "Confirmada por apoderado", Historial_Descripcion_Cambio: "Confirmación de citación" }
    ],
  },
];

function hoyMockISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function minutosFinCitacionMock(c) {
  const tramo = String(c?.Citacion_Tramo_Horario || "");
  const rango = /(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/.exec(tramo);
  if (rango) return Number(rango[3]) * 60 + Number(rango[4]);
  if (c?.Citacion_Hora_Fin) {
    const fin = /^(\d{1,2}):(\d{2})/.exec(String(c.Citacion_Hora_Fin));
    if (fin) return Number(fin[1]) * 60 + Number(fin[2]);
  }
  const ini = /^(\d{1,2}):(\d{2})/.exec(tramo || String(c?.Citacion_Hora_Inicio || ""));
  return ini ? Number(ini[1]) * 60 + Number(ini[2]) : null;
}

function yaPasoCitacionMock(c) {
  const fecha = String(c?.Citacion_Fecha || "").slice(0, 10);
  if (!fecha) return false;
  const hoy = hoyMockISO();
  if (fecha < hoy) return true;
  if (fecha > hoy) return false;
  const finMin = minutosFinCitacionMock(c);
  if (finMin === null) return false;
  const d = new Date();
  return finMin <= d.getHours() * 60 + d.getMinutes();
}

function getContextoUsuarioMock(urlStr) {
  let usuario = null;
  let rolActivoStorage = null;
  try {
    const storage = typeof window !== "undefined" && window.localStorage
      ? window.localStorage
      : (typeof globalThis !== "undefined" && globalThis.localStorage ? globalThis.localStorage : null);
    if (storage) {
      const rawUser = storage.getItem("usuario");
      if (rawUser) usuario = JSON.parse(rawUser);
      rolActivoStorage = storage.getItem("rolActivo");
    }
  } catch { /* ignore */ }
  const qRolMatch = String(urlStr || "").match(/[?&]rol=([^&#]+)/i);
  const rolQuery = qRolMatch ? decodeURIComponent(qRolMatch[1]) : null;
  const roles = Array.isArray(usuario?.roles) ? usuario.roles : [];
  const rol = rolQuery || rolActivoStorage || roles[0] || "";
  return {
    userId: Number(usuario?.id || usuario?.Usuario_Id || 0),
    nombre: usuario?.nombre || usuario?.Usuario_Nombre_Completo || "",
    rol,
    roles,
  };
}

function normalizarCitacionMock(c) {
  const tramo = c.Citacion_Tramo_Horario || (c.Citacion_Hora_Inicio && c.Citacion_Hora_Fin ? `${String(c.Citacion_Hora_Inicio).slice(0, 5)} - ${String(c.Citacion_Hora_Fin).slice(0, 5)}` : (c.Citacion_Hora_Inicio ? String(c.Citacion_Hora_Inicio).slice(0, 5) : ""));
  let estado = String(c.Citacion_Estado || "").trim();
  if (estado.toLowerCase() === "futura") estado = "Confirmada";
  else if (estado.toLowerCase() === "pendiente") estado = "Pendiente de confirmación";

  const docMatch = STORE_USUARIOS.find(u => (u.Usuario_Nombre_Completo || "").toLowerCase() === String(c.Docente_Nombre || "").toLowerCase());
  const docenteId = Number(c.Docente_Usuario_Id) || docMatch?.Usuario_Id || 3;

  let apoderadoId = Number(c.Apoderado_Usuario_Id);
  if (!apoderadoId) {
    let estMatch = null;
    try {
      estMatch = STORE_ESTUDIANTES.find(e => Number(e.Estudiante_Id) === Number(c.Estudiante_Id)) || null;
    } catch { /* ignore */ }
    const apoMatch = STORE_USUARIOS.find(u => (u.Usuario_Nombre_Completo || "").toLowerCase() === String(c.Apoderado_Nombre || "").toLowerCase());
    apoderadoId = Number(estMatch?.Apoderado_Usuario_Id) || apoMatch?.Usuario_Id || 4;
  }

  let solicitanteRol = c.Citacion_Solicitante_Rol;
  if (!solicitanteRol) {
    const prim = Array.isArray(c.historial) ? c.historial[0] : null;
    const desc = String(prim?.Historial_Descripcion_Cambio || "").toLowerCase();
    solicitanteRol = desc.includes("apoderado") ? "Apoderado" : "Docente";
  }

  const historialNorm = Array.isArray(c.historial)
    ? c.historial.map((h) => ({
        ...h,
        Historial_Descripcion_Cambio:
          h.Historial_Descripcion_Cambio || h.Accion || "Movimiento registrado"
      }))
    : [];

  return {
    ...c,
    Citacion_Tramo_Horario: tramo,
    Citacion_Estado: estado,
    Docente_Usuario_Id: docenteId,
    Apoderado_Usuario_Id: apoderadoId,
    Citacion_Solicitante_Rol: solicitanteRol,
    historial: historialNorm,
  };
}

function enriquecerCitacionMock(c, urlStr) {
  const norm = normalizarCitacionMock(c);
  const { userId } = getContextoUsuarioMock(urlStr);
  const esPend = String(norm.Citacion_Estado || "").startsWith("Pendiente");
  let requiere = null;
  if (esPend) {
    let ultimoMovimientoApoderado = norm.Citacion_Solicitante_Rol === "Apoderado";
    if (norm.Ultimo_Reprogramador_Id != null) {
      ultimoMovimientoApoderado =
        Number(norm.Ultimo_Reprogramador_Id) === Number(norm.Apoderado_Usuario_Id) &&
        Number(norm.Ultimo_Reprogramador_Id) !== Number(norm.Docente_Usuario_Id);
    }
    requiere = ultimoMovimientoApoderado ? "Docente" : "Apoderado";
  }
  const responsableId = requiere === "Docente" ? norm.Docente_Usuario_Id : norm.Apoderado_Usuario_Id;
  const puedeConfirmar = requiere !== null && !yaPasoCitacionMock(norm) && Number(responsableId) === Number(userId);
  const rest = { ...norm };
  delete rest.Ultimo_Reprogramador_Id;
  return {
    ...rest,
    Requiere_Confirmacion_De: requiere,
    Puede_Confirmar: puedeConfirmar,
  };
}

let STORE_CITACIONES = loadStore("SIGAE_CITACIONES", SEED_CITACIONES).map(normalizarCitacionMock);
saveStore("SIGAE_CITACIONES", STORE_CITACIONES);

// 5b. Horarios de Atención a Apoderados (RF55 / CU87–CU88, RF56 / CU89)
const SEED_HORARIOS_ATENCION = [
  { Horario_Atencion_Id: 1, Usuario_Id: 3, Horario_Atencion_Dia_Semana: "Martes", Horario_Atencion_Hora_Inicio: "15:00:00", Horario_Atencion_Hora_Fin: "16:30:00" },
  { Horario_Atencion_Id: 2, Usuario_Id: 3, Horario_Atencion_Dia_Semana: "Jueves", Horario_Atencion_Hora_Inicio: "15:00:00", Horario_Atencion_Hora_Fin: "16:30:00" },
  { Horario_Atencion_Id: 3, Usuario_Id: 5, Horario_Atencion_Dia_Semana: "Miércoles", Horario_Atencion_Hora_Inicio: "11:30:00", Horario_Atencion_Hora_Fin: "13:00:00" },
  { Horario_Atencion_Id: 4, Usuario_Id: 5, Horario_Atencion_Dia_Semana: "Viernes", Horario_Atencion_Hora_Inicio: "10:00:00", Horario_Atencion_Hora_Fin: "11:30:00" },
  { Horario_Atencion_Id: 5, Usuario_Id: 6, Horario_Atencion_Dia_Semana: "Lunes", Horario_Atencion_Hora_Inicio: "14:00:00", Horario_Atencion_Hora_Fin: "15:30:00" },
  { Horario_Atencion_Id: 6, Usuario_Id: 8, Horario_Atencion_Dia_Semana: "Miércoles", Horario_Atencion_Hora_Inicio: "09:30:00", Horario_Atencion_Hora_Fin: "11:00:00" },
];

let STORE_HORARIOS_ATENCION = loadStore("SIGAE_HORARIOS_ATENCION", SEED_HORARIOS_ATENCION).map((b) =>
  Number(b.Horario_Atencion_Id) === 1 && Number(b.Usuario_Id) === 3 && b.Horario_Atencion_Dia_Semana === "Martes" && b.Horario_Atencion_Hora_Inicio === "10:00:00"
    ? { ...b, Horario_Atencion_Hora_Inicio: "15:00:00", Horario_Atencion_Hora_Fin: "16:30:00" }
    : b
);
saveStore("SIGAE_HORARIOS_ATENCION", STORE_HORARIOS_ATENCION);

// 5c. Mensajería Interna (CU73 / RF47)
const SEED_CONVERSACIONES = [
  {
    Conversacion_Id: 1,
    Docente_Usuario_Id: 3,
    Docente_Nombre: "María Morales",
    Apoderado_Usuario_Id: 4,
    Apoderado_Nombre: "Pedro Fernandez",
    Conversacion_Estado: 1,
    Ultimo_Mensaje: "Quedamos atentos al desempeño de Lucas en Matemáticas.",
  },
];

const SEED_MENSAJES = [
  {
    Mensaje_Id: 1,
    Conversacion_Id: 1,
    Mensaje_Remitente_Rol: "Docente",
    Mensaje_Remitente_Usuario_Id: 3,
    Mensaje_Contenido: "Buenas tardes don Pedro, le escribo por el progreso de Lucas en Matemáticas.",
    Mensaje_Fecha_Envio: "2026-11-10",
    Mensaje_Hora_Envio: "10:30:00",
    Mensaje_Estado: "Leído",
  },
  {
    Mensaje_Id: 2,
    Conversacion_Id: 1,
    Mensaje_Remitente_Rol: "Apoderado",
    Mensaje_Remitente_Usuario_Id: 4,
    Mensaje_Contenido: "Muchas gracias profesora, en casa estamos reforzando las guías.",
    Mensaje_Fecha_Envio: "2026-11-10",
    Mensaje_Hora_Envio: "11:05:00",
    Mensaje_Estado: "Leído",
  },
  {
    Mensaje_Id: 3,
    Conversacion_Id: 1,
    Mensaje_Remitente_Rol: "Docente",
    Mensaje_Remitente_Usuario_Id: 3,
    Mensaje_Contenido: "Quedamos atentos al desempeño de Lucas en Matemáticas.",
    Mensaje_Fecha_Envio: "2026-11-11",
    Mensaje_Hora_Envio: "09:15:00",
    Mensaje_Estado: "No leído",
  },
];

let STORE_CONVERSACIONES = loadStore("SIGAE_CONVERSACIONES", SEED_CONVERSACIONES);
let STORE_MENSAJES = loadStore("SIGAE_MENSAJES", SEED_MENSAJES);
saveStore("SIGAE_CONVERSACIONES", STORE_CONVERSACIONES);
saveStore("SIGAE_MENSAJES", STORE_MENSAJES);

// 5d. Situación Final y Cierre de Período (RF61)
const SEED_SITUACIONES = {
  1: { valor: "Promovido", estado: "Registrado" },
};
let STORE_SITUACIONES = loadStore("SIGAE_SITUACIONES", SEED_SITUACIONES);
let STORE_PERIODO_ESTADO = loadStore("SIGAE_PERIODO_ESTADO", { vigente: "2026", siguiente: "2027", cierreIniciado: false });
saveStore("SIGAE_SITUACIONES", STORE_SITUACIONES);
saveStore("SIGAE_PERIODO_ESTADO", STORE_PERIODO_ESTADO);

// 6. Horarios de Curso y Docentes
const SEED_HORARIOS = [
  {
    Horario_Asignatura_Id: 1,
    Curso_Id: 1,
    curso: "1° Básico A",
    Curso_Nombre: "1° Básico A",
    Asignatura_Id: 1,
    asignatura: "Lenguaje y Comunicación",
    Asignatura_Nombre: "Lenguaje y Comunicación",
    Usuario_Id: 5,
    docente: "Ana Torres",
    Docente_Nombre: "Ana Torres",
    Bloque_Horario_Id: 1,
    horaInicio: "08:00:00",
    horaFin: "08:45:00",
    hora_inicio: "08:00:00",
    hora_fin: "08:45:00",
    dia: "Lunes",
    estado: "Activo",
    Horario_Estado: "Activo",
    eliminado: 0,
    observaciones: ["Clase regular de Lenguaje y Comunicación."]
  },
  {
    Horario_Asignatura_Id: 2,
    Curso_Id: 1,
    curso: "1° Básico A",
    Curso_Nombre: "1° Básico A",
    Asignatura_Id: 1,
    asignatura: "Lenguaje y Comunicación",
    Asignatura_Nombre: "Lenguaje y Comunicación",
    Usuario_Id: 5,
    docente: "Ana Torres",
    Docente_Nombre: "Ana Torres",
    Bloque_Horario_Id: 2,
    horaInicio: "08:45:00",
    horaFin: "09:30:00",
    hora_inicio: "08:45:00",
    hora_fin: "09:30:00",
    dia: "Lunes",
    estado: "Activo",
    Horario_Estado: "Activo",
    eliminado: 0,
    observaciones: ["Clase regular de Lenguaje y Comunicación."]
  },
  {
    Horario_Asignatura_Id: 3,
    Curso_Id: 1,
    curso: "1° Básico A",
    Curso_Nombre: "1° Básico A",
    Asignatura_Id: 2,
    asignatura: "Matemáticas",
    Asignatura_Nombre: "Matemáticas",
    Usuario_Id: 3,
    docente: "María Morales",
    Docente_Nombre: "María Morales",
    Bloque_Horario_Id: 4,
    horaInicio: "09:45:00",
    horaFin: "10:30:00",
    hora_inicio: "09:45:00",
    hora_fin: "10:30:00",
    dia: "Martes",
    estado: "Activo",
    Horario_Estado: "Activo",
    eliminado: 0,
    observaciones: ["Clase regular de Matemáticas."]
  },
  {
    Horario_Asignatura_Id: 4,
    Curso_Id: 1,
    curso: "1° Básico A",
    Curso_Nombre: "1° Básico A",
    Asignatura_Id: 2,
    asignatura: "Matemáticas",
    Asignatura_Nombre: "Matemáticas",
    Usuario_Id: 3,
    docente: "María Morales",
    Docente_Nombre: "María Morales",
    Bloque_Horario_Id: 5,
    horaInicio: "10:30:00",
    horaFin: "11:15:00",
    hora_inicio: "10:30:00",
    hora_fin: "11:15:00",
    dia: "Martes",
    estado: "Activo",
    Horario_Estado: "Activo",
    eliminado: 0,
    observaciones: ["Clase regular de Matemáticas."]
  },
  {
    Horario_Asignatura_Id: 5,
    Curso_Id: 1,
    curso: "1° Básico A",
    Curso_Nombre: "1° Básico A",
    Asignatura_Id: 3,
    asignatura: "Ciencias Naturales",
    Asignatura_Nombre: "Ciencias Naturales",
    Usuario_Id: 6,
    docente: "Roberto Silva",
    Docente_Nombre: "Roberto Silva",
    Bloque_Horario_Id: 5,
    horaInicio: "10:30:00",
    horaFin: "11:15:00",
    hora_inicio: "10:30:00",
    hora_fin: "11:15:00",
    dia: "Miércoles",
    estado: "Activo",
    Horario_Estado: "Activo",
    eliminado: 0,
    observaciones: ["Clase regular de Ciencias Naturales."]
  },
  {
    Horario_Asignatura_Id: 6,
    Curso_Id: 1,
    curso: "1° Básico A",
    Curso_Nombre: "1° Básico A",
    Asignatura_Id: 2,
    asignatura: "Matemáticas",
    Asignatura_Nombre: "Matemáticas",
    Usuario_Id: 3,
    docente: "María Morales",
    Docente_Nombre: "María Morales",
    Bloque_Horario_Id: 1,
    horaInicio: "08:00:00",
    horaFin: "08:45:00",
    hora_inicio: "08:00:00",
    hora_fin: "08:45:00",
    dia: "Jueves",
    estado: "Activo",
    Horario_Estado: "Activo",
    eliminado: 0,
    observaciones: ["Clase regular de Matemáticas."]
  },
  {
    Horario_Asignatura_Id: 7,
    Curso_Id: 1,
    curso: "1° Básico A",
    Curso_Nombre: "1° Básico A",
    Asignatura_Id: 2,
    asignatura: "Matemáticas",
    Asignatura_Nombre: "Matemáticas",
    Usuario_Id: 3,
    docente: "María Morales",
    Docente_Nombre: "María Morales",
    Bloque_Horario_Id: 2,
    horaInicio: "08:45:00",
    horaFin: "09:30:00",
    hora_inicio: "08:45:00",
    hora_fin: "09:30:00",
    dia: "Jueves",
    estado: "Activo",
    Horario_Estado: "Activo",
    eliminado: 0,
    observaciones: ["Clase regular de Matemáticas."]
  },
  {
    Horario_Asignatura_Id: 8,
    Curso_Id: 1,
    curso: "1° Básico A",
    Curso_Nombre: "1° Básico A",
    Asignatura_Id: 2,
    asignatura: "Matemáticas",
    Asignatura_Nombre: "Matemáticas",
    Usuario_Id: 3,
    docente: "María Morales",
    Docente_Nombre: "María Morales",
    Bloque_Horario_Id: 4,
    horaInicio: "09:45:00",
    horaFin: "10:30:00",
    hora_inicio: "09:45:00",
    hora_fin: "10:30:00",
    dia: "Viernes",
    estado: "Activo",
    Horario_Estado: "Activo",
    eliminado: 0,
    observaciones: ["Clase regular de Matemáticas."]
  },
  {
    Horario_Asignatura_Id: 9,
    Curso_Id: 1,
    curso: "1° Básico A",
    Curso_Nombre: "1° Básico A",
    Asignatura_Id: 1,
    asignatura: "Lenguaje y Comunicación",
    Asignatura_Nombre: "Lenguaje y Comunicación",
    Usuario_Id: 5,
    docente: "Ana Torres",
    Docente_Nombre: "Ana Torres",
    Bloque_Horario_Id: 1,
    horaInicio: "08:00:00",
    horaFin: "08:45:00",
    hora_inicio: "08:00:00",
    hora_fin: "08:45:00",
    dia: "Miércoles",
    estado: "Activo",
    Horario_Estado: "Activo",
    eliminado: 0,
    observaciones: ["Clase regular de Lenguaje y Comunicación."]
  },
  {
    Horario_Asignatura_Id: 10,
    Curso_Id: 1,
    curso: "1° Básico A",
    Curso_Nombre: "1° Básico A",
    Asignatura_Id: 1,
    asignatura: "Lenguaje y Comunicación",
    Asignatura_Nombre: "Lenguaje y Comunicación",
    Usuario_Id: 5,
    docente: "Ana Torres",
    Docente_Nombre: "Ana Torres",
    Bloque_Horario_Id: 2,
    horaInicio: "08:45:00",
    horaFin: "09:30:00",
    hora_inicio: "08:45:00",
    hora_fin: "09:30:00",
    dia: "Miércoles",
    estado: "Activo",
    Horario_Estado: "Activo",
    eliminado: 0,
    observaciones: ["Clase regular de Lenguaje y Comunicación."]
  },
  {
    Horario_Asignatura_Id: 11,
    Curso_Id: 1,
    curso: "1° Básico A",
    Curso_Nombre: "1° Básico A",
    Asignatura_Id: 3,
    asignatura: "Ciencias Naturales",
    Asignatura_Nombre: "Ciencias Naturales",
    Usuario_Id: 6,
    docente: "Roberto Silva",
    Docente_Nombre: "Roberto Silva",
    Bloque_Horario_Id: 5,
    horaInicio: "10:30:00",
    horaFin: "11:15:00",
    hora_inicio: "10:30:00",
    hora_fin: "11:15:00",
    dia: "Lunes",
    estado: "Activo",
    Horario_Estado: "Activo",
    eliminado: 0,
    observaciones: ["Clase regular de Ciencias Naturales."]
  },
  {
    Horario_Asignatura_Id: 12,
    Curso_Id: 1,
    curso: "1° Básico A",
    Curso_Nombre: "1° Básico A",
    Asignatura_Id: 3,
    asignatura: "Ciencias Naturales",
    Asignatura_Nombre: "Ciencias Naturales",
    Usuario_Id: 6,
    docente: "Roberto Silva",
    Docente_Nombre: "Roberto Silva",
    Bloque_Horario_Id: 5,
    horaInicio: "10:30:00",
    horaFin: "11:15:00",
    hora_inicio: "10:30:00",
    hora_fin: "11:15:00",
    dia: "Jueves",
    estado: "Activo",
    Horario_Estado: "Activo",
    eliminado: 0,
    observaciones: ["Clase regular de Ciencias Naturales."]
  },
  {
    Horario_Asignatura_Id: 13,
    Curso_Id: 1,
    curso: "1° Básico A",
    Curso_Nombre: "1° Básico A",
    Asignatura_Id: 1,
    asignatura: "Lenguaje y Comunicación",
    Asignatura_Nombre: "Lenguaje y Comunicación",
    Usuario_Id: 5,
    docente: "Ana Torres",
    Docente_Nombre: "Ana Torres",
    Bloque_Horario_Id: 1,
    horaInicio: "08:00:00",
    horaFin: "08:45:00",
    hora_inicio: "08:00:00",
    hora_fin: "08:45:00",
    dia: "Viernes",
    jornada: "Mañana",
    estado: "Activo",
    Horario_Estado: "Activo",
    eliminado: 0,
    observaciones: ["Clase regular de Lenguaje y Comunicación."]
  },
  {
    Horario_Asignatura_Id: 14,
    Curso_Id: 6,
    curso: "6° Básico A",
    Curso_Nombre: "6° Básico A",
    Asignatura_Id: 4,
    asignatura: "Historia y Geografía",
    Asignatura_Nombre: "Historia y Geografía",
    Usuario_Id: 8,
    docente: "Gonzalo Andres Ramos Herrera",
    Docente_Nombre: "Gonzalo Andres Ramos Herrera",
    Bloque_Horario_Id: 1,
    horaInicio: "08:00:00",
    horaFin: "08:45:00",
    hora_inicio: "08:00:00",
    hora_fin: "08:45:00",
    dia: "Lunes",
    jornada: "Mañana",
    estado: "Activo",
    Horario_Estado: "Activo",
    eliminado: 0,
    observaciones: ["Clase regular de Historia y Geografía."]
  },
  {
    Horario_Asignatura_Id: 15,
    Curso_Id: 6,
    curso: "6° Básico A",
    Curso_Nombre: "6° Básico A",
    Asignatura_Id: 4,
    asignatura: "Historia y Geografía",
    Asignatura_Nombre: "Historia y Geografía",
    Usuario_Id: 8,
    docente: "Gonzalo Andres Ramos Herrera",
    Docente_Nombre: "Gonzalo Andres Ramos Herrera",
    Bloque_Horario_Id: 2,
    horaInicio: "08:45:00",
    horaFin: "09:30:00",
    hora_inicio: "08:45:00",
    hora_fin: "09:30:00",
    dia: "Lunes",
    jornada: "Mañana",
    estado: "Activo",
    Horario_Estado: "Activo",
    eliminado: 0,
    observaciones: ["Clase regular de Historia y Geografía."]
  },
  {
    Horario_Asignatura_Id: 16,
    Curso_Id: 6,
    curso: "6° Básico A",
    Curso_Nombre: "6° Básico A",
    Asignatura_Id: 1,
    asignatura: "Lenguaje y Comunicación",
    Asignatura_Nombre: "Lenguaje y Comunicación",
    Usuario_Id: 5,
    docente: "Ana Torres",
    Docente_Nombre: "Ana Torres",
    Bloque_Horario_Id: 4,
    horaInicio: "09:45:00",
    horaFin: "10:30:00",
    hora_inicio: "09:45:00",
    hora_fin: "10:30:00",
    dia: "Martes",
    jornada: "Mañana",
    estado: "Activo",
    Horario_Estado: "Activo",
    eliminado: 0,
    observaciones: ["Clase regular de Lenguaje y Comunicación."]
  },
  {
    Horario_Asignatura_Id: 17,
    Curso_Id: 6,
    curso: "6° Básico A",
    Curso_Nombre: "6° Básico A",
    Asignatura_Id: 2,
    asignatura: "Matemáticas",
    Asignatura_Nombre: "Matemáticas",
    Usuario_Id: 3,
    docente: "María Morales",
    Docente_Nombre: "María Morales",
    Bloque_Horario_Id: 1,
    horaInicio: "08:00:00",
    horaFin: "08:45:00",
    hora_inicio: "08:00:00",
    hora_fin: "08:45:00",
    dia: "Miércoles",
    jornada: "Mañana",
    estado: "Activo",
    Horario_Estado: "Activo",
    eliminado: 0,
    observaciones: ["Clase regular de Matemáticas."]
  },
  {
    Horario_Asignatura_Id: 18,
    Curso_Id: 6,
    curso: "6° Básico A",
    Curso_Nombre: "6° Básico A",
    Asignatura_Id: 4,
    asignatura: "Historia y Geografía",
    Asignatura_Nombre: "Historia y Geografía",
    Usuario_Id: 8,
    docente: "Gonzalo Andres Ramos Herrera",
    Docente_Nombre: "Gonzalo Andres Ramos Herrera",
    Bloque_Horario_Id: 5,
    horaInicio: "10:30:00",
    horaFin: "11:15:00",
    hora_inicio: "10:30:00",
    hora_fin: "11:15:00",
    dia: "Jueves",
    jornada: "Mañana",
    estado: "Activo",
    Horario_Estado: "Activo",
    eliminado: 0,
    observaciones: ["Clase regular de Historia y Geografía."]
  },
  {
    Horario_Asignatura_Id: 19,
    Curso_Id: 6,
    curso: "6° Básico A",
    Curso_Nombre: "6° Básico A",
    Asignatura_Id: 3,
    asignatura: "Ciencias Naturales",
    Asignatura_Nombre: "Ciencias Naturales",
    Usuario_Id: 6,
    docente: "Roberto Silva",
    Docente_Nombre: "Roberto Silva",
    Bloque_Horario_Id: 4,
    horaInicio: "09:45:00",
    horaFin: "10:30:00",
    hora_inicio: "09:45:00",
    hora_fin: "10:30:00",
    dia: "Viernes",
    jornada: "Mañana",
    estado: "Activo",
    Horario_Estado: "Activo",
    eliminado: 0,
    observaciones: ["Clase regular de Ciencias Naturales."]
  },
];

let STORE_HORARIOS = loadStore("SIGAE_HORARIOS", SEED_HORARIOS);
if (!Array.isArray(STORE_HORARIOS) || STORE_HORARIOS.length < SEED_HORARIOS.length || !STORE_HORARIOS[0]?.horaInicio || !STORE_HORARIOS.some(h => Number(h.Curso_Id) === 6)) {
  STORE_HORARIOS = SEED_HORARIOS;
  saveStore("SIGAE_HORARIOS", STORE_HORARIOS);
}

// 7. Cursos Institucionales
function normalizarCurso(curso) {
  const nId = Number(curso?.Nivel_Educativo_Id || curso?.nivel_educativo_id || 1);
  const nivelInfo = NIVELES_EDUCATIVOS.find(n => n.Nivel_Educativo_Id === nId) || {};
  const nivelNombre = curso?.Nivel_Educativo_Nombre || nivelInfo.Nivel_Educativo_Nombre || (nId + "° Básico");

  let seccion = (curso?.Curso_Seccion || curso?.seccion || "").trim().toUpperCase();
  if (!seccion && curso?.Curso_Nombre) {
    const parts = curso.Curso_Nombre.trim().split(" ");
    const lastPart = parts[parts.length - 1];
    if (lastPart.length === 1 && /[A-Z]/i.test(lastPart)) {
      seccion = lastPart.toUpperCase();
    }
  }
  if (!seccion) seccion = "A";

  const periodo = String(curso?.Curso_Periodo_Lectivo || curso?.periodo || "2026").trim();
  const nombre = curso?.Curso_Nombre || `${nivelNombre} ${seccion}`;
  const cId = Number(curso?.Curso_Id || curso?.id || nextId());

  let profeJefeNombre = curso?.Profesor_Jefe_Nombre || null;
  let profeJefeId = curso?.Profesor_Jefe_Id ? Number(curso.Profesor_Jefe_Id) : null;
  if (!profeJefeNombre && profeJefeId) {
    profeJefeNombre = STORE_USUARIOS.find(u => u.Usuario_Id === profeJefeId)?.Usuario_Nombre_Completo || null;
  }
  if (!profeJefeNombre && !profeJefeId && cId === 1) {
    profeJefeId = 3;
    profeJefeNombre = "María Morales";
  }

  const defaultAsignaturas = [
    { tieneasig_Id: 1, Asignatura_Id: 1, Asignatura_Nombre: "Lenguaje y Comunicación", Asignatura_Prioridad_Academica: "Alta", Estado_Asignacion: "Activa" },
    { tieneasig_Id: 2, Asignatura_Id: 2, Asignatura_Nombre: "Matemáticas", Asignatura_Prioridad_Academica: "Alta", Estado_Asignacion: "Activa" },
    { tieneasig_Id: 3, Asignatura_Id: 3, Asignatura_Nombre: "Ciencias Naturales", Asignatura_Prioridad_Academica: "Media", Estado_Asignacion: "Activa" },
    { tieneasig_Id: 4, Asignatura_Id: 4, Asignatura_Nombre: "Historia y Geografía", Asignatura_Prioridad_Academica: "Media", Estado_Asignacion: "Activa" },
  ];

  const asignaturas = (Array.isArray(curso?.asignaturas) && curso.asignaturas.length > 0)
    ? curso.asignaturas
    : defaultAsignaturas;

  const totalActivas = curso?.Total_Asignaturas_Activas !== undefined
    ? Number(curso.Total_Asignaturas_Activas)
    : asignaturas.filter(a => a.Estado_Asignacion === "Activa" || a.estado === "Activa").length;

  return {
    Curso_Id: cId,
    id: cId,
    Curso_Nombre: nombre,
    curso: nombre,
    Nivel_Educativo_Id: nId,
    nivel_educativo_id: nId,
    Nivel_Educativo_Nombre: nivelNombre,
    Curso_Seccion: seccion,
    seccion: seccion,
    Curso_Periodo_Lectivo: periodo,
    periodo: periodo,
    Cupo_Maximo: Number(curso?.Cupo_Maximo || 35),
    Jornada: curso?.Jornada || "Mañana",
    Profesor_Jefe_Id: profeJefeId,
    Profesor_Jefe_Nombre: profeJefeNombre,
    Total_Asignaturas_Activas: totalActivas,
    asignaturas: asignaturas
  };
}

const SEED_CURSOS = [
  { Curso_Id: 1, Curso_Nombre: "1° Básico A", curso: "1° Básico A", Nivel_Educativo_Id: 1, Nivel_Educativo_Nombre: "1° Básico", Curso_Seccion: "A", seccion: "A", Curso_Periodo_Lectivo: "2026", periodo: "2026", Cupo_Maximo: 35, Jornada: "Mañana", Profesor_Jefe_Id: 3, Profesor_Jefe_Nombre: "María Morales" },
  { Curso_Id: 2, Curso_Nombre: "2° Básico A", curso: "2° Básico A", Nivel_Educativo_Id: 2, Nivel_Educativo_Nombre: "2° Básico", Curso_Seccion: "A", seccion: "A", Curso_Periodo_Lectivo: "2026", periodo: "2026", Cupo_Maximo: 35, Jornada: "Mañana" },
  { Curso_Id: 3, Curso_Nombre: "3° Básico A", curso: "3° Básico A", Nivel_Educativo_Id: 3, Nivel_Educativo_Nombre: "3° Básico", Curso_Seccion: "A", seccion: "A", Curso_Periodo_Lectivo: "2026", periodo: "2026", Cupo_Maximo: 35, Jornada: "Mañana" },
  { Curso_Id: 4, Curso_Nombre: "4° Básico A", curso: "4° Básico A", Nivel_Educativo_Id: 4, Nivel_Educativo_Nombre: "4° Básico", Curso_Seccion: "A", seccion: "A", Curso_Periodo_Lectivo: "2026", periodo: "2026", Cupo_Maximo: 35, Jornada: "Mañana" },
  { Curso_Id: 5, Curso_Nombre: "5° Básico A", curso: "5° Básico A", Nivel_Educativo_Id: 5, Nivel_Educativo_Nombre: "5° Básico", Curso_Seccion: "A", seccion: "A", Curso_Periodo_Lectivo: "2026", periodo: "2026", Cupo_Maximo: 35, Jornada: "Mañana" },
  { Curso_Id: 6, Curso_Nombre: "6° Básico A", curso: "6° Básico A", Nivel_Educativo_Id: 6, Nivel_Educativo_Nombre: "6° Básico", Curso_Seccion: "A", seccion: "A", Curso_Periodo_Lectivo: "2026", periodo: "2026", Cupo_Maximo: 35, Jornada: "Mañana" },
];

let STORE_CURSOS = loadStore("SIGAE_CURSOS", SEED_CURSOS).map(normalizarCurso);
saveStore("SIGAE_CURSOS", STORE_CURSOS);

// 8. Estudiantes (24 estudiantes base vinculados a cursos y apoderados)
const SEED_ESTUDIANTES = [
  {
    "Estudiante_Id": 1,
    "Estudiante_Nombre_Completo": "Lucas Mateo Fernandez Vera",
    "Estudiante_RUT": "24111222-3",
    "Curso_Id": 1,
    "Curso_Nombre": "1° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "100",
    "Estudiante_Direccion_Depto": "Dept 1",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "100",
    "depto": "Dept 1",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Pedro Fernandez",
    "Apoderado_Usuario_Id": 4,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 2,
    "Estudiante_Nombre_Completo": "Sofia Valentina Gonzalez Morales",
    "Estudiante_RUT": "25222333-1",
    "Curso_Id": 2,
    "Curso_Nombre": "2° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "115",
    "Estudiante_Direccion_Depto": "",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "115",
    "depto": "",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Pedro Fernandez",
    "Apoderado_Usuario_Id": 4,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 3,
    "Estudiante_Nombre_Completo": "Benjamin Alonso Castro Rojas",
    "Estudiante_RUT": "24333444-5",
    "Curso_Id": 3,
    "Curso_Nombre": "3° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "130",
    "Estudiante_Direccion_Depto": "",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "130",
    "depto": "",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Francisca Soto",
    "Apoderado_Usuario_Id": 7,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 4,
    "Estudiante_Nombre_Completo": "Martina Isidora Silva Munoz",
    "Estudiante_RUT": "24444555-7",
    "Curso_Id": 4,
    "Curso_Nombre": "4° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "145",
    "Estudiante_Direccion_Depto": "Dept 4",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "145",
    "depto": "Dept 4",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Sin asignar",
    "Apoderado_Usuario_Id": null,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 5,
    "Estudiante_Nombre_Completo": "Mateo Nicolas Torres Tapia",
    "Estudiante_RUT": "24555666-9",
    "Curso_Id": 5,
    "Curso_Nombre": "5° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "160",
    "Estudiante_Direccion_Depto": "",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "160",
    "depto": "",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Francisca Soto",
    "Apoderado_Usuario_Id": 7,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 6,
    "Estudiante_Nombre_Completo": "Florencia Paz Morales Araya",
    "Estudiante_RUT": "25666777-2",
    "Curso_Id": 6,
    "Curso_Nombre": "6° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "175",
    "Estudiante_Direccion_Depto": "",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "175",
    "depto": "",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Sin asignar",
    "Apoderado_Usuario_Id": null,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 7,
    "Estudiante_Nombre_Completo": "Joaquin Andres Herrera Diaz",
    "Estudiante_RUT": "24777888-4",
    "Curso_Id": 1,
    "Curso_Nombre": "1° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "190",
    "Estudiante_Direccion_Depto": "Dept 7",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "190",
    "depto": "Dept 7",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Francisca Soto",
    "Apoderado_Usuario_Id": 7,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 8,
    "Estudiante_Nombre_Completo": "Isidora Belen Espinoza Perez",
    "Estudiante_RUT": "25888999-6",
    "Curso_Id": 2,
    "Curso_Nombre": "2° Básico A",
    "Estudiante_Estado_Academico": "Irregular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "205",
    "Estudiante_Direccion_Depto": "",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "205",
    "depto": "",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Sin asignar",
    "Apoderado_Usuario_Id": null,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 9,
    "Estudiante_Nombre_Completo": "Tomas Ignacio Alvarez Soto",
    "Estudiante_RUT": "24999000-8",
    "Curso_Id": 3,
    "Curso_Nombre": "3° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "220",
    "Estudiante_Direccion_Depto": "",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "220",
    "depto": "",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Francisca Soto",
    "Apoderado_Usuario_Id": 7,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 10,
    "Estudiante_Nombre_Completo": "Agustina Javiera Sepulveda Contreras",
    "Estudiante_RUT": "25000111-0",
    "Curso_Id": 4,
    "Curso_Nombre": "4° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "235",
    "Estudiante_Direccion_Depto": "Dept 10",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "235",
    "depto": "Dept 10",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Sin asignar",
    "Apoderado_Usuario_Id": null,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 11,
    "Estudiante_Nombre_Completo": "Vicente Emilio Carrasco Lopez",
    "Estudiante_RUT": "24123456-7",
    "Curso_Id": 5,
    "Curso_Nombre": "5° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "250",
    "Estudiante_Direccion_Depto": "",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "250",
    "depto": "",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Francisca Soto",
    "Apoderado_Usuario_Id": 7,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 12,
    "Estudiante_Nombre_Completo": "Emilia Sofia Fuentes Valenzuela",
    "Estudiante_RUT": "25234567-8",
    "Curso_Id": 6,
    "Curso_Nombre": "6° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "265",
    "Estudiante_Direccion_Depto": "",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "265",
    "depto": "",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Sin asignar",
    "Apoderado_Usuario_Id": null,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 13,
    "Estudiante_Nombre_Completo": "Maximiliano David Reyes Parra",
    "Estudiante_RUT": "24345678-9",
    "Curso_Id": 1,
    "Curso_Nombre": "1° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "280",
    "Estudiante_Direccion_Depto": "Dept 13",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "280",
    "depto": "Dept 13",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Francisca Soto",
    "Apoderado_Usuario_Id": 7,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 14,
    "Estudiante_Nombre_Completo": "Antonella Millaray Bravo Sandoval",
    "Estudiante_RUT": "25456789-0",
    "Curso_Id": 2,
    "Curso_Nombre": "2° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "295",
    "Estudiante_Direccion_Depto": "",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "295",
    "depto": "",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Sin asignar",
    "Apoderado_Usuario_Id": null,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 15,
    "Estudiante_Nombre_Completo": "Felipe Ignacio Nunez Gutierrez",
    "Estudiante_RUT": "24567890-1",
    "Curso_Id": 3,
    "Curso_Nombre": "3° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "310",
    "Estudiante_Direccion_Depto": "",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "310",
    "depto": "",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Francisca Soto",
    "Apoderado_Usuario_Id": 7,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 16,
    "Estudiante_Nombre_Completo": "Catalina Andrea Molina Vergara",
    "Estudiante_RUT": "25678901-2",
    "Curso_Id": 4,
    "Curso_Nombre": "4° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "325",
    "Estudiante_Direccion_Depto": "Dept 16",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "325",
    "depto": "Dept 16",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Sin asignar",
    "Apoderado_Usuario_Id": null,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 17,
    "Estudiante_Nombre_Completo": "Cristobal Alexis Vega Romero",
    "Estudiante_RUT": "24789012-3",
    "Curso_Id": 5,
    "Curso_Nombre": "5° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "340",
    "Estudiante_Direccion_Depto": "",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "340",
    "depto": "",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Francisca Soto",
    "Apoderado_Usuario_Id": 7,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 18,
    "Estudiante_Nombre_Completo": "Constanza Leonor Campos Pinto",
    "Estudiante_RUT": "25890123-4",
    "Curso_Id": 6,
    "Curso_Nombre": "6° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "355",
    "Estudiante_Direccion_Depto": "",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "355",
    "depto": "",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Sin asignar",
    "Apoderado_Usuario_Id": null,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 19,
    "Estudiante_Nombre_Completo": "Alonso Gabriel Castillo Figueroa",
    "Estudiante_RUT": "24901234-5",
    "Curso_Id": 1,
    "Curso_Nombre": "1° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "370",
    "Estudiante_Direccion_Depto": "Dept 19",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "370",
    "depto": "Dept 19",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Francisca Soto",
    "Apoderado_Usuario_Id": 7,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 20,
    "Estudiante_Nombre_Completo": "Francisca Ignacia Cortes Gallardo",
    "Estudiante_RUT": "25012345-6",
    "Curso_Id": 2,
    "Curso_Nombre": "2° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "385",
    "Estudiante_Direccion_Depto": "",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "385",
    "depto": "",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Sin asignar",
    "Apoderado_Usuario_Id": null,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 21,
    "Estudiante_Nombre_Completo": "Martin Eduardo Garrido Ortiz",
    "Estudiante_RUT": "24135790-2",
    "Curso_Id": 3,
    "Curso_Nombre": "3° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "400",
    "Estudiante_Direccion_Depto": "",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "400",
    "depto": "",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Francisca Soto",
    "Apoderado_Usuario_Id": 7,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 22,
    "Estudiante_Nombre_Completo": "Javiera Paz Medina Delgado",
    "Estudiante_RUT": "25246801-3",
    "Curso_Id": 4,
    "Curso_Nombre": "4° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "415",
    "Estudiante_Direccion_Depto": "Dept 22",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "415",
    "depto": "Dept 22",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Sin asignar",
    "Apoderado_Usuario_Id": null,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 23,
    "Estudiante_Nombre_Completo": "Diego Alejandro Riquelme Cardenas",
    "Estudiante_RUT": "24357912-4",
    "Curso_Id": 5,
    "Curso_Nombre": "5° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "430",
    "Estudiante_Direccion_Depto": "",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "430",
    "depto": "",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Francisca Soto",
    "Apoderado_Usuario_Id": 7,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  },
  {
    "Estudiante_Id": 24,
    "Estudiante_Nombre_Completo": "Valentina Rocio Sanchez Miranda",
    "Estudiante_RUT": "25468023-5",
    "Curso_Id": 6,
    "Curso_Nombre": "6° Básico A",
    "Estudiante_Estado_Academico": "Regular",
    "Estudiante_Direccion_Calle": "Av. Las Perdices",
    "Estudiante_Direccion_Numero": "445",
    "Estudiante_Direccion_Depto": "",
    "Estudiante_Direccion_Comuna": "La Florida",
    "calle": "Av. Las Perdices",
    "numero": "445",
    "depto": "",
    "comuna": "La Florida",
    "Apoderado_Nombre": "Sin asignar",
    "Apoderado_Usuario_Id": null,
    "Usuario_Telefono": "+56 9 3344 5566",
    "Usuario_Correo": "apoderado@email.cl"
  }
];
function normalizarEstudiante(e) {
  if (!e) return e;
  const calle = e.Estudiante_Calle || e.Estudiante_Direccion_Calle || e.calle || "";
  const numero = e.Estudiante_Numero || e.Estudiante_Direccion_Numero || e.numero || "";
  const depto = e.Estudiante_Depto || e.Estudiante_Direccion_Depto || e.depto || "";
  const comuna = e.Estudiante_Comuna || e.Estudiante_Direccion_Comuna || e.comuna || "";

  return {
    ...e,
    Estudiante_Calle: calle,
    Estudiante_Numero: numero,
    Estudiante_Depto: depto,
    Estudiante_Comuna: comuna,
    Estudiante_Direccion_Calle: calle,
    Estudiante_Direccion_Numero: numero,
    Estudiante_Direccion_Depto: depto,
    Estudiante_Direccion_Comuna: comuna,
    calle,
    numero,
    depto,
    comuna,
  };
}

let STORE_ESTUDIANTES = loadStore("SIGAE_ESTUDIANTES", SEED_ESTUDIANTES).map(normalizarEstudiante);
saveStore("SIGAE_ESTUDIANTES", STORE_ESTUDIANTES);

// Saneamiento de IDs y sincronización del contador atómico en todos los almacenes locales
asegurarIdsUnicos(STORE_USUARIOS, "Usuario_Id", "SIGAE_USUARIOS");
asegurarIdsUnicos(STORE_ESTUDIANTES, "Estudiante_Id", "SIGAE_ESTUDIANTES");
asegurarIdsUnicos(STORE_CURSOS, "Curso_Id", "SIGAE_CURSOS");
asegurarIdsUnicos(STORE_ASIGNATURAS, "Asignatura_Id", "SIGAE_ASIGNATURAS");
asegurarIdsUnicos(STORE_PLANES, "Plan_Educativo_Id", "SIGAE_PLANES");
asegurarIdsUnicos(STORE_BLOQUES, "Bloque_Horario_Id", "SIGAE_BLOQUES");
asegurarIdsUnicos(STORE_CITACIONES, "Citacion_Id", "SIGAE_CITACIONES");
asegurarIdsUnicos(STORE_CONVERSACIONES, "Conversacion_Id", "SIGAE_CONVERSACIONES");
asegurarIdsUnicos(STORE_MENSAJES, "Mensaje_Id", "SIGAE_MENSAJES");
asegurarIdsUnicos(STORE_EVENTOS, "Evento_Institucional_Id", "SIGAE_EVENTOS");
asegurarIdsUnicos(STORE_HORARIOS_ATENCION, "Horario_Atencion_Id", "SIGAE_HORARIOS_ATENCION");

try {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem("SIGAE_MAX_ID", String(_nextIdCounter));
  }
} catch { /* ignore */ }

// Helper para extraer ID numérico de URL
function parseUrlId(url) {
  const m = String(url).match(/\/(\d+)(?:[/?#]|$)/);
  return m ? Number(m[1]) : null;
}

// Interceptor Mock Inteligente y Reactivo
function getMockResponseForUrl(urlStr, method = "GET", reqBody = null) {
  const p = (urlStr || "").toLowerCase();
  const m = (method || "GET").toUpperCase();
  const reqId = parseUrlId(urlStr);

  let b = null;
  if (reqBody) {
    try {
      b = typeof reqBody === "string" ? JSON.parse(reqBody) : reqBody;
    } catch { /* ignore */ }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 1. MUTACIONES (POST, PUT, PATCH, DELETE) CON PERSISTENCIA LOCAL
  // ═════════════════════════════════════════════════════════════════════════
  if (m === "POST") {
    // Promoción y cierre de período (/api/promocion/...)
    if (p.includes("/promocion/periodos/iniciar-cierre")) {
      STORE_PERIODO_ESTADO = {
        ...STORE_PERIODO_ESTADO,
        siguiente: String(Number(STORE_PERIODO_ESTADO.vigente || "2026") + 1),
        cierreIniciado: true,
      };
      saveStore("SIGAE_PERIODO_ESTADO", STORE_PERIODO_ESTADO);
      return { ok: true, status: 200, mensaje: `Cierre del período ${STORE_PERIODO_ESTADO.vigente} iniciado.` };
    }
    if (p.includes("/promocion/periodos/iniciar-nuevo")) {
      const nuevaVigencia = STORE_PERIODO_ESTADO.siguiente || String(Number(STORE_PERIODO_ESTADO.vigente || "2026") + 1);
      STORE_PERIODO_ESTADO = {
        vigente: nuevaVigencia,
        siguiente: String(Number(nuevaVigencia) + 1),
        cierreIniciado: false,
      };
      saveStore("SIGAE_PERIODO_ESTADO", STORE_PERIODO_ESTADO);
      return { ok: true, status: 200, mensaje: `Período ${nuevaVigencia} activado.` };
    }
    if (p.includes("/promocion/cursos/") && p.includes("/promover")) {
      const mId = urlStr.match(/\/promocion\/cursos\/(\d+)\//i);
      const cursoId = mId ? Number(mId[1]) : 1;
      const idsFiltro = Array.isArray(b?.estudianteIds) ? new Set(b.estudianteIds.map(Number)) : null;
      const ests = STORE_ESTUDIANTES.filter(e => Number(e.Curso_Id) === cursoId);
      let aplicados = 0;
      for (const e of ests) {
        if (idsFiltro && !idsFiltro.has(e.Estudiante_Id)) continue;
        const cur = STORE_SITUACIONES[e.Estudiante_Id];
        if (cur && cur.estado === "Registrado") {
          STORE_SITUACIONES[e.Estudiante_Id] = { ...cur, estado: "Aplicado" };
          aplicados += 1;
        }
      }
      saveStore("SIGAE_SITUACIONES", STORE_SITUACIONES);
      return { ok: true, status: 200, mensaje: `Promoción aplicada a ${aplicados} estudiante(s).`, cursosCreados: [], advertencias: [] };
    }
    if (p.includes("/promocion/cursos/") && p.includes("/situaciones/excel")) {
      const confirmar = p.includes("confirmar=true");
      if (confirmar) {
        return { ok: true, status: 200, mensaje: "Situaciones cargadas desde Excel correctamente." };
      }
      return { ok: true, status: 200, validas: [], rechazadas: [], advertencias: [{ fila: 1, mensaje: "Archivo revisado en modo offline sin cambios pendientes." }] };
    }

    // Mensajería interna (CU73 / RF47)
    if (p.includes("/mensajes/conversaciones/") && p.includes("/mensajes")) {
      const mConv = urlStr.match(/\/conversaciones\/(\d+)\//i);
      const convId = mConv ? Number(mConv[1]) : 1;
      const ctx = getContextoUsuarioMock(urlStr);
      const texto = String(b?.contenido || "").trim();
      if (!texto) return { ok: false, status: 400, error: "El mensaje no puede estar vacío" };
      const ahora = new Date();
      const nuevoMsg = {
        Mensaje_Id: nextId(),
        Conversacion_Id: convId,
        Mensaje_Remitente_Rol: ctx.rol === "Apoderado" ? "Apoderado" : "Docente",
        Mensaje_Remitente_Usuario_Id: ctx.userId || 3,
        Mensaje_Contenido: texto,
        Mensaje_Fecha_Envio: hoyMockISO(),
        Mensaje_Hora_Envio: ahora.toTimeString().slice(0, 8),
        Mensaje_Estado: "No leído",
      };
      STORE_MENSAJES.push(nuevoMsg);
      STORE_CONVERSACIONES = STORE_CONVERSACIONES.map(c =>
        Number(c.Conversacion_Id) === convId ? { ...c, Ultimo_Mensaje: texto } : c
      );
      saveStore("SIGAE_MENSAJES", STORE_MENSAJES);
      saveStore("SIGAE_CONVERSACIONES", STORE_CONVERSACIONES);
      return { ok: true, status: 201, mensaje: nuevoMsg };
    }
    if (p.includes("/mensajes/conversaciones")) {
      const ctx = getContextoUsuarioMock(urlStr);
      const contactoId = Number(b?.contactoId);
      const soyApoderado = (b?.rol || ctx.rol) === "Apoderado";
      const docenteId = soyApoderado ? contactoId : (ctx.userId || 3);
      const apoderadoId = soyApoderado ? (ctx.userId || 4) : contactoId;
      let existente = STORE_CONVERSACIONES.find(c => Number(c.Docente_Usuario_Id) === docenteId && Number(c.Apoderado_Usuario_Id) === apoderadoId);
      if (!existente) {
        const docU = STORE_USUARIOS.find(u => Number(u.Usuario_Id) === docenteId);
        const apoU = STORE_USUARIOS.find(u => Number(u.Usuario_Id) === apoderadoId);
        existente = {
          Conversacion_Id: nextId(),
          Docente_Usuario_Id: docenteId,
          Docente_Nombre: docU?.Usuario_Nombre_Completo || "Docente",
          Apoderado_Usuario_Id: apoderadoId,
          Apoderado_Nombre: apoU?.Usuario_Nombre_Completo || "Apoderado",
          Conversacion_Estado: 1,
          Ultimo_Mensaje: null,
        };
        STORE_CONVERSACIONES.push(existente);
        saveStore("SIGAE_CONVERSACIONES", STORE_CONVERSACIONES);
      }
      const otroNombre = soyApoderado ? existente.Docente_Nombre : existente.Apoderado_Nombre;
      return {
        ...existente,
        Mi_Rol: soyApoderado ? "Apoderado" : "Docente",
        Contacto_Nombre: otroNombre,
        No_Leidos: 0,
      };
    }

    // Impacto de nueva jornada en bloques horarios (/api/bloques/parametros/impacto)
    if (p.includes("/parametros/impacto")) {
      const inicioRaw = b?.Parametro_Institucional_Inicio_Jornada;
      const finRaw = b?.Parametro_Institucional_Fin_Jornada;
      if (!esHoraMockValida(String(inicioRaw || "")) || !esHoraMockValida(String(finRaw || ""))) {
        return { error: "El inicio de jornada debe ser anterior al fin", status: 400 };
      }
      const inicio = normHora8(inicioRaw);
      const fin = normHora8(finRaw);
      if (inicio >= fin) {
        return { error: "El inicio de jornada debe ser anterior al fin", status: 400 };
      }
      const bloquesActuales = enriquecerBloquesMock();
      const bloquesFuera = bloquesActuales
        .filter((bh) => Number(bh.desajustado) !== 1 && (bh.Bloque_Horario_Hora_Inicio < inicio || bh.Bloque_Horario_Hora_Fin > fin))
        .map((bh) => ({
          Bloque_Horario_Id: bh.Bloque_Horario_Id,
          Bloque_Horario_Hora_Inicio: bh.Bloque_Horario_Hora_Inicio,
          Bloque_Horario_Hora_Fin: bh.Bloque_Horario_Hora_Fin,
          Bloque_Horario_Jornada: bh.Bloque_Horario_Jornada || "Mañana",
          Bloque_Horario_Tipo: bh.Bloque_Horario_Tipo || "Clase",
          Clases: bh.clases || 0,
        }));
      return {
        clases: bloquesFuera.reduce((acc, x) => acc + x.Clases, 0),
        bloques: bloquesFuera,
        status: 200,
      };
    }
    // Autenticación / Login (/api/auth/login)
    if (p.includes("/auth/login") || p.includes("/login")) {
      const qRut = (b?.rut || "").trim().toLowerCase();
      const matchU = STORE_USUARIOS.find(u => (u.Usuario_RUT || "").toLowerCase() === qRut) || STORE_USUARIOS[0];
      const rol = matchU.Es_Administrador ? "Administrador" : matchU.Es_Docente ? "Docente" : "Apoderado";
      return {
        ok: true,
        user: {
          id: matchU.Usuario_Id,
          nombre: matchU.Usuario_Nombre_Completo,
          rut: matchU.Usuario_RUT,
          correo: matchU.Usuario_Correo || matchU.Administrador_Correo_Institucional || matchU.Docente_Correo_Institucional,
          roles: [rol],
          administradorTipo: matchU.Administrador_Tipo || (matchU.Es_Administrador ? "Regular" : null),
        },
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZXhwIjoxOTI0OTA1NjAwfQ.mock"
      };
    }
    // Búsqueda de usuarios (acepta POST /api/usuarios/buscar)
    if (p.includes("/usuarios/buscar")) {
      const qRut = (b?.rut || "").trim().toLowerCase();
      const qNom = (b?.nombre || "").trim().toLowerCase();
      const qCor = (b?.correo || "").trim().toLowerCase();
      return STORE_USUARIOS.filter((u) => {
        const mRut = !qRut || (u.Usuario_RUT || "").toLowerCase().includes(qRut);
        const mNom = !qNom || (u.Usuario_Nombre_Completo || "").toLowerCase().includes(qNom);
        const emails = [
          u.Usuario_Correo,
          u.Administrador_Correo_Institucional,
          u.Docente_Correo_Institucional,
          u.Apoderado_Correo_Natural,
        ].filter(Boolean).map(e => String(e).toLowerCase());
        const mCor = !qCor || emails.some(e => e.includes(qCor));
        return mRut && mNom && mCor;
      });
    }

    // Crear Citación / Solicitud de Citación (CU74 / CU89)
    if (p.includes("/citaciones")) {
      const ctx = getContextoUsuarioMock(urlStr);
      const esSolicitud = p.includes("/solicitud");
      if (esSolicitud && ctx.userId && ctx.rol && ctx.rol !== "Apoderado" && !ctx.roles.includes("Apoderado")) {
        return { ok: false, status: 403, mensaje: "Solo un apoderado puede solicitar citaciones" };
      }

      const estId = Number(b?.Estudiante_Id || b?.estudianteId) || 1;
      const est = STORE_ESTUDIANTES.find(e => Number(e.Estudiante_Id) === estId);
      const docId = esSolicitud
        ? (Number(b?.Docente_Usuario_Id || b?.docenteId) || 3)
        : (Number(b?.Docente_Usuario_Id || b?.docenteId) || ctx.userId || 3);
      const apoderadoId = esSolicitud
        ? (ctx.userId || Number(est?.Apoderado_Usuario_Id) || 4)
        : (Number(est?.Apoderado_Usuario_Id) || 4);

      const fecha = b?.Citacion_Fecha || b?.fecha || hoyMockISO();
      const tramoStr = b?.Citacion_Tramo_Horario || b?.tramo || "10:00 - 10:45";
      if (yaPasoCitacionMock({ Citacion_Fecha: fecha, Citacion_Tramo_Horario: tramoStr })) {
        return {
          ok: false,
          status: 400,
          mensaje: fecha < hoyMockISO() ? "La fecha no puede ser anterior a hoy" : "El tramo horario seleccionado ya pasó",
        };
      }

      const conflicto = STORE_CITACIONES.some((item) => {
        const c = normalizarCitacionMock(item);
        return (
          !String(c.Citacion_Estado || "").startsWith("Cancelada") &&
          c.Citacion_Fecha === fecha &&
          c.Citacion_Tramo_Horario === tramoStr &&
          (Number(c.Docente_Usuario_Id) === docId || Number(c.Apoderado_Usuario_Id) === apoderadoId)
        );
      });
      if (conflicto) {
        return { ok: false, status: 409, mensaje: "No existe disponibilidad para la fecha y tramo seleccionado" };
      }

      const doc = STORE_USUARIOS.find(u => Number(u.Usuario_Id) === docId);
      const apo = STORE_USUARIOS.find(u => Number(u.Usuario_Id) === apoderadoId);
      const partes = tramoStr.split(/\s*[-–]\s*/);
      const hIni = partes[0] ? (partes[0].length === 5 ? `${partes[0]}:00` : partes[0]) : "10:00:00";
      const hFin = partes[1] ? (partes[1].length === 5 ? `${partes[1]}:00` : partes[1]) : "10:45:00";
      const solicitanteRol = esSolicitud ? "Apoderado" : "Docente";

      const nueva = {
        Citacion_Id: nextId(),
        Citacion_Fecha: fecha,
        Citacion_Hora_Inicio: hIni,
        Citacion_Hora_Fin: hFin,
        Citacion_Tramo_Horario: tramoStr,
        Citacion_Estado: "Pendiente de confirmación",
        Citacion_Motivo: b?.Citacion_Motivo || b?.motivo || "Entrevista con apoderado",
        Citacion_Modalidad: b?.Citacion_Modalidad || b?.modalidad || "Presencial",
        Estudiante_Id: estId,
        Docente_Usuario_Id: docId,
        Apoderado_Usuario_Id: apoderadoId,
        Citacion_Solicitante_Rol: solicitanteRol,
        Estudiante_Nombre_Completo: est?.Estudiante_Nombre_Completo || (estId === 2 ? "Sofia Valentina Gonzalez Morales" : "Lucas Mateo Fernandez Vera"),
        Curso_Nombre: est?.Curso_Nombre || (estId === 2 ? "2° Básico A" : "1° Básico A"),
        Docente_Nombre: doc?.Usuario_Nombre_Completo || ctx.nombre || "María Morales",
        Apoderado_Nombre: est?.Apoderado_Nombre || apo?.Usuario_Nombre_Completo || "Pedro Fernandez",
        historial: [
          {
            Historial_Id: nextId(),
            Historial_Fecha_Registro: hoyMockISO(),
            Historial_Hora_Registro: new Date().toTimeString().slice(0, 8),
            Accion: esSolicitud ? "Solicitud registrada" : "Citación creada por docente",
            Historial_Descripcion_Cambio: esSolicitud
              ? "Solicitud enviada por el apoderado, pendiente de confirmación por el docente"
              : "Citación agendada inicialmente en estado Pendiente de confirmación"
          }
        ]
      };
      STORE_CITACIONES.unshift(nueva);
      saveStore("SIGAE_CITACIONES", STORE_CITACIONES);
      return {
        ok: true,
        status: 201,
        id: nueva.Citacion_Id,
        citacion: enriquecerCitacionMock(nueva, urlStr),
        mensaje: esSolicitud ? "Solicitud registrada con éxito. Queda pendiente hasta que el docente la confirme." : "Citación creada, pendiente de confirmación"
      };
    }

    // Crear bloque de horario de atención docente (CU87)
    if (p.includes("/horario-atencion")) {
      const nuevoBloqueAtencion = {
        Horario_Atencion_Id: nextId(),
        Usuario_Id: Number(b?.Usuario_Id) || 3,
        Horario_Atencion_Dia_Semana: b?.Horario_Atencion_Dia_Semana || b?.dia || "Martes",
        Horario_Atencion_Hora_Inicio: b?.Horario_Atencion_Hora_Inicio || b?.horaInicio || "10:00:00",
        Horario_Atencion_Hora_Fin: b?.Horario_Atencion_Hora_Fin || b?.horaFin || "11:30:00",
      };
      STORE_HORARIOS_ATENCION.push(nuevoBloqueAtencion);
      saveStore("SIGAE_HORARIOS_ATENCION", STORE_HORARIOS_ATENCION);
      return { ok: true, status: 200, id: nuevoBloqueAtencion.Horario_Atencion_Id, mensaje: "Bloque de atención registrado exitosamente" };
    }

    // Crear Evento Institucional
    if (p.includes("/eventos")) {
      const nuevo = {
        Evento_Institucional_Id: nextId(),
        Evento_Institucional_Nombre: b?.Evento_Institucional_Nombre || b?.nombre || "Nuevo Evento Institucional",
        Evento_Institucional_Fecha: b?.Evento_Institucional_Fecha || b?.fecha || "2026-11-25",
        Evento_Institucional_Impacto_Clases: b?.Evento_Institucional_Impacto_Clases || b?.impacto || "Suspensión total",
        Evento_Institucional_Descripcion: b?.Evento_Institucional_Descripcion || b?.descripcion || "Evento registrado por dirección.",
        bloques_afectados_count: (b?.bloques || []).length || 2,
        bloques: (b?.bloques || []).map((bl, i) => ({
          Afecta_Id: i + 1,
          Bloque_Horario_Hora_Inicio: bl.Bloque_Horario_Hora_Inicio || "08:00:00",
          Bloque_Horario_Hora_Fin: bl.Bloque_Horario_Hora_Fin || "08:45:00",
          Bloque_Horario_Jornada: bl.Bloque_Horario_Jornada || "Mañana"
        })),
        clases: [],
        dia_semana: "Miércoles"
      };
      STORE_EVENTOS.unshift(nuevo);
      saveStore("SIGAE_EVENTOS", STORE_EVENTOS);
      return { ok: true, status: 200, id: nuevo.Evento_Institucional_Id, mensaje: "Evento registrado correctamente" };
    }

    // Crear Bloque Horario
    if (p.includes("/bloques") && !p.includes("/parametros") && !p.includes("/eventos") && !p.includes("/conflictos")) {
      const hIniRaw = b?.Bloque_Horario_Hora_Inicio;
      const hFinRaw = b?.Bloque_Horario_Hora_Fin;
      const jornada = b?.Bloque_Horario_Jornada;
      const tipo = b?.Bloque_Horario_Tipo;
      const reemplazar = b?.reemplazar === true;

      if (!hIniRaw || !hFinRaw || !jornada || !tipo) {
        return { error: "Todos los campos son obligatorios", status: 400 };
      }
      if (!esHoraMockValida(String(hIniRaw)) || !esHoraMockValida(String(hFinRaw))) {
        return { error: "Formato de hora inválido", status: 400 };
      }
      const hIni = normHora8(hIniRaw);
      const hFin = normHora8(hFinRaw);
      if (hIni >= hFin) {
        return { error: "La hora de inicio debe ser anterior a la hora de fin", status: 400 };
      }
      const pIni = normHora8(STORE_PARAMETROS?.Parametro_Institucional_Inicio_Jornada || "08:00:00");
      const pFin = normHora8(STORE_PARAMETROS?.Parametro_Institucional_Fin_Jornada || "16:00:00");
      if (hIni < pIni || hFin > pFin) {
        return {
          error: `El bloque debe estar dentro del rango institucional: ${pIni.slice(0, 5)} – ${pFin.slice(0, 5)}`,
          status: 400,
        };
      }

      const vigentes = enriquecerBloquesMock().filter((x) => Number(x.desajustado) !== 1);
      const conflicto = vigentes.filter((x) =>
        x.Bloque_Horario_Jornada === jornada &&
        x.Bloque_Horario_Hora_Inicio < hFin &&
        x.Bloque_Horario_Hora_Fin > hIni
      );
      if (conflicto.length > 0 && !reemplazar) {
        return {
          error: "El horario se superpone con un bloque existente",
          codigo: "SUPERPOSICION",
          status: 409,
          bloques: conflicto.map((x) => ({
            Bloque_Horario_Id: x.Bloque_Horario_Id,
            Bloque_Horario_Hora_Inicio: x.Bloque_Horario_Hora_Inicio,
            Bloque_Horario_Hora_Fin: x.Bloque_Horario_Hora_Fin,
            Bloque_Horario_Tipo: x.Bloque_Horario_Tipo,
            clases: x.clases || 0,
          })),
        };
      }

      const nuevo = {
        Bloque_Horario_Id: nextId(),
        Bloque_Horario_Hora_Inicio: hIni,
        Bloque_Horario_Hora_Fin: hFin,
        Bloque_Horario_Jornada: jornada,
        Bloque_Horario_Tipo: tipo,
        clases: 0,
        eventos: 0,
        activo: 1,
      };
      let clasesPendientes = 0;
      const idsSinUso = new Set();
      conflicto.forEach((x) => {
        const c = contarClasesActivasBloque(x.Bloque_Horario_Id);
        const ev = bloqueEnUsoEvento(x.Bloque_Horario_Id);
        if (c === 0 && !ev) idsSinUso.add(Number(x.Bloque_Horario_Id));
        else clasesPendientes += c;
      });
      if (idsSinUso.size > 0) {
        STORE_BLOQUES = STORE_BLOQUES.filter((x) => !idsSinUso.has(Number(x.Bloque_Horario_Id)));
      }
      STORE_BLOQUES.push(nuevo);
      saveStore("SIGAE_BLOQUES", STORE_BLOQUES);
      return {
        ok: true,
        status: 201,
        id: nuevo.Bloque_Horario_Id,
        clasesPendientes,
        mensaje: clasesPendientes > 0
          ? `Bloque creado. ${clasesPendientes} clase(s) quedaron pendientes de reubicar.`
          : "Bloque creado correctamente",
      };
    }

    // Crear Asignatura
    if (p.includes("/planes/asignaturas")) {
      const maxAsigId = STORE_ASIGNATURAS.reduce((m, a) => Math.max(m, Number(a.Asignatura_Id) || 0), 1000);
      if (maxAsigId >= _nextIdCounter) {
        _nextIdCounter = maxAsigId;
      }
      const nueva = {
        Asignatura_Id: nextId(),
        Asignatura_Nombre: b?.nombre || "Nueva Asignatura",
        Asignatura_Prioridad_Academica: b?.prioridad || "Media"
      };
      STORE_ASIGNATURAS.push(nueva);
      saveStore("SIGAE_ASIGNATURAS", STORE_ASIGNATURAS);
      return { ok: true, status: 200, id: nueva.Asignatura_Id, mensaje: "Asignatura registrada correctamente" };
    }

    // Clonar Plan Educativo
    if (p.includes("/planes/clonar")) {
      const nuevoPlan = normalizarPlan({
        Plan_Educativo_Id: nextId(),
        plan_origen_id: b?.plan_origen_id,
        nuevo_periodo_lectivo: b?.nuevo_periodo_lectivo || "2027",
        nivel_educativo_id: b?.nivel_educativo_id,
        asignaturas: b?.asignaturas || [],
      });
      STORE_PLANES.unshift(nuevoPlan);
      saveStore("SIGAE_PLANES", STORE_PLANES);
      return { ok: true, status: 201, id: nuevoPlan.Plan_Educativo_Id, mensaje: "Plan educativo clonado correctamente" };
    }

    // Crear Plan Educativo
    if (p.includes("/planes") && !p.includes("/asignaturas") && !p.includes("/clonar")) {
      const nuevoPlan = normalizarPlan({
        Plan_Educativo_Id: nextId(),
        nivel_educativo_id: b?.nivel_educativo_id,
        periodo_lectivo: b?.periodo_lectivo || "2026",
        asignaturas: b?.asignaturas || [],
      });
      STORE_PLANES.unshift(nuevoPlan);
      saveStore("SIGAE_PLANES", STORE_PLANES);
      return { ok: true, status: 201, id: nuevoPlan.Plan_Educativo_Id, mensaje: "Plan educativo creado correctamente" };
    }

    // Asignar asignaturas a un curso (/api/cursos/:id/asignaturas)
    if (p.includes("/cursos/") && p.includes("/asignaturas")) {
      const cId = reqId;
      const nuevasAsigs = b?.asignaturas || [];
      STORE_CURSOS = STORE_CURSOS.map(c => {
        if (Number(c.Curso_Id) === Number(cId)) {
          let asigs = Array.isArray(c.asignaturas) ? [...c.asignaturas] : [];
          nuevasAsigs.forEach(item => {
            const asigId = Number(item.asignatura_id || item.Asignatura_Id);
            const asigObj = STORE_ASIGNATURAS.find(a => a.Asignatura_Id === asigId) || {};
            const existingIdx = asigs.findIndex(a => Number(a.Asignatura_Id) === asigId);
            const estado = item.estado || item.Estado_Asignacion || "Activa";
            if (existingIdx >= 0) {
              asigs[existingIdx] = {
                ...asigs[existingIdx],
                Estado_Asignacion: estado,
              };
            } else {
              asigs.push({
                tieneasig_Id: nextId(),
                Asignatura_Id: asigId,
                Asignatura_Nombre: asigObj.Asignatura_Nombre || "Asignatura",
                Asignatura_Prioridad_Academica: asigObj.Asignatura_Prioridad_Academica || "Media",
                Estado_Asignacion: estado,
              });
            }
          });
          const totalActivas = asigs.filter(a => a.Estado_Asignacion === "Activa").length;
          return {
            ...c,
            asignaturas: asigs,
            Total_Asignaturas_Activas: totalActivas,
          };
        }
        return c;
      });
      saveStore("SIGAE_CURSOS", STORE_CURSOS);
      return { ok: true, status: 200, mensaje: "Asignaturas asociadas correctamente" };
    }

    // Registrar nuevo Curso (/api/cursos)
    if (p.includes("/cursos") && !p.includes("/asignaturas") && !p.includes("/niveles")) {
      const nId = Number(b?.nivel_educativo_id || b?.Nivel_Educativo_Id);
      let sec = (b?.seccion || b?.Curso_Seccion || "").trim().toUpperCase();
      if (!sec) sec = "A";
      const per = String(b?.periodo || b?.Curso_Periodo_Lectivo || "2026").trim();

      const existe = STORE_CURSOS.some(c =>
        Number(c.Nivel_Educativo_Id) === nId &&
        String(c.Curso_Seccion || c.seccion || "").toUpperCase() === sec &&
        String(c.Curso_Periodo_Lectivo || c.periodo || "2026") === per
      );

      if (existe) {
        return { ok: false, status: 409, error: "El curso ya existe para este periodo lectivo" };
      }

      const nuevoCurso = normalizarCurso({
        Curso_Id: nextId(),
        nivel_educativo_id: nId,
        seccion: sec,
        periodo: per,
        Cupo_Maximo: Number(b?.Cupo_Maximo || 35),
        Jornada: b?.Jornada || "Mañana",
      });

      STORE_CURSOS.push(nuevoCurso);
      saveStore("SIGAE_CURSOS", STORE_CURSOS);
      return { ok: true, status: 201, id: nuevoCurso.Curso_Id, mensaje: `Curso ${nuevoCurso.Curso_Nombre} registrado exitosamente` };
    }

    // Suspender bloques por evento institucional (/api/horarios/suspender-bloques)
    if (p.includes("/horarios/suspender-bloques")) {
      const bloqueIds = Array.isArray(b?.bloqueIds) ? b.bloqueIds.map(Number) : [];
      const fecha = b?.fecha || hoyMockISO();
      const eventoId = b?.eventoId || 1;
      const evento = STORE_EVENTOS.find((e) => Number(e.Evento_Institucional_Id) === Number(eventoId));
      const eventoNombre = evento ? evento.Evento_Institucional_Nombre : "Evento Institucional";

      STORE_HORARIOS = STORE_HORARIOS.map((h) => {
        if (bloqueIds.includes(Number(h.Bloque_Horario_Id))) {
          return {
            ...h,
            suspension_evento: { fecha, nombre: eventoNombre },
          };
        }
        return h;
      });
      saveStore("SIGAE_HORARIOS", STORE_HORARIOS);
      return { ok: true, status: 200, mensaje: "Bloques suspendidos por evento institucional" };
    }

    // Suspender jornada completa (/api/horarios/suspender-jornada)
    if (p.includes("/horarios/suspender-jornada")) {
      const jornada = b?.jornada || "Completa";
      const fecha = b?.fecha || hoyMockISO();
      const eventoId = b?.eventoId || 1;
      const evento = STORE_EVENTOS.find((e) => Number(e.Evento_Institucional_Id) === Number(eventoId));
      const eventoNombre = evento ? evento.Evento_Institucional_Nombre : "Evento Institucional";

      STORE_HORARIOS = STORE_HORARIOS.map((h) => {
        if (jornada === "Completa" || h.jornada === jornada) {
          return {
            ...h,
            suspension_evento: { fecha, nombre: eventoNombre },
          };
        }
        return h;
      });
      saveStore("SIGAE_HORARIOS", STORE_HORARIOS);
      return { ok: true, status: 200, mensaje: "Jornada suspendida exitosamente" };
    }

    // Crear Clase en Horario
    if (p.includes("/horarios")) {
      const targetCurso = STORE_CURSOS.find(c => Number(c.Curso_Id) === Number(b?.Curso_Id || 1));
      const targetBlk = STORE_BLOQUES.find(blk => Number(blk.Bloque_Horario_Id) === Number(b?.Bloque_Horario_Id));
      const horaIni = b?.hora_inicio || targetBlk?.Bloque_Horario_Hora_Inicio || "08:00:00";
      const horaFin = b?.hora_fin || targetBlk?.Bloque_Horario_Hora_Fin || "08:45:00";
      const cursoNombre = targetCurso?.Curso_Nombre || "1° Básico A";
      const asigNombre = STORE_ASIGNATURAS.find(a => Number(a.Asignatura_Id) === Number(b?.Asignatura_Id))?.Asignatura_Nombre || "Asignatura";
      const docNombre = STORE_USUARIOS.find(u => Number(u.Usuario_Id) === Number(b?.Usuario_Id))?.Usuario_Nombre_Completo || "Docente Asignado";
      const nuevaClase = {
        Horario_Asignatura_Id: nextId(),
        Curso_Id: Number(b?.Curso_Id) || 1,
        curso: cursoNombre,
        Curso_Nombre: cursoNombre,
        Asignatura_Id: Number(b?.Asignatura_Id) || 1,
        asignatura: asigNombre,
        Asignatura_Nombre: asigNombre,
        Usuario_Id: Number(b?.Usuario_Id) || 5,
        docente: docNombre,
        Docente_Nombre: docNombre,
        Bloque_Horario_Id: Number(b?.Bloque_Horario_Id) || 1,
        horaInicio: horaIni,
        horaFin: horaFin,
        hora_inicio: horaIni,
        hora_fin: horaFin,
        dia: b?.dia || "Lunes",
        jornada: targetBlk?.Bloque_Horario_Jornada || "Mañana",
        estado: "Activo",
        Horario_Estado: "Activo",
        eliminado: 0,
        observaciones: ["Clase programada."]
      };
      STORE_HORARIOS.push(nuevaClase);
      saveStore("SIGAE_HORARIOS", STORE_HORARIOS);
      return { ok: true, status: 200, id: nuevaClase.Horario_Asignatura_Id, mensaje: "Clase asignada exitosamente" };
    }

    // Asignar apoderado a uno o más estudiantes
    if (p.includes("/estudiantes/asignar-apoderado")) {
      const apoId = Number(b?.apoderadoId);
      const apo = STORE_USUARIOS.find(u => u.Usuario_Id === apoId);
      const ids = b?.estudianteIds || [];
      STORE_ESTUDIANTES = STORE_ESTUDIANTES.map(e => {
        if (ids.includes(e.Estudiante_Id)) {
          return {
            ...e,
            Apoderado_Usuario_Id: apoId,
            Apoderado_Nombre: apo?.Usuario_Nombre_Completo || "Apoderado Asignado",
            Usuario_Telefono: apo?.Usuario_Telefono || e.Usuario_Telefono,
            Usuario_Correo: apo?.Usuario_Correo || apo?.Apoderado_Correo_Natural || e.Usuario_Correo,
          };
        }
        return e;
      });
      saveStore("SIGAE_ESTUDIANTES", STORE_ESTUDIANTES);
      return { ok: true, status: 200, mensaje: "Estudiantes asignados correctamente" };
    }

    // Registrar Estudiante (CU Ficha Estudiantil)
    if (p.includes("/estudiantes") && !p.includes("/cursos/")) {
      const cId = Number(b?.Curso_Id || b?.curso) || 1;
      const cNombre = STORE_CURSOS.find(c => c.Curso_Id === cId)?.Curso_Nombre || (cId + "° Básico A");
      const calle = b?.Estudiante_Calle || b?.calle || b?.Estudiante_Direccion_Calle || "";
      const numero = b?.Estudiante_Numero || b?.numero || b?.Estudiante_Direccion_Numero || "";
      const depto = b?.Estudiante_Depto || b?.depto || b?.Estudiante_Direccion_Depto || "";
      const comuna = b?.Estudiante_Comuna || b?.comuna || b?.Estudiante_Direccion_Comuna || "";

      const maxEstId = STORE_ESTUDIANTES.reduce((m, e) => Math.max(m, Number(e.Estudiante_Id) || 0), 1000);
      if (maxEstId >= _nextIdCounter) {
        _nextIdCounter = maxEstId;
      }
      const nuevoEstId = nextId();

      const nuevoEst = {
        Estudiante_Id: nuevoEstId,
        Estudiante_Nombre_Completo: b?.Estudiante_Nombre_Completo || b?.nombre || "Estudiante Nuevo",
        Estudiante_RUT: b?.Estudiante_RUT || b?.rut || "25123456-7",
        Curso_Id: cId,
        Curso_Nombre: cNombre,
        Estudiante_Estado_Academico: b?.Estudiante_Estado_Academico || b?.estadoAcademico || "Regular",
        Estudiante_Calle: calle,
        Estudiante_Numero: numero,
        Estudiante_Depto: depto,
        Estudiante_Comuna: comuna,
        Estudiante_Direccion_Calle: calle,
        Estudiante_Direccion_Numero: numero,
        Estudiante_Direccion_Depto: depto,
        Estudiante_Direccion_Comuna: comuna,
        calle: calle,
        numero: numero,
        depto: depto,
        comuna: comuna,
        Apoderado_Nombre: null,
        Apoderado_Usuario_Id: null,
        Usuario_Telefono: "",
        Usuario_Correo: "",
      };
      STORE_ESTUDIANTES.unshift(nuevoEst);
      saveStore("SIGAE_ESTUDIANTES", STORE_ESTUDIANTES);
      return { ok: true, status: 201, id: nuevoEst.Estudiante_Id, mensaje: "Ficha estudiantil registrada correctamente" };
    }

    // Asignar rol a usuario existente (/api/usuarios/:id/asignar-rol)
    if (p.includes("asignar-rol")) {
      const mId = urlStr.match(/\/usuarios\/(\d+)\/asignar-rol/i);
      const targetId = mId ? Number(mId[1]) : reqId;
      let usuarioActualizado = null;
      if (targetId) {
        STORE_USUARIOS = STORE_USUARIOS.map(u => {
          if (Number(u.Usuario_Id) === Number(targetId)) {
            const rol = b?.rol;
            const isDoc = rol === "Docente";
            const isApo = rol === "Apoderado";
            const isAdm = rol === "Administrador";

            usuarioActualizado = {
              ...u,
              Es_Docente: isDoc ? 1 : (isAdm ? 0 : u.Es_Docente),
              Es_Apoderado: isApo ? 1 : (isAdm ? 0 : u.Es_Apoderado),
              Es_Administrador: isAdm ? 1 : ((isDoc || isApo) ? 0 : u.Es_Administrador),
              Docente_Correo_Institucional: isDoc ? (b?.Docente_Correo_Institucional || u.Docente_Correo_Institucional || u.Usuario_Correo) : u.Docente_Correo_Institucional,
              Docente_Especialidad: isDoc ? (b?.Docente_Especialidad || u.Docente_Especialidad || "General") : u.Docente_Especialidad,
              Docente_Carga_Horaria_Maxima: isDoc ? (Number(b?.Docente_Carga_Horaria_Maxima) || u.Docente_Carga_Horaria_Maxima || 36) : u.Docente_Carga_Horaria_Maxima,
              Apoderado_Correo_Natural: isApo ? (b?.Apoderado_Correo_Natural || u.Apoderado_Correo_Natural || u.Usuario_Correo) : u.Apoderado_Correo_Natural,
              Administrador_Correo_Institucional: isAdm ? (b?.Administrador_Correo_Institucional || u.Administrador_Correo_Institucional || u.Usuario_Correo) : u.Administrador_Correo_Institucional,
              Administrador_Tipo: isAdm ? (b?.Administrador_Tipo || u.Administrador_Tipo || "Administrador Normal") : (isDoc || isApo ? null : u.Administrador_Tipo),
              Usuario_Correo: isAdm
                ? (b?.Administrador_Correo_Institucional || u.Administrador_Correo_Institucional || u.Usuario_Correo)
                : isDoc
                ? (b?.Docente_Correo_Institucional || u.Docente_Correo_Institucional || u.Usuario_Correo)
                : (b?.Apoderado_Correo_Natural || u.Apoderado_Correo_Natural || u.Usuario_Correo),
              Usuario_Direccion_Calle: b?.Usuario_Direccion_Calle || u.Usuario_Direccion_Calle,
              Usuario_Direccion_Numero: b?.Usuario_Direccion_Numero || u.Usuario_Direccion_Numero,
              Usuario_Direccion_Depto: b?.Usuario_Direccion_Depto ?? u.Usuario_Direccion_Depto,
              Usuario_Direccion_Comuna: b?.Usuario_Direccion_Comuna || u.Usuario_Direccion_Comuna,
            };
            return usuarioActualizado;
          }
          return u;
        });
        saveStore("SIGAE_USUARIOS", STORE_USUARIOS);
      }
      return { ok: true, status: 200, mensaje: `Rol ${b?.rol} asignado exitosamente`, usuario: usuarioActualizado };
    }

    // Registrar Usuario (Administrador / Docente / Apoderado)
    if ((p.includes("/usuarios/administradores") || p.includes("/usuarios/docentes") || p.includes("/usuarios/apoderados") || p.endsWith("/usuarios") || p.includes("/usuarios?")) && !p.includes("asignar-rol") && !p.includes("/buscar") && !p.includes("/roles") && !p.includes("/estado") && !reqId) {
      const rawRut = (b?.Usuario_RUT || b?.rut || "").trim();
      const normRut = rawRut.replace(/[.\-\s]/g, "").toUpperCase();
      if (normRut) {
        const existing = STORE_USUARIOS.find(u => (u.Usuario_RUT || "").replace(/[.\-\s]/g, "").toUpperCase() === normRut);
        if (existing) {
          return {
            ok: false,
            status: 409,
            requiereAsignacionRol: true,
            usuarioId: existing.Usuario_Id,
            mensaje: `El usuario con RUT ${rawRut} ya está registrado en el sistema. Asigne el nuevo rol desde Gestión de Roles.`,
          };
        }
      }

      let isAdm = false;
      let isDoc = false;
      let isApo = false;

      if (Number(b?.Es_Apoderado) === 1 || p.includes("/apoderados") || b?.Apoderado_Correo_Natural) {
        isApo = true;
      } else if (Number(b?.Es_Docente) === 1 || p.includes("/docentes") || b?.Docente_Especialidad) {
        isDoc = true;
      } else if (Number(b?.Es_Administrador) === 1 || p.includes("/administradores") || b?.Administrador_Tipo) {
        isAdm = true;
      } else if (b?.rol) {
        const r = String(b.rol).toLowerCase();
        if (r.includes("apoderado")) isApo = true;
        else if (r.includes("docente")) isDoc = true;
        else isAdm = true;
      } else {
        isAdm = true;
      }

      const nombre = (b?.Usuario_Nombre_Completo || b?.nombre || "").trim();
      if (!nombre) {
        return { ok: false, status: 400, mensaje: "El nombre completo es obligatorio." };
      }

      const rut = rawRut || "11111111-1";

      const correo = (
        (isApo && b?.Apoderado_Correo_Natural) ||
        (isDoc && b?.Docente_Correo_Institucional) ||
        (isAdm && b?.Administrador_Correo_Institucional) ||
        b?.Usuario_Correo ||
        b?.correo ||
        b?.Apoderado_Correo_Natural ||
        b?.Docente_Correo_Institucional ||
        b?.Administrador_Correo_Institucional ||
        (isAdm ? "admin@jacquescousteau.edu" : isDoc ? "docente@jacquescousteau.edu" : "apoderado@email.cl")
      ).trim();

      const telefono = b?.Usuario_Telefono || b?.telefono || "+56 9 1122 3344";
      const calle = b?.Usuario_Direccion_Calle || b?.calle || "";
      const numero = b?.Usuario_Direccion_Numero || b?.numero || "";
      const depto = b?.Usuario_Direccion_Depto || b?.depto || "";
      const comuna = b?.Usuario_Direccion_Comuna || b?.comuna || "";
      const estado = b?.Usuario_Estado_Cuenta !== undefined ? Number(b.Usuario_Estado_Cuenta) : 1;

      const nuevoUsuario = {
        Usuario_Id: nextId(),
        Usuario_Nombre_Completo: nombre,
        Usuario_RUT: rut,
        Usuario_Telefono: telefono,
        Usuario_Estado_Cuenta: estado,
        Usuario_Direccion_Calle: calle,
        Usuario_Direccion_Numero: numero,
        Usuario_Direccion_Depto: depto,
        Usuario_Direccion_Comuna: comuna,
        calle: calle,
        numero: numero,
        depto: depto,
        comuna: comuna,
        Es_Administrador: isAdm ? 1 : 0,
        Es_Docente: isDoc ? 1 : 0,
        Es_Apoderado: isApo ? 1 : 0,
        Administrador_Tipo: isAdm ? (b?.Administrador_Tipo || "Administrador Normal") : null,
        Administrador_Correo_Institucional: isAdm ? correo : null,
        Docente_Correo_Institucional: isDoc ? correo : null,
        Docente_Especialidad: isDoc ? (b?.Docente_Especialidad || b?.especialidad || "General") : null,
        Docente_Carga_Horaria_Maxima: isDoc ? (Number(b?.Docente_Carga_Horaria_Maxima || b?.cargaHoraria) || 36) : null,
        Apoderado_Correo_Natural: isApo ? correo : null,
        Usuario_Correo: correo,
      };

      STORE_USUARIOS.push(nuevoUsuario);
      saveStore("SIGAE_USUARIOS", STORE_USUARIOS);
      const rolTexto = isAdm ? "Administrador" : isDoc ? "Docente" : "Apoderado";
      return { ok: true, status: 201, id: nuevoUsuario.Usuario_Id, mensaje: `${rolTexto} registrado exitosamente` };
    }

    return { ok: true, status: 200, id: nextId(), mensaje: "Operación realizada con éxito" };
  }

  if (m === "DELETE") {
    // Retirar profesor jefe de un curso (/api/cursos/:id/profesor-jefe)
    if (p.includes("/cursos/") && p.includes("/profesor-jefe") && reqId) {
      STORE_CURSOS = STORE_CURSOS.map(c => {
        if (Number(c.Curso_Id) === Number(reqId)) {
          return {
            ...c,
            Profesor_Jefe_Id: null,
            Profesor_Jefe_Nombre: null,
          };
        }
        return c;
      });
      saveStore("SIGAE_CURSOS", STORE_CURSOS);
      return { ok: true, status: 200, mensaje: "Profesor jefe retirado exitosamente" };
    }

    // Eliminar todas las asociaciones de un apoderado
    if (p.includes("/estudiantes/apoderado/") && p.includes("/todas")) {
      const apoId = reqId;
      STORE_ESTUDIANTES = STORE_ESTUDIANTES.map(e =>
        e.Apoderado_Usuario_Id === apoId
          ? { ...e, Apoderado_Usuario_Id: null, Apoderado_Nombre: null }
          : e
      );
      saveStore("SIGAE_ESTUDIANTES", STORE_ESTUDIANTES);
      return { ok: true, status: 200, mensaje: "Todas las asociaciones fueron eliminadas exitosamente" };
    }

    // Quitar asociación puntual estudiante-apoderado (/api/estudiantes/:id/apoderado)
    if (p.includes("/estudiantes") && p.includes("/apoderado") && reqId) {
      STORE_ESTUDIANTES = STORE_ESTUDIANTES.map(e =>
        e.Estudiante_Id === reqId
          ? { ...e, Apoderado_Usuario_Id: null, Apoderado_Nombre: null }
          : e
      );
      saveStore("SIGAE_ESTUDIANTES", STORE_ESTUDIANTES);
      return { ok: true, status: 200, mensaje: "Asociación eliminada exitosamente" };
    }

    // Eliminar estudiante
    if (p.includes("/estudiantes") && reqId) {
      STORE_ESTUDIANTES = STORE_ESTUDIANTES.filter(e => e.Estudiante_Id !== reqId);
      saveStore("SIGAE_ESTUDIANTES", STORE_ESTUDIANTES);
      return { ok: true, status: 200, mensaje: "Estudiante eliminado exitosamente" };
    }

    if (p.includes("/eventos")) {
      if (reqId) STORE_EVENTOS = STORE_EVENTOS.filter(e => e.Evento_Institucional_Id !== reqId);
      saveStore("SIGAE_EVENTOS", STORE_EVENTOS);
      return { ok: true, status: 200, mensaje: "Evento eliminado correctamente" };
    }
    if (p.includes("/horario-atencion")) {
      if (reqId) STORE_HORARIOS_ATENCION = STORE_HORARIOS_ATENCION.filter(h => Number(h.Horario_Atencion_Id) !== Number(reqId));
      saveStore("SIGAE_HORARIOS_ATENCION", STORE_HORARIOS_ATENCION);
      return { ok: true, status: 200, mensaje: "Bloque de atención eliminado correctamente" };
    }
    const matchDelConflicto = p.match(/\/bloques\/conflictos\/(\d+)/);
    if (matchDelConflicto) {
      const horarioId = Number(matchDelConflicto[1]);
      const h = STORE_HORARIOS.find(x =>
        Number(x.Horario_Asignatura_Id) === horarioId &&
        x.eliminado !== 1 &&
        (x.estado || x.Horario_Estado || "Activo") !== "Eliminado"
      );
      if (!h) {
        return { ok: false, status: 404, error: "Clase no encontrada o ya fue eliminada", codigo: "YA_RESUELTA" };
      }
      STORE_HORARIOS = STORE_HORARIOS.map(x =>
        Number(x.Horario_Asignatura_Id) === horarioId
          ? { ...x, estado: "Eliminado", Horario_Estado: "Eliminado", eliminado: 1 }
          : x
      );
      saveStore("SIGAE_HORARIOS", STORE_HORARIOS);
      return { ok: true, status: 200, mensaje: "Clase eliminada del horario" };
    }
    if (p.includes("/bloques/multiples")) {
      const rawIds = b?.bloques_id ?? b?.ids;
      const ids = Array.isArray(rawIds)
        ? [...new Set(rawIds.map(Number).filter(n => Number.isInteger(n) && n > 0))]
        : [];
      if (!ids.length) {
        return { ok: false, status: 400, error: "Debes seleccionar al menos un bloque" };
      }
      const conClases = ids.filter(id => contarClasesActivasBloque(id) > 0);
      if (conClases.length > 0) {
        return {
          ok: false, status: 409,
          error: "Uno o más bloques seleccionados tienen clases activas asignadas.",
          codigo: "TIENE_CLASES",
          bloquesIds: conClases,
        };
      }
      const enEvento = ids.filter(id => bloqueEnUsoEvento(id));
      if (enEvento.length > 0) {
        return {
          ok: false, status: 409,
          error: "Uno o más bloques seleccionados están afectados por un evento institucional.",
          codigo: "EN_USO_EVENTO",
          bloquesIds: enEvento,
        };
      }
      STORE_BLOQUES = STORE_BLOQUES.filter(blk => !ids.includes(Number(blk.Bloque_Horario_Id)));
      saveStore("SIGAE_BLOQUES", STORE_BLOQUES);
      return { ok: true, status: 200, mensaje: `${ids.length} bloque(s) eliminado(s) exitosamente` };
    }
    if (p.includes("/bloques")) {
      if (!reqId) {
        return { ok: false, status: 400, error: "ID de bloque inválido" };
      }
      const existe = STORE_BLOQUES.some(blk => Number(blk.Bloque_Horario_Id) === Number(reqId));
      if (!existe) {
        return { ok: false, status: 404, error: "Bloque horario no encontrado" };
      }
      const clases = contarClasesActivasBloque(reqId);
      if (clases > 0) {
        return {
          ok: false, status: 409,
          error: `No se puede eliminar: el bloque tiene ${clases} clase(s) asignada(s).`,
          codigo: "TIENE_CLASES",
          clases,
        };
      }
      if (bloqueEnUsoEvento(reqId)) {
        return {
          ok: false, status: 409,
          error: "No se puede eliminar: el bloque está afectado por un evento institucional.",
          codigo: "EN_USO_EVENTO",
        };
      }
      STORE_BLOQUES = STORE_BLOQUES.filter(blk => Number(blk.Bloque_Horario_Id) !== Number(reqId));
      saveStore("SIGAE_BLOQUES", STORE_BLOQUES);
      return { ok: true, status: 200, mensaje: "Bloque eliminado exitosamente" };
    }
    if (p.includes("/citaciones")) {
      if (reqId) STORE_CITACIONES = STORE_CITACIONES.filter(c => c.Citacion_Id !== reqId);
      saveStore("SIGAE_CITACIONES", STORE_CITACIONES);
      return { ok: true, status: 200, mensaje: "Citación cancelada exitosamente" };
    }
    if (p.includes("/horarios")) {
      if (reqId) {
        STORE_HORARIOS = STORE_HORARIOS.map(h =>
          h.Horario_Asignatura_Id === reqId ? { ...h, estado: "Eliminado", Horario_Estado: "Eliminado", eliminado: 1 } : h
        );
        saveStore("SIGAE_HORARIOS", STORE_HORARIOS);
      }
      return { ok: true, status: 200, mensaje: "Clase eliminada" };
    }
    if (p.includes("/planes") && reqId) {
      STORE_PLANES = STORE_PLANES.filter(pl => Number(pl.Plan_Educativo_Id) !== Number(reqId));
      saveStore("SIGAE_PLANES", STORE_PLANES);
      return { ok: true, status: 200, mensaje: "Plan educativo eliminado correctamente" };
    }
    return { ok: true, status: 200, mensaje: "Eliminado con éxito" };
  }

  if (m === "PUT" || m === "PATCH") {
    // Situación final (/api/promocion/cursos/:id/situaciones)
    if (p.includes("/promocion/cursos/") && p.includes("/situaciones")) {
      const lista = Array.isArray(b?.situaciones) ? b.situaciones : [];
      const nuevoEstado = b?.confirmar ? "Registrado" : "Borrador";
      for (const s of lista) {
        if (!s?.estudianteId || !s?.valor) continue;
        STORE_SITUACIONES[Number(s.estudianteId)] = { valor: s.valor, estado: nuevoEstado };
      }
      saveStore("SIGAE_SITUACIONES", STORE_SITUACIONES);
      return {
        ok: true,
        status: 200,
        mensaje: b?.confirmar ? "Situación final confirmada." : "Borrador guardado.",
        faltantes: [],
      };
    }

    // Mensajería: marcar mensajes leídos
    if (p.includes("/mensajes/conversaciones/") && p.includes("/leidos")) {
      const mConv = urlStr.match(/\/conversaciones\/(\d+)\//i);
      const convId = mConv ? Number(mConv[1]) : 1;
      const ctx = getContextoUsuarioMock(urlStr);
      const miRol = ctx.rol === "Apoderado" ? "Apoderado" : "Docente";
      STORE_MENSAJES = STORE_MENSAJES.map(msg =>
        Number(msg.Conversacion_Id) === convId && msg.Mensaje_Remitente_Rol !== miRol
          ? { ...msg, Mensaje_Estado: "Leído" }
          : msg
      );
      saveStore("SIGAE_MENSAJES", STORE_MENSAJES);
      return { ok: true, status: 200 };
    }

    // Cancelar citación (CU76)
    if (p.includes("/citaciones") && p.includes("/cancelar") && reqId) {
      const motivoRaw = String(b?.Citacion_Motivo_Cancelacion || b?.motivo || "").trim();
      if (motivoRaw.length < 5) {
        return { ok: false, status: 400, mensaje: "Debe ingresar un motivo de cancelación válido" };
      }
      const target = STORE_CITACIONES.find(c => Number(c.Citacion_Id) === Number(reqId));
      const norm = target ? normalizarCitacionMock(target) : null;
      if (!norm || String(norm.Citacion_Estado || "").startsWith("Cancelada") || yaPasoCitacionMock(norm)) {
        return { ok: false, status: 404, mensaje: "La citación seleccionada no existe o no está disponible" };
      }
      let citacionModificada = null;
      STORE_CITACIONES = STORE_CITACIONES.map(item => {
        if (Number(item.Citacion_Id) === Number(reqId)) {
          const c = normalizarCitacionMock(item);
          const hist = Array.isArray(c.historial) ? [...c.historial] : [];
          hist.push({
            Historial_Id: nextId(),
            Historial_Fecha_Registro: hoyMockISO(),
            Historial_Hora_Registro: new Date().toTimeString().slice(0, 8),
            Accion: "Cancelación de citación",
            Historial_Descripcion_Cambio: `Cancelación de citación. Motivo: ${motivoRaw}`,
          });
          citacionModificada = {
            ...c,
            Citacion_Estado: "Cancelada",
            Citacion_Motivo_Cancelacion: motivoRaw,
            historial: hist,
          };
          return citacionModificada;
        }
        return item;
      });
      saveStore("SIGAE_CITACIONES", STORE_CITACIONES);
      return {
        ok: true,
        status: 200,
        mensaje: "Citación cancelada correctamente",
        citacion: enriquecerCitacionMock(citacionModificada, urlStr),
      };
    }

    // Confirmar citación (CU75)
    if (p.includes("/citaciones") && p.includes("/confirmar") && reqId) {
      const target = STORE_CITACIONES.find(c => Number(c.Citacion_Id) === Number(reqId));
      if (!target) {
        return { ok: false, status: 404, mensaje: "La citación seleccionada no existe o no está disponible" };
      }
      const enriq = enriquecerCitacionMock(target, urlStr);
      if (!String(enriq.Citacion_Estado || "").startsWith("Pendiente")) {
        return { ok: false, status: 409, mensaje: "La citación no se encuentra pendiente de confirmación" };
      }
      if (yaPasoCitacionMock(enriq)) {
        return {
          ok: false,
          status: 409,
          mensaje: enriq.Citacion_Fecha < hoyMockISO()
            ? "La fecha de la citación ya pasó; no puede confirmarse"
            : "El horario de la citación ya pasó; no puede confirmarse",
        };
      }
      if (!enriq.Puede_Confirmar) {
        return { ok: false, status: 403, mensaje: "La confirmación de esta citación le corresponde a la contraparte" };
      }

      let citacionConfirmada = null;
      STORE_CITACIONES = STORE_CITACIONES.map(item => {
        if (Number(item.Citacion_Id) === Number(reqId)) {
          const c = normalizarCitacionMock(item);
          const hist = Array.isArray(c.historial) ? [...c.historial] : [];
          hist.push({
            Historial_Id: nextId(),
            Historial_Fecha_Registro: hoyMockISO(),
            Historial_Hora_Registro: new Date().toTimeString().slice(0, 8),
            Accion: "Confirmación de citación",
            Historial_Descripcion_Cambio: "Confirmación de citación",
          });
          citacionConfirmada = {
            ...c,
            Citacion_Estado: "Confirmada",
            Citacion_Fecha_Confirmacion: hoyMockISO(),
            historial: hist,
          };
          return citacionConfirmada;
        }
        return item;
      });
      saveStore("SIGAE_CITACIONES", STORE_CITACIONES);
      return {
        ok: true,
        status: 200,
        mensaje: "Citación confirmada correctamente. Se notificó el cambio de estado a la contraparte.",
        citacion: enriquecerCitacionMock(citacionConfirmada, urlStr),
      };
    }

    // Reprogramar citación (CU77)
    if (p.includes("/citaciones") && p.includes("/reprogramar") && reqId) {
      const target = STORE_CITACIONES.find(c => Number(c.Citacion_Id) === Number(reqId));
      const norm = target ? normalizarCitacionMock(target) : null;
      if (!norm || String(norm.Citacion_Estado || "").startsWith("Cancelada") || yaPasoCitacionMock(norm)) {
        return { ok: false, status: 404, mensaje: "La citación seleccionada no existe o no está disponible para edición" };
      }
      const nuevaFecha = b?.Citacion_Fecha || b?.fecha || hoyMockISO();
      const nuevoTramo = b?.Citacion_Tramo_Horario || b?.tramo || norm.Citacion_Tramo_Horario || "10:00 - 10:45";
      if (yaPasoCitacionMock({ Citacion_Fecha: nuevaFecha, Citacion_Tramo_Horario: nuevoTramo })) {
        return {
          ok: false,
          status: 400,
          mensaje: nuevaFecha < hoyMockISO() ? "La fecha no puede ser anterior a hoy" : "El tramo horario seleccionado ya pasó",
        };
      }
      if (nuevaFecha === norm.Citacion_Fecha && nuevoTramo === norm.Citacion_Tramo_Horario) {
        return { ok: false, status: 400, mensaje: "Debes modificar la fecha y/o el tramo horario para reprogramar" };
      }
      const conflicto = STORE_CITACIONES.some((item) => {
        const other = normalizarCitacionMock(item);
        return (
          Number(other.Citacion_Id) !== Number(reqId) &&
          !String(other.Citacion_Estado || "").startsWith("Cancelada") &&
          other.Citacion_Fecha === nuevaFecha &&
          other.Citacion_Tramo_Horario === nuevoTramo &&
          (Number(other.Docente_Usuario_Id) === Number(norm.Docente_Usuario_Id) ||
            Number(other.Apoderado_Usuario_Id) === Number(norm.Apoderado_Usuario_Id))
        );
      });
      if (conflicto) {
        return { ok: false, status: 409, mensaje: "Los nuevos datos generan conflicto de disponibilidad horaria" };
      }

      const { userId } = getContextoUsuarioMock(urlStr);
      const tramoParts = nuevoTramo.split(/\s*[-–]\s*/);
      let citacionReprog = null;
      STORE_CITACIONES = STORE_CITACIONES.map(item => {
        if (Number(item.Citacion_Id) === Number(reqId)) {
          const c = normalizarCitacionMock(item);
          const hist = Array.isArray(c.historial) ? [...c.historial] : [];
          hist.push({
            Historial_Id: nextId(),
            Historial_Fecha_Registro: hoyMockISO(),
            Historial_Hora_Registro: new Date().toTimeString().slice(0, 8),
            Accion: "Reprogramación de citación",
            Historial_Descripcion_Cambio: `Reprogramación de citación. Nueva fecha: ${nuevaFecha}, tramo: ${nuevoTramo}`,
          });
          citacionReprog = {
            ...c,
            Citacion_Fecha: nuevaFecha,
            Citacion_Tramo_Horario: nuevoTramo,
            Citacion_Hora_Inicio: tramoParts[0] ? (tramoParts[0].length === 5 ? `${tramoParts[0]}:00` : tramoParts[0]) : c.Citacion_Hora_Inicio,
            Citacion_Hora_Fin: tramoParts[1] ? (tramoParts[1].length === 5 ? `${tramoParts[1]}:00` : tramoParts[1]) : c.Citacion_Hora_Fin,
            Citacion_Estado: "Pendiente de confirmación",
            Citacion_Fecha_Confirmacion: null,
            Ultimo_Reprogramador_Id: userId || c.Docente_Usuario_Id,
            historial: hist,
          };
          return citacionReprog;
        }
        return item;
      });
      saveStore("SIGAE_CITACIONES", STORE_CITACIONES);
      return {
        ok: true,
        status: 200,
        mensaje: "Citación reprogramada correctamente. Quedó pendiente de confirmación.",
        citacion: enriquecerCitacionMock(citacionReprog, urlStr),
      };
    }
    // Modificar bloque de atención docente (CU88)
    if (p.includes("/horario-atencion") && reqId) {
      STORE_HORARIOS_ATENCION = STORE_HORARIOS_ATENCION.map(h => {
        if (Number(h.Horario_Atencion_Id) === Number(reqId)) {
          return {
            ...h,
            Horario_Atencion_Dia_Semana: b?.Horario_Atencion_Dia_Semana || b?.dia || h.Horario_Atencion_Dia_Semana,
            Horario_Atencion_Hora_Inicio: b?.Horario_Atencion_Hora_Inicio || b?.horaInicio || h.Horario_Atencion_Hora_Inicio,
            Horario_Atencion_Hora_Fin: b?.Horario_Atencion_Hora_Fin || b?.horaFin || h.Horario_Atencion_Hora_Fin,
          };
        }
        return h;
      });
      saveStore("SIGAE_HORARIOS_ATENCION", STORE_HORARIOS_ATENCION);
      return { ok: true, status: 200, mensaje: "Bloque de atención actualizado correctamente" };
    }

    // Actualizar parámetros institucionales (/api/bloques/parametros)
    if (p.includes("/parametros")) {
      const inicioRaw = b?.Parametro_Institucional_Inicio_Jornada;
      const finRaw = b?.Parametro_Institucional_Fin_Jornada;
      const durBloqueRaw = b?.Parametro_Institucional_Duracion_Bloque;
      const durRecreoRaw = b?.Parametro_Institucional_Duracion_Recreo;
      const maxBloquesRaw = b?.Parametro_Institucional_Bloques_Maximos_Diarios;

      const presente = (v) => v !== undefined && v !== null && String(v).trim() !== "";
      if (!presente(inicioRaw) || !presente(finRaw) || !presente(durBloqueRaw) || !presente(durRecreoRaw) || !presente(maxBloquesRaw)) {
        return { ok: false, status: 400, error: "Todos los campos son obligatorios" };
      }
      if (!esHoraMockValida(inicioRaw) || !esHoraMockValida(finRaw)) {
        return { ok: false, status: 400, error: "Formato de hora inválido (usa HH:MM)" };
      }

      const inicio = normHora8(inicioRaw);
      const fin = normHora8(finRaw);
      if (inicio >= fin) {
        return { ok: false, status: 400, error: "La hora de inicio de jornada debe ser menor que la hora de fin" };
      }

      const durBloque = Number(durBloqueRaw);
      const durRecreo = Number(durRecreoRaw);
      const maxBloques = Number(maxBloquesRaw);
      if (!Number.isFinite(durBloque) || durBloque < 1 || durBloque > 180) {
        return { ok: false, status: 400, error: "La duración del bloque debe estar entre 1 y 180 minutos" };
      }
      if (!Number.isFinite(durRecreo) || durRecreo < 0 || durRecreo > 120) {
        return { ok: false, status: 400, error: "La duración del recreo debe estar entre 0 y 120 minutos" };
      }
      if (!Number.isFinite(maxBloques) || maxBloques < 1 || maxBloques > 20) {
        return { ok: false, status: 400, error: "El máximo de bloques diarios debe estar entre 1 y 20" };
      }

      STORE_PARAMETROS = {
        ...STORE_PARAMETROS,
        Parametro_Institucional_Inicio_Jornada: inicio,
        Parametro_Institucional_Fin_Jornada: fin,
        Parametro_Institucional_Duracion_Bloque: durBloque,
        Parametro_Institucional_Duracion_Recreo: durRecreo,
        Parametro_Institucional_Bloques_Maximos_Diarios: maxBloques,
      };
      saveStore("SIGAE_PARAMETROS", STORE_PARAMETROS);
      return { ok: true, status: 200, mensaje: "Parámetros actualizados correctamente", parametros: STORE_PARAMETROS };
    }
    // Designar profesor jefe de un curso (/api/cursos/:id/profesor-jefe)
    if (p.includes("/cursos/") && p.includes("/profesor-jefe") && reqId) {
      const docId = Number(b?.docenteId || b?.docente_id || b?.Profesor_Jefe_Id || b?.usuario_id);
      const doc = STORE_USUARIOS.find(u => Number(u.Usuario_Id) === docId);
      const docNombre = doc ? doc.Usuario_Nombre_Completo : "Docente Asignado";
      STORE_CURSOS = STORE_CURSOS.map(c => {
        if (Number(c.Curso_Id) === Number(reqId)) {
          return {
            ...c,
            Profesor_Jefe_Id: docId,
            Profesor_Jefe_Nombre: docNombre,
          };
        }
        return c;
      });
      saveStore("SIGAE_CURSOS", STORE_CURSOS);
      return { ok: true, status: 200, mensaje: `Profesor jefe ${docNombre} designado exitosamente` };
    }

    // Desactivar / Reactivar cuenta de usuario (CU21 / CU22)
    if (p.includes("/usuarios/") && p.includes("/estado") && reqId) {
      let nuevoEstado = 0;
      STORE_USUARIOS = STORE_USUARIOS.map(u => {
        if (Number(u.Usuario_Id) === Number(reqId)) {
          nuevoEstado = u.Usuario_Estado_Cuenta ? 0 : 1;
          return { ...u, Usuario_Estado_Cuenta: nuevoEstado };
        }
        return u;
      });
      saveStore("SIGAE_USUARIOS", STORE_USUARIOS);
      return { ok: true, status: 200, mensaje: "Estado actualizado", estado: nuevoEstado };
    }

    // Editar datos personales del propio perfil (CU19)
    if (p.includes("/usuarios/perfil") && !p.includes("/foto")) {
      const ctx = getContextoUsuarioMock(urlStr);
      const targetId = b?.id || ctx.userId || 1;
      STORE_USUARIOS = STORE_USUARIOS.map(u => {
        if (Number(u.Usuario_Id) === Number(targetId)) {
          return {
            ...u,
            Usuario_Correo: b?.correo || u.Usuario_Correo,
            Administrador_Correo_Institucional: u.Es_Administrador ? (b?.correo || u.Administrador_Correo_Institucional) : u.Administrador_Correo_Institucional,
            Docente_Correo_Institucional: u.Es_Docente ? (b?.correo || u.Docente_Correo_Institucional) : u.Docente_Correo_Institucional,
            Apoderado_Correo_Natural: u.Es_Apoderado ? (b?.correo || u.Apoderado_Correo_Natural) : u.Apoderado_Correo_Natural,
            Usuario_Telefono: b?.telefono || u.Usuario_Telefono,
            Usuario_Direccion_Calle: b?.direccion?.calle ?? u.Usuario_Direccion_Calle,
            Usuario_Direccion_Numero: b?.direccion?.numero ?? u.Usuario_Direccion_Numero,
            Usuario_Direccion_Depto: b?.direccion?.depto ?? u.Usuario_Direccion_Depto,
            Usuario_Direccion_Comuna: b?.direccion?.comuna ?? u.Usuario_Direccion_Comuna,
          };
        }
        return u;
      });
      saveStore("SIGAE_USUARIOS", STORE_USUARIOS);
      return { ok: true, status: 200, mensaje: "Perfil actualizado correctamente" };
    }

    // Editar fotografía de perfil (CU20)
    if (p.includes("/usuarios/perfil/foto")) {
      return { ok: true, status: 200, mensaje: "Fotografía actualizada exitosamente" };
    }

    // Actualizar / Desactivar roles de usuario existente (/api/usuarios/:id/roles)
    if (p.includes("/roles")) {
      const mId = urlStr.match(/\/usuarios\/(\d+)\/roles/i);
      const targetId = mId ? Number(mId[1]) : reqId;
      let usuarioActualizado = null;
      if (targetId) {
        STORE_USUARIOS = STORE_USUARIOS.map(u => {
          if (Number(u.Usuario_Id) === Number(targetId)) {
            usuarioActualizado = {
              ...u,
              Es_Administrador: b?.Es_Administrador !== undefined ? Number(b.Es_Administrador) : u.Es_Administrador,
              Es_Docente: b?.Es_Docente !== undefined ? Number(b.Es_Docente) : u.Es_Docente,
              Es_Apoderado: b?.Es_Apoderado !== undefined ? Number(b.Es_Apoderado) : u.Es_Apoderado,
              Administrador_Tipo: b?.Administrador_Tipo !== undefined ? b.Administrador_Tipo : u.Administrador_Tipo,
            };
            return usuarioActualizado;
          }
          return u;
        });
        saveStore("SIGAE_USUARIOS", STORE_USUARIOS);
      }
      return { ok: true, status: 200, mensaje: "Roles actualizados exitosamente", usuario: usuarioActualizado };
    }

    // Editar usuario o administrador
    if (p.includes("/usuarios") && !p.includes("/roles") && reqId) {
      STORE_USUARIOS = STORE_USUARIOS.map(u => {
        if (Number(u.Usuario_Id) === Number(reqId)) {
          const nuevoCorreo = b?.Administrador_Correo_Institucional || b?.Docente_Correo_Institucional || b?.Apoderado_Correo_Natural || b?.correo || b?.Usuario_Correo || u.Usuario_Correo;
          return {
            ...u,
            ...b,
            Usuario_Telefono: b?.Usuario_Telefono ?? b?.telefono ?? u.Usuario_Telefono,
            Usuario_Correo: nuevoCorreo,
            Administrador_Correo_Institucional: u.Es_Administrador ? nuevoCorreo : u.Administrador_Correo_Institucional,
            Docente_Correo_Institucional: u.Es_Docente ? nuevoCorreo : u.Docente_Correo_Institucional,
            Apoderado_Correo_Natural: u.Es_Apoderado ? nuevoCorreo : u.Apoderado_Correo_Natural,
            Usuario_Estado_Cuenta: b?.Usuario_Estado_Cuenta !== undefined ? Number(b.Usuario_Estado_Cuenta) : (b?.estado !== undefined ? (b.estado ? 1 : 0) : u.Usuario_Estado_Cuenta),
          };
        }
        return u;
      });
      saveStore("SIGAE_USUARIOS", STORE_USUARIOS);
      return { ok: true, status: 200, mensaje: "Usuario actualizado correctamente" };
    }

    // Designar apoderado titular y suplentes (/api/estudiantes/:id/apoderados)
    const mEstPut = urlStr.match(/\/estudiantes\/(\d+)\/apoderados/i);
    if (p.includes("/estudiantes") && p.includes("/apoderados") && (mEstPut || reqId)) {
      const targetEstId = mEstPut ? Number(mEstPut[1]) : Number(reqId);
      const titularId = Number(b?.titularId);
      const suplenteIds = Array.isArray(b?.suplenteIds) ? b.suplenteIds.map(Number) : [];
      if (!titularId) {
        return { ok: false, status: 400, mensaje: "Debes designar un apoderado titular: cada estudiante tiene exactamente uno" };
      }
      if (suplenteIds.includes(titularId)) {
        return { ok: false, status: 400, mensaje: "El apoderado titular no puede ser también suplente del mismo estudiante" };
      }
      if (suplenteIds.length > 4) {
        return { ok: false, status: 400, mensaje: "Un estudiante puede tener como máximo 4 apoderados suplentes" };
      }
      const apo = STORE_USUARIOS.find(u => Number(u.Usuario_Id) === titularId);
      if (!apo) {
        return { ok: false, status: 404, mensaje: "Uno de los apoderados seleccionados no existe" };
      }
      STORE_ESTUDIANTES = STORE_ESTUDIANTES.map(e =>
        Number(e.Estudiante_Id) === targetEstId
          ? {
              ...e,
              Apoderado_Usuario_Id: titularId,
              Apoderado_Nombre: apo.Usuario_Nombre_Completo,
              Suplente_Usuario_Ids: suplenteIds,
              Usuario_Telefono: apo.Usuario_Telefono || e.Usuario_Telefono,
              Usuario_Correo: apo.Usuario_Correo || apo.Apoderado_Correo_Natural || e.Usuario_Correo,
            }
          : e
      );
      const idsAsociados = new Set([titularId, ...suplenteIds]);
      STORE_USUARIOS = STORE_USUARIOS.map(u =>
        idsAsociados.has(Number(u.Usuario_Id)) && !u.Usuario_Estado_Cuenta && u.Apoderado_Sin_Asociaciones_Desde
          ? { ...u, Usuario_Estado_Cuenta: 1, Apoderado_Sin_Asociaciones_Desde: null }
          : u
      );
      saveStore("SIGAE_USUARIOS", STORE_USUARIOS);
      saveStore("SIGAE_ESTUDIANTES", STORE_ESTUDIANTES);
      return { ok: true, status: 200, mensaje: "Designación de apoderados guardada correctamente" };
    }

    // Reasignar o quitar apoderado de estudiante (/api/estudiantes/:id/apoderado)
    const mEstApoSng = urlStr.match(/\/estudiantes\/(\d+)\/apoderado(?:\/|$|\?)/i);
    if (p.includes("/estudiantes") && p.includes("/apoderado") && !p.includes("/apoderados") && (mEstApoSng || reqId)) {
      const targetEstId = mEstApoSng ? Number(mEstApoSng[1]) : Number(reqId);
      const apoId = b?.apoderadoId === null || b?.apoderadoId === "" ? null : Number(b?.apoderadoId);
      if (apoId === null) {
        if (!b?.confirmarEliminacion) {
          return { ok: true, status: 200, requiereConfirmacion: true, mensaje: "¿Confirmas dejar a este estudiante sin apoderado asociado?" };
        }
        STORE_ESTUDIANTES = STORE_ESTUDIANTES.map(e =>
          Number(e.Estudiante_Id) === targetEstId
            ? { ...e, Apoderado_Usuario_Id: null, Apoderado_Nombre: "Sin asignar", Suplente_Usuario_Ids: [] }
            : e
        );
        saveStore("SIGAE_ESTUDIANTES", STORE_ESTUDIANTES);
        return { ok: true, status: 200, mensaje: "Asociación eliminada exitosamente" };
      }
      const apo = STORE_USUARIOS.find(u => Number(u.Usuario_Id) === apoId);
      STORE_ESTUDIANTES = STORE_ESTUDIANTES.map(e =>
        Number(e.Estudiante_Id) === targetEstId
          ? {
              ...e,
              Apoderado_Usuario_Id: apoId || null,
              Apoderado_Nombre: apo ? apo.Usuario_Nombre_Completo : null,
              Usuario_Telefono: apo ? apo.Usuario_Telefono : e.Usuario_Telefono,
              Usuario_Correo: apo ? (apo.Usuario_Correo || apo.Apoderado_Correo_Natural) : e.Usuario_Correo,
            }
          : e
      );
      saveStore("SIGAE_ESTUDIANTES", STORE_ESTUDIANTES);
      return { ok: true, status: 200, mensaje: "Asociación actualizada exitosamente" };
    }

    // Editar estudiante puntual
    if (p.includes("/estudiantes") && !p.includes("/apoderado") && reqId) {
      STORE_ESTUDIANTES = STORE_ESTUDIANTES.map(e => {
        if (Number(e.Estudiante_Id) === Number(reqId)) {
          const cId = b?.Curso_Id ? Number(b.Curso_Id) : e.Curso_Id;
          const cNombre = b?.Curso_Nombre || STORE_CURSOS.find(c => c.Curso_Id === cId)?.Curso_Nombre || e.Curso_Nombre;
          const calle = b?.Estudiante_Calle ?? b?.calle ?? b?.Estudiante_Direccion_Calle ?? e.Estudiante_Calle ?? e.calle ?? "";
          const numero = b?.Estudiante_Numero ?? b?.numero ?? b?.Estudiante_Direccion_Numero ?? e.Estudiante_Numero ?? e.numero ?? "";
          const depto = b?.Estudiante_Depto ?? b?.depto ?? b?.Estudiante_Direccion_Depto ?? e.Estudiante_Depto ?? e.depto ?? "";
          const comuna = b?.Estudiante_Comuna ?? b?.comuna ?? b?.Estudiante_Direccion_Comuna ?? e.Estudiante_Comuna ?? e.comuna ?? "";

          return {
            ...e,
            ...b,
            Curso_Id: cId,
            Curso_Nombre: cNombre,
            Estudiante_Estado_Academico: b?.Estudiante_Estado_Academico || b?.estadoAcademico || e.Estudiante_Estado_Academico,
            Estudiante_Calle: calle,
            Estudiante_Numero: numero,
            Estudiante_Depto: depto,
            Estudiante_Comuna: comuna,
            Estudiante_Direccion_Calle: calle,
            Estudiante_Direccion_Numero: numero,
            Estudiante_Direccion_Depto: depto,
            Estudiante_Direccion_Comuna: comuna,
            calle,
            numero,
            depto,
            comuna,
          };
        }
        return e;
      });
      saveStore("SIGAE_ESTUDIANTES", STORE_ESTUDIANTES);
      return { ok: true, status: 200, mensaje: "Estudiante actualizado exitosamente" };
    }

    if (p.includes("/eventos") && reqId) {
      STORE_EVENTOS = STORE_EVENTOS.map(e => e.Evento_Institucional_Id === reqId ? { ...e, ...b } : e);
      saveStore("SIGAE_EVENTOS", STORE_EVENTOS);
      return { ok: true, status: 200, mensaje: "Evento actualizado correctamente" };
    }
    const matchMigrar = p.match(/\/bloques\/conflictos\/(\d+)\/migrar/);
    if (matchMigrar) {
      const horarioId = Number(matchMigrar[1]);
      const bloqueDestinoId = Number(b?.bloqueDestinoId);
      const h = STORE_HORARIOS.find(x =>
        Number(x.Horario_Asignatura_Id) === horarioId &&
        x.eliminado !== 1 &&
        x.estado !== "Eliminado"
      );
      if (!h) {
        return { ok: false, status: 404, error: "Clase no encontrada o ya fue resuelta", codigo: "YA_RESUELTA" };
      }
      const dest = enriquecerBloquesMock().find(blk => Number(blk.Bloque_Horario_Id) === bloqueDestinoId);
      if (!dest) {
        return { ok: false, status: 404, error: "Bloque destino no encontrado" };
      }
      if (dest.Bloque_Horario_Tipo === "Recreo") {
        return { ok: false, status: 400, error: "No puedes migrar una clase a un bloque de Recreo" };
      }
      if (Number(dest.desajustado) === 1) {
        return { ok: false, status: 400, error: "El bloque destino también está desajustado" };
      }

      const topeCurso = STORE_HORARIOS.find(x =>
        x.eliminado !== 1 && x.estado !== "Eliminado" &&
        Number(x.Horario_Asignatura_Id) !== horarioId &&
        Number(x.Bloque_Horario_Id) === bloqueDestinoId &&
        x.dia === h.dia &&
        Number(x.Curso_Id) === Number(h.Curso_Id)
      );
      if (topeCurso) {
        return {
          ok: false, status: 409,
          error: `Tope horario: el curso ${h.Curso_Nombre || h.curso} ya tiene "${topeCurso.Asignatura_Nombre || topeCurso.asignatura}" el ${h.dia} en ese bloque.`,
        };
      }
      const topeDocente = h.Usuario_Id && STORE_HORARIOS.find(x =>
        x.eliminado !== 1 && x.estado !== "Eliminado" &&
        Number(x.Horario_Asignatura_Id) !== horarioId &&
        Number(x.Bloque_Horario_Id) === bloqueDestinoId &&
        x.dia === h.dia &&
        Number(x.Usuario_Id) === Number(h.Usuario_Id)
      );
      if (topeDocente) {
        return {
          ok: false, status: 409,
          error: `Tope docente: ${h.Docente_Nombre || h.docente} ya dicta clase en ${topeDocente.Curso_Nombre || topeDocente.curso} el ${h.dia} en ese bloque.`,
        };
      }

      STORE_HORARIOS = STORE_HORARIOS.map(x =>
        Number(x.Horario_Asignatura_Id) === horarioId
          ? {
              ...x,
              Bloque_Horario_Id: dest.Bloque_Horario_Id,
              horaInicio: dest.Bloque_Horario_Hora_Inicio,
              horaFin: dest.Bloque_Horario_Hora_Fin,
              hora_inicio: dest.Bloque_Horario_Hora_Inicio,
              hora_fin: dest.Bloque_Horario_Hora_Fin,
            }
          : x
      );
      saveStore("SIGAE_HORARIOS", STORE_HORARIOS);
      return { ok: true, status: 200, mensaje: "Clase migrada correctamente al bloque destino" };
    }
    if (p.includes("/bloques") && reqId) {
      const actual = STORE_BLOQUES.find(blk => Number(blk.Bloque_Horario_Id) === reqId);
      if (!actual) {
        return { ok: false, status: 404, error: "Bloque horario no encontrado" };
      }
      const hIniRaw = b?.Bloque_Horario_Hora_Inicio ?? actual.Bloque_Horario_Hora_Inicio;
      const hFinRaw = b?.Bloque_Horario_Hora_Fin ?? actual.Bloque_Horario_Hora_Fin;
      const jornada = b?.Bloque_Horario_Jornada ?? actual.Bloque_Horario_Jornada;
      const tipo = b?.Bloque_Horario_Tipo ?? actual.Bloque_Horario_Tipo;

      if (!esHoraMockValida(hIniRaw) || !esHoraMockValida(hFinRaw)) {
        return { ok: false, status: 400, error: "Formato de hora inválido (usa HH:MM)" };
      }
      const hIni = normHora8(hIniRaw);
      const hFin = normHora8(hFinRaw);
      if (hIni >= hFin) {
        return { ok: false, status: 400, error: "La hora de inicio debe ser menor que la hora de término" };
      }
      if (!["Clase", "Recreo"].includes(tipo) || !["Mañana", "Tarde"].includes(jornada)) {
        return { ok: false, status: 400, error: "Tipo o jornada de bloque inválido" };
      }

      const pIni = normHora8(STORE_PARAMETROS?.Parametro_Institucional_Inicio_Jornada || "08:00:00");
      const pFin = normHora8(STORE_PARAMETROS?.Parametro_Institucional_Fin_Jornada || "16:00:00");
      if (hIni < pIni || hFin > pFin) {
        return {
          ok: false, status: 400,
          error: `El bloque debe estar dentro de la jornada institucional (${pIni.slice(0, 5)} - ${pFin.slice(0, 5)})`,
        };
      }

      const solapados = enriquecerBloquesMock().filter(blk =>
        Number(blk.Bloque_Horario_Id) !== reqId &&
        Number(blk.desajustado) !== 1 &&
        blk.Bloque_Horario_Jornada === jornada &&
        normHora8(blk.Bloque_Horario_Hora_Inicio) < hFin &&
        normHora8(blk.Bloque_Horario_Hora_Fin) > hIni
      );
      if (solapados.length > 0) {
        return {
          ok: false, status: 409,
          error: "Conflicto con bloque existente en el mismo horario",
          bloquesEnConflicto: solapados,
        };
      }

      STORE_BLOQUES = STORE_BLOQUES.map(blk =>
        Number(blk.Bloque_Horario_Id) === reqId
          ? {
              ...blk,
              Bloque_Horario_Hora_Inicio: hIni,
              Bloque_Horario_Hora_Fin: hFin,
              Bloque_Horario_Jornada: jornada,
              Bloque_Horario_Tipo: tipo,
            }
          : blk
      );
      saveStore("SIGAE_BLOQUES", STORE_BLOQUES);

      STORE_HORARIOS = STORE_HORARIOS.map(h =>
        Number(h.Bloque_Horario_Id) === reqId && h.eliminado !== 1 && h.estado !== "Eliminado"
          ? { ...h, horaInicio: hIni, horaFin: hFin, hora_inicio: hIni, hora_fin: hFin }
          : h
      );
      saveStore("SIGAE_HORARIOS", STORE_HORARIOS);
      return { ok: true, status: 200, mensaje: "Bloque actualizado exitosamente" };
    }
    if (p.includes("/planes/asignaturas") && reqId) {
      const targetAsigId = Number(reqId);
      STORE_ASIGNATURAS = STORE_ASIGNATURAS.map(a =>
        Number(a.Asignatura_Id) === targetAsigId
          ? {
              ...a,
              Asignatura_Nombre: b?.nombre !== undefined ? b.nombre : a.Asignatura_Nombre,
              Asignatura_Prioridad_Academica: b?.prioridad !== undefined ? b.prioridad : a.Asignatura_Prioridad_Academica,
            }
          : a
      );
      saveStore("SIGAE_ASIGNATURAS", STORE_ASIGNATURAS);
      return { ok: true, status: 200, mensaje: "Asignatura actualizada correctamente" };
    }
    // Cambiar estado de clase individual o masivo (/api/horarios/:id/estado)
    const mHorarioEstado = urlStr.match(/\/horarios\/(\d+)\/estado/i);
    if (p.includes("/horarios") && p.includes("/estado") && (mHorarioEstado || reqId)) {
      const targetHId = mHorarioEstado ? Number(mHorarioEstado[1]) : Number(reqId);
      const nuevoEstado = b?.estado || "Suspendido";
      STORE_HORARIOS = STORE_HORARIOS.map((h) =>
        Number(h.Horario_Asignatura_Id) === targetHId
          ? {
              ...h,
              estado: nuevoEstado,
              Horario_Estado: nuevoEstado,
              Horario_Asignatura_Estado: nuevoEstado,
            }
          : h
      );
      saveStore("SIGAE_HORARIOS", STORE_HORARIOS);
      return { ok: true, status: 200, mensaje: `Clase marcada como ${nuevoEstado}` };
    }

    if (p.includes("/horarios") && p.includes("/restaurar") && reqId) {
      STORE_HORARIOS = STORE_HORARIOS.map(h =>
        h.Horario_Asignatura_Id === reqId ? { ...h, estado: "Activo", Horario_Estado: "Activo", eliminado: 0 } : h
      );
      saveStore("SIGAE_HORARIOS", STORE_HORARIOS);
      return { ok: true, status: 200, mensaje: "Clase restaurada exitosamente" };
    }

    // Editar Plan Educativo (/api/planes/:id)
    if (p.includes("/planes") && !p.includes("/asignaturas") && reqId) {
      const targetId = Number(reqId);
      STORE_PLANES = STORE_PLANES.map(pl => {
        if (Number(pl.Plan_Educativo_Id) === targetId) {
          return normalizarPlan({
            ...pl,
            nivel_educativo_id: b?.nivel_educativo_id !== undefined ? b.nivel_educativo_id : pl.Nivel_Educativo_Id,
            periodo_lectivo: b?.periodo_lectivo || pl.Plan_Educativo_Periodo_Lectivo,
            asignaturas: b?.asignaturas || pl.asignaturas,
          });
        }
        return pl;
      });
      saveStore("SIGAE_PLANES", STORE_PLANES);
      return { ok: true, status: 200, mensaje: "Plan educativo actualizado exitosamente", advertencias: [] };
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 2. CONSULTAS (GET) DINÁMICAS Y REACTIVAS
  // ═════════════════════════════════════════════════════════════════════════

  // Bloques afectados por evento (/api/bloques/eventos/:id/afectados o /api/eventos/:id/afectados)
  if (p.includes("/eventos") && p.includes("/afectados")) {
    const encontrado = STORE_EVENTOS.find(e => e.Evento_Institucional_Id === reqId) || STORE_EVENTOS[0];
    return encontrado?.bloques || [];
  }

  // Detalle de evento individual por ID (ej: /api/eventos/1)
  if (p.includes("/eventos") && reqId) {
    const encontrado = STORE_EVENTOS.find(e => e.Evento_Institucional_Id === reqId) || STORE_EVENTOS[0];
    return {
      ...encontrado,
      bloques: encontrado.bloques || [],
      clases: encontrado.clases || [],
      dia_semana: encontrado.dia_semana || "Viernes",
    };
  }

  // Eventos Institucionales completos
  if (p.includes("/eventos")) {
    return STORE_EVENTOS;
  }

  // Detalle de bloque horario (ej: /api/horarios/bloque-detalle/1)
  if (p.includes("/bloque-detalle")) {
    const matchH = reqId && STORE_HORARIOS.find(h => Number(h.Horario_Asignatura_Id) === Number(reqId) && !h.eliminado && h.estado !== "Eliminado");
    if (!matchH) {
      return { status: 404, mensaje: "El bloque horario seleccionado no existe o fue eliminado" };
    }
    const cursoObj = STORE_CURSOS.find(c => Number(c.Curso_Id) === Number(matchH.Curso_Id));
    const blkObj = STORE_BLOQUES.find(b => Number(b.Bloque_Horario_Id) === Number(matchH.Bloque_Horario_Id));
    const docObj = STORE_USUARIOS.find(u => Number(u.Usuario_Id) === Number(matchH.Usuario_Id));
    const asigObj = STORE_ASIGNATURAS.find(a => Number(a.Asignatura_Id) === Number(matchH.Asignatura_Id));
    const estadoFinal = matchH.estado || matchH.Horario_Estado || "Activo";
    const diaFinal = matchH.dia || matchH.Horario_Asignatura_Dia_Semana || "Lunes";
    const obsBase = Array.isArray(matchH.observaciones) ? [...matchH.observaciones] : [];
    if (estadoFinal === "Suspendido" && obsBase.length === 0) {
      obsBase.push("El bloque se encuentra suspendido en el horario semanal del curso.");
    }
    if (!matchH.Usuario_Id && obsBase.length === 0) {
      obsBase.push("El bloque no tiene un docente asignado.");
    }
    (STORE_EVENTOS || []).forEach((ev) => {
      if (!ev.Evento_Institucional_Fecha) return;
      const [ey, em, ed] = String(ev.Evento_Institucional_Fecha).slice(0, 10).split("-").map(Number);
      if (!ey || !em || !ed) return;
      const evtDia = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][new Date(ey, em - 1, ed).getDay()];
      if (evtDia !== diaFinal) return;
      const bloquesAfectados = Array.isArray(ev.bloques) ? ev.bloques.map(x => Number(x.Bloque_Horario_Id || x.id)) : [];
      const afectaPorTotal = ev.Evento_Institucional_Impacto_Clases === "Suspensión total" && bloquesAfectados.length === 0;
      const afectaPorTarde = ev.Evento_Institucional_Impacto_Clases === "Salida anticipada" && bloquesAfectados.length === 0 && (blkObj?.Bloque_Horario_Jornada === "Tarde" || matchH.jornada === "Tarde");
      if (afectaPorTotal || afectaPorTarde || bloquesAfectados.includes(Number(matchH.Bloque_Horario_Id))) {
        obsBase.push(`Suspendido el ${String(ev.Evento_Institucional_Fecha).slice(0, 10)} por "${ev.Evento_Institucional_Nombre}" (${ev.Evento_Institucional_Impacto_Clases}).`);
      }
    });
    return {
      horarioId: matchH.Horario_Asignatura_Id,
      curso: matchH.curso || cursoObj?.Curso_Nombre || "1° Básico A",
      nivelEducativo: cursoObj?.Nivel_Educativo_Nombre || `${matchH.Curso_Id || 1}° Básico`,
      dia: diaFinal,
      horaInicio: matchH.horaInicio || matchH.hora_inicio || blkObj?.Bloque_Horario_Hora_Inicio || "08:00:00",
      horaFin: matchH.horaFin || matchH.hora_fin || blkObj?.Bloque_Horario_Hora_Fin || "08:45:00",
      hora_inicio: matchH.hora_inicio || matchH.horaInicio || blkObj?.Bloque_Horario_Hora_Inicio || "08:00:00",
      hora_fin: matchH.hora_fin || matchH.horaFin || blkObj?.Bloque_Horario_Hora_Fin || "08:45:00",
      jornada: matchH.jornada || blkObj?.Bloque_Horario_Jornada || "Mañana",
      tipoBloque: blkObj?.Bloque_Horario_Tipo || "Clase",
      asignatura: matchH.asignatura || asigObj?.Asignatura_Nombre || "Asignatura",
      prioridadAcademica: asigObj?.Asignatura_Prioridad_Academica || "Media",
      docente: matchH.docente || docObj?.Usuario_Nombre_Completo || "Sin docente asignado",
      especialidadDocente: docObj?.Docente_Especialidad || "",
      estado: estadoFinal,
      observaciones: obsBase,
    };
  }

  // Citaciones de historial, pendientes y detalle
  if (p.includes("/citaciones/pendientes")) {
    const ctx = getContextoUsuarioMock(urlStr);
    const rolSolicitado = ctx.rol || "Apoderado";
    const requiereObjetivo = rolSolicitado === "Apoderado" ? "Apoderado" : "Docente";
    const pendientes = STORE_CITACIONES
      .map(c => enriquecerCitacionMock(c, urlStr))
      .filter(c => !yaPasoCitacionMock(c) && c.Requiere_Confirmacion_De === requiereObjetivo && c.Puede_Confirmar)
      .sort((a, b) =>
        `${a.Citacion_Fecha} ${a.Citacion_Tramo_Horario || ""}`.localeCompare(
          `${b.Citacion_Fecha} ${b.Citacion_Tramo_Horario || ""}`
        ) || Number(a.Citacion_Id) - Number(b.Citacion_Id)
      );
    if (pendientes.length === 0) {
      return {
        mensaje: `No existen citaciones pendientes para el ${rolSolicitado.toLowerCase()}`,
        citaciones: [],
      };
    }
    return pendientes;
  }
  if (p.includes("/citaciones/estudiante/") && p.includes("/historial")) {
    const matchEst = p.match(/\/citaciones\/estudiante\/(\d+)\/historial/);
    const estId = matchEst ? Number(matchEst[1]) : Number(reqId);
    const lista = STORE_CITACIONES
      .map(c => enriquecerCitacionMock(c, urlStr))
      .filter(c => Number(c.Estudiante_Id) === estId)
      .sort((a, b) =>
        `${b.Citacion_Fecha} ${b.Citacion_Tramo_Horario || ""}`.localeCompare(
          `${a.Citacion_Fecha} ${a.Citacion_Tramo_Horario || ""}`
        )
      );
    if (lista.length === 0) {
      return { mensaje: "No existen citaciones registradas para el estudiante seleccionado", citaciones: [] };
    }
    return { citaciones: lista };
  }
  if (p.includes("/citaciones/historial")) {
    return STORE_CITACIONES.map(c => enriquecerCitacionMock(c, urlStr));
  }

  // Citación individual por ID
  if (p.includes("/citaciones/") && reqId && !p.includes("/estudiante") && !p.includes("/solicitud")) {
    const found = STORE_CITACIONES.find(c => Number(c.Citacion_Id) === Number(reqId));
    if (!found) {
      return { ok: false, status: 404, mensaje: "La citación seleccionada no existe o no está disponible" };
    }
    const enriquecida = enriquecerCitacionMock(found, urlStr);
    return {
      ...enriquecida,
      historial: Array.isArray(enriquecida.historial) && enriquecida.historial.length > 0
        ? enriquecida.historial
        : [
            {
              Historial_Id: 1,
              Historial_Fecha_Registro: enriquecida.Citacion_Fecha,
              Historial_Hora_Registro: enriquecida.Citacion_Hora_Inicio,
              Accion: "Citación creada",
              Historial_Descripcion_Cambio: "Citación creada",
            },
          ],
    };
  }

  // Solicitud de citaciones del apoderado: estudiantes asociados (RF56 / CU89)
  if (p.includes("/citaciones/solicitud/estudiantes")) {
    const ctx = getContextoUsuarioMock(urlStr);
    const uid = Number(ctx.userId || 0);
    const asociados = uid
      ? STORE_ESTUDIANTES.filter(
          (e) =>
            Number(e.Apoderado_Usuario_Id) === uid ||
            (Array.isArray(e.Suplente_Usuario_Ids) && e.Suplente_Usuario_Ids.map(Number).includes(uid))
        )
      : STORE_ESTUDIANTES;
    return {
      estudiantes: asociados.map((e) => ({
        Estudiante_Id: e.Estudiante_Id,
        Estudiante_Nombre_Completo: e.Estudiante_Nombre_Completo,
        Curso_Nombre: e.Curso_Nombre,
        Rol_Apoderado:
          uid &&
          Array.isArray(e.Suplente_Usuario_Ids) &&
          e.Suplente_Usuario_Ids.map(Number).includes(uid) &&
          Number(e.Apoderado_Usuario_Id) !== uid
            ? "Suplente"
            : "Titular"
      }))
    };
  }

  // Solicitud de citaciones del apoderado: docentes del estudiante (RF56 / CU89)
  if (p.includes("/citaciones/solicitud/estudiante/") && p.includes("/docentes")) {
    return {
      docentes: STORE_USUARIOS.filter(u => u.Es_Docente).map(d => ({
        Usuario_Id: d.Usuario_Id,
        Usuario_Nombre_Completo: d.Usuario_Nombre_Completo,
        Docente_Correo_Institucional: d.Docente_Correo_Institucional || d.Usuario_Correo,
        Docente_Especialidad: d.Docente_Especialidad || "General",
        Tiene_Horario_Atencion: STORE_HORARIOS_ATENCION.some(h => Number(h.Usuario_Id) === Number(d.Usuario_Id)),
        Asignaturas: d.Docente_Especialidad || "General"
      }))
    };
  }

  // Solicitud de citaciones del apoderado: tramos libres de horario de atención (RF56 / CU89)
  if (p.includes("/citaciones/solicitud/disponibilidad")) {
    try {
      const urlObj = new URL(urlStr, "http://localhost");
      const docenteId = Number(urlObj.searchParams.get("docenteId") || 3);
      const bloquesDocente = STORE_HORARIOS_ATENCION.filter(b => Number(b.Usuario_Id) === docenteId);
      if (!bloquesDocente.length) {
        return { dias: [], mensaje: "El docente no tiene horario de atención configurado" };
      }

      const diasSemanaMap = { 1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes" };
      const hoy = new Date();
      const diasDisponibles = [];

      for (let i = 1; i <= 14; i++) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
        const dayOfWeek = d.getDay();
        const diaNombre = diasSemanaMap[dayOfWeek];
        if (!diaNombre) continue;

        const atencionDia = bloquesDocente.filter(b => b.Horario_Atencion_Dia_Semana === diaNombre);
        if (!atencionDia.length) continue;

        const pad = (n) => String(n).padStart(2, "0");
        const fechaStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

        const tramos = [];
        atencionDia.forEach(b => {
          const toMin = (hhmm) => {
            const [h, m] = (hhmm || "00:00").split(":").map(Number);
            return h * 60 + m;
          };
          const toHHMM = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
          const ini = toMin(b.Horario_Atencion_Hora_Inicio);
          const fin = toMin(b.Horario_Atencion_Hora_Fin);
          for (let cur = ini; cur + 45 <= fin; cur += 45) {
            const tramoLabel = `${toHHMM(cur)} - ${toHHMM(cur + 45)}`;
            const ocupado = STORE_CITACIONES.some(c =>
              Number(c.Docente_Usuario_Id) === docenteId &&
              c.Citacion_Fecha === fechaStr &&
              c.Citacion_Tramo_Horario === tramoLabel &&
              c.Citacion_Estado !== "Cancelada"
            );
            if (!ocupado) {
              tramos.push(tramoLabel);
            }
          }
        });

        if (tramos.length > 0) {
          diasDisponibles.push({
            fecha: fechaStr,
            dia: diaNombre,
            tramos
          });
        }
      }

      return {
        dias: diasDisponibles,
        mensaje: diasDisponibles.length ? "" : "El docente no tiene bloques disponibles en los próximos días"
      };
    } catch {
      return { dias: [], mensaje: "Error al consultar disponibilidad" };
    }
  }

  // Horario de atención a apoderados (/api/horario-atencion)
  if (p.includes("/horario-atencion") && !reqId) {
    const ctx = getContextoUsuarioMock(urlStr);
    let docenteFilter = null;
    try {
      const u = new URL(urlStr, "http://localhost");
      const qDoc = u.searchParams.get("docente_id") || u.searchParams.get("usuario_id");
      if (qDoc) docenteFilter = Number(qDoc);
    } catch { /* ignore */ }
    if (docenteFilter) {
      return STORE_HORARIOS_ATENCION.filter(b => Number(b.Usuario_Id) === docenteFilter);
    }
    if (ctx.rol === "Docente" && ctx.userId) {
      return STORE_HORARIOS_ATENCION.filter(b => Number(b.Usuario_Id) === ctx.userId);
    }
    return STORE_HORARIOS_ATENCION;
  }

  // Citaciones lista general (agenda para docente, apoderado o administrador)
  if (p.includes("/citaciones") && !p.includes("/solicitud") && !p.includes("/contactos")) {
    const ctx = getContextoUsuarioMock(urlStr);
    const normList = STORE_CITACIONES.map(normalizarCitacionMock);
    const filtradas = normList.filter((c) => {
      if (ctx.rol === "Administrador") return true;
      if (ctx.rol === "Docente" && ctx.userId) return Number(c.Docente_Usuario_Id) === ctx.userId;
      if (ctx.rol === "Apoderado" && ctx.userId) return Number(c.Apoderado_Usuario_Id) === ctx.userId;
      if (ctx.userId) {
        return Number(c.Docente_Usuario_Id) === ctx.userId || Number(c.Apoderado_Usuario_Id) === ctx.userId;
      }
      return true;
    });
    if (filtradas.length === 0) {
      return { mensaje: "No existen citaciones asociadas al usuario", citaciones: [] };
    }
    return filtradas
      .map((c) => enriquecerCitacionMock(c, urlStr))
      .sort((a, b) =>
        `${a.Citacion_Fecha} ${a.Citacion_Tramo_Horario || ""}`.localeCompare(
          `${b.Citacion_Fecha} ${b.Citacion_Tramo_Horario || ""}`
        ) || Number(a.Citacion_Id) - Number(b.Citacion_Id)
      );
  }

  // Contactos de apoderados para citación
  if (p.includes("/citaciones/estudiante/") && p.includes("/contactos")) {
    const estMatch = p.match(/\/citaciones\/estudiante\/(\d+)\/contactos/);
    const eId = estMatch ? Number(estMatch[1]) : reqId;
    const est = STORE_ESTUDIANTES.find(e => Number(e.Estudiante_Id) === Number(eId));
    const apo = est
      ? (est.Apoderado_Usuario_Id
        ? STORE_USUARIOS.find(u => Number(u.Usuario_Id) === Number(est.Apoderado_Usuario_Id))
        : (est.Apoderado_Nombre
          ? STORE_USUARIOS.find(u => u.Usuario_Nombre_Completo === est.Apoderado_Nombre)
          : null))
      : STORE_USUARIOS.find(u => Number(u.Usuario_Id) === 4);
    const mapContacto = (u) => u && {
      Usuario_Id: u.Usuario_Id,
      Usuario_Nombre_Completo: u.Usuario_Nombre_Completo,
      Usuario_Correo: u.Usuario_Correo || u.Apoderado_Correo_Natural || null,
      Apoderado_Correo_Natural: u.Apoderado_Correo_Natural || u.Usuario_Correo || null,
      Usuario_Telefono: u.Usuario_Telefono || null,
    };
    const suplenteIds = Array.isArray(est?.Suplente_Usuario_Ids) ? est.Suplente_Usuario_Ids : [];
    const suplentes = suplenteIds
      .map(id => STORE_USUARIOS.find(u => Number(u.Usuario_Id) === Number(id)))
      .filter(Boolean)
      .map(mapContacto);
    return {
      titular: mapContacto(apo) || null,
      suplentes,
    };
  }

  // Clases en bloques desajustados o con clases pendientes (/api/bloques/conflictos)
  if (p.includes("/bloques/conflictos")) {
    const qMatch = p.match(/[?&]bloque=(\d+)/);
    const filtroBloque = qMatch ? Number(qMatch[1]) : null;
    const enriquecidos = enriquecerBloquesMock();
    const desajustadoPorId = new Map(
      enriquecidos
        .filter(blk => Number(blk.desajustado) === 1)
        .map(blk => [Number(blk.Bloque_Horario_Id), blk])
    );
    const destinos = enriquecidos.filter(blk =>
      blk.Bloque_Horario_Tipo === "Clase" &&
      Number(blk.desajustado) !== 1 &&
      (!filtroBloque || Number(blk.Bloque_Horario_Id) !== filtroBloque)
    );
    const activos = STORE_HORARIOS.filter(h =>
      h.eliminado !== 1 && (h.estado || h.Horario_Estado || "Activo") !== "Eliminado"
    );
    const clases = activos
      .filter(h => {
        const bId = Number(h.Bloque_Horario_Id);
        return filtroBloque ? bId === filtroBloque : desajustadoPorId.has(bId);
      })
      .map(h => {
        const bId = Number(h.Bloque_Horario_Id);
        const blk = enriquecidos.find(x => Number(x.Bloque_Horario_Id) === bId) || {};
        const dia = h.dia || h.Horario_Asignatura_Dia_Semana || "Lunes";
        const ocupados = new Set(
          activos
            .filter(x =>
              (x.dia || x.Horario_Asignatura_Dia_Semana) === dia &&
              (Number(x.Curso_Id) === Number(h.Curso_Id) || (h.Usuario_Id && Number(x.Usuario_Id) === Number(h.Usuario_Id)))
            )
            .map(x => Number(x.Bloque_Horario_Id))
        );
        const sug = destinos.find(d =>
          Number(d.Bloque_Horario_Id) !== bId &&
          d.Bloque_Horario_Jornada === (blk.Bloque_Horario_Jornada || "Mañana") &&
          !ocupados.has(Number(d.Bloque_Horario_Id))
        ) || destinos.find(d =>
          Number(d.Bloque_Horario_Id) !== bId &&
          !ocupados.has(Number(d.Bloque_Horario_Id))
        ) || null;
        return {
          Horario_Asignatura_Id: h.Horario_Asignatura_Id,
          Curso_Id: h.Curso_Id,
          Curso_Nombre: h.Curso_Nombre || h.curso || "",
          Asignatura_Id: h.Asignatura_Id,
          Asignatura_Nombre: h.Asignatura_Nombre || h.asignatura || "",
          Docente_Nombre: h.Docente_Nombre || h.docente || "",
          Horario_Asignatura_Dia_Semana: dia,
          Bloque_Horario_Id: h.Bloque_Horario_Id,
          Bloque_Horario_Hora_Inicio: blk.Bloque_Horario_Hora_Inicio || h.horaInicio || "",
          Bloque_Horario_Hora_Fin: blk.Bloque_Horario_Hora_Fin || h.horaFin || "",
          Bloque_Horario_Jornada: blk.Bloque_Horario_Jornada || "Mañana",
          motivo_desajuste: blk.motivo_desajuste || "Bloque con clases pendientes",
          Sugerido_Id: sug ? sug.Bloque_Horario_Id : null,
        };
      });
    return { clases, destinos };
  }

  // Bloques horarios institucionales
  if (p.includes("/bloques") && !p.includes("/bloques-libres") && !p.includes("/parametros") && !p.includes("/eventos") && !p.includes("/conflictos")) {
    return enriquecerBloquesMock();
  }

  // Asignaturas de planes educativos (/api/planes/asignaturas)
  if (p.includes("/planes/asignaturas")) {
    asegurarIdsUnicos(STORE_ASIGNATURAS, "Asignatura_Id", "SIGAE_ASIGNATURAS");
    return STORE_ASIGNATURAS;
  }

  // Niveles sin plan para un periodo específico (/api/planes/niveles-sin-plan?periodo=...)
  if (p.includes("/planes/niveles-sin-plan")) {
    try {
      const urlObj = new URL(urlStr, "http://localhost");
      const periodoQ = (urlObj.searchParams.get("periodo") || "2026").trim();
      const nivelesConPlan = STORE_PLANES
        .filter(pl => String(pl.Plan_Educativo_Periodo_Lectivo) === periodoQ)
        .map(pl => Number(pl.Nivel_Educativo_Id));
      return NIVELES_EDUCATIVOS.filter(n => !nivelesConPlan.includes(n.Nivel_Educativo_Id));
    } catch {
      return NIVELES_EDUCATIVOS;
    }
  }

  // Detalle de Plan individual por ID (/api/planes/:id)
  if (p.includes("/planes/") && reqId && !p.includes("/asignaturas") && !p.includes("/niveles")) {
    const plan = STORE_PLANES.find(pl => Number(pl.Plan_Educativo_Id) === Number(reqId));
    return plan || STORE_PLANES[0] || null;
  }

  // Listado general de Planes educativos (/api/planes)
  if (p.includes("/planes") && !p.includes("/asignaturas") && !p.includes("/niveles")) {
    return STORE_PLANES;
  }

  // Verificar si RUT de estudiante ya existe (/api/estudiantes/verificar-rut?rut=...)
  if (p.includes("/estudiantes/verificar-rut")) {
    try {
      const urlObj = new URL(urlStr, "http://localhost");
      const rutQ = (urlObj.searchParams.get("rut") || "").trim().toLowerCase();
      const existe = STORE_ESTUDIANTES.some(e => (e.Estudiante_RUT || "").toLowerCase() === rutQ);
      return { existe };
    } catch {
      return { existe: false };
    }
  }

  // Estudiantes sin apoderado asignado
  if (p.includes("/estudiantes/sin-apoderado")) {
    asegurarIdsUnicos(STORE_ESTUDIANTES, "Estudiante_Id", "SIGAE_ESTUDIANTES");
    return STORE_ESTUDIANTES.filter(e => !e.Apoderado_Usuario_Id);
  }

  // Buscar estudiantes por nombre o RUT (/api/estudiantes/buscar?criterio=...)
  if (p.includes("/estudiantes/buscar")) {
    try {
      const urlObj = new URL(urlStr, "http://localhost");
      const crit = (urlObj.searchParams.get("criterio") || "").trim().toLowerCase();
      if (!crit) return STORE_ESTUDIANTES.map(normalizarEstudiante);
      const coincidencias = STORE_ESTUDIANTES.filter(e =>
        (e.Estudiante_Nombre_Completo || "").toLowerCase().includes(crit) ||
        (e.Estudiante_RUT || "").toLowerCase().includes(crit)
      ).map(normalizarEstudiante);
      if (coincidencias.length === 0) {
        return { mensaje: "No se encontraron estudiantes con el criterio ingresado", estudiantes: [] };
      }
      return coincidencias;
    } catch {
      return STORE_ESTUDIANTES.map(normalizarEstudiante);
    }
  }

  // Estudiantes asociados a apoderado (/api/estudiantes/apoderado/:id/asociados)
  if (p.includes("/estudiantes/apoderado/") && p.includes("/asociados")) {
    const matchEst = p.match(/\/asociados\/(\d+)/);
    if (matchEst) {
      const estId = Number(matchEst[1]);
      const encontrado = STORE_ESTUDIANTES.find(e => Number(e.Estudiante_Id) === estId) || STORE_ESTUDIANTES[0];
      return encontrado ? normalizarEstudiante(encontrado) : null;
    }
    const matchApod = p.match(/\/estudiantes\/apoderado\/(\d+)\/asociados/);
    const apodId = matchApod ? Number(matchApod[1]) : Number(reqId);
    if (apodId) {
      return STORE_ESTUDIANTES.filter(
        e =>
          Number(e.Apoderado_Usuario_Id) === apodId ||
          (Array.isArray(e.Suplente_Usuario_Ids) && e.Suplente_Usuario_Ids.map(Number).includes(apodId))
      ).map(normalizarEstudiante);
    }
    return STORE_ESTUDIANTES.filter(e => e.Apoderado_Usuario_Id).map(normalizarEstudiante);
  }

  // Dashboard Estadísticas - Reactivo y Dinámico
  if (p.includes("/dashboard/stats")) {
    return {
      usuarios: STORE_USUARIOS.length,
      docentes: STORE_USUARIOS.filter(u => u.Es_Docente).length,
      apoderados: STORE_USUARIOS.filter(u => u.Es_Apoderado).length,
      estudiantes: STORE_ESTUDIANTES.length,
      cursos: STORE_CURSOS.length,
      citaciones: STORE_CITACIONES.length,
      totalUsuarios: STORE_USUARIOS.length,
      totalDocentes: STORE_USUARIOS.filter(u => u.Es_Docente).length,
      totalApoderados: STORE_USUARIOS.filter(u => u.Es_Apoderado).length,
      totalEstudiantes: STORE_ESTUDIANTES.length,
      totalCursos: STORE_CURSOS.length,
      totalCitaciones: STORE_CITACIONES.length,
    };
  }

  // Administradores (lista o individual)
  if (p.includes("/usuarios/administradores")) {
    if (reqId) {
      const matchAdmin = STORE_USUARIOS.find((u) => Number(u.Usuario_Id) === Number(reqId) && u.Es_Administrador);
      return matchAdmin || STORE_USUARIOS.find((u) => u.Es_Administrador) || null;
    }
    return STORE_USUARIOS.filter(u => u.Es_Administrador);
  }

  // Docentes (soporta filtros por especialidad y estado activo/inactivo)
  if (p.includes("/docentes")) {
    let list = STORE_USUARIOS.filter(u => u.Es_Docente);
    if (p.includes("/horarios/docentes")) {
      list = list
        .filter(u => Number(u.Usuario_Estado_Cuenta) === 1)
        .sort((a, b) => String(a.Usuario_Nombre_Completo || "").localeCompare(String(b.Usuario_Nombre_Completo || ""), "es"));
    } else {
      try {
        const urlObj = new URL(urlStr, "http://localhost");
        const crit = (urlObj.searchParams.get("especialidad") || urlObj.searchParams.get("criterio") || urlObj.searchParams.get("busqueda") || urlObj.searchParams.get("q") || "").trim().toLowerCase();
        const est = urlObj.searchParams.get("estado");
        if (crit) {
          list = list.filter(d =>
            (d.Docente_Especialidad || "").toLowerCase().includes(crit) ||
            (d.Usuario_Nombre_Completo || "").toLowerCase().includes(crit) ||
            (d.Usuario_RUT || "").toLowerCase().includes(crit)
          );
        }
        if (est !== null && est !== "" && est !== undefined) {
          list = list.filter(d => String(d.Usuario_Estado_Cuenta) === String(est));
        }
      } catch {
        // Ignora errores de URL
      }
    }
    return list.map(d => ({
      ...d,
      Docente_Correo_Institucional: d.Docente_Correo_Institucional || d.Usuario_Correo,
      Usuario_Telefono: d.Usuario_Telefono,
      Carga_Horaria_Maxima: Number(d.Docente_Carga_Horaria_Maxima ?? d.Carga_Horaria_Maxima ?? 36),
      Docente_Especialidad: d.Docente_Especialidad || "General"
    }));
  }

  // Apoderados vinculados a un estudiante (/api/estudiantes/:id/apoderados)
  const mEstApo = urlStr.match(/\/estudiantes\/(\d+)\/apoderados/i);
  if (p.includes("/estudiantes") && p.includes("/apoderados") && (mEstApo || reqId)) {
    const estId = mEstApo ? Number(mEstApo[1]) : Number(reqId);
    const est = STORE_ESTUDIANTES.find(e => Number(e.Estudiante_Id) === estId);
    if (!est) return { status: 404, mensaje: "Ficha de estudiante no encontrada" };
    const formatearContacto = (u) => u && ({
      Usuario_Id: Number(u.Usuario_Id),
      Usuario_Nombre_Completo: u.Usuario_Nombre_Completo,
      Usuario_RUT: u.Usuario_RUT,
      Usuario_Telefono: u.Usuario_Telefono,
      Usuario_Correo: u.Apoderado_Correo_Natural || u.Usuario_Correo || null,
      Usuario_Estado_Cuenta: Number(u.Usuario_Estado_Cuenta),
    });
    const apo = STORE_USUARIOS.find(u => Number(u.Usuario_Id) === Number(est.Apoderado_Usuario_Id));
    const suplenteIds = Array.isArray(est.Suplente_Usuario_Ids) ? est.Suplente_Usuario_Ids : [];
    const suplentes = suplenteIds
      .map(id => STORE_USUARIOS.find(u => Number(u.Usuario_Id) === Number(id)))
      .filter(Boolean)
      .map(formatearContacto);
    return {
      estudiante: normalizarEstudiante(est),
      titular: formatearContacto(apo) || null,
      suplentes,
      maxSuplentes: 4,
    };
  }

  // Apoderados (con cálculo dinámico de estudiantes vinculados y filtrado por operador)
  if (p.includes("/apoderados") && !p.includes("/estudiantes")) {
    let lista = STORE_USUARIOS.filter(u => u.Es_Apoderado).map(u => ({
      ...u,
      Apoderado_Correo_Natural: u.Usuario_Correo,
      Total_Estudiantes_Asociados: STORE_ESTUDIANTES.filter(e => Number(e.Apoderado_Usuario_Id) === Number(u.Usuario_Id)).length,
    }));
    try {
      const urlObj = new URL(urlStr, "http://localhost");
      const op = urlObj.searchParams.get("operador") || "=";
      const cantStr = urlObj.searchParams.get("cantidadEstudiantes");
      if (cantStr !== null && cantStr !== "" && cantStr !== undefined) {
        const cant = Number(cantStr);
        if (!isNaN(cant)) {
          lista = lista.filter(u => {
            const t = u.Total_Estudiantes_Asociados;
            if (op === "=") return t === cant;
            if (op === "!=") return t !== cant;
            if (op === ">") return t > cant;
            if (op === "<") return t < cant;
            if (op === ">=") return t >= cant;
            if (op === "<=") return t <= cant;
            return true;
          });
        }
      }
    } catch { /* ignore */ }
    return lista;
  }

  // Estudiantes de un curso para profesor jefe (/api/estudiantes/curso/:id/mis-estudiantes)
  if (p.includes("/estudiantes/curso/") && p.includes("/mis-estudiantes")) {
    const m = urlStr.match(/\/estudiantes\/curso\/(\d+)\/mis-estudiantes/i);
    const cId = m ? Number(m[1]) : 1;
    return STORE_ESTUDIANTES.filter(e => Number(e.Curso_Id) === cId).map(normalizarEstudiante);
  }

  // Todas las vinculaciones de un apoderado (/api/estudiantes/apoderado/:id/todas)
  if (p.includes("/estudiantes/apoderado/") && p.includes("/todas")) {
    const m = urlStr.match(/\/estudiantes\/apoderado\/(\d+)\/todas/i);
    const aId = m ? Number(m[1]) : 4;
    return STORE_ESTUDIANTES.filter(e => Number(e.Apoderado_Usuario_Id) === aId).map(normalizarEstudiante);
  }

  // Estudiantes de un curso desde gestión de cursos (/api/cursos/:id/estudiantes)
  const mCursoEst = urlStr.match(/\/cursos\/(\d+)\/estudiantes/i);
  if (p.includes("/cursos/") && p.includes("/estudiantes") && (mCursoEst || reqId)) {
    const cId = mCursoEst ? Number(mCursoEst[1]) : Number(reqId);
    const curso = STORE_CURSOS.find(c => Number(c.Curso_Id) === cId);
    const ests = STORE_ESTUDIANTES
      .filter(e => Number(e.Curso_Id) === cId)
      .map(e => ({
        Estudiante_Id: Number(e.Estudiante_Id),
        Estudiante_Nombre_Completo: e.Estudiante_Nombre_Completo,
        Estudiante_RUT: e.Estudiante_RUT,
        Estudiante_Estado_Academico: e.Estudiante_Estado_Academico || "Regular"
      }));
    return {
      curso: curso || { Curso_Id: cId, Curso_Nombre: `Curso #${cId}` },
      estudiantes: ests,
      ...(ests.length === 0 && { mensaje: "El curso no tiene estudiantes asignados." })
    };
  }

  // Estudiantes general con filtros curso y estado
  if (p.includes("/estudiantes") && !p.includes("/cursos/") && !p.includes("/apoderad") && !p.includes("/mis-estudiantes")) {
    if (reqId) {
      const target = STORE_ESTUDIANTES.find(e => Number(e.Estudiante_Id) === Number(reqId)) || STORE_ESTUDIANTES[0];
      return normalizarEstudiante(target);
    }
    let lista = STORE_ESTUDIANTES.map(normalizarEstudiante);
    try {
      const urlObj = new URL(urlStr, "http://localhost");
      const curso = urlObj.searchParams.get("curso");
      const estado = urlObj.searchParams.get("estado");
      if (curso) lista = lista.filter(e => String(e.Curso_Id) === String(curso) || e.Curso_Nombre === curso);
      if (estado) lista = lista.filter(e => e.Estudiante_Estado_Academico === estado);
    } catch { /* ignore */ }
    return lista;
  }

  // Promoción, Situación Final y Cierre de Período (/api/promocion/...)
  if (p.includes("/promocion/")) {
    const calcResumenCurso = (cursoId) => {
      const ests = STORE_ESTUDIANTES.filter(e => Number(e.Curso_Id) === Number(cursoId));
      const items = ests.map(e => {
        const sit = STORE_SITUACIONES[e.Estudiante_Id] || null;
        return {
          Estudiante_Id: e.Estudiante_Id,
          Estudiante_Nombre_Completo: e.Estudiante_Nombre_Completo,
          Estudiante_RUT: e.Estudiante_RUT,
          enCurso: (e.Estudiante_Estado_Academico || "Regular") === "Regular",
          situacion: sit,
        };
      });
      return {
        items,
        resumen: {
          total: items.length,
          sinSituacion: items.filter(x => !x.situacion).length,
          borrador: items.filter(x => x.situacion?.estado === "Borrador").length,
          registrado: items.filter(x => x.situacion?.estado === "Registrado").length,
          aplicado: items.filter(x => x.situacion?.estado === "Aplicado").length,
        },
      };
    };

    if (p.includes("/promocion/periodos/estado")) {
      const vigente = STORE_PERIODO_ESTADO.vigente || "2026";
      const cierreIniciado = Boolean(STORE_PERIODO_ESTADO.cierreIniciado);
      const cursosVigentes = STORE_CURSOS
        .filter(c => (c.Curso_Periodo_Lectivo || vigente) === vigente)
        .map(c => ({
          Curso_Id: c.Curso_Id,
          Curso_Nombre: c.Curso_Nombre,
          ...calcResumenCurso(c.Curso_Id).resumen,
        }));
      const cursosSiguientes = cierreIniciado
        ? STORE_CURSOS.filter(c => c.Curso_Periodo_Lectivo === STORE_PERIODO_ESTADO.siguiente)
        : [];
      const pendientes = cursosVigentes.reduce((s, c) => s + c.sinSituacion + c.borrador, 0);
      return {
        periodos: { ...STORE_PERIODO_ESTADO },
        cursosVigentes,
        cursosSiguientes,
        puedeIniciarNuevoPeriodo: cierreIniciado && pendientes === 0,
        motivos: pendientes > 0 ? [`Hay ${pendientes} estudiante(s) sin situación final confirmada`] : [],
        limpieza: { cursos: 0, estudiantes: 0, apoderadosEliminar: 0, apoderadosDesactivar: 0, apoderadosQuitarRol: 0 },
      };
    }

    if (p.includes("/promocion/cursos/") && p.includes("/situaciones")) {
      const mId = urlStr.match(/\/promocion\/cursos\/(\d+)\//i);
      const cursoId = mId ? Number(mId[1]) : 1;
      const curso = STORE_CURSOS.find(c => Number(c.Curso_Id) === cursoId) || STORE_CURSOS[0];
      const { items, resumen } = calcResumenCurso(curso.Curso_Id);
      const esUltimoMedio = /4°\s*Medio/i.test(curso.Curso_Nombre || "");
      return {
        curso,
        periodo: curso.Curso_Periodo_Lectivo || STORE_PERIODO_ESTADO.vigente || "2026",
        cierreIniciado: Boolean(STORE_PERIODO_ESTADO.cierreIniciado),
        valoresPermitidos: esUltimoMedio
          ? ["Egresado", "Repitente", "Retirado"]
          : ["Promovido", "Repitente", "Retirado"],
        estudiantes: items,
        resumen,
      };
    }
  }

  // Mensajería Interna (/api/mensajes/...)
  if (p.includes("/mensajes/")) {
    const ctx = getContextoUsuarioMock(urlStr);
    const miRol = ctx.rol === "Apoderado" ? "Apoderado" : "Docente";
    if (p.includes("/mensajes/conversaciones/") && p.includes("/mensajes")) {
      const mConv = urlStr.match(/\/conversaciones\/(\d+)\//i);
      const convId = mConv ? Number(mConv[1]) : 1;
      const conv = STORE_CONVERSACIONES.find(c => Number(c.Conversacion_Id) === convId) || STORE_CONVERSACIONES[0];
      const mensajes = STORE_MENSAJES.filter(m => Number(m.Conversacion_Id) === convId);
      return {
        conversacion: conv
          ? {
              ...conv,
              Mi_Rol: miRol,
              Contacto_Nombre: miRol === "Apoderado" ? conv.Docente_Nombre : conv.Apoderado_Nombre,
            }
          : null,
        mensajes,
      };
    }
    if (p.includes("/mensajes/conversaciones/") && p.includes("/contacto")) {
      const mConv = urlStr.match(/\/conversaciones\/(\d+)\//i);
      const convId = mConv ? Number(mConv[1]) : 1;
      const conv = STORE_CONVERSACIONES.find(c => Number(c.Conversacion_Id) === convId) || STORE_CONVERSACIONES[0];
      if (!conv) return {};
      if (miRol === "Docente") {
        const apoU = STORE_USUARIOS.find(u => Number(u.Usuario_Id) === Number(conv.Apoderado_Usuario_Id));
        const ests = STORE_ESTUDIANTES.filter(e => Number(e.Apoderado_Usuario_Id) === Number(conv.Apoderado_Usuario_Id));
        return {
          Rol: "Apoderado",
          Nombre: conv.Apoderado_Nombre,
          Telefono: apoU?.Usuario_Telefono || "+56 9 3344 5566",
          Correo: apoU?.Apoderado_Correo_Natural || apoU?.Usuario_Correo || "apoderado@correo.cl",
          Estudiantes: ests.map(e => ({ Estudiante_Id: e.Estudiante_Id, Nombre: e.Estudiante_Nombre_Completo, Curso: e.Curso_Nombre })),
        };
      }
      const docU = STORE_USUARIOS.find(u => Number(u.Usuario_Id) === Number(conv.Docente_Usuario_Id));
      return {
        Rol: "Docente",
        Nombre: conv.Docente_Nombre,
        Especialidad: docU?.Docente_Especialidad || "General",
        Correo: docU?.Docente_Correo_Institucional || docU?.Usuario_Correo || "docente@colegio.cl",
        Asignaturas: [{ Nombre: "Matemáticas", Curso: "1° Básico A" }],
      };
    }
    if (p.includes("/mensajes/conversaciones")) {
      const uid = ctx.userId || (miRol === "Apoderado" ? 4 : 3);
      return STORE_CONVERSACIONES
        .filter(c => miRol === "Apoderado" ? Number(c.Apoderado_Usuario_Id) === uid : Number(c.Docente_Usuario_Id) === uid)
        .map(c => {
          const msgs = STORE_MENSAJES.filter(m => Number(m.Conversacion_Id) === Number(c.Conversacion_Id));
          const noLeidos = msgs.filter(m => m.Mensaje_Remitente_Rol !== miRol && m.Mensaje_Estado === "No leído").length;
          return {
            ...c,
            Mi_Rol: miRol,
            Contacto_Nombre: miRol === "Apoderado" ? c.Docente_Nombre : c.Apoderado_Nombre,
            No_Leidos: noLeidos,
          };
        });
    }
    if (p.includes("/mensajes/contactos")) {
      if (miRol === "Docente") {
        return STORE_USUARIOS.filter(u => u.Es_Apoderado).map(u => ({
          Contacto_Id: u.Usuario_Id,
          Contacto_Nombre: u.Usuario_Nombre_Completo,
          Contacto_Rol: "Apoderado",
          Estudiantes: STORE_ESTUDIANTES
            .filter(e => Number(e.Apoderado_Usuario_Id) === Number(u.Usuario_Id))
            .map(e => `${e.Estudiante_Nombre_Completo} (${e.Curso_Nombre})`),
        }));
      }
      return STORE_USUARIOS.filter(u => u.Es_Docente).map(u => ({
        Contacto_Id: u.Usuario_Id,
        Contacto_Nombre: u.Usuario_Nombre_Completo,
        Contacto_Rol: "Docente",
        Asignaturas: [u.Docente_Especialidad || "General"],
      }));
    }
  }

  // Cursos y sub-rutas
  if (p.includes("/horarios/cursos") || p.includes("/cursos")) {
    if (p.includes("/niveles")) {
      return NIVELES_EDUCATIVOS;
    }
    if (p.includes("/mis-jefaturas")) {
      const ctx = getContextoUsuarioMock(urlStr);
      const vigentes = STORE_CURSOS.filter(c => c.Profesor_Jefe_Id != null);
      const filtrados = ctx.rol === "Administrador" || !ctx.userId
        ? vigentes
        : vigentes.filter(c => Number(c.Profesor_Jefe_Id) === ctx.userId);
      return {
        periodoVigente: STORE_PERIODO_ESTADO.vigente || "2026",
        cursos: filtrados,
      };
    }
    if (p.includes("/asignaturas/disponibles") && reqId) {
      const targetCurso = STORE_CURSOS.find(c => Number(c.Curso_Id) === Number(reqId));
      const asignadasIds = (targetCurso?.asignaturas || []).map(a => Number(a.Asignatura_Id));
      return STORE_ASIGNATURAS.filter(a => !asignadasIds.includes(Number(a.Asignatura_Id))).map(a => ({
        Asignatura_Id: a.Asignatura_Id,
        Asignatura_Nombre: a.Asignatura_Nombre,
        Tipo: "Obligatorio",
        Horas_Semanales_Requeridas: 4,
      }));
    }
    if (p.includes("/asignaturas") && reqId) {
      const targetCurso = STORE_CURSOS.find(c => Number(c.Curso_Id) === Number(reqId));
      return targetCurso?.asignaturas || [];
    }
    if (p.includes("/estudiantes") && reqId) {
      const ests = STORE_ESTUDIANTES.filter(e => Number(e.Curso_Id) === Number(reqId));
      return {
        ok: true,
        estudiantes: ests.map(e => ({
          Estudiante_Id: e.Estudiante_Id,
          Estudiante_Nombre_Completo: e.Estudiante_Nombre_Completo,
          Estudiante_RUT: e.Estudiante_RUT,
          Estudiante_Estado_Academico: e.Estudiante_Estado_Academico || "Regular",
        })),
        mensaje: ests.length === 0 ? "Este curso no tiene estudiantes asignados." : ""
      };
    }
    if (reqId && !p.includes("/cursos?")) {
      const matchCurso = STORE_CURSOS.find(c => Number(c.Curso_Id) === Number(reqId));
      if (matchCurso) return matchCurso;
    }
    return STORE_CURSOS;
  }

  // Horario Maestro
  if (p.includes("/horarios/maestro")) {
    return STORE_HORARIOS;
  }

  // Horario de Docente (/api/horarios/docente/:id/horario)
  if (p.includes("/horarios/docente/") && !p.includes("/asignaciones") && (p.includes("/horario/") || p.endsWith("/horario") || p.includes("/horario?"))) {
    const targetDocenteId = reqId || 3;
    return STORE_HORARIOS.filter(h =>
      (Number(h.Usuario_Id) === Number(targetDocenteId) || Number(h.docente_id) === Number(targetDocenteId)) &&
      h.estado !== "Eliminado" &&
      h.eliminado !== 1
    ).map(h => ({
      id: h.Horario_Asignatura_Id,
      dia: h.dia,
      horaInicio: h.horaInicio || h.hora_inicio || h.Horario_Hora_Inicio || "08:00:00",
      horaFin: h.horaFin || h.hora_fin || h.Horario_Hora_Fin || "08:45:00",
      hora_inicio: h.hora_inicio || h.horaInicio || "08:00:00",
      hora_fin: h.hora_fin || h.horaFin || "08:45:00",
      asignatura: h.asignatura || h.Asignatura_Nombre,
      asignaturaId: h.Asignatura_Id,
      curso: h.curso || h.Curso_Nombre,
      docente: h.docente || h.Docente_Nombre,
      estado: h.estado || h.Horario_Estado || "Activo",
      pendiente: Boolean(Number(h.pendiente)),
    }));
  }

  // Horario de Estudiante (/api/horarios/estudiante/:id/horario)
  if (p.includes("/horarios/estudiante/") && p.includes("/horario")) {
    const est = (reqId && STORE_ESTUDIANTES.find(e => e.Estudiante_Id === reqId)) || STORE_ESTUDIANTES[0];
    const cursoId = est ? est.Curso_Id : 1;
    const clasesCurso = STORE_HORARIOS.filter(h =>
      (Number(h.Curso_Id) === Number(cursoId) || Number(h.curso_id) === Number(cursoId)) &&
      h.estado !== "Eliminado" &&
      h.eliminado !== 1
    ).map(h => ({
      id: h.Horario_Asignatura_Id,
      dia: h.dia,
      horaInicio: h.horaInicio || h.hora_inicio || h.Horario_Hora_Inicio || "08:00:00",
      horaFin: h.horaFin || h.hora_fin || h.Horario_Hora_Fin || "08:45:00",
      hora_inicio: h.hora_inicio || h.horaInicio || "08:00:00",
      hora_fin: h.hora_fin || h.horaFin || "08:45:00",
      asignatura: h.asignatura || h.Asignatura_Nombre,
      asignaturaId: h.Asignatura_Id,
      curso: h.curso || h.Curso_Nombre,
      docente: h.docente || h.Docente_Nombre,
      estado: h.estado || h.Horario_Estado || "Activo",
      pendiente: Boolean(Number(h.pendiente)),
    }));
    return {
      estudiante: {
        id: est.Estudiante_Id,
        nombre: est.Estudiante_Nombre_Completo,
        curso: est.Curso_Nombre || "1° Básico A"
      },
      horario: clasesCurso
    };
  }

  // Parámetros institucionales (/api/bloques/parametros)
  if (p.includes("/parametros")) {
    return STORE_PARAMETROS;
  }

  // Cursos y asignaturas asignadas a un docente (CU42)
  if (p.includes("/horarios/docente/") && p.includes("/asignaciones")) {
    const targetDocenteId = reqId || 3;
    const clasesDoc = STORE_HORARIOS.filter(h =>
      (Number(h.Usuario_Id) === Number(targetDocenteId) || Number(h.docente_id) === Number(targetDocenteId)) &&
      h.estado !== "Eliminado" &&
      h.eliminado !== 1
    );

    const grupos = {};
    for (const c of clasesDoc) {
      const key = `${c.Curso_Id || c.curso}-${c.Asignatura_Id || c.asignatura}`;
      if (!grupos[key]) {
        grupos[key] = {
          cursoId: c.Curso_Id || 1,
          curso: c.curso || c.Curso_Nombre || "1° Básico A",
          nivelEducativo: c.nivelEducativo || "1° Básico",
          asignaturaId: c.Asignatura_Id || 1,
          asignatura: c.asignatura || c.Asignatura_Nombre || "Asignatura",
          horasSemanales: 0,
          estadoVigencia: c.estado || "Activo",
          bloques: []
        };
      }
      grupos[key].horasSemanales += 0.75;
      grupos[key].bloques.push({
        dia: c.dia,
        horaInicio: c.horaInicio || c.hora_inicio || "08:00:00",
        horaFin: c.horaFin || c.hora_fin || "08:45:00",
        estado: c.estado || "Activo"
      });
    }
    return Object.values(grupos);
  }

  // Resumen de horas por curso para el listado lateral (/api/horarios/resumen-cursos)
  if (p.includes("/horarios/resumen-cursos")) {
    return STORE_CURSOS.map(c => {
      const cId = Number(c.Curso_Id);
      const clasesCurso = STORE_HORARIOS.filter(h =>
        (Number(h.Curso_Id) === cId || h.curso === c.Curso_Nombre) &&
        h.estado !== "Eliminado" &&
        h.eliminado !== 1
      );
      const totalProg = Math.round(clasesCurso.length * 0.75 * 10) / 10;
      const asigsActivas = (c.asignaturas || []).filter(a => a.Estado_Asignacion === "Activa" || a.estado === "Activa");
      const totalReq = asigsActivas.length > 0 ? asigsActivas.length * 4 : 16;

      return {
        Curso_Id: cId,
        Curso_Nombre: c.Curso_Nombre,
        Nivel_Educativo_Nombre: c.Nivel_Educativo_Nombre || (cId + "° Básico"),
        Curso_Periodo_Lectivo: c.Curso_Periodo_Lectivo || "2026",
        total_horas_requeridas: totalReq,
        total_horas_programadas: totalProg,
      };
    });
  }

  // Asignaturas de un curso con horas requeridas y programadas (/api/horarios/asignaturas-curso?curso_id=X)
  if (p.includes("/horarios/asignaturas-curso")) {
    let targetCursoId = 1;
    try {
      const u = new URL(urlStr, "http://localhost");
      if (u.searchParams.get("curso_id")) targetCursoId = Number(u.searchParams.get("curso_id"));
    } catch { /* ignore */ }

    const targetCurso = STORE_CURSOS.find(c => Number(c.Curso_Id) === targetCursoId) || STORE_CURSOS[0];
    const asigs = (targetCurso?.asignaturas && targetCurso.asignaturas.length > 0) ? targetCurso.asignaturas : [
      { Asignatura_Id: 1, Asignatura_Nombre: "Lenguaje y Comunicación", Estado_Asignacion: "Activa" },
      { Asignatura_Id: 2, Asignatura_Nombre: "Matemáticas", Estado_Asignacion: "Activa" },
      { Asignatura_Id: 3, Asignatura_Nombre: "Ciencias Naturales", Estado_Asignacion: "Activa" },
      { Asignatura_Id: 4, Asignatura_Nombre: "Historia y Geografía", Estado_Asignacion: "Activa" },
    ];

    return asigs.map(a => {
      const asigId = Number(a.Asignatura_Id);
      const clasesAsig = STORE_HORARIOS.filter(h =>
        (Number(h.Curso_Id) === targetCursoId || h.curso === targetCurso?.Curso_Nombre) &&
        Number(h.Asignatura_Id) === asigId &&
        h.estado !== "Eliminado" &&
        h.eliminado !== 1
      );
      const horasProg = Math.round(clasesAsig.length * 0.75 * 10) / 10;
      return {
        Asignatura_Id: asigId,
        Asignatura_Nombre: a.Asignatura_Nombre,
        Horas_Semanales_Requeridas: a.Horas_Semanales_Requeridas ?? a.horas_semanales ?? 4,
        Horas_Programadas: horasProg,
      };
    });
  }

  // Catálogo de asignaturas institucional para filtros de horarios (/api/horarios/asignaturas)
  if (p.includes("/horarios/asignaturas") && !p.includes("/asignaturas-curso")) {
    return STORE_ASIGNATURAS.map(a => ({
      Asignatura_Id: a.Asignatura_Id,
      Asignatura_Nombre: a.Asignatura_Nombre,
      Asignatura_Prioridad_Academica: a.Asignatura_Prioridad_Academica || "Media"
    }));
  }

  // CU68: Filtrar horarios reactivamente (/api/horarios/filtrar)
  if (p.includes("/horarios/filtrar")) {
    try {
      const u = new URL(urlStr, "http://localhost");
      const docenteId = u.searchParams.get("docente_id");
      const cursoId = u.searchParams.get("curso_id");
      const nivelId = u.searchParams.get("nivel_educativo_id");
      const asigId = u.searchParams.get("asignatura_id");
      const jornada = u.searchParams.get("jornada");
      const diaSemana = u.searchParams.get("dia_semana");
      const estado = u.searchParams.get("estado") || "Activo";
      const DIA_ORDEN = { Lunes: 1, Martes: 2, "Miércoles": 3, Miercoles: 3, Jueves: 4, Viernes: 5 };

      const matching = STORE_HORARIOS.filter(h => {
        const estadoH = h.estado || h.Horario_Estado || "Activo";
        if (estadoH === "Eliminado" || h.eliminado === 1) return false;
        if (estado && estado !== "Todos" && estadoH !== estado) return false;
        if (docenteId && Number(h.Usuario_Id) !== Number(docenteId) && Number(h.docente_id) !== Number(docenteId)) return false;
        if (cursoId && Number(h.Curso_Id) !== Number(cursoId)) return false;
        if (nivelId) {
          const cursoObj = STORE_CURSOS.find(c => Number(c.Curso_Id) === Number(h.Curso_Id));
          const nivelActual = cursoObj?.Nivel_Educativo_Id || cursoObj?.Nivel_Id || h.Nivel_Educativo_Id || h.Curso_Id;
          if (Number(nivelActual) !== Number(nivelId)) return false;
        }
        if (asigId && Number(h.Asignatura_Id) !== Number(asigId)) return false;
        if (jornada) {
          const blkJ = STORE_BLOQUES.find(b => Number(b.Bloque_Horario_Id) === Number(h.Bloque_Horario_Id))?.Bloque_Horario_Jornada;
          const jH = h.jornada || blkJ || "Mañana";
          if (jH.toLowerCase() !== jornada.toLowerCase()) return false;
        }
        if (diaSemana && (h.dia || h.Horario_Asignatura_Dia_Semana) !== diaSemana) return false;
        return true;
      });

      if (matching.length === 0) {
        return {
          mensaje: "No se encontraron horarios coincidentes con los filtros seleccionados",
          horarios: []
        };
      }

      return matching.map(h => {
        const c = STORE_CURSOS.find(x => Number(x.Curso_Id) === Number(h.Curso_Id));
        const blk = STORE_BLOQUES.find(b => Number(b.Bloque_Horario_Id) === Number(h.Bloque_Horario_Id));
        const doc = STORE_USUARIOS.find(u => Number(u.Usuario_Id) === Number(h.Usuario_Id));
        return {
          Horario_Asignatura_Id: h.Horario_Asignatura_Id,
          dia: h.dia || h.Horario_Asignatura_Dia_Semana,
          estado: h.estado || h.Horario_Estado || "Activo",
          cursoId: h.Curso_Id,
          curso: h.curso || c?.Curso_Nombre || "1° Básico A",
          seccion: c?.Curso_Seccion || "A",
          nivelEducativoId: c?.Nivel_Educativo_Id || h.Nivel_Educativo_Id || 1,
          nivelEducativo: c?.Nivel_Educativo_Nombre || (h.Curso_Id + "° Básico"),
          bloqueId: h.Bloque_Horario_Id,
          horaInicio: h.horaInicio || blk?.Bloque_Horario_Hora_Inicio || "08:00:00",
          horaFin: h.horaFin || blk?.Bloque_Horario_Hora_Fin || "08:45:00",
          hora_inicio: h.horaInicio || blk?.Bloque_Horario_Hora_Inicio || "08:00:00",
          hora_fin: h.horaFin || blk?.Bloque_Horario_Hora_Fin || "08:45:00",
          jornada: h.jornada || blk?.Bloque_Horario_Jornada || "Mañana",
          tipoBloque: blk?.Bloque_Horario_Tipo || "Clase",
          asignaturaId: h.Asignatura_Id,
          asignatura: h.asignatura || h.Asignatura_Nombre,
          docenteId: h.Usuario_Id,
          docente: h.docente || h.Docente_Nombre || doc?.Usuario_Nombre_Completo || "Sin asignar",
        };
      }).sort((a, b) => {
        const dDiff = (DIA_ORDEN[a.dia] || 99) - (DIA_ORDEN[b.dia] || 99);
        if (dDiff !== 0) return dDiff;
        const hDiff = String(a.horaInicio || "").localeCompare(String(b.horaInicio || ""));
        if (hDiff !== 0) return hDiff;
        return String(a.curso || "").localeCompare(String(b.curso || ""), "es");
      });
    } catch {
      return [];
    }
  }

  // CU67: Disponibilidad de bloques libres (/api/horarios/bloques-libres)
  if (p.includes("/horarios/bloques-libres")) {
    try {
      const u = new URL(urlStr, "http://localhost");
      const cursoId = u.searchParams.get("curso_id");
      const docenteId = u.searchParams.get("docente_id");
      const diaSemanaParam = u.searchParams.get("dia_semana");
      const jornada = u.searchParams.get("jornada");
      const fechaParam = u.searchParams.get("fecha");

      const DIAS_POR_INDICE = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const DIAS_SEMANA_VALIDOS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

      let diasAEvaluar = [];
      const fechasMap = {};

      if (fechaParam) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaParam)) {
          return { status: 400, mensaje: "Formato de fecha inválido (use AAAA-MM-DD)" };
        }
        const [y, m, d] = fechaParam.split("-").map(Number);
        const dt = new Date(y, m - 1, d);
        if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
          return { status: 400, mensaje: "Formato de fecha inválido (use AAAA-MM-DD)" };
        }
        const diaNombre = DIAS_POR_INDICE[dt.getDay()];
        if (!DIAS_SEMANA_VALIDOS.includes(diaNombre)) {
          return { status: 400, mensaje: "La fecha debe corresponder a un día hábil (lunes a viernes)" };
        }
        diasAEvaluar = [diaNombre];
        fechasMap[diaNombre] = fechaParam;
      } else if (diaSemanaParam && DIAS_SEMANA_VALIDOS.includes(diaSemanaParam)) {
        diasAEvaluar = [diaSemanaParam];
      } else {
        diasAEvaluar = [...DIAS_SEMANA_VALIDOS];
      }

      // Si no se proporcionó fecha puntual, asignamos la fecha próxima de ocurrencia
      const hoy = new Date();
      DIAS_SEMANA_VALIDOS.forEach((d) => {
        if (!fechasMap[d]) {
          for (let i = 0; i < 7; i++) {
            const dt = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
            if (DIAS_POR_INDICE[dt.getDay()] === d) {
              const pad = (n) => String(n).padStart(2, "0");
              fechasMap[d] = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
              break;
            }
          }
        }
      });

      const bloquesClase = enriquecerBloquesMock()
        .filter(b => b.Bloque_Horario_Tipo !== "Recreo" && Number(b.desajustado) !== 1 && (!jornada || b.Bloque_Horario_Jornada === jornada))
        .sort((a, b) => String(a.Bloque_Horario_Hora_Inicio || "").localeCompare(String(b.Bloque_Horario_Hora_Inicio || "")));

      const libres = [];
      for (const d of diasAEvaluar) {
        for (const b of bloquesClase) {
          const bId = Number(b.Bloque_Horario_Id);
          const fechaEval = fechasMap[d];

          // 1. Solo las asignaciones activas ocupan el bloque (eliminados/suspendidos quedan libres)
          const ocupadoPorClase = STORE_HORARIOS.some(h => {
            const estadoH = h.estado || h.Horario_Estado || "Activo";
            if (h.eliminado === 1 || estadoH !== "Activo") return false;
            if (h.dia !== d && h.Horario_Asignatura_Dia_Semana !== d) return false;
            if (Number(h.Bloque_Horario_Id) !== bId) return false;
            if (cursoId && Number(h.Curso_Id) === Number(cursoId)) return true;
            if (docenteId && (Number(h.Usuario_Id) === Number(docenteId) || Number(h.docente_id) === Number(docenteId))) return true;
            if (!cursoId && !docenteId) return true;
            return false;
          });

          // 2. Revisar si hay evento institucional que afecte el bloque en esa fecha
          const ocupadoPorEvento = (STORE_EVENTOS || []).some(ev => {
            if (String(ev.Evento_Institucional_Fecha || "").slice(0, 10) !== fechaEval) return false;
            const bloquesAfectados = Array.isArray(ev.bloques) ? ev.bloques.map(x => Number(x.Bloque_Horario_Id || x.id)) : [];
            if (bloquesAfectados.includes(bId)) return true;
            if (bloquesAfectados.length === 0 && ev.Evento_Institucional_Impacto_Clases === "Suspensión total") return true;
            if (bloquesAfectados.length === 0 && ev.Evento_Institucional_Impacto_Clases === "Salida anticipada" && b.Bloque_Horario_Jornada === "Tarde") return true;
            return false;
          });

          if (!ocupadoPorClase && !ocupadoPorEvento) {
            libres.push({
              bloqueId: bId,
              dia: d,
              fecha: fechaEval || "",
              horaInicio: b.Bloque_Horario_Hora_Inicio,
              horaFin: b.Bloque_Horario_Hora_Fin,
              jornada: b.Bloque_Horario_Jornada,
              tipo: b.Bloque_Horario_Tipo,
            });
          }
        }
      }

      if (libres.length === 0) {
        return {
          mensaje: "No existen bloques libres disponibles para los criterios indicados",
          bloquesLibres: []
        };
      }
      return libres;
    } catch {
      return [];
    }
  }

  // Horarios de curso (/api/horarios?curso_id=X&incluir_eliminadas=1)
  if (p.includes("/horarios") && !p.includes("/exportar") && !p.includes("/resumen-cursos") && !p.includes("/asignaturas-curso") && !p.includes("/asignaturas") && !p.includes("/filtrar") && !p.includes("/bloques-libres")) {
    let filtered = [...STORE_HORARIOS];
    try {
      const u = new URL(urlStr, "http://localhost");
      const cId = u.searchParams.get("curso_id");
      const incElim = u.searchParams.get("incluir_eliminadas");
      if (cId) {
        filtered = filtered.filter(h => Number(h.Curso_Id) === Number(cId) || (Number(cId) === 1 && !h.Curso_Id));
      }
      if (incElim !== "1" && incElim !== "true") {
        filtered = filtered.filter(h => h.estado !== "Eliminado" && h.eliminado !== 1);
      }
    } catch { /* ignore */ }
    return filtered;
  }

  // Usuario individual por ID (CU17 / CU18)
  if (p.includes("/usuarios/") && reqId && !p.includes("/administradores") && !p.includes("/buscar") && !p.includes("/filtrar")) {
    const u = STORE_USUARIOS.find(usr => Number(usr.Usuario_Id) === Number(reqId));
    if (!u) return null;
    return {
      ...u,
      Usuario_Foto_Perfil: u.Usuario_Foto_Perfil || null,
      Administrador_Correo_Institucional: u.Administrador_Correo_Institucional || (u.Es_Administrador ? u.Usuario_Correo : null),
      Docente_Correo_Institucional: u.Docente_Correo_Institucional || (u.Es_Docente ? u.Usuario_Correo : null),
      Apoderado_Correo_Natural: u.Apoderado_Correo_Natural || (u.Es_Apoderado ? u.Usuario_Correo : null),
      Docente_Especialidad: u.Docente_Especialidad || (u.Es_Docente ? "General" : null),
      Docente_Carga_Horaria_Maxima: u.Docente_Carga_Horaria_Maxima || (u.Es_Docente ? 36 : null),
      Usuario_Direccion_Calle: u.Usuario_Direccion_Calle || "Av. Las Perdices",
      Usuario_Direccion_Numero: u.Usuario_Direccion_Numero || "100",
      Usuario_Direccion_Depto: u.Usuario_Direccion_Depto || "",
      Usuario_Direccion_Comuna: u.Usuario_Direccion_Comuna || "La Florida",
    };
  }

  // Perfil de usuario autenticado (/api/usuarios/perfil)
  if (p.includes("/usuarios/perfil") && !p.includes("/foto")) {
    const ctx = getContextoUsuarioMock(urlStr);
    const u = (ctx.userId && STORE_USUARIOS.find(usr => Number(usr.Usuario_Id) === Number(ctx.userId))) ||
              STORE_USUARIOS.find(usr => usr.Usuario_Id === 1) ||
              STORE_USUARIOS[0];
    return {
      ...u,
      Usuario_Foto_Perfil: u.Usuario_Foto_Perfil || null,
      Administrador_Correo_Institucional: u.Administrador_Correo_Institucional || (u.Es_Administrador ? u.Usuario_Correo : null),
      Docente_Correo_Institucional: u.Docente_Correo_Institucional || (u.Es_Docente ? u.Usuario_Correo : null),
      Apoderado_Correo_Natural: u.Apoderado_Correo_Natural || (u.Es_Apoderado ? u.Usuario_Correo : null),
      Docente_Especialidad: u.Docente_Especialidad || (u.Es_Docente ? "General" : null),
      Docente_Carga_Horaria_Maxima: u.Docente_Carga_Horaria_Maxima || (u.Es_Docente ? 36 : null),
      Usuario_Direccion_Calle: u.Usuario_Direccion_Calle || "Av. Las Perdices",
      Usuario_Direccion_Numero: u.Usuario_Direccion_Numero || "100",
      Usuario_Direccion_Depto: u.Usuario_Direccion_Depto || "",
      Usuario_Direccion_Comuna: u.Usuario_Direccion_Comuna || "La Florida",
    };
  }

  // Búsqueda rápida de usuarios (/api/usuarios/buscar?criterio=...)
  if (p.includes("/usuarios/buscar")) {
    try {
      const u = new URL(urlStr, "http://localhost");
      const crit = (u.searchParams.get("criterio") || u.searchParams.get("q") || "").trim().toLowerCase();
      if (!crit) return STORE_USUARIOS;
      return STORE_USUARIOS.filter(usr =>
        (usr.Usuario_Nombre_Completo || "").toLowerCase().includes(crit) ||
        (usr.Usuario_RUT || "").toLowerCase().includes(crit) ||
        (usr.Usuario_Correo || usr.Administrador_Correo_Institucional || usr.Docente_Correo_Institucional || usr.Apoderado_Correo_Natural || "").toLowerCase().includes(crit)
      );
    } catch {
      return STORE_USUARIOS;
    }
  }

  // Lista general de Usuarios con filtros
  if (p.includes("/usuarios")) {
    let filtrados = [...STORE_USUARIOS];
    if (p.includes("rol=administrador")) filtrados = filtrados.filter((u) => u.Es_Administrador);
    else if (p.includes("rol=docente")) filtrados = filtrados.filter((u) => u.Es_Docente);
    else if (p.includes("rol=apoderado")) filtrados = filtrados.filter((u) => u.Es_Apoderado);
    if (p.includes("estado=1")) filtrados = filtrados.filter((u) => u.Usuario_Estado_Cuenta === 1);
    else if (p.includes("estado=0")) filtrados = filtrados.filter((u) => u.Usuario_Estado_Cuenta === 0);
    return filtrados;
  }

  return [];
}

function obtenerFilasExportacionHorario(urlStr) {
  const cleanUrl = (urlStr || "").split("?")[0].toLowerCase();
  const matchCurso = cleanUrl.match(/\/exportar\/curso\/(\d+)/);
  const matchDocente = cleanUrl.match(/\/exportar\/docente\/(\d+)/);
  const DIA_ORDEN = {
    Lunes: 1,
    Martes: 2,
    "Miércoles": 3,
    Miercoles: 3,
    Jueves: 4,
    Viernes: 5,
    "Sábado": 6,
    Sabado: 6,
    Domingo: 7,
  };

  let filas = (Array.isArray(STORE_HORARIOS) ? STORE_HORARIOS : []).filter(
    (h) => !h.eliminado && h.estado !== "Eliminado" && h.Horario_Estado !== "Eliminado"
  );
  let tituloScope = "Horario Maestro Institucional";

  if (matchCurso) {
    const cursoId = Number(matchCurso[1]);
    filas = filas.filter((h) => Number(h.Curso_Id) === cursoId);
    const cursoObj = STORE_CURSOS.find((c) => Number(c.Curso_Id) === cursoId);
    tituloScope = `Horario Curso: ${cursoObj?.Curso_Nombre || filas[0]?.Curso_Nombre || `Curso #${cursoId}`}`;
  } else if (matchDocente) {
    const docenteId = Number(matchDocente[1]);
    filas = filas.filter((h) => Number(h.Usuario_Id) === docenteId);
    const docObj = STORE_USUARIOS.find((u) => Number(u.Usuario_Id) === docenteId);
    tituloScope = `Horario Docente: ${docObj?.Usuario_Nombre_Completo || filas[0]?.Docente_Nombre || `Docente #${docenteId}`}`;
  }

  filas = [...filas].sort((a, b) => {
    const dA = DIA_ORDEN[a.dia] || 99;
    const dB = DIA_ORDEN[b.dia] || 99;
    if (dA !== dB) return dA - dB;
    const hA = String(a.horaInicio || a.hora_inicio || "");
    const hB = String(b.horaInicio || b.hora_inicio || "");
    return hA.localeCompare(hB);
  });

  return { filas, tituloScope };
}

function escaparCsv(val) {
  const s = String(val ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function truncarTextoCanvas(ctx, texto, maxWidth) {
  const s = String(texto ?? "");
  if (ctx.measureText(s).width <= maxWidth) return s;
  let recorte = s;
  while (recorte.length > 1 && ctx.measureText(`${recorte}...`).width > maxWidth) {
    recorte = recorte.slice(0, -1);
  }
  return `${recorte}...`;
}

async function canvasToPngBlob(canvas) {
  const fromToBlob = await new Promise((resolve) => {
    if (typeof canvas.toBlob === "function") {
      canvas.toBlob((b) => resolve(b), "image/png");
    } else {
      resolve(null);
    }
  });
  if (fromToBlob && fromToBlob.size > 0) return fromToBlob;

  const dataUrl = canvas.toDataURL("image/png");
  const base64 = dataUrl.split(",")[1] || "";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new Blob([bytes], { type: "image/png" });
}

async function generarPngHorarioBlob(filas, tituloScope) {
  const maxFilasVisibles = 60;
  const visibles = filas.slice(0, maxFilasVisibles);
  const hayVacios = visibles.length === 0;
  const totalFilas = hayVacios ? 1 : visibles.length;
  const width = 1120;
  const topBanner = 94;
  const tableHeaderH = 38;
  const rowH = 34;
  const footerH = filas.length > maxFilasVisibles ? 44 : 28;
  const height = topBanner + tableHeaderH + totalFilas * rowH + footerH + 16;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    // Fallback PNG mínimo válido (1x1 px blanco) si no hay contexto 2D disponible
    const fallbackPng = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
      0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f,
      0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59, 0xe7, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
    return new Blob([fallbackPng], { type: "image/png" });
  }

  // Fondo blanco
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Encabezado institucional
  ctx.fillStyle = "#1e3a5f";
  ctx.fillRect(20, 16, width - 40, 64);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
  ctx.fillText("Colegio Jacques Cousteau · SIGAE", 38, 44);
  ctx.font = "14px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText(`${tituloScope} · ${filas.length} bloque(s)`, 38, 66);

  // Cabecera de tabla
  const tableX = 20;
  const tableW = width - 40;
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(tableX, topBanner, tableW, tableHeaderH);
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
  const cols = [
    { label: "Día", x: 34, w: 105 },
    { label: "Horario", x: 145, w: 120 },
    { label: "Curso", x: 272, w: 155 },
    { label: "Asignatura", x: 435, w: 325 },
    { label: "Docente", x: 768, w: 315 },
  ];
  for (const col of cols) {
    ctx.fillText(col.label, col.x, topBanner + 24);
  }

  ctx.font = "13px system-ui, -apple-system, sans-serif";
  if (hayVacios) {
    const y = topBanner + tableHeaderH;
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(tableX, y, tableW, rowH);
    ctx.strokeStyle = "#cbd5e1";
    ctx.strokeRect(tableX, y, tableW, rowH);
    ctx.fillStyle = "#475569";
    ctx.fillText("No hay bloques de horario registrados para exportar.", 34, y + 22);
  } else {
    visibles.forEach((h, idx) => {
      const y = topBanner + tableHeaderH + idx * rowH;
      ctx.fillStyle = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      ctx.fillRect(tableX, y, tableW, rowH);
      ctx.strokeStyle = "#e2e8f0";
      ctx.strokeRect(tableX, y, tableW, rowH);

      const hi = String(h.horaInicio || h.hora_inicio || "").slice(0, 5);
      const hf = String(h.horaFin || h.hora_fin || "").slice(0, 5);
      const valores = [
        h.dia || "-",
        hi && hf ? `${hi} - ${hf}` : "-",
        h.Curso_Nombre || h.curso || "-",
        h.Asignatura_Nombre || h.asignatura || "-",
        h.Docente_Nombre || h.docente || "-",
      ];
      ctx.fillStyle = "#1e293b";
      cols.forEach((col, cIdx) => {
        ctx.fillText(truncarTextoCanvas(ctx, valores[cIdx], col.w), col.x, y + 22);
      });
    });
  }

  if (filas.length > maxFilasVisibles) {
    const noteY = topBanner + tableHeaderH + totalFilas * rowH + 24;
    ctx.fillStyle = "#64748b";
    ctx.font = "italic 12px system-ui, -apple-system, sans-serif";
    ctx.fillText(
      `Se muestran los primeros ${maxFilasVisibles} de ${filas.length} bloques registrados.`,
      34,
      noteY
    );
  }

  return canvasToPngBlob(canvas);
}

function textoPdfAscii(texto) {
  return String(texto ?? "")
    .replace(/°/g, "o")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function generarPdfHorario(filas, tituloScope) {
  const lineas = (filas.length ? filas.slice(0, 28) : [null]).map((h) => {
    if (!h) return "No hay bloques de horario registrados.";
    const hi = String(h.horaInicio || h.hora_inicio || "").slice(0, 5);
    const hf = String(h.horaFin || h.hora_fin || "").slice(0, 5);
    return `${h.dia || ""} ${hi}-${hf} | ${h.Curso_Nombre || h.curso || ""} | ${h.Asignatura_Nombre || h.asignatura || ""} - ${h.Docente_Nombre || h.docente || ""}`;
  });

  const ops = [
    "BT",
    `/F1 15 Tf 40 748 Td (${textoPdfAscii("Colegio Jacques Cousteau - SIGAE")}) Tj`,
    `/F1 11 Tf 0 -22 Td (${textoPdfAscii(`${tituloScope} (${filas.length} bloques)`)}) Tj`,
    "/F1 9 Tf 0 -18 Td () Tj",
    ...lineas.map((l) => `0 -18 Td (${textoPdfAscii(l).slice(0, 105)}) Tj`),
    "ET",
  ];
  const streamBody = ops.join("\n");
  const objs = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n",
    `4 0 obj << /Length ${streamBody.length} >> stream\n${streamBody}\nendstream endobj\n`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objs) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return pdf;
}

// Generador de respuestas mock de exportación (PDF, Excel, CSV, PNG)
async function generateMockExportResponse(urlStr) {
  const p = (urlStr || "").toLowerCase();
  const esExcel = p.includes("formato=excel") || p.includes("xlsx");
  const esCsv = p.includes("formato=csv") || (!p.includes("formato=") && p.includes("csv"));
  const esPng = p.includes("formato=png") || (!p.includes("formato=") && p.includes("png"));

  const { filas, tituloScope } = obtenerFilasExportacionHorario(urlStr);

  if (esCsv || esExcel) {
    const cabecera = ["Día", "Hora Inicio", "Hora Fin", "Curso", "Asignatura", "Docente"];
    const cuerpo = filas.map((h) =>
      [
        h.dia || "",
        String(h.horaInicio || h.hora_inicio || "").slice(0, 5),
        String(h.horaFin || h.hora_fin || "").slice(0, 5),
        h.Curso_Nombre || h.curso || "",
        h.Asignatura_Nombre || h.asignatura || "",
        h.Docente_Nombre || h.docente || "",
      ]
        .map(escaparCsv)
        .join(",")
    );
    const contenidoCsv = [cabecera.join(","), ...cuerpo].join("\n");

    if (esCsv) {
      return new Response(new Blob([`\uFEFF${contenidoCsv}`], { type: "text/csv;charset=utf-8" }), {
        status: 200,
        headers: { "Content-Type": "text/csv; charset=utf-8" },
      });
    }
    return new Response(
      new Blob([`\uFEFF${contenidoCsv}`], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      }
    );
  }

  if (esPng) {
    const pngBlob = await generarPngHorarioBlob(filas, tituloScope);
    return new Response(pngBlob, {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });
  }

  // Por defecto: PDF estructurado
  const pdfContent = generarPdfHorario(filas, tituloScope);
  return new Response(new Blob([pdfContent], { type: "application/pdf" }), {
    status: 200,
    headers: { "Content-Type": "application/pdf" },
  });
}

// ── FETCH INTERCEPTOR GLOBAL ───────────────────────────────────────────────
const originalFetch = window.fetch;

window.fetch = async function (input, init = {}) {
  let url = input;
  let isApiCall = false;

  if (typeof input === "string") {
    if (input.startsWith("/api/") || input === "/api") {
      url = `${BASE_URL}${input.slice(4)}`;
      isApiCall = true;
    } else if (input.includes("/api/")) {
      isApiCall = true;
    }
  } else if (input instanceof Request) {
    const parsed = new URL(input.url);
    if (parsed.pathname.startsWith("/api/")) {
      url = new Request(`${BASE_URL}${parsed.pathname.slice(4)}${parsed.search}`, input);
      isApiCall = true;
    }
  }

  const modifiedInit = {
    ...init,
    headers: {
      ...(init.headers || {}),
      "bypass-tunnel-reminder": "true",
    },
  };

  const method = (init.method || (input instanceof Request ? input.method : "GET") || "GET").toUpperCase();

  try {
    const response = await originalFetch.call(this, url, modifiedInit);

    // Si una llamada de API devolvió 404/502/504 o devolvió HTML (404.html de GitHub Pages)
    if (isApiCall && (!response.ok || response.headers.get("content-type")?.includes("text/html"))) {
      const urlStr = typeof url === "string" ? url : (url.url || "");
      if (urlStr.includes("/exportar") || (urlStr.includes("/promocion/") && (urlStr.includes("/plantilla") || urlStr.includes("/respaldo")))) {
        return await generateMockExportResponse(urlStr);
      }
      const mockData = getMockResponseForUrl(urlStr, method, modifiedInit.body);
      if (mockData !== null) {
        const httpStatus = (mockData && typeof mockData === "object" && typeof mockData.status === "number") ? mockData.status : 200;
        return new Response(JSON.stringify(mockData), {
          status: httpStatus,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    return response;
  } catch (err) {
    // Si la llamada falló por error de red (Failed to fetch, túnel offline)
    if (isApiCall) {
      const urlStr = typeof url === "string" ? url : (url.url || "");
      if (urlStr.includes("/exportar") || (urlStr.includes("/promocion/") && (urlStr.includes("/plantilla") || urlStr.includes("/respaldo")))) {
        return await generateMockExportResponse(urlStr);
      }
      const mockData = getMockResponseForUrl(urlStr, method, modifiedInit.body);
      if (mockData !== null) {
        const httpStatus = (mockData && typeof mockData === "object" && typeof mockData.status === "number") ? mockData.status : 200;
        return new Response(JSON.stringify(mockData), {
          status: httpStatus,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    throw err;
  }
};

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// Registro de Service Worker para PWA en producción
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        reg.update();
        console.log('SIGAE PWA Service Worker registrado con éxito:', reg.scope);
      })
      .catch((err) => {
        console.error('Error al registrar Service Worker de SIGAE:', err);
      });
  });
}
