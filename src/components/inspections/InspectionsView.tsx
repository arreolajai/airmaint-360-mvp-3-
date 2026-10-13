import React, {useState} from 'react';
import {
  ClipboardCheck,
  Search,
  Plus,
  FileSpreadsheet,
  Calendar,
  User as UserIcon,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import type {Inspection, Compressor} from '../../types';
import {exportToCSV} from '../../services/csvService';

interface InspectionsViewProps {
  inspections: Inspection[];
  compressors: Compressor[];
  onSelectInspection: (inspection: Inspection) => void;
  onNewInspection: () => void;
}

export const InspectionsView: React.FC<InspectionsViewProps> = ({
  inspections,
  compressors,
  onSelectInspection,
  onNewInspection,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompId, setSelectedCompId] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');

  const compMap = new Map(compressors.map((c) => [c.id, c]));

  const enriched = inspections.map((i) => {
    const c = compMap.get(i.compressorId);
    return {
      ...i,
      compressorCode: c?.code || 'N/A',
      compressorName: c?.name || 'Equipo Desconocido',
    };
  });

  const filtered = enriched.filter((i) => {
    const matchesSearch =
      i.inspectionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.technicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.compressorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.notes && i.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesComp = selectedCompId === 'all' || i.compressorId === selectedCompId;
    const matchesResult = resultFilter === 'all' || i.overallResult === resultFilter;

    return matchesSearch && matchesComp && matchesResult;
  });

  const handleExportCSV = () => {
    const rows = filtered.map((i) => ({
      Folio: i.inspectionNumber,
      Equipo: i.compressorCode,
      Fecha: i.date,
      Hora: i.time,
      Tecnico: i.technicianName,
      Cumplimiento_Porcentaje: `${i.compliancePercentage}%`,
      Hallazgos: i.findingsCount,
      Resultado: i.overallResult,
      Observaciones: i.notes || '',
    }));
    exportToCSV('Inspecciones_Tecnicas', rows);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Inspecciones Operativas y de Seguridad
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Checklist técnico periódico de 14 puntos de control, niveles y condiciones
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
            onClick={onNewInspection}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Inspección</span>
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
            placeholder="Buscar por folio de inspección, técnico o equipo..."
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
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Todos los Resultados</option>
            <option value="pass">Aprobada (Pass)</option>
            <option value="warning">Con Observaciones</option>
            <option value="fail">Crítica / No Apta</option>
          </select>
        </div>
      </div>

      {/* Inspections List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            <ClipboardCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            No se encontraron inspecciones con los filtros seleccionados.
          </div>
        ) : (
          filtered.map((ins) => (
            <div
              key={ins.id}
              onClick={() => onSelectInspection(ins)}
              className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 p-4 shadow-xs transition cursor-pointer space-y-2 hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-xs text-indigo-700 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                    {ins.inspectionNumber}
                  </span>
                  <span className="font-bold text-xs text-slate-900">{ins.compressorCode}</span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-600 font-medium">Téc. {ins.technicianName}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-bold text-slate-700">
                    Cumplimiento: {ins.compliancePercentage}%
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      ins.overallResult === 'pass'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ins.overallResult === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {ins.overallResult}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {ins.date} {ins.time}
                  </span>
                  <span>
                    Hallazgos detectados:{' '}
                    <strong className={ins.findingsCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                      {ins.findingsCount}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-1 text-indigo-600 font-bold text-xs">
                  <span>Ver Detalle y Checklist</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
