import React, {useState} from 'react';
import {
  Cpu,
  Search,
  Plus,
  PlayCircle,
  StopCircle,
  Wrench,
  AlertTriangle,
  QrCode,
  Gauge,
  ChevronRight,
  Filter,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import type {Compressor, CompressorStatus} from '../../types';

interface CompressorListViewProps {
  compressors: Compressor[];
  onSelectCompressor: (compressor: Compressor) => void;
  onNewCompressor: () => void;
  onEditCompressor: (compressor: Compressor) => void;
  onDeactivateCompressor: (compressor: Compressor) => void;
  onCaptureMeter: (compressor: Compressor) => void;
}

export const CompressorListView: React.FC<CompressorListViewProps> = ({
  compressors,
  onSelectCompressor,
  onNewCompressor,
  onEditCompressor,
  onDeactivateCompressor,
  onCaptureMeter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');

  const buildings = Array.from(new Set(compressors.map((c) => c.building).filter(Boolean)));

  const filteredCompressors = compressors.filter((c) => {
    if (c.deletedAt) return false;

    const matchesSearch =
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesBuilding = buildingFilter === 'all' || c.building === buildingFilter;

    return matchesSearch && matchesStatus && matchesBuilding;
  });

  const getStatusBadge = (status: CompressorStatus) => {
    switch (status) {
      case 'operating':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
            <PlayCircle className="w-3 h-3 text-emerald-600" /> Operando
          </span>
        );
      case 'stopped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[11px] font-bold">
            <StopCircle className="w-3 h-3 text-slate-600" /> Detenido
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
            <Wrench className="w-3 h-3 text-amber-600" /> En Mantenimiento
          </span>
        );
      case 'standby':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
            En Espera
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-bold">
            <AlertTriangle className="w-3 h-3 text-red-600" /> Fuera de Servicio
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Catálogo de Compresores de Aire
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Administración de activos, fichas técnicas, horómetros y códigos QR
          </p>
        </div>

        <button
          onClick={onNewCompressor}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Compresor</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código (ej. CP-01), marca, serie o modelo..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-700 focus:border-blue-600 focus:outline-none"
            >
              <option value="all">Todos los Estados</option>
              <option value="operating">Operando</option>
              <option value="stopped">Detenido</option>
              <option value="maintenance">En Mantenimiento</option>
              <option value="standby">En Espera</option>
              <option value="out_of_service">Fuera de Servicio</option>
            </select>

            {/* Building Filter */}
            {buildings.length > 0 && (
              <select
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-700 focus:border-blue-600 focus:outline-none"
              >
                <option value="all">Todas las Naves</option>
                {buildings.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Compressor Grid & List */}
      {filteredCompressors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron compresores</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No existen equipos registrados que coincidan con los criterios de búsqueda aplicados.
          </p>
          <button
            onClick={onNewCompressor}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
          >
            Registrar el primer equipo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCompressors.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-xs shrink-0">
                      {c.code}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">{c.name}</h3>
                      <p className="text-[11px] text-slate-500">{c.brand} {c.model}</p>
                    </div>
                  </div>
                  {getStatusBadge(c.status)}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block font-medium">Horómetro:</span>
                    <strong className="text-slate-900 font-mono text-xs">
                      {c.currentHours.toLocaleString()} hrs
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Régimen Diario:</span>
                    <strong className="text-slate-900 font-mono text-xs">
                      {c.avgDailyHours} h/d
                    </strong>
                  </div>
                  <div className="col-span-2 mt-1 pt-1 border-t border-slate-200/60 truncate">
                    <span className="text-slate-400 font-medium">Ubicación: </span>
                    <span className="text-slate-700 font-semibold">{c.building} - {c.location}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onCaptureMeter(c)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="Capturar Horómetro"
                  >
                    <Gauge className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEditCompressor(c)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                    title="Editar datos del equipo"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeactivateCompressor(c)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                    title="Desactivar equipo (eliminación lógica)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => onSelectCompressor(c)}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                >
                  <span>Ficha Técnica</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
