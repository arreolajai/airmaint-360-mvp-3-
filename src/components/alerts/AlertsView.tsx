import React, {useState} from 'react';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle,
  Clock,
  ArrowRight,
  Filter,
  Check,
  X,
} from 'lucide-react';
import type {Alert, AlertLevel, AlertStatus} from '../../types';

interface AlertsViewProps {
  alerts: Alert[];
  onOpenEntity: (type: Alert['relatedEntityType'], entityId?: string) => void;
  onUpdateAlertStatus: (alertId: string, status: AlertStatus) => Promise<void>;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onOpenEntity,
  onUpdateAlertStatus,
}) => {
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');

  const filtered = alerts.filter((a) => {
    const matchesLevel = levelFilter === 'all' || a.level === levelFilter;
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? a.status !== 'closed'
        : a.status === statusFilter;

    return matchesLevel && matchesStatus;
  });

  const getLevelIcon = (level: AlertLevel) => {
    switch (level) {
      case 'critical':
        return <AlertOctagon className="w-5 h-5 text-red-600" />;
      case 'important':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'warning':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getLevelBadge = (level: AlertLevel) => {
    switch (level) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[10px]">Crítica</span>;
      case 'important':
        return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">Importante</span>;
      case 'warning':
        return <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 font-bold text-[10px]">Advertencia</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">Informativa</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Centro de Alertas y Notificaciones
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Monitoreo en tiempo real de vencimientos, anomalías de inspección, fallas y avisos del sistema
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none"
          >
            <option value="active">Activas (Nuevas, Vistas, Atendidas)</option>
            <option value="all">Todas las Alertas</option>
            <option value="new">Solo Nuevas</option>
            <option value="closed">Cerradas / Resueltas</option>
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Todos los Niveles</option>
            <option value="critical">Críticas</option>
            <option value="important">Importantes</option>
            <option value="warning">Advertencias</option>
            <option value="info">Informativas</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Mostrando {filtered.length} de {alerts.length} alertas registradas
        </span>
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            <CheckCircle className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
            No existen alertas que requieran atención en este momento.
          </div>
        ) : (
          filtered.map((al) => (
            <div
              key={al.id}
              className={`p-4 rounded-2xl border transition shadow-xs space-y-2.5 ${
                al.status === 'new'
                  ? 'bg-white border-blue-300 ring-2 ring-blue-500/10'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                    {getLevelIcon(al.level)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{al.title}</h3>
                    <span className="text-[11px] text-slate-400 font-mono">{al.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {getLevelBadge(al.level)}
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                    {al.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 pl-11 leading-relaxed">{al.description}</p>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 pl-11">
                <div className="flex items-center gap-1.5">
                  {al.status === 'new' && (
                    <button
                      onClick={() => onUpdateAlertStatus(al.id, 'viewed')}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
                    >
                      Marcar como vista
                    </button>
                  )}
                  {al.status !== 'attended' && al.status !== 'closed' && (
                    <button
                      onClick={() => onUpdateAlertStatus(al.id, 'attended')}
                      className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:text-amber-900 rounded-lg hover:bg-amber-50 transition"
                    >
                      Marcar como atendida
                    </button>
                  )}
                  {al.status !== 'closed' && (
                    <button
                      onClick={() => onUpdateAlertStatus(al.id, 'closed')}
                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 rounded-lg hover:bg-emerald-50 transition"
                    >
                      Cerrar alerta
                    </button>
                  )}
                </div>

                {al.relatedEntityId && (
                  <button
                    onClick={() => onOpenEntity(al.relatedEntityType, al.relatedEntityId)}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                  >
                    <span>Ir al Registro Relacionado</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
