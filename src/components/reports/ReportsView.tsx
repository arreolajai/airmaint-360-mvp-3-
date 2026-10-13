import React, {useState} from 'react';
import {
  FileText,
  FileDown,
  FileSpreadsheet,
  Cpu,
  Clock,
  AlertTriangle,
  Wrench,
  ClipboardCheck,
  AlertOctagon,
  Calendar,
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
import {
  generateCompressorsGeneralReportPDF,
  generateHourMetersReportPDF,
  generateMaintenancePlanReportPDF,
  generateWorkOrdersReportPDF,
  generateInspectionsReportPDF,
  generateFailuresReportPDF,
  generateCompressorDatasheetPDF,
} from '../../services/pdfService';
import {exportToCSV} from '../../services/csvService';

interface ReportsViewProps {
  compressors: Compressor[];
  calculations: MaintenanceCalculation[];
  readings: HourMeterReading[];
  workOrders: WorkOrder[];
  inspections: Inspection[];
  failures: Failure[];
  settings: AppSettings | null;
  userName: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  compressors,
  calculations,
  readings,
  workOrders,
  inspections,
  failures,
  settings,
  userName,
}) => {
  const [selectedCompId, setSelectedCompId] = useState<string>(compressors[0]?.id || '');

  const appSettings: AppSettings = settings || {
    id: 'default',
    companyName: 'Industrias Neumáticas',
    plantName: 'Planta Principal',
    confidentialityNotice: 'Confidencial - Uso Interno Exclusivo',
    dateFormat: 'YYYY-MM-DD',
    buildingsList: ['Nave 1'],
    areasList: ['Compresores'],
    trafficLightNormalPercent: 20,
    trafficLightUpcomingPercent: 10,
    trafficLightSchedulePercent: 0,
    maxDaysWithoutBackup: 7,
    maxDaysBetweenHourMeters: 3,
    initialWorkOrderFolio: 100,
    theme: 'light',
    autoLockMinutes: 10,
    schemaVersion: 1,
  };

  const compMap = new Map(compressors.map((c) => [c.id, c]));

  // 10 Reports definition
  const reportsList = [
    {
      id: 'general_compressors',
      title: '1. Estado General de Compresores',
      desc: 'Inventario completo, marcas, modelos, ubicaciones y horómetros acumulados.',
      icon: Cpu,
      color: 'text-blue-600 bg-blue-50',
      actionPDF: () => generateCompressorsGeneralReportPDF(compressors, userName, appSettings),
      actionCSV: () => {
        exportToCSV(
          'Estado_General_Compresores',
          compressors.map((c) => ({
            Codigo: c.code,
            Nombre: c.name,
            Marca: c.brand,
            Modelo: c.model,
            Serie: c.serialNumber,
            Nave: c.building,
            Area: c.area,
            Horometro: c.currentHours,
            Criticidad: c.criticality,
            Estado: c.status,
          }))
        );
      },
    },
    {
      id: 'datasheet',
      title: '2. Ficha Técnica por Compresor',
      desc: 'Especificaciones completas y plan de mantenimiento detallado del equipo seleccionado.',
      icon: FileText,
      color: 'text-sky-600 bg-sky-50',
      requiresCompressor: true,
      actionPDF: () => {
        const comp = compMap.get(selectedCompId);
        if (comp) {
          const compCalcs = calculations.filter((c) => c.compressorId === comp.id);
          generateCompressorDatasheetPDF(comp, compCalcs, userName, appSettings);
        }
      },
      actionCSV: () => {
        const comp = compMap.get(selectedCompId);
        if (comp) {
          const compCalcs = calculations.filter((c) => c.compressorId === comp.id);
          exportToCSV(
            `Ficha_${comp.code}`,
            compCalcs.map((c) => ({
              Equipo: comp.code,
              Actividad: c.activityName,
              Proximo_Horometro: c.nextMeter,
              Horas_Restantes: c.remainingHours,
              Consumo: `${c.consumedPercentage}%`,
              Estado: c.statusLabel,
            }))
          );
        }
      },
    },
    {
      id: 'hourmeters',
      title: '3. Historial de Horómetros',
      desc: 'Bitácora cronológica de lecturas, horas en carga/vacío y deltas registradas.',
      icon: Clock,
      color: 'text-cyan-600 bg-cyan-50',
      actionPDF: () => {
        const enriched = readings.map((r) => ({
          ...r,
          compressorCode: compMap.get(r.compressorId)?.code,
          compressorName: compMap.get(r.compressorId)?.name,
        }));
        generateHourMetersReportPDF(enriched, userName, appSettings);
      },
      actionCSV: () => {
        exportToCSV(
          'Historial_Horometros',
          readings.map((r) => ({
            Fecha: r.date,
            Hora: r.time,
            Equipo: compMap.get(r.compressorId)?.code || '-',
            Horometro: r.currentHours,
            Diferencia: r.diffHours,
            Tecnico: r.recordedBy,
          }))
        );
      },
    },
    {
      id: 'maint_upcoming',
      title: '4. Mantenimientos Próximos',
      desc: 'Listado predictivo de servicios a vencerse en las próximas horas de trabajo.',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
      actionPDF: () => {
        const upcoming = calculations.filter((c) => c.status === 'upcoming' || c.status === 'schedule');
        generateMaintenancePlanReportPDF(upcoming, false, userName, appSettings);
      },
      actionCSV: () => {
        const upcoming = calculations.filter((c) => c.status === 'upcoming' || c.status === 'schedule');
        exportToCSV(
          'Mantenimientos_Proximos',
          upcoming.map((c) => ({
            Equipo: c.compressorCode,
            Actividad: c.activityName,
            Horas_Restantes: c.remainingHours,
            Consumo: `${c.consumedPercentage}%`,
            Fecha_Proyectada: c.estimatedDate || '',
          }))
        );
      },
    },
    {
      id: 'maint_overdue',
      title: '5. Mantenimientos Vencidos',
      desc: 'Equipos y componentes que han superado el ciclo límite sin haberse cerrado.',
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50',
      actionPDF: () => {
        const overdue = calculations.filter((c) => c.status === 'overdue');
        generateMaintenancePlanReportPDF(overdue, true, userName, appSettings);
      },
      actionCSV: () => {
        const overdue = calculations.filter((c) => c.status === 'overdue');
        exportToCSV(
          'Mantenimientos_Vencidos',
          overdue.map((c) => ({
            Equipo: c.compressorCode,
            Actividad: c.activityName,
            Horas_Vencidas: Math.abs(c.remainingHours),
            Consumo: `${c.consumedPercentage}%`,
          }))
        );
      },
    },
    {
      id: 'orders_open',
      title: '6. Órdenes de Trabajo Abiertas',
      desc: 'Pendientes programadas y en ejecución técnica activas en planta.',
      icon: Wrench,
      color: 'text-emerald-600 bg-emerald-50',
      actionPDF: () => {
        const openOrders = workOrders
          .filter((o) => o.status !== 'closed' && o.status !== 'cancelled')
          .map((o) => ({...o, compressorCode: compMap.get(o.compressorId)?.code}));
        generateWorkOrdersReportPDF(openOrders, userName, appSettings);
      },
      actionCSV: () => {
        const open = workOrders.filter((o) => o.status !== 'closed');
        exportToCSV(
          'Ordenes_Abiertas',
          open.map((o) => ({
            Folio: o.folio,
            Equipo: compMap.get(o.compressorId)?.code,
            Prioridad: o.priority,
            Fecha_Prog: o.scheduledDate,
            Responsable: o.assignedTo,
          }))
        );
      },
    },
    {
      id: 'orders_history',
      title: '7. Historial de Mantenimiento por Equipo',
      desc: 'Bitácora histórica de todas las órdenes concluidas y trabajos efectuados.',
      icon: CheckCircle,
      color: 'text-teal-600 bg-teal-50',
      actionPDF: () => {
        const enriched = workOrders.map((o) => ({
          ...o,
          compressorCode: compMap.get(o.compressorId)?.code,
        }));
        generateWorkOrdersReportPDF(enriched, userName, appSettings);
      },
      actionCSV: () => {
        exportToCSV(
          'Historial_Ordenes',
          workOrders.map((o) => ({
            Folio: o.folio,
            Equipo: compMap.get(o.compressorId)?.code,
            Estado: o.status,
            Ejecucion_Horas: o.executionHours || '',
            Fecha_Ejecucion: o.executionDate || '',
            Tecnico: o.technicianName || '',
          }))
        );
      },
    },
    {
      id: 'inspections_history',
      title: '8. Inspecciones Realizadas',
      desc: 'Resultados de chequeos de campo de 14 puntos y porcentaje de cumplimiento.',
      icon: ClipboardCheck,
      color: 'text-indigo-600 bg-indigo-50',
      actionPDF: () => {
        const enriched = inspections.map((i) => ({
          ...i,
          compressorCode: compMap.get(i.compressorId)?.code,
        }));
        generateInspectionsReportPDF(enriched, userName, appSettings);
      },
      actionCSV: () => {
        exportToCSV(
          'Inspecciones',
          inspections.map((i) => ({
            Folio: i.inspectionNumber,
            Equipo: compMap.get(i.compressorId)?.code,
            Fecha: i.date,
            Cumplimiento: `${i.compliancePercentage}%`,
            Hallazgos: i.findingsCount,
            Resultado: i.overallResult,
          }))
        );
      },
    },
    {
      id: 'failures_open',
      title: '9. Registro y Control de Fallas',
      desc: 'Bitácora de alarmas, paros imprevistos y análisis de tiempos muertos.',
      icon: AlertOctagon,
      color: 'text-rose-600 bg-rose-50',
      actionPDF: () => {
        const enriched = failures.map((f) => ({
          ...f,
          compressorCode: compMap.get(f.compressorId)?.code,
        }));
        generateFailuresReportPDF(enriched, userName, appSettings);
      },
      actionCSV: () => {
        exportToCSV(
          'Fallas',
          failures.map((f) => ({
            Folio: f.folio,
            Equipo: compMap.get(f.compressorId)?.code,
            Fecha: f.occurredAt,
            Sintoma: f.symptom,
            Tiempo_Paro: f.downtimeHours || '',
            Estado: f.status,
          }))
        );
      },
    },
    {
      id: 'monthly_summary',
      title: '10. Resumen Ejecutivo Mensual',
      desc: 'Consolidado gerencial con indicadores clave, órdenes ejecutadas y disponibilidad.',
      icon: Calendar,
      color: 'text-purple-600 bg-purple-50',
      actionPDF: () => {
        generateCompressorsGeneralReportPDF(compressors, userName, appSettings);
      },
      actionCSV: () => {
        exportToCSV(
          'Resumen_Mensual',
          compressors.map((c) => ({
            Codigo: c.code,
            Nombre: c.name,
            Horometro_Actual: c.currentHours,
            Horas_Diarias: c.avgDailyHours,
            Estado: c.status,
          }))
        );
      },
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Centro de Reportes y Documentación Técnica
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Generación en tiempo real de documentos oficiales en PDF y hojas de cálculo CSV
        </p>
      </div>

      {/* Compressor selector for specific reports */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-700">Compresor Seleccionado para Reportes Individuales:</span>
        <select
          value={selectedCompId}
          onChange={(e) => setSelectedCompId(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 bg-white font-bold text-slate-800 focus:outline-none"
        >
          {compressors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} - {c.name} ({c.building})
            </option>
          ))}
        </select>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportsList.map((rep) => {
          const Icon = rep.icon;
          return (
            <div
              key={rep.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${rep.color} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{rep.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{rep.desc}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={rep.actionCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                  title="Descargar en formato CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={rep.actionPDF}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
                  title="Descargar documento PDF oficial"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Descargar PDF</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
