import React from 'react';
import {X, Shield, Search, FileSpreadsheet} from 'lucide-react';
import type {AuditLog} from '../../types';
import {exportToCSV} from '../../services/csvService';

interface AuditLogModalProps {
  isOpen: boolean;
  logs: AuditLog[];
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({isOpen, logs, onClose}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  if (!isOpen) return null;

  const filtered = logs.filter(
    (l) =>
      l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    const rows = filtered.map((l) => ({
      Timestamp: l.timestamp,
      Usuario: l.user,
      Accion: l.action,
      Modulo: l.module,
      Entidad_ID: l.entityId || '',
      Descripcion: l.description,
    }));
    exportToCSV('Bitacora_Auditoria_AIRMAINT', rows);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-600 rounded-lg text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Bitácora de Auditoría Local</h2>
              <p className="text-xs text-slate-400">Registro inalterable de accesos, operaciones y transacciones</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por usuario, acción o descripción..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 bg-white text-xs focus:outline-none"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold shadow-xs hover:bg-slate-100 transition shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar Bitácora</span>
          </button>
        </div>

        {/* Table */}
        <div className="p-6 overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No se encontraron registros en la bitácora con el término especificado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-2 px-3">Fecha y Hora</th>
                    <th className="py-2 px-3">Usuario</th>
                    <th className="py-2 px-3">Acción</th>
                    <th className="py-2 px-3">Módulo</th>
                    <th className="py-2 px-3">Descripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{log.user}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 uppercase font-mono text-[10px]">
                        {log.module}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-sm">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
