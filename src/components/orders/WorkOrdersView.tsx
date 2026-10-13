import React, {useState} from 'react';
import {
  Wrench,
  Search,
  Plus,
  FileSpreadsheet,
  Calendar,
  User as UserIcon,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import type {WorkOrder, Compressor, OrderStatus, OrderPriority} from '../../types';
import {exportToCSV} from '../../services/csvService';

interface WorkOrdersViewProps {
  orders: WorkOrder[];
  compressors: Compressor[];
  onSelectOrder: (order: WorkOrder) => void;
  onNewOrder: () => void;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  orders,
  compressors,
  onSelectOrder,
  onNewOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedCompId, setSelectedCompId] = useState<string>('all');

  const compMap = new Map(compressors.map((c) => [c.id, c]));

  const enriched = orders.map((o) => {
    const c = compMap.get(o.compressorId);
    return {
      ...o,
      compressorCode: c?.code || 'N/A',
      compressorName: c?.name || 'Equipo Desconocido',
    };
  });

  const filtered = enriched.filter((o) => {
    const matchesSearch =
      o.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.compressorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'open'
        ? o.status === 'new' || o.status === 'scheduled' || o.status === 'in_progress' || o.status === 'pending'
        : o.status === statusFilter;

    const matchesPriority = priorityFilter === 'all' || o.priority === priorityFilter;
    const matchesComp = selectedCompId === 'all' || o.compressorId === selectedCompId;

    return matchesSearch && matchesStatus && matchesPriority && matchesComp;
  });

  const handleExportCSV = () => {
    const rows = filtered.map((o) => ({
      Folio: o.folio,
      Equipo: o.compressorCode,
      Tipo_Mantenimiento: o.maintenanceType,
      Prioridad: o.priority,
      Estado: o.status,
      Fecha_Programada: o.scheduledDate,
      Responsable: o.assignedTo,
      Descripcion: o.description,
      Fecha_Ejecucion: o.executionDate || '',
      Horometro_Ejecucion: o.executionHours || '',
      Tecnico: o.technicianName || '',
    }));
    exportToCSV('Ordenes_de_Trabajo', rows);
  };

  const getPriorityBadge = (p: OrderPriority) => {
    switch (p) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[10px]">Crítica</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">Alta</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">Media</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">Baja</span>;
    }
  };

  const getStatusBadge = (s: OrderStatus) => {
    switch (s) {
      case 'closed':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">Cerrada</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">Terminada</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">En Proceso</span>;
      case 'scheduled':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">Programada</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">Cancelada</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">Nueva</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Órdenes de Trabajo (OT)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Control de intervenciones preventivas, correctivas, asignaciones y cierre técnico
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
            onClick={onNewOrder}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Orden</span>
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
            placeholder="Buscar por folio (ej. OT-2026-001), descripción, equipo o responsable..."
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Todos los Estados</option>
            <option value="open">Abiertas (Pendientes)</option>
            <option value="scheduled">Programadas</option>
            <option value="in_progress">En Proceso</option>
            <option value="closed">Cerradas</option>
            <option value="cancelled">Canceladas</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Todas las Prioridades</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>

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
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            <Wrench className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            No se encontraron órdenes de trabajo con los criterios de búsqueda.
          </div>
        ) : (
          filtered.map((order) => (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 p-4 shadow-xs transition cursor-pointer space-y-2 hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-xs text-blue-700 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                    {order.folio}
                  </span>
                  <span className="font-bold text-xs text-slate-900">{order.compressorCode}</span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-600 font-semibold">{order.description}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {getPriorityBadge(order.priority)}
                  {getStatusBadge(order.status)}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Prog: {order.scheduledDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    Asignado: <strong className="text-slate-700">{order.assignedTo}</strong>
                  </span>
                  {order.executionDate && (
                    <span className="text-emerald-700 font-semibold">
                      Ejecutado: {order.executionDate} ({order.executionHours} hrs)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-blue-600 font-bold text-xs">
                  <span>Abrir Detalle</span>
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
