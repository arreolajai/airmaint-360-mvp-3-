import React, {useState, useEffect} from 'react';
import {
  ArrowLeft,
  FileDown,
  Edit,
  QrCode,
  Gauge,
  CalendarClock,
  Wrench,
  ClipboardCheck,
  AlertOctagon,
  History,
  Info,
  Play,
  Pause,
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle,
} from 'lucide-react';
import type {
  Compressor,
  HourMeterReading,
  MaintenanceCalculation,
  WorkOrder,
  Inspection,
  Failure,
  AppSettings,
} from '../../types';
import {generateCompressorQRDataUrl} from '../../services/qrService';
import {generateCompressorDatasheetPDF} from '../../services/pdfService';

interface CompressorDetailViewProps {
  compressor: Compressor;
  calculations: MaintenanceCalculation[];
  readings: HourMeterReading[];
  workOrders: WorkOrder[];
  inspections: Inspection[];
  failures: Failure[];
  settings: AppSettings | null;
  userName: string;
  onBack: () => void;
  onEdit: () => void;
  onCaptureMeter: () => void;
  onNewOrder: () => void;
  onNewInspection: () => void;
  onReportFailure: () => void;
}

type TabType =
  | 'summary'
  | 'hourmeters'
  | 'maintenance'
  | 'orders'
  | 'inspections'
  | 'failures'
  | 'timeline';

export const CompressorDetailView: React.FC<CompressorDetailViewProps> = ({
  compressor,
  calculations,
  readings,
  workOrders,
  inspections,
  failures,
  settings,
  userName,
  onBack,
  onEdit,
  onCaptureMeter,
  onNewOrder,
  onNewInspection,
  onReportFailure,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [timelineFilter, setTimelineFilter] = useState<string>('all');

  useEffect(() => {
    generateCompressorQRDataUrl(compressor).then(setQrDataUrl);
  }, [compressor]);

  const handleDownloadPDF = () => {
    if (settings) {
      generateCompressorDatasheetPDF(compressor, calculations, userName, settings, qrDataUrl);
    }
  };

  // Build unified chronological timeline (Tab 7)
  interface TimelineEvent {
    id: string;
    date: string;
    type: 'meter' | 'order' | 'inspection' | 'failure' | 'creation';
    typeLabel: string;
    description: string;
    user: string;
    color: string;
  }

  const timelineEvents: TimelineEvent[] = [
    {
      id: 'created',
      date: compressor.createdAt.split('T')[0],
      type: 'creation' as const,
      typeLabel: 'Alta de Equipo',
      description: `Registro inicial en sistema con horómetro base ${compressor.initialHours} hrs.`,
      user: compressor.createdBy,
      color: 'bg-blue-500',
    },
    ...readings.map((r) => ({
      id: r.id,
      date: r.date,
      type: 'meter' as const,
      typeLabel: 'Captura de Horómetro',
      description: `Lectura: ${r.currentHours.toLocaleString()} hrs (+${r.diffHours} hrs operadas). ${r.notes || ''}`,
      user: r.recordedBy,
      color: 'bg-sky-500',
    })),
    ...workOrders.map((w) => ({
      id: w.id,
      date: w.executionDate || w.scheduledDate,
      type: 'order' as const,
      typeLabel: `Orden ${w.folio}`,
      description: `${w.description} - Estado: ${w.status.toUpperCase()}`,
      user: w.assignedTo,
      color: w.status === 'closed' ? 'bg-emerald-500' : 'bg-amber-500',
    })),
    ...inspections.map((i) => ({
      id: i.id,
      date: i.date,
      type: 'inspection' as const,
      typeLabel: `Inspección ${i.inspectionNumber}`,
      description: `Cumplimiento: ${i.compliancePercentage}%. ${i.findingsCount} hallazgos registrados.`,
      user: i.technicianName,
      color: 'bg-indigo-500',
    })),
    ...failures.map((f) => ({
      id: f.id,
      date: f.occurredAt.split('T')[0],
      type: 'failure' as const,
      typeLabel: `Falla ${f.folio}`,
      description: `${f.symptom} (${f.isMachineStopped ? 'Con paro de equipo' : 'Sin paro'}). Estado: ${f.status}`,
      user: f.assignedTo || 'Técnico',
      color: 'bg-rose-500',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTimeline = timelineEvents.filter((item) => {
    if (timelineFilter === 'all') return true;
    return item.type === timelineFilter;
  });

  const tabs: {id: TabType; label: string; icon: React.ElementType; count?: number}[] = [
    {id: 'summary', label: '1. Resumen', icon: Info},
    {id: 'hourmeters', label: '2. Horómetros', icon: Gauge, count: readings.length},
    {id: 'maintenance', label: '3. Mantenimientos', icon: CalendarClock, count: calculations.length},
    {id: 'orders', label: '4. Órdenes', icon: Wrench, count: workOrders.length},
    {id: 'inspections', label: '5. Inspecciones', icon: ClipboardCheck, count: inspections.length},
    {id: 'failures', label: '6. Fallas', icon: AlertOctagon, count: failures.length},
    {id: 'timeline', label: '7. Documentos / Historial', icon: History, count: timelineEvents.length},
  ];

  const getStatusBadge = () => {
    switch (compressor.status) {
      case 'operating':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold"><Play className="w-3 h-3 fill-emerald-800" /> Operando</span>;
      case 'stopped':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold"><Pause className="w-3 h-3 fill-slate-800" /> Detenido</span>;
      case 'maintenance':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold"><Wrench className="w-3 h-3" /> En Mantenimiento</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold"><AlertTriangle className="w-3 h-3" /> Fuera de Servicio</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Back and Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo de Compresores</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onCaptureMeter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Capturar Horómetro</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Ficha PDF</span>
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Edit className="w-3.5 h-3.5 text-slate-500" />
            <span>Editar</span>
          </button>
        </div>
      </div>

      {/* Main Compressor Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {compressor.photoUrl ? (
              <img
                src={compressor.photoUrl}
                alt={compressor.name}
                className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 shrink-0">
                <Gauge className="w-8 h-8 text-blue-600" />
                <span className="text-[10px] font-bold text-slate-500 mt-1">{compressor.code}</span>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-xs">
                  {compressor.code}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                  Criticidad {compressor.criticality}
                </span>
                {getStatusBadge()}
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                {compressor.name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {compressor.brand} {compressor.model} • S/N: {compressor.serialNumber || 'N/A'} • {compressor.building} ({compressor.area})
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 shrink-0">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Horómetro Actual</div>
              <div className="text-xl font-black text-slate-900 font-mono">
                {compressor.currentHours.toLocaleString()} <span className="text-xs font-normal text-slate-500">hrs</span>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Régimen Diario</div>
              <div className="text-base font-bold text-slate-800 font-mono">
                {compressor.avgDailyHours} <span className="text-xs font-normal text-slate-500">hrs/día</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-bold border-b-2 transition ${
                  isActive
                    ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Resumen */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Ficha Técnica del Activo
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Marca:</span>
                <span className="font-bold text-slate-800">{compressor.brand || 'No especificada'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Modelo:</span>
                <span className="font-bold text-slate-800">{compressor.model || 'No especificado'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Número de Serie:</span>
                <span className="font-bold font-mono text-slate-800">{compressor.serialNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Tipo:</span>
                <span className="font-bold text-slate-800">{compressor.compressorType}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Potencia:</span>
                <span className="font-bold text-slate-800">{compressor.motorPower || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Capacidad:</span>
                <span className="font-bold text-slate-800">{compressor.capacity || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Presión Nominal:</span>
                <span className="font-bold text-slate-800">{compressor.nominalPressure || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Tipo de Aceite:</span>
                <span className="font-bold text-slate-800">{compressor.oilType || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Fecha de Instalación:</span>
                <span className="font-bold text-slate-800">{compressor.installationDate || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Nave / Edificio:</span>
                <span className="font-bold text-slate-800">{compressor.building}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Área:</span>
                <span className="font-bold text-slate-800">{compressor.area}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Ubicación Detallada:</span>
                <span className="font-bold text-slate-800">{compressor.location}</span>
              </div>
            </div>

            {compressor.observations && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400 block font-medium">Observaciones:</span>
                <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {compressor.observations}
                </p>
              </div>
            )}
          </div>

          {/* QR Code and Quick Actions Column */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-center flex flex-col items-center">
              <h4 className="text-xs font-bold text-slate-800 mb-2">Código QR del Compresor</h4>
              {qrDataUrl ? (
                <div className="p-2 border border-slate-200 rounded-xl bg-white shadow-xs">
                  <img src={qrDataUrl} alt={`QR ${compressor.code}`} className="w-40 h-40" />
                </div>
              ) : (
                <div className="w-40 h-40 bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">
                  Generando QR...
                </div>
              )}
              <span className="font-mono font-bold text-xs text-slate-600 mt-2">{compressor.code}</span>
              <a
                href={qrDataUrl}
                download={`QR_${compressor.code}.png`}
                className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                Descargar Imagen QR
              </a>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Acciones Rápidas con este Equipo</span>
              <button
                onClick={onNewOrder}
                className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-semibold text-slate-700 flex items-center gap-2 transition"
              >
                <Wrench className="w-4 h-4 text-emerald-600" />
                <span>Generar Orden de Trabajo</span>
              </button>
              <button
                onClick={onNewInspection}
                className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-semibold text-slate-700 flex items-center gap-2 transition"
              >
                <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                <span>Ejecutar Inspección Técnica</span>
              </button>
              <button
                onClick={onReportFailure}
                className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-semibold text-slate-700 flex items-center gap-2 transition"
              >
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>Reportar Falla o Paro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Horómetros */}
      {activeTab === 'hourmeters' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Historial de Horómetros</h3>
              <p className="text-xs text-slate-400">Lecturas verificadas de display y horas de operación</p>
            </div>
            <button
              onClick={onCaptureMeter}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Lectura</span>
            </button>
          </div>

          {readings.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No se han registrado lecturas posteriores a la instalación inicial.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                    <th className="py-2">Fecha y Hora</th>
                    <th className="py-2">Horómetro Actual</th>
                    <th className="py-2">En Carga</th>
                    <th className="py-2">En Vacío</th>
                    <th className="py-2">Diferencia</th>
                    <th className="py-2">Registrado Por</th>
                    <th className="py-2">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {readings.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 font-medium text-slate-900">
                        {r.date} <span className="text-slate-400 text-[11px]">{r.time}</span>
                      </td>
                      <td className="py-2.5 font-bold font-mono text-slate-900">
                        {r.currentHours.toLocaleString()} hrs
                      </td>
                      <td className="py-2.5 text-slate-600">
                        {r.loadedHours ? `${r.loadedHours.toLocaleString()} hrs` : '-'}
                      </td>
                      <td className="py-2.5 text-slate-600">
                        {r.unloadedHours ? `${r.unloadedHours.toLocaleString()} hrs` : '-'}
                      </td>
                      <td className="py-2.5 font-bold text-emerald-600">+{r.diffHours} hrs</td>
                      <td className="py-2.5 text-slate-600">{r.recordedBy}</td>
                      <td className="py-2.5 text-slate-500 max-w-xs truncate">{r.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Mantenimientos */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Actividades Preventivas y Semáforo</h3>
              <p className="text-xs text-slate-400">Monitoreo de horas de consumo por componente</p>
            </div>
          </div>

          {calculations.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No existen actividades preventivas configuradas para este equipo.
            </div>
          ) : (
            <div className="space-y-3">
              {calculations.map((calc) => (
                <div
                  key={calc.activityId}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{calc.activityName}</h4>
                      <p className="text-[11px] text-slate-400">
                        Próximo servicio a los {calc.nextMeter.toLocaleString()} hrs • Proyección:{' '}
                        {calc.estimatedDate || 'No calculable'}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${calc.colorClass}`}>
                      {calc.statusLabel}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-slate-500">
                      <span>Consumo de ciclo: {calc.consumedPercentage}%</span>
                      <span>
                        Restan:{' '}
                        <strong className={calc.remainingHours <= 0 ? 'text-red-600' : 'text-slate-800'}>
                          {calc.remainingHours.toLocaleString()} hrs
                        </strong>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Órdenes */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Órdenes de Trabajo del Equipo</h3>
              <p className="text-xs text-slate-400">Preventivas, correctivas y de inspección</p>
            </div>
            <button
              onClick={onNewOrder}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Orden</span>
            </button>
          </div>

          {workOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No hay órdenes de trabajo registradas para este compresor.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {workOrders.map((o) => (
                <div key={o.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{o.folio}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold bg-slate-100 text-slate-700">
                        {o.priority}
                      </span>
                      <span className="text-slate-600 truncate">{o.description}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Responsable: {o.assignedTo} • Prog: {o.scheduledDate}
                      {o.executionDate && ` • Ejecutada: ${o.executionDate}`}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                      o.status === 'closed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : o.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Inspecciones */}
      {activeTab === 'inspections' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inspecciones de Rutina y Seguridad</h3>
              <p className="text-xs text-slate-400">Chequeos de campo de 14 puntos y porcentaje de cumplimiento</p>
            </div>
            <button
              onClick={onNewInspection}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Inspección</span>
            </button>
          </div>

          {inspections.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No hay inspecciones registradas para este equipo.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {inspections.map((i) => (
                <div key={i.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{i.inspectionNumber}</span>
                      <span className="text-slate-400">{i.date} {i.time}</span>
                      <span className="text-slate-700 font-medium">Téc. {i.technicianName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Cumplimiento: <strong>{i.compliancePercentage}%</strong> • Hallazgos:{' '}
                      <strong className={i.findingsCount > 0 ? 'text-amber-600' : 'text-slate-700'}>
                        {i.findingsCount}
                      </strong>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                      i.overallResult === 'pass'
                        ? 'bg-emerald-100 text-emerald-800'
                        : i.overallResult === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {i.overallResult}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Fallas */}
      {activeTab === 'failures' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Registro de Fallas y Paros</h3>
              <p className="text-xs text-slate-400">Alarmas, síntomas y acciones correctivas</p>
            </div>
            <button
              onClick={onReportFailure}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Reportar Falla</span>
            </button>
          </div>

          {failures.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No hay fallas registradas en el historial de este compresor.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {failures.map((f) => (
                <div key={f.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{f.folio}</span>
                      <span className="text-slate-400">{f.occurredAt.split('T')[0]}</span>
                      {f.isMachineStopped && (
                        <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                          Paro Total
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-700 font-semibold mt-1">{f.symptom}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Alarma: {f.alarmCode || 'S/N'} • Causa: {f.possibleCause || 'En análisis'}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800 shrink-0">
                    {f.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Documentos / Línea de Tiempo Cronológica */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Línea de Tiempo del Compresor</h3>
              <p className="text-xs text-slate-400">Historial cronológico unificado de todos los eventos del equipo</p>
            </div>

            {/* Event Filter */}
            <select
              value={timelineFilter}
              onChange={(e) => setTimelineFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">Todos los eventos</option>
              <option value="meter">Lecturas de Horómetro</option>
              <option value="order">Órdenes de Trabajo</option>
              <option value="inspection">Inspecciones</option>
              <option value="failure">Fallas y Alarmas</option>
            </select>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {filteredTimeline.map((ev) => (
              <div key={ev.id} className="relative group">
                {/* Dot */}
                <div
                  className={`absolute -left-[27px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${ev.color} shadow-xs`}
                />
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{ev.typeLabel}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{ev.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ev.description}</p>
                  <div className="text-[10px] text-slate-400 mt-1.5">
                    Responsable / Registro: <span className="font-semibold text-slate-600">{ev.user}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
