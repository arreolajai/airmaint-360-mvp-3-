import React, {useState} from 'react';
import {
  AlertOctagon,
  Search,
  Plus,
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
  Wrench,
  ChevronRight,
  Clock,
  Edit,
} from 'lucide-react';
import type {Failure, Compressor} from '../../types';
import {exportToCSV} from '../../services/csvService';

interface FailuresViewProps {
  failures: Failure[];
  compressors: Compressor[];
  onNewFailure: () => void;
  onEditFailure: (failure: Failure) => void;
  onCreateOrderFromFailure: (failure: Failure, compressor: Compressor) => void;
}

export const FailuresView: React.FC<FailuresViewProps> = ({
  failures,
  compressors,
  onNewFailure,
  onEditFailure,
  onCreateOrderFromFailure,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompId, setSelectedCompId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const compMap = new Map(compressors.map((c) => [c.id, c]));

  const enriched = failures.map((f) => {
    const c = compMap.get(f.compressorId);
    return {
      ...f,
      compressorCode: c?.code || 'N/A',
      compressorName: c?.name || 'Equipo Desconocido',
    };
  });

  const filtered = enriched.filter((f) => {
    const matchesSearch =
      f.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.symptom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.compressorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.alarmCode && f.alarmCode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesComp = selectedCompId === 'all' || f.compressorId === selectedCompId;
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;

    return matchesSearch && matchesComp && matchesStatus;
  });

  const totalDowntime = failures
    .filter((f) => f.downtimeHours)
    .reduce((sum, f) => sum + (f.downtimeHours || 0), 0);

  const handleExportCSV = () => {
    const rows = filtered.map((f) => ({
      Folio: f.folio,
      Equipo: f.compressorCode,
      Fecha: f.occurredAt,
      Paro_Equipo: f.isMachineStopped ? 'SI' : 'NO',
      Sintoma: f.symptom,
      Alarma: f.alarmCode || '',
      Prioridad: f.priority,
      Estado: f.status,
      Tiempo_Paro_Hrs: f.downtimeHours || '',
      Responsable: f.assignedTo || '',
      Causa_Estimada: f.possibleCause || '',
      Accion_Inmediata: f.immediateAction || '',
    }));
    exportToCSV('Registro_de_Fallas', rows);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Control y Registro de Fallas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Bitácora de alarmas, fallas mecánicas, paros no programados y tiempos de inactividad
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
            onClick={onNewFailure}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Reportar Falla</span>
          </button>
        </div>
      </div>

      {/* KPI banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Fallas Reportadas</span>
          <div className="text-xl font-black text-slate-900 mt-1">{failures.length}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Fallas Activas (Abiertas)</span>
          <div className="text-xl font-black text-rose-600 mt-1">
            {failures.filter((f) => f.status !== 'closed' && f.status !== 'resolved').length}
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Tiempo de Paro Acumulado</span>
          <div className="text-xl font-black text-amber-700 mt-1 font-mono">{totalDowntime} hrs</div>
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
            placeholder="Buscar por síntoma, código de alarma, equipo o descripción..."
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
                {c.code}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Todos los Estados</option>
            <option value="open">Abierta</option>
            <option value="in_analysis">En Análisis</option>
            <option value="in_repair">En Reparación</option>
            <option value="resolved">Corregida</option>
            <option value="closed">Cerrada</option>
          </select>
        </div>
      </div>

      {/* Failures List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            <AlertOctagon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            No se encontraron fallas registradas con los filtros seleccionados.
          </div>
        ) : (
          filtered.map((f) => {
            const rawComp = compMap.get(f.compressorId);

            return (
              <div
                key={f.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-rose-400 p-4 shadow-xs transition space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-xs text-rose-700 px-2 py-0.5 rounded bg-rose-50 border border-rose-200">
                      {f.folio}
                    </span>
                    <span className="font-bold text-xs text-slate-900">{f.compressorCode}</span>
                    {f.isMachineStopped && (
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]">
                        PARO DE EQUIPO
                      </span>
                    )}
                    {f.alarmCode && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                        {f.alarmCode}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        f.priority === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : f.priority === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {f.priority}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                      {f.status}
                    </span>
                    <button
                      onClick={() => onEditFailure(f)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                      title="Editar registro de falla"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs">
                  <h4 className="font-bold text-slate-800">{f.symptom}</h4>
                  <p className="text-slate-600 mt-0.5">{f.description}</p>
                </div>

                {/* Footer details & Action */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <span>Ocurrió: {f.occurredAt.replace('T', ' ').substring(0, 16)}</span>
                    {f.downtimeHours && (
                      <span className="font-mono font-bold text-amber-700">
                        Tiempo de paro: {f.downtimeHours} hrs
                      </span>
                    )}
                  </div>

                  {rawComp && f.status !== 'closed' && (
                    <button
                      onClick={() => onCreateOrderFromFailure(f, rawComp)}
                      className="flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 transition"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Generar OT Correctiva</span>
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
