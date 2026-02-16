import React from "react";
import { FiCheck, FiLink, FiMessageSquare } from "react-icons/fi";

const PreviewPanel = ({ previews, mensajes, numMensajes }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <FiCheck className="text-green-400" size={24} />
        <h2 className="text-2xl font-bold">
          Resumen de {numMensajes} mensaje(s)
        </h2>
      </div>

      {previews.map((preview, index) => {
        const msgId = index + 1;
        const msgConfig = mensajes[msgId];

        return (
          <div key={index} className="card bg-white/5">
            <h3 className="text-xl font-bold mb-4 text-gradient">
              Mensaje #{msgId}
            </h3>

            {/* Configuration Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-xs text-gray-400">CHECK</p>
                <p className="font-medium">{preview.variables.CHECK}</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <p className="text-xs text-gray-400">CLASE</p>
                <p className="font-medium">{preview.variables.CLASE}</p>
              </div>
              <div className="p-3 bg-pink-500/10 rounded-lg border border-pink-500/20">
                <p className="text-xs text-gray-400">GRUPO</p>
                <p className="font-medium">{preview.variables.GRUPO}</p>
              </div>
              <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <p className="text-xs text-gray-400">HORA</p>
                <p className="font-medium">{preview.variables.HORA}</p>
              </div>
            </div>

            {/* Generated Link */}
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FiLink className="text-green-400" />
                <span className="text-sm font-medium text-green-400">
                  Link generado:
                </span>
              </div>
              <a
                href={preview.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-300 hover:text-green-200 break-all transition-colors"
              >
                {preview.link}
              </a>
            </div>

            {/* Message Preview */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FiMessageSquare className="text-blue-400" />
                <span className="text-sm font-medium text-blue-400">
                  Mensaje final:
                </span>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg border border-white/10">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-300">
                  {preview.texto_final}
                </pre>
              </div>
            </div>

            {/* Files Info */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="badge-info">
                📄 {msgConfig?.archivo_numeros || "Sin archivo de números"}
              </span>
              <span className="badge-info">
                📧 {msgConfig?.archivo_correos || "Sin archivo de correos"}
              </span>
            </div>

            {/* Variable Replacements (if any variables were used) */}
            {preview.texto_original !== preview.texto_final && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                  Ver texto original con variables
                </summary>
                <div className="mt-2 p-3 bg-gray-900/50 rounded-lg border border-white/5">
                  <pre className="whitespace-pre-wrap font-sans text-xs text-gray-500">
                    {preview.texto_original}
                  </pre>
                </div>
              </details>
            )}
          </div>
        );
      })}

      {/* Summary Stats */}
      <div className="card bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <h3 className="text-lg font-bold mb-3">Resumen de la campaña</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-400">Total de mensajes</p>
            <p className="text-2xl font-bold">{numMensajes}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Links generados</p>
            <p className="text-2xl font-bold">{previews.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Variables usadas</p>
            <p className="text-2xl font-bold">
              {previews.reduce((acc, p) => {
                const matches = p.texto_original.match(/\{[A-Z]+\}/g);
                return acc + (matches ? matches.length : 0);
              }, 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
