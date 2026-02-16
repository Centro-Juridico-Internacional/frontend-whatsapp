import React, { useState, useEffect } from "react";
import {
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiTrash2,
  FiClock,
  FiLink,
} from "react-icons/fi";
import { uploadExcel, generateLink } from "../utils/api";

const MessageConfig = ({
  messageId,
  checks,
  onUpdate,
  onRemove,
  initialData,
}) => {
  const [config, setConfig] = useState({
    check: initialData?.check || "",
    clase: initialData?.clase || "",
    grupo: initialData?.grupo || "",
    hora: initialData?.hora || "",
    fecha: initialData?.fecha || new Date().toISOString().split("T")[0], // Default today
    texto:
      initialData?.texto ||
      `CHECK {CHECK} - CLASE {CLASE} - GRUPO {GRUPO} - {FECHA} - {HORA}

Bienvenido a tu clase # {CLASE}
{NOMBRECHECK}


Link de conexión: 
{LINK}


Te recordamos que la asistencia a todas las clases de Check es indispensable para poder recibir el certificado correspondiente, la inasistencia a cualquiera de las sesiones afectará la obtención del certificado.


Si tienes problemas con al conexión no dudes en contactarnos
Agradecemos su comprensión y compromiso.`,
    archivo_numeros: initialData?.archivo_numeros || "",
    archivo_correos: initialData?.archivo_correos || "",
  });

  const [uploading, setUploading] = useState({
    numeros: false,
    correos: false,
  });
  const [uploadStatus, setUploadStatus] = useState({
    numeros: null,
    correos: null,
  });
  const [generatedLink, setGeneratedLink] = useState("");

  // Helper to convert 24h time (from input) to 12h AM/PM (for display)
  const formatTime12h = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  // Helper to convert 12h AM/PM (from config) to 24h (for input value)
  const formatTime24h = (time12) => {
    if (!time12) return "";
    // Simple regex match for "HH:MM AM/PM"
    const match = time12.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return ""; // fallback if manual edit broke format
    let [_, h, m, ampm] = match;
    h = parseInt(h, 10);
    if (ampm.toUpperCase() === "PM" && h < 12) h += 12;
    if (ampm.toUpperCase() === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${m}`;
  };

  // Generate link when check, clase, and grupo are set
  useEffect(() => {
    if (config.check && config.clase && config.grupo) {
      generateLink(config.check, config.clase, config.grupo)
        .then((response) => {
          if (response.success) {
            setGeneratedLink(response.data.link);
          }
        })
        .catch((err) => console.error("Error generando link:", err));
    }
  }, [config.check, config.clase, config.grupo]);

  // Update parent component
  useEffect(() => {
    onUpdate(messageId, config);
  }, [config, messageId, onUpdate]);

  const handleInputChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleTimeChange = (e) => {
    const val24 = e.target.value;
    const val12 = formatTime12h(val24);
    setConfig((prev) => ({ ...prev, hora: val12 }));
  };

  const handleFileUpload = async (file, tipo) => {
    if (!file) return;

    setUploading((prev) => ({ ...prev, [tipo]: true }));
    setUploadStatus((prev) => ({ ...prev, [tipo]: null }));

    try {
      const response = await uploadExcel(file, tipo, messageId);

      if (response.success) {
        setConfig((prev) => ({
          ...prev,
          [`archivo_${tipo}`]: response.data.filename,
        }));
        setUploadStatus((prev) => ({
          ...prev,
          [tipo]: {
            success: true,
            message: `${response.data.count} ${tipo} cargados`,
            count: response.data.count,
          },
        }));
      } else {
        setUploadStatus((prev) => ({
          ...prev,
          [tipo]: {
            success: false,
            message: response.error,
          },
        }));
      }
    } catch (error) {
      setUploadStatus((prev) => ({
        ...prev,
        [tipo]: {
          success: false,
          message: error.response?.data?.error || "Error al subir archivo",
        },
      }));
    } finally {
      setUploading((prev) => ({ ...prev, [tipo]: false }));
    }
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById(`mensaje-${messageId}`);
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = config.texto;
    const newText =
      text.substring(0, start) + `{${variable}}` + text.substring(end);

    handleInputChange("texto", newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + variable.length + 2,
        start + variable.length + 2
      );
    }, 0);
  };

  const selectedCheck = checks.find((c) => c.id === parseInt(config.check));

  return (
    <div className="card mb-6 animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gradient">
          Mensaje #{messageId}
        </h3>
        {messageId > 1 && (
          <button
            onClick={() => onRemove(messageId)}
            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
            title="Eliminar mensaje"
          >
            <FiTrash2 size={20} />
          </button>
        )}
      </div>

      {/* Check Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="label">CHECK *</label>
          <select
            value={config.check}
            onChange={(e) => handleInputChange("check", e.target.value)}
            className="select"
            required
          >
            <option value="">Seleccionar CHECK...</option>
            {checks.map((check) => (
              <option key={check.id} value={check.id}>
                {check.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">CLASE *</label>
          <select
            value={config.clase}
            onChange={(e) => handleInputChange("clase", e.target.value)}
            className="select"
            required
            disabled={!selectedCheck}
          >
            <option value="">Seleccionar CLASE...</option>
            {selectedCheck &&
              Array.from({ length: selectedCheck.clases }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Clase {i + 1}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="label">GRUPO *</label>
          <select
            value={config.grupo}
            onChange={(e) => handleInputChange("grupo", e.target.value)}
            className="select"
            required
            disabled={!selectedCheck}
          >
            <option value="">Seleccionar GRUPO...</option>
            {selectedCheck &&
              Array.from({ length: selectedCheck.grupos }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Grupo {i + 1}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="label flex items-center gap-2">
            <FiClock /> HORA *
          </label>
          <input
            type="time"
            value={formatTime24h(config.hora)}
            onChange={handleTimeChange}
            className="input"
            required
          />
          {config.hora && (
            <p className="text-xs text-blue-300 mt-1 font-medium">
              Formato: {config.hora}
            </p>
          )}
        </div>

        <div>
          <label className="label flex items-center gap-2">📅 FECHA *</label>
          <input
            type="date"
            value={config.fecha}
            onChange={(e) => handleInputChange("fecha", e.target.value)}
            className="input"
            required
          />
        </div>
      </div>

      {/* Generated Link */}
      {generatedLink && (
        <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <FiLink className="text-blue-400" />
            <span className="text-sm font-medium text-blue-400">
              Link generado:
            </span>
          </div>
          <a
            href={generatedLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-300 hover:text-blue-200 break-all"
          >
            {generatedLink}
          </a>
        </div>
      )}

      {/* File Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="label">
            <FiUpload className="inline mr-2" />
            Excel de Números *
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => handleFileUpload(e.target.files[0], "numeros")}
              className="input-file"
              disabled={uploading.numeros}
            />
          </div>
          {uploading.numeros && (
            <p className="text-sm text-blue-400 mt-2">Subiendo...</p>
          )}
          {uploadStatus.numeros && (
            <div
              className={`mt-2 flex items-center gap-2 text-sm ${
                uploadStatus.numeros.success ? "text-green-400" : "text-red-400"
              }`}
            >
              {uploadStatus.numeros.success ? (
                <FiCheckCircle />
              ) : (
                <FiAlertCircle />
              )}
              {uploadStatus.numeros.message}
            </div>
          )}
        </div>

        <div>
          <label className="label">
            <FiUpload className="inline mr-2" />
            Excel de Correos *
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => handleFileUpload(e.target.files[0], "correos")}
              className="input-file"
              disabled={uploading.correos}
            />
          </div>
          {uploading.correos && (
            <p className="text-sm text-blue-400 mt-2">Subiendo...</p>
          )}
          {uploadStatus.correos && (
            <div
              className={`mt-2 flex items-center gap-2 text-sm ${
                uploadStatus.correos.success ? "text-green-400" : "text-red-400"
              }`}
            >
              {uploadStatus.correos.success ? (
                <FiCheckCircle />
              ) : (
                <FiAlertCircle />
              )}
              {uploadStatus.correos.message}
            </div>
          )}
        </div>
      </div>

      {/* Variable Insertion Buttons */}
      <div className="mb-2">
        <label className="label">Insertar variables:</label>
        <div className="flex flex-wrap gap-2">
          {[
            "CHECK",
            "CLASE",
            "GRUPO",
            "HORA",
            "FECHA",
            "NOMBRECHECK",
            "LINK",
          ].map((variable) => (
            <button
              key={variable}
              type="button"
              onClick={() => insertVariable(variable)}
              className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-lg text-purple-300 text-sm transition-colors"
            >
              {`{${variable}}`}
            </button>
          ))}
        </div>
      </div>

      {/* Message Text */}
      <div>
        <label className="label">Mensaje *</label>
        <textarea
          id={`mensaje-${messageId}`}
          value={config.texto}
          onChange={(e) => handleInputChange("texto", e.target.value)}
          className="textarea min-h-[300px]"
          placeholder="Escribe tu mensaje aquí..."
          rows={12}
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          Caracteres: {config.texto.length}
        </p>
      </div>

      <div className="divider"></div>

      {/* Validation Status */}
      <div className="flex flex-wrap gap-2">
        {config.check && <span className="badge-success">CHECK ✓</span>}
        {config.clase && <span className="badge-success">CLASE ✓</span>}
        {config.grupo && <span className="badge-success">GRUPO ✓</span>}
        {config.hora && <span className="badge-success">HORA ✓</span>}
        {config.fecha && <span className="badge-success">FECHA ✓</span>}
        {config.archivo_numeros && (
          <span className="badge-success">Números ✓</span>
        )}
        {config.archivo_correos && (
          <span className="badge-success">Correos ✓</span>
        )}
        {config.texto && <span className="badge-success">Texto ✓</span>}
      </div>
    </div>
  );
};

export default MessageConfig;
