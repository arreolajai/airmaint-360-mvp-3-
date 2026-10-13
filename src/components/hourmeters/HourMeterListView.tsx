import React, {useState} from 'react';
import {Gauge, Search, Plus, FileSpreadsheet, Calendar, Image as ImageIcon} from 'lucide-react';
import type {HourMeterReading, Compressor} from '../../types';
import {exportToCSV} from '../../services/csvService';

interface HourMeterListViewProps {
  readings: HourMeterReading[];
  compressors: Compressor[];
  onOpenCaptureModal: () => void;
}

export const HourMeterListView: React.FC<HourMeterListViewProps> = ({
  readings,
  compressors,
  onOpenCaptureModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompId, setSelectedCompId] = useState<string>('all');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const compMap = new Map(compressors.map((c) => [c.id, c]));

  const enrichedReadings = readings.map((r) => {
    const comp = compMap.get(r.compressorId);
    return {
      ...r,
      compressorCode: comp?.code || 'N/A',
      compressorName: comp?.name || 'Equipo Desconocido',
    };
  });

  const filtered = enrichedReadings.filter((r) => {
    const matchesSearch =
      r.compressorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.compressorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.recordedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesComp = selectedCompId === 'all' || r.compressorId === selectedCompId;

    return matchesSearch && matchesComp;
  });

  const handleExportCSV = () => {
    const rows = filtered.map((r) => ({
      Fecha: r.date,
      Hora: r.time,
      Codigo_Equipo: r.compressorCode,
      Nombre_Equipo: r.compressorName,
      Horometro_Actual: r.currentHours,
      Horas_Carga: r.loadedHours || '',
      Horas_Vacio: r.unloadedHours || '',
      Diferencia_Horas: r.diffHours,
      Registrado_Por: r.recordedBy,
      Observaciones: r.notes || '',
      Es_Reemplazo: r.isMeterReplacement ? 'SI' : 'NO',
    }));
    exportToCSV('Historial_Horometros', rows);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Bitácora de Horómetros
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Registro cronológico inalterable de lecturas y marcha de equipos
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
            onClick={onOpenCaptureModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Horómetro</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por equipo, técnico u observación..."
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
          />
        </div>

        <select
          value={selectedCompId}
          onChange={(e) => setSelectedCompId(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none"
        >
          <option value="all">Todos los Compresores</option>
          {compressors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} - {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Gauge className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            No se encontraron capturas de horómetro con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Equipo</th>
                  <th className="py-3 px-4">Horómetro Registrado</th>
                  <th className="py-3 px-4">Carga / Vacío</th>
                  <th className="py-3 px-4">Diferencia</th>
                  <th className="py-3 px-4">Técnico</th>
                  <th className="py-3 px-4">Foto</th>
                  <th className="py-3 px-4">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                      {r.date} <span className="text-slate-400 text-[11px] font-mono">{r.time}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{r.compressorCode}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {r.compressorName}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-black font-mono text-slate-900 text-sm">
                        {r.currentHours.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">hrs</span>
                      </div>
                      {r.isMeterReplacement && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 text-[9px] font-bold">
                          Reemplazo Panel
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {r.loadedHours ? `${r.loadedHours.toLocaleString()} h` : '-'}{' '}
                      / {r.unloadedHours ? `${r.unloadedHours.toLocaleString()} h` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-600 font-mono">
                        +{r.diffHours.toLocaleString()} hrs
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{r.recordedBy}</td>
                    <td className="py-3 px-4">
                      {r.photoUrl ? (
                        <button
                          onClick={() => setPreviewPhoto(r.photoUrl || null)}
                          className="p-1 rounded bg-slate-100 hover:bg-blue-100 text-blue-600 transition"
                          title="Ver fotografía del display"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{r.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="max-w-lg w-full bg-white rounded-2xl p-3 overflow-hidden shadow-2xl">
            <img src={previewPhoto} alt="Display del Horómetro" className="w-full rounded-xl object-contain max-h-[80vh]" />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="mt-3 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
            >
              Cerrar Vista Previa
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
