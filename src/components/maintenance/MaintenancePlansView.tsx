import React, {useState} from 'react';
import {
  CalendarClock,
  Search,
  Plus,
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  Filter,
  ArrowRight,
  Edit,
} from 'lucide-react';
import type {
  MaintenanceActivity,
  MaintenanceCalculation,
  Compressor,
  TrafficLightStatus,
} from '../../types';
import {exportToCSV} from '../../services/csvService';

interface MaintenancePlansViewProps {
  calculations: MaintenanceCalculation[];
  activities: MaintenanceActivity[];
  compressors: Compressor[];
  onNewActivity: () => void;
  onEditActivity: (activity: MaintenanceActivity) => void;
  onCreateOrderFromActivity: (activity: MaintenanceActivity, compressor: Compressor) => void;
}

export const MaintenancePlansView: React.FC<MaintenancePlansViewProps> = ({
  calculations,
  activities,
  compressors,
  onNewActivity,
  onEditActivity,
  onCreateOrderFromActivity,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompId, setSelectedCompId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const compMap = new Map(compressors.map((c) => [c.id, c]));
  const actMap = new Map(activities.map((a) => [a.id, a]));

  const filtered = calculations.filter((calc) => {
    const matchesSearch =
      calc.activityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      calc.compressorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      calc.compressorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesComp = selectedCompId === 'all' || calc.compressorId === selectedCompId;
    const matchesStatus = statusFilter === 'all' || calc.status === statusFilter;

    return matchesSearch && matchesComp && matchesStatus;
  });

  const handleExportCSV = () => {
    const rows = filtered.map((c) => ({
      Codigo_Equipo: c.compressorCode,
      Nombre_Equipo: c.compressorName,
      Actividad: c.activityName,
      Proximo_Horometro: c.nextMeter,
      Horas_Restantes: c.remainingHours,
      Porcentaje_Consumido: `${c.consumedPercentage}%`,
      Fecha_Estimada: c.estimatedDate || c.nextDate || 'N/A',
      Estado: c.statusLabel,
    }));
    exportToCSV('Programa_Mantenimiento_Preventivo', rows);
  };

  const getStatusBadge = (status: TrafficLightStatus, label: string, colorClass: string) => {
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${colorClass}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Programa de Mantenimiento Preventivo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Control de ciclos por horómetro, semáforo dinámico y generación de órdenes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={onNewActivity}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Actividad</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de actividad o código de compresor..."
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCompId}
            onChange={(e) => setSelectedCompId(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Todos los Equipos</option>
            {compressors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none font-medium"
          >
            <option value="all">Todos los Semáforos</option>
            <option value="overdue">Vencidos (Rojo)</option>
            <option value="schedule">Por Programar (&lt; 10%)</option>
            <option value="upcoming">Próximos (10% - 20%)</option>
            <option value="normal">Normal (&gt; 20%)</option>
          </select>
        </div>
      </div>

      {/* Matrix Cards List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            <CalendarClock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            No se encontraron actividades de mantenimiento con los filtros seleccionados.
          </div>
        ) : (
          filtered.map((calc) => {
            const rawAct = actMap.get(calc.activityId);
            const rawComp = compMap.get(calc.compressorId);

            return (
              <div
                key={calc.activityId}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-4 shadow-xs transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-mono font-bold text-xs">
                      {calc.compressorCode}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{calc.activityName}</h3>
                      <p className="text-[11px] text-slate-400">
                        {calc.compressorName} • Intervalo: {rawAct?.intervalHours.toLocaleString()} hrs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(calc.status, calc.statusLabel, calc.colorClass)}
                    {rawAct && (
                      <button
                        onClick={() => onEditActivity(rawAct)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        title="Editar parámetros de la actividad"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Numerical indicators */}
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Próx. Horómetro</span>
                      <strong className="text-slate-900 font-mono">{calc.nextMeter.toLocaleString()} hrs</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Horas Restantes</span>
                      <strong className={calc.remainingHours <= 0 ? 'text-red-600 font-mono' : 'text-slate-900 font-mono'}>
                        {calc.remainingHours.toLocaleString()} hrs
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Consumo de Ciclo</span>
                      <strong className="text-slate-900">{calc.consumedPercentage}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Fecha Proyectada</span>
                      <strong className="text-slate-800">{calc.estimatedDate || calc.nextDate || 'Sin proyección'}</strong>
                    </div>
                  </div>

                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all ${
                        calc.status === 'overdue'
                          ? 'bg-red-600'
                          : calc.status === 'schedule'
                          ? 'bg-amber-500'
                          : calc.status === 'upcoming'
                          ? 'bg-yellow-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{width: `${Math.min(100, Math.max(0, calc.consumedPercentage))}%`}}
                    />
                  </div>
                </div>

                {/* Quick create order button */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Último servicio: {rawAct?.lastServiceHours.toLocaleString()} hrs ({rawAct?.lastServiceDate})
                  </span>

                  {rawAct && rawComp && (
                    <button
                      onClick={() => onCreateOrderFromActivity(rawAct, rawComp)}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition active:scale-95"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Generar Orden de Trabajo</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
