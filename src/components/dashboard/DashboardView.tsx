import React from 'react';
import {
  Cpu,
  PlayCircle,
  StopCircle,
  Clock,
  AlertTriangle,
  Wrench,
  AlertOctagon,
  ClipboardCheck,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import type {
  Compressor,
  MaintenanceCalculation,
  WorkOrder,
  Failure,
  Inspection,
  Alert,
} from '../../types';

interface DashboardViewProps {
  compressors: Compressor[];
  calculations: MaintenanceCalculation[];
  workOrders: WorkOrder[];
  failures: Failure[];
  inspections: Inspection[];
  alerts: Alert[];
  onNavigate: (view: any, filter?: any) => void;
  onOpenQuickActions: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  compressors,
  calculations,
  workOrders,
  failures,
  inspections,
  alerts,
  onNavigate,
}) => {
  // Counters
  const totalCompressors = compressors.length;
  const operatingCompressors = compressors.filter((c) => c.status === 'operating').length;
  const stoppedCompressors = compressors.filter(
    (c) => c.status === 'stopped' || c.status === 'out_of_service' || c.status === 'maintenance'
  ).length;

  const upcomingMaintenance = calculations.filter((c) => c.status === 'upcoming' || c.status === 'schedule');
  const overdueMaintenance = calculations.filter((c) => c.status === 'overdue');

  const openOrders = workOrders.filter(
    (o) => o.status === 'new' || o.status === 'scheduled' || o.status === 'in_progress' || o.status === 'pending'
  );
  const openFailures = failures.filter((f) => f.status !== 'closed' && f.status !== 'resolved');
  const criticalAlerts = alerts.filter(
    (a) => (a.level === 'critical' || a.level === 'important') && a.status !== 'closed'
  );

  // Top 5 upcoming / overdue maintenance sorted by remaining hours
  const topUpcoming = [...calculations]
    .sort((a, b) => a.remainingHours - b.remainingHours)
    .slice(0, 5);

  // Preventive Compliance KPI: ratio of completed/closed orders or normal activities
  const totalCalculable = calculations.length;
  const normalCalculable = calculations.filter((c) => c.status === 'normal').length;
  const complianceKpi =
    totalCalculable > 0 ? Math.round((normalCalculable / totalCalculable) * 100) : null;

  // Work orders by status breakdown
  const ordersByStatus = {
    new: workOrders.filter((o) => o.status === 'new').length,
    scheduled: workOrders.filter((o) => o.status === 'scheduled').length,
    in_progress: workOrders.filter((o) => o.status === 'in_progress').length,
    completed: workOrders.filter((o) => o.status === 'completed' || o.status === 'closed').length,
  };

  // Recent month maintenance executed
  const closedOrdersThisYear = workOrders.filter((o) => o.status === 'closed' || o.status === 'completed');

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Industrial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Panel de Control de Mantenimiento
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Supervisión operativa, semáforo preventivo y órdenes de compresores
          </p>
        </div>

        {complianceKpi !== null && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Cumplimiento Preventivo</div>
              <div className="text-lg font-black text-emerald-700">{complianceKpi}%</div>
            </div>
          </div>
        )}
      </div>

      {/* 8 Primary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Compresores */}
        <div
          onClick={() => onNavigate('compressors')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 cursor-pointer transition active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Compresores</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totalCompressors}</div>
          <div className="mt-1 text-[11px] text-blue-600 font-medium flex items-center gap-1">
            <span>Ver inventario</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* 2. Equipos Operando */}
        <div
          onClick={() => onNavigate('compressors')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-400 cursor-pointer transition active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Equipos Operando</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">{operatingCompressors}</div>
          <div className="mt-1 text-[11px] text-emerald-700 font-medium">En servicio continuo</div>
        </div>

        {/* 3. Equipos Detenidos */}
        <div
          onClick={() => onNavigate('compressors')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400 cursor-pointer transition active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Equipos Detenidos</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <StopCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">{stoppedCompressors}</div>
          <div className="mt-1 text-[11px] text-amber-700 font-medium">Paro o mantenimiento</div>
        </div>

        {/* 4. Servicios Próximos */}
        <div
          onClick={() => onNavigate('maintenance')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-yellow-400 cursor-pointer transition active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Servicios Próximos</span>
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-yellow-700">{upcomingMaintenance.length}</div>
          <div className="mt-1 text-[11px] text-yellow-800 font-medium">Menos de 20% disponible</div>
        </div>

        {/* 5. Servicios Vencidos */}
        <div
          onClick={() => onNavigate('maintenance')}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition active:scale-[0.99] ${
            overdueMaintenance.length > 0
              ? 'bg-red-50/70 border-red-300 hover:border-red-500'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Servicios Vencidos</span>
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-red-700">{overdueMaintenance.length}</div>
          <div className="mt-1 text-[11px] text-red-600 font-medium">Requieren orden urgente</div>
        </div>

        {/* 6. Órdenes Abiertas */}
        <div
          onClick={() => onNavigate('orders')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 cursor-pointer transition active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Órdenes Abiertas</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{openOrders.length}</div>
          <div className="mt-1 text-[11px] text-blue-600 font-medium">Programadas o en curso</div>
        </div>

        {/* 7. Fallas Abiertas */}
        <div
          onClick={() => onNavigate('failures')}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition active:scale-[0.99] ${
            openFailures.length > 0 ? 'bg-rose-50/70 border-rose-300' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Fallas Abiertas</span>
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700">{openFailures.length}</div>
          <div className="mt-1 text-[11px] text-rose-600 font-medium">En análisis o reparación</div>
        </div>

        {/* 8. Inspecciones Registradas */}
        <div
          onClick={() => onNavigate('inspections')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 cursor-pointer transition active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Inspecciones</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{inspections.length}</div>
          <div className="mt-1 text-[11px] text-indigo-600 font-medium">Historial acumulado</div>
        </div>
      </div>

      {/* Main Two-Column Section: Top 5 Maintenance & Critical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos 5 Mantenimientos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cinco Próximos Mantenimientos</h3>
              <p className="text-xs text-slate-400">Proyección por horómetro acumulado</p>
            </div>
            <button
              onClick={() => onNavigate('maintenance')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 flex-1 divide-y divide-slate-100">
            {topUpcoming.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No existen datos suficientes para mostrar este indicador
              </div>
            ) : (
              topUpcoming.map((item) => (
                <div key={item.activityId} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{item.compressorCode}</span>
                      <span className="text-xs text-slate-600 truncate">{item.activityName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Horas restantes: <strong className={item.remainingHours <= 0 ? 'text-red-600' : 'text-slate-700'}>{item.remainingHours} hrs</strong>
                      {item.estimatedDate && ` • Est: ${item.estimatedDate}`}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${item.colorClass}`}>
                      {item.statusLabel}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.consumedPercentage}% consumido</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alertas Críticas & Importantes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Alertas Activas</h3>
              <p className="text-xs text-slate-400">Fallas, vencimientos y anomalías</p>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 flex-1 divide-y divide-slate-100">
            {criticalAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-emerald-600 font-medium">
                No existen alertas críticas activas en este momento.
              </div>
            ) : (
              criticalAlerts.slice(0, 5).map((al) => (
                <div key={al.id} className="py-3 flex items-start gap-3">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      al.level === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900">{al.title}</div>
                    <div className="text-xs text-slate-600 mt-0.5 line-clamp-2">{al.description}</div>
                    <span className="text-[10px] text-slate-400 mt-1 block">{al.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Industrial Visual Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de Órdenes por Estado */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Órdenes de Trabajo por Estado</h3>
            <p className="text-xs text-slate-400">Distribución de carga de trabajo técnico</p>
          </div>

          {workOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No existen datos suficientes para mostrar este indicador
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {[
                {label: 'Nuevas', count: ordersByStatus.new, color: 'bg-slate-400'},
                {label: 'Programadas', count: ordersByStatus.scheduled, color: 'bg-blue-500'},
                {label: 'En Proceso', count: ordersByStatus.in_progress, color: 'bg-amber-500'},
                {label: 'Terminadas / Cerradas', count: ordersByStatus.completed, color: 'bg-emerald-500'},
              ].map((item) => {
                const pct =
                  workOrders.length > 0 ? Math.round((item.count / workOrders.length) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>{item.label}</span>
                      <span>
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{width: `${pct}%`}} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumen Operativo y Mantenimientos Cerrados */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Mantenimientos Ejecutados</h3>
              <p className="text-xs text-slate-400">Historial de órdenes preventivas concluidas</p>
            </div>

            {closedOrdersThisYear.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No existen datos suficientes para mostrar este indicador
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-600 font-medium">Total de órdenes cerradas satisfactoriamente:</div>
                  <div className="text-base font-black text-blue-700">{closedOrdersThisYear.length}</div>
                </div>

                <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {closedOrdersThisYear.slice(0, 3).map((co) => (
                    <div key={co.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{co.folio}</span>
                        <span className="text-slate-500 ml-2">{co.description}</span>
                      </div>
                      <span className="text-emerald-600 font-bold text-[11px] shrink-0">
                        {co.executionDate || 'Completada'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Control de activos sin conexión</span>
            <button
              onClick={() => onNavigate('reports')}
              className="font-bold text-blue-600 hover:text-blue-800"
            >
              Exportar Reporte Ejecutivo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
