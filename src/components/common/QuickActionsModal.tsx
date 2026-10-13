import React from 'react';
import {Gauge, Wrench, ClipboardCheck, AlertOctagon, X} from 'lucide-react';

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: 'capture_meter' | 'create_order' | 'run_inspection' | 'report_failure') => void;
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({isOpen, onClose, onAction}) => {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'capture_meter' as const,
      title: 'Registrar Horómetro',
      desc: 'Captura rápida de horas de operación y carga',
      icon: Gauge,
      color: 'bg-blue-500 text-white hover:bg-blue-600',
    },
    {
      id: 'create_order' as const,
      title: 'Crear Orden de Trabajo',
      desc: 'Generar orden preventiva, correctiva o de servicio',
      icon: Wrench,
      color: 'bg-emerald-600 text-white hover:bg-emerald-700',
    },
    {
      id: 'run_inspection' as const,
      title: 'Realizar Inspección',
      desc: 'Checklist técnico de 14 puntos de control',
      icon: ClipboardCheck,
      color: 'bg-indigo-600 text-white hover:bg-indigo-700',
    },
    {
      id: 'report_failure' as const,
      title: 'Reportar Falla',
      desc: 'Registrar alarma, síntoma o paro no programado',
      icon: AlertOctagon,
      color: 'bg-rose-600 text-white hover:bg-rose-700',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Acción Rápida</h3>
            <p className="text-xs text-slate-500">Operaciones frecuentes en planta</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => {
                  onClose();
                  onAction(act.id);
                }}
                className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition group active:scale-[0.98]"
              >
                <div className={`p-2.5 rounded-xl ${act.color} shadow-sm transition`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600">
                    {act.title}
                  </div>
                  <div className="text-xs text-slate-500">{act.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
