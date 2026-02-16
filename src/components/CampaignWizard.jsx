import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiMinus,
  FiSend,
  FiEye,
  FiCheckCircle,
  FiLoader,
} from "react-icons/fi";
import MessageConfig from "./MessageConfig";
import PreviewPanel from "./PreviewPanel";
import { getChecks, previewCampaign, sendCampaign } from "../utils/api";

const CampaignWizard = () => {
  const [checks, setChecks] = useState([]);
  const [numMensajes, setNumMensajes] = useState(1);
  const [mensajes, setMensajes] = useState({});
  const [asuntoCorreo, setAsuntoCorreo] = useState("");
  const [currentStep, setCurrentStep] = useState("config"); // 'config' | 'preview' | 'sending' | 'results'
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingResults, setSendingResults] = useState(null);

  // Load checks on mount and force config step
  useEffect(() => {
    loadChecks();
    setCurrentStep("config");
  }, []);

  const loadChecks = async () => {
    try {
      const response = await getChecks();
      if (response.success) {
        setChecks(response.data);
      }
    } catch (error) {
      console.error("Error cargando checks:", error);
      alert("Error al cargar los checks");
    }
  };

  const handleNumMensajesChange = (newNum) => {
    const num = Math.min(Math.max(parseInt(newNum) || 1, 1), 10);
    setNumMensajes(num);

    // Initialize new messages
    const newMensajes = { ...mensajes };
    for (let i = 1; i <= num; i++) {
      if (!newMensajes[i]) {
        newMensajes[i] = {
          check: "",
          clase: "",
          grupo: "",
          hora: "",
          fecha: new Date().toISOString().split("T")[0],
          texto: `CHECK {CHECK} - CLASE {CLASE} - GRUPO {GRUPO} - {FECHA} - {HORA}

Bienvenido a tu clase # {CLASE}
{NOMBRECHECK}


Link de conexión: 
{LINK}


Te recordamos que la asistencia a todas las clases de Check es indispensable para poder recibir el certificado correspondiente, la inasistencia a cualquiera de las sesiones afectará la obtención del certificado.


Si tienes problemas con al conexión no dudes en contactarnos
Agradecemos su comprensión y compromiso.`,
          archivo_numeros: "",
          archivo_correos: "",
        };
      }
    }
    setMensajes(newMensajes);
  };

  const [asuntoManual, setAsuntoManual] = useState(false);

  // Helper to format date: '2026-01-13' -> 'ENERO - 13'
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const [y, m, d] = dateStr.split("-");
      const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      const month = date
        .toLocaleString("es-ES", { month: "long" })
        .toUpperCase();
      return `${month} - ${d}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Auto-update subject based on Message 1 if not manually edited
  useEffect(() => {
    if (!asuntoManual && mensajes[1]) {
      const { check, clase, grupo, fecha, hora } = mensajes[1];
      if (check || clase || grupo || hora) {
        const fechaFormateada = formatDate(fecha) || "{FECHA}";
        setAsuntoCorreo(
          `CHECK ${check || "{CHECK}"} - CLASE ${clase || "{CLASE}"} - GRUPO ${
            grupo || "{GRUPO}"
          } - ${fechaFormateada} - ${hora || "{HORA}"}`
        );
      }
    }
  }, [mensajes, asuntoManual]);

  const handleMessageUpdate = (messageId, config) => {
    setMensajes((prev) => ({
      ...prev,
      [messageId]: config,
    }));
  };

  const handleMessageRemove = (messageId) => {
    if (numMensajes > 1) {
      setNumMensajes((prev) => prev - 1);
      const newMensajes = {};
      let newId = 1;
      Object.keys(mensajes).forEach((id) => {
        const idNum = parseInt(id);
        if (idNum !== messageId) {
          newMensajes[newId] = mensajes[id];
          newId++;
        }
      });
      setMensajes(newMensajes);
    }
  };

  const validateCampaign = () => {
    for (let i = 1; i <= numMensajes; i++) {
      const msg = mensajes[i];
      if (!msg) return `Mensaje ${i} no configurado`;
      if (!msg.check) return `Mensaje ${i}: Falta seleccionar CHECK`;
      if (!msg.clase) return `Mensaje ${i}: Falta seleccionar CLASE`;
      if (!msg.grupo) return `Mensaje ${i}: Falta seleccionar GRUPO`;
      if (!msg.hora) return `Mensaje ${i}: Falta especificar HORA`;
      if (!msg.fecha) return `Mensaje ${i}: Falta especificar FECHA`;
      if (!msg.archivo_numeros) return `Mensaje ${i}: Falta Excel de números`;
      if (!msg.archivo_correos) return `Mensaje ${i}: Falta Excel de correos`;
      if (!msg.texto.trim()) return `Mensaje ${i}: Falta texto del mensaje`;
    }
    return null;
  };

  const handlePreview = async () => {
    const error = validateCampaign();
    if (error) {
      alert(error);
      return;
    }

    setLoading(true);
    try {
      const mensajesArray = Object.keys(mensajes)
        .filter((id) => parseInt(id) <= numMensajes)
        .map((id) => ({
          texto: mensajes[id].texto,
          check: parseInt(mensajes[id].check),
          clase: parseInt(mensajes[id].clase),
          grupo: parseInt(mensajes[id].grupo),
          hora: mensajes[id].hora,
          fecha: formatDate(mensajes[id].fecha), // Send formatted date
        }));

      const response = await previewCampaign(mensajesArray);

      if (response.success) {
        setPreviews(response.data);
        setCurrentStep("preview");
      }
    } catch (error) {
      console.error("Error en preview:", error);
      alert("Error al generar vista previa");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (
      !confirm(
        "¿Estás seguro de enviar esta campaña? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    setCurrentStep("sending");
    setLoading(true);

    try {
      const mensajesArray = Object.keys(mensajes)
        .filter((id) => parseInt(id) <= numMensajes)
        .map((id) => ({
          texto: mensajes[id].texto,
          check: parseInt(mensajes[id].check),
          clase: parseInt(mensajes[id].clase),
          grupo: parseInt(mensajes[id].grupo),
          hora: mensajes[id].hora,
          fecha: formatDate(mensajes[id].fecha),
          archivo_numeros: mensajes[id].archivo_numeros,
          archivo_correos: mensajes[id].archivo_correos,
        }));

      // No need to send subject, backend handles it per message
      const response = await sendCampaign(mensajesArray, "");

      if (response.success) {
        setSendingResults(response.data);
        setCurrentStep("results");
      } else {
        alert(`Error: ${response.error}`);
        setCurrentStep("preview");
      }
    } catch (error) {
      console.error("Error enviando campaña:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (
      confirm("¿Estás seguro de reiniciar? Se perderá toda la configuración.")
    ) {
      setNumMensajes(1);
      setMensajes({});
      setAsuntoCorreo("");
      setCurrentStep("config");
      setPreviews([]);
      setSendingResults(null);
    }
  };

  if (currentStep === "sending") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-md w-full text-center">
          <FiLoader className="w-16 h-16 mx-auto mb-4 text-blue-400 animate-spin" />
          <h2 className="text-2xl font-bold mb-2">Enviando campaña...</h2>
          <p className="text-gray-400">Por favor no cierres esta ventana</p>
          <p className="text-sm text-gray-500 mt-4">
            Este proceso puede tomar varios minutos dependiendo de la cantidad
            de mensajes
          </p>
        </div>
      </div>
    );
  }

  if (currentStep === "results" && sendingResults) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <div className="text-center mb-8">
              <FiCheckCircle className="w-20 h-20 mx-auto mb-4 text-green-400" />
              <h1 className="text-3xl font-bold mb-2 text-gradient">
                ¡Campaña Completada!
              </h1>
            </div>

            {/* WhatsApp Results */}
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4">📱 Resultados WhatsApp</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="card bg-blue-500/10 border-blue-500/30">
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-3xl font-bold">
                    {sendingResults.whatsapp.total}
                  </p>
                </div>
                <div className="card bg-green-500/10 border-green-500/30">
                  <p className="text-sm text-gray-400">Exitosos</p>
                  <p className="text-3xl font-bold text-green-400">
                    {sendingResults.whatsapp.exitosos}
                  </p>
                </div>
                <div className="card bg-red-500/10 border-red-500/30">
                  <p className="text-sm text-gray-400">Fallidos</p>
                  <p className="text-3xl font-bold text-red-400">
                    {sendingResults.whatsapp.fallidos}
                  </p>
                </div>
              </div>
            </div>

            {/* Email Results */}
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4">📧 Resultados Correos</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="card bg-green-500/10 border-green-500/30">
                  <p className="text-sm text-gray-400">Enviados</p>
                  <p className="text-3xl font-bold text-green-400">
                    {sendingResults.correos.ok}
                  </p>
                </div>
                <div className="card bg-red-500/10 border-red-500/30">
                  <p className="text-sm text-gray-400">Fallidos</p>
                  <p className="text-3xl font-bold text-red-400">
                    {sendingResults.correos.fail}
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            {sendingResults.detalles && sendingResults.detalles.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4">Detalles por número</h3>
                <div className="max-h-96 overflow-y-auto scrollbar-thin">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-800">
                      <tr className="border-b border-white/10">
                        <th className="text-left p-2">Número</th>
                        <th className="text-left p-2">Estado</th>
                        <th className="text-left p-2">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sendingResults.detalles.map((detalle, idx) => (
                        <tr key={idx} className="border-b border-white/5">
                          <td className="p-2">{detalle.numero}</td>
                          <td className="p-2">
                            {detalle.estado === "OK" ? (
                              <span className="badge-success">OK</span>
                            ) : (
                              <span className="badge-error">FALLO</span>
                            )}
                          </td>
                          <td className="p-2 text-xs text-gray-400">
                            {detalle.error}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button onClick={handleReset} className="btn-primary w-full">
              Nueva Campaña
            </button>
          </div>
        </div>
      </div>
    );
  }
  // ... [Inside Render, Preview Step]
  if (currentStep === "preview") {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="card">
            <h1 className="text-3xl font-bold mb-6 text-gradient">
              Vista Previa de la Campaña
            </h1>

            <PreviewPanel
              previews={previews}
              mensajes={mensajes}
              numMensajes={numMensajes}
            />

            <div className="alert-info mt-6 mb-6">
              <p>
                📢 <strong>Nota:</strong> Se enviará un correo individual por
                cada mensaje configurado, con su propio asunto y lista de
                destinatarios.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep("config")}
                className="btn-secondary flex-1"
              >
                Volver a Editar
              </button>
              <button
                onClick={handleSend}
                className="btn-success flex-1 flex items-center justify-center gap-2"
                disabled={loading}
              >
                <FiSend />
                Enviar Campaña
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Config step
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gradient">
            WhatsApp Campaign Manager
          </h1>
          <p className="text-gray-400">
            Configura y envía campañas de WhatsApp personalizadas
          </p>
        </div>

        {/* Number of Messages Selector */}
        <div className="card mb-6">
          <label className="label text-lg">
            Número de mensajes a configurar
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleNumMensajesChange(numMensajes - 1)}
              className="btn-secondary p-3"
              disabled={numMensajes <= 1}
            >
              <FiMinus />
            </button>
            <input
              type="number"
              min="1"
              max="10"
              value={numMensajes}
              onChange={(e) => handleNumMensajesChange(e.target.value)}
              className="input text-center text-2xl font-bold w-24"
            />
            <button
              onClick={() => handleNumMensajesChange(numMensajes + 1)}
              className="btn-secondary p-3"
              disabled={numMensajes >= 10}
            >
              <FiPlus />
            </button>
            <span className="text-gray-400">mensaje(s)</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Máximo 10 mensajes por campaña
          </p>
        </div>

        {/* Message Configurations */}
        {Array.from({ length: numMensajes }, (_, i) => i + 1).map(
          (messageId) => (
            <MessageConfig
              key={messageId}
              messageId={messageId}
              checks={checks}
              onUpdate={handleMessageUpdate}
              onRemove={handleMessageRemove}
              initialData={mensajes[messageId]}
            />
          )
        )}

        {/* Actions */}
        <div className="flex gap-4 sticky bottom-6 z-10">
          <button onClick={handleReset} className="btn-danger flex-1">
            Reiniciar Todo
          </button>
          <button
            onClick={handlePreview}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FiEye />
                Vista Previa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignWizard;
