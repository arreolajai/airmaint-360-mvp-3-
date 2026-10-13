import React from 'react';
import {
  X,
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Wrench,
  Calendar,
  User as UserIcon,
} from 'lucide-react';
import type {Inspection, Compressor, InspectionItem} from '../../types';

interface InspectionDetailModalProps {
  isOpen: boolean;
  inspection: Inspection;
  compressor?: Compressor;
  onClose: () => void;
  onCreateOrderFromFinding: (item: InspectionItem, inspection: Inspection) => void;
}

export const InspectionDetailModal: React.FC<InspectionDetailModalProps> = ({
  isOpen,
  inspection,
  compressor,
  onClose,
  onCreateOrderFromFinding,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">{inspection.inspectionNumber}</h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    inspection.overallResult === 'pass'
                      ? 'bg-emerald-800 text-emerald-200'
                      : inspection.overallResult === 'warning'
                      ? 'bg-amber-800 text-amber-200'
                      : 'bg-red-800 text-red-200'
                  }`}
                >
                  {inspection.overallResult}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {compressor?.code} - {compressor?.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick summary cards */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
          <div>
            <span className="text-slate-400 block font-medium">Fecha y Hora:</span>
            <strong className="text-slate-900">{inspection.date} {inspection.time}</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Técnico:</span>
            <strong className="text-slate-900">{inspection.technicianName}</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Cumplimiento:</span>
            <strong className="text-slate-900 font-mono text-sm">{inspection.compliancePercentage}%</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Hallazgos:</span>
            <strong className={inspection.findingsCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-900'}>
              {inspection.findingsCount} detectados
            </strong>
          </div>
        </div>

        {/* Body Items list */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Puntos Evaluados en la Inspección
            </h3>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {inspection.items.map((it) => (
                <div key={it.id} className="p-3 text-xs space-y-1.5 hover:bg-slate-50/60 transition">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800">{it.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                        it.result === 'pass'
                          ? 'bg-emerald-100 text-emerald-800'
                          : it.result === 'fail'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {it.result === 'pass' ? 'Correcto' : it.result === 'fail' ? 'Incorrecto' : 'N/A'}
                    </span>
                  </div>

                  {it.numericValue !== undefined && (
                    <div className="text-[11px] text-slate-500 font-mono">
                      Lectura: <strong>{it.numericValue} {it.unit}</strong>
                    </div>
                  )}

                  {it.result === 'fail' && (
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <strong className="text-red-900 block font-bold">Hallazgo Reportado:</strong>
                          <p className="text-red-800">{it.observation}</p>
                          {it.priority && (
                            <span className="inline-block mt-1 text-[10px] uppercase font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                              Prioridad: {it.priority}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onCreateOrderFromFinding(it, inspection);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 shadow-xs transition"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Crear OT</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {inspection.notes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <strong className="block text-slate-800 font-bold mb-0.5">Observaciones Generales:</strong>
              <p className="text-slate-600">{inspection.notes}</p>
            </div>
          )}

          {inspection.signatureUrl && (
            <div className="text-xs">
              <strong className="block text-slate-700 font-bold mb-1">Firma del Inspector:</strong>
              <img
                src={inspection.signatureUrl}
                alt="Firma del inspector"
                className="h-16 border border-slate-200 rounded-lg p-1 bg-white"
              />
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
