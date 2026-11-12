import { useRef, useState } from "react";
import { apiUrl } from "../services/api";

/* ── Export helpers (CU60-62) ─────────────────────────────────── */
const MIME_POR_FORMATO = {
  pdf: "application/pdf",
  excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv;charset=utf-8",
  png: "image/png",
};

function authHeadersGet() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

async function validarArchivoExportado(blob, formato) {
  if (!blob || blob.size === 0) {
    throw new Error("El archivo exportado está vacío");
  }
  const tipo = (blob.type || "").toLowerCase();
  if (tipo.includes("json")) {
    const text = await blob.text();
    let message = "Error al exportar el horario";
    try {
      const parsed = JSON.parse(text);
      message = parsed.error || parsed.mensaje || message;
    } catch {
      // Ignora JSON inválido
    }
    throw new Error(message);
  }
  if (tipo.includes("text/html")) {
    throw new Error("El servidor devolvió una respuesta HTML inválida");
  }
  if (formato === "png") {
    const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
    const esPngValido =
      header.length === 4 &&
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47;
    if (!esPngValido) {
      throw new Error("El archivo generado no es una imagen PNG válida");
    }
  }
  const mimeEsperado = MIME_POR_FORMATO[formato];
  if (!tipo || (formato === "png" && tipo !== "image/png")) {
    return new Blob([blob], { type: mimeEsperado || blob.type });
  }
  return blob;
}

async function descargarArchivo(url, nombreArchivo, formato) {
  const res = await fetch(apiUrl(url), { headers: authHeadersGet() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Error al exportar el horario");
  }
  const rawBlob = await res.blob();
  const blob = await validarArchivoExportado(rawBlob, formato);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = nombreArchivo;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Retrasa la revocación para que navegadores móviles/PWA alcancen a leer el blob
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
}

const EXT_POR_FORMATO = { pdf: "pdf", excel: "xlsx", csv: "csv", png: "png" };

/* ── Menú desplegable de exportación (CU60/61/62) ─────────────── */
export default function ExportMenu({ label, url, filenameBase, disabled }) {
  const wrapperRef = useRef(null);
  const [abierto, setAbierto] = useState(false);
  const [alineacion, setAlineacion] = useState("right");
  const [exportando, setExportando] = useState(null);
  const [error, setError] = useState("");

  const toggleMenu = () => {
    if (!abierto && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setAlineacion(window.innerWidth - rect.left >= rect.right ? "left" : "right");
    }
    setAbierto((v) => !v);
  };

  const exportar = async (formato) => {
    setExportando(formato);
    setError("");
    try {
      await descargarArchivo(
        `${url}?formato=${formato}`,
        `${filenameBase}.${EXT_POR_FORMATO[formato]}`,
        formato
      );
      setAbierto(false);
    } catch (e) {
      setError(e.message || "Error al exportar");
    } finally {
      setExportando(null);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={toggleMenu}
        disabled={disabled}
        style={{
          padding: "0.35rem 0.85rem",
          borderRadius: "6px",
          border: "1px solid #93c5fd",
          background: abierto ? "#4f46e5" : "#fff",
          color: abierto ? "#fff" : "#4f46e5",
          cursor: disabled ? "not-allowed" : "pointer",
          fontWeight: 600,
          fontSize: "0.82rem",
          whiteSpace: "nowrap",
          opacity: disabled ? 0.5 : 1,
          transition: "all 0.15s",
        }}
      >
        ⬇ {label}
      </button>
      {abierto && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            [alineacion]: 0,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 6px 20px rgba(0,0,0,0.14)",
            zIndex: 60,
            minWidth: 180,
            maxWidth: "calc(100vw - 24px)",
            overflow: "hidden",
          }}
        >
          {[
            { key: "pdf", label: "📄 PDF" },
            { key: "excel", label: "📊 Excel" },
            { key: "csv", label: "🧾 CSV" },
            { key: "png", label: "🖼 Imagen (PNG)" },
          ].map((op) => (
            <button
              key={op.key}
              onClick={() => exportar(op.key)}
              disabled={exportando !== null}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "0.5rem 0.85rem",
                border: "none",
                borderBottom: "1px solid #f3f4f6",
                background: "#fff",
                cursor: exportando !== null ? "default" : "pointer",
                fontSize: "0.85rem",
                color: "#374151",
              }}
              onMouseEnter={(e) => { if (!exportando) e.currentTarget.style.background = "#f0f4ff"; }}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              {exportando === op.key ? "Generando..." : op.label}
            </button>
          ))}
          {error && (
            <div style={{ padding: "0.45rem 0.85rem", fontSize: "0.74rem", color: "#dc2626", background: "#fee2e2" }}>
              {error}
            </div>
          )}
        </div>
      )}
      {/* Cierra el menú al hacer clic fuera */}
      {abierto && (
        <div
          onClick={() => setAbierto(false)}
          style={{ position: "fixed", inset: 0, zIndex: 40 }}
        />
      )}
    </div>
  );
}
