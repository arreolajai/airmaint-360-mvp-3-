import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  Compressor,
  HourMeterReading,
  MaintenanceCalculation,
  WorkOrder,
  Inspection,
  Failure,
  AppSettings,
} from '../types';

interface ReportHeaderOptions {
  title: string;
  subtitle?: string;
  userName: string;
  settings: AppSettings;
  filtersText?: string;
}

function addStandardHeader(doc: jsPDF, opts: ReportHeaderOptions): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary top bar
  doc.setFillColor(30, 58, 138); // Blue #1e3a8a
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Title in header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('AIRMAINT 360 - SISTEMA DE CONTROL DE COMPRESORES', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${opts.settings.companyName || 'Industria'} | ${opts.settings.plantName || 'Planta'}`, 14, 18);

  const dateStr = new Date().toLocaleString('es-MX');
  doc.setFontSize(8);
  doc.text(`Generado: ${dateStr}`, pageWidth - 14, 12, {align: 'right'});
  doc.text(`Usuario: ${opts.userName}`, pageWidth - 14, 18, {align: 'right'});

  // Report Title Box
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(opts.title, 14, 35);

  let currentY = 40;

  if (opts.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(opts.subtitle, 14, currentY);
    currentY += 6;
  }

  if (opts.filtersText) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Filtros: ${opts.filtersText}`, 14, currentY);
    currentY += 6;
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  return currentY;
}

function addFooter(doc: jsPDF, settings: AppSettings): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);

    // Confidentiality notice
    const notice = settings.confidentialityNotice || 'Documento Confidencial - Uso Interno Exclusivo';
    doc.text(notice, 14, pageHeight - 8);

    // Page number
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 8, {align: 'right'});
  }
}

// 1. Ficha Técnica del Compresor
export function generateCompressorDatasheetPDF(
  compressor: Compressor,
  calculations: MaintenanceCalculation[],
  userName: string,
  settings: AppSettings,
  qrDataUrl?: string
): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = addStandardHeader(doc, {
    title: `FICHA TÉCNICA: ${compressor.code} - ${compressor.name}`,
    subtitle: `Datos del equipo y estado de mantenimiento preventivo`,
    userName,
    settings,
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // QR Code if available
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', pageWidth - 48, y, 34, 34);
  }

  // Information grid
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('1. ESPECIFICACIONES GENERALES DEL EQUIPO', 14, y + 4);
  y += 8;

  const dataSpecs = [
    ['Código:', compressor.code, 'Estado Operativo:', compressor.status.toUpperCase()],
    ['Marca:', compressor.brand, 'Modelo:', compressor.model],
    ['Serie:', compressor.serialNumber, 'Tipo Compresor:', compressor.compressorType],
    ['Ubicación:', `${compressor.building} - ${compressor.area}`, 'Bahía / Detalle:', compressor.location],
    ['Potencia Motor:', compressor.motorPower, 'Capacidad Flujo:', compressor.capacity],
    ['Presión Nominal:', compressor.nominalPressure, 'Tipo de Aceite:', compressor.oilType],
    ['Horómetro Inicial:', `${compressor.initialHours.toLocaleString()} hrs`, 'Horómetro Actual:', `${compressor.currentHours.toLocaleString()} hrs`],
    ['Horas Promedio / Día:', `${compressor.avgDailyHours} hrs/día`, 'Criticidad:', `Categoría ${compressor.criticality}`],
  ];

  autoTable(doc, {
    startY: y,
    margin: {left: 14, right: qrDataUrl ? 52 : 14},
    body: dataSpecs,
    theme: 'plain',
    styles: {fontSize: 8.5, cellPadding: 2},
    columnStyles: {
      0: {fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 32},
      1: {textColor: [15, 23, 42], cellWidth: 45},
      2: {fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 32},
      3: {textColor: [15, 23, 42]},
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = (doc.lastAutoTable?.finalY ?? y + 50) + 10;

  // Maintenance activities status table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('2. PLAN DE MANTENIMIENTO PREVENTIVO ASIGNADO', 14, y);
  y += 4;

  const maintRows = calculations.map((c) => [
    c.activityName,
    `${c.nextMeter.toLocaleString()} hrs`,
    `${c.remainingHours.toLocaleString()} hrs`,
    `${c.consumedPercentage}%`,
    c.estimatedDate || 'N/A',
    c.statusLabel,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Actividad', 'Próx. Horómetro', 'Horas Restantes', '% Consumo', 'Fecha Est.', 'Estado']],
    body: maintRows.length > 0 ? maintRows : [['Sin actividades programadas', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: {fillColor: [30, 58, 138], fontSize: 8},
    styles: {fontSize: 8, cellPadding: 2.5},
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = (doc.lastAutoTable?.finalY ?? y + 40) + 8;

  if (compressor.observations) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Observaciones Técnicas:', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(compressor.observations, 14, y + 5, {maxWidth: pageWidth - 28});
  }

  addFooter(doc, settings);
  doc.save(`Ficha_Tecnica_${compressor.code}.pdf`);
}

// 2. Estado General de Compresores
export function generateCompressorsGeneralReportPDF(
  compressors: Compressor[],
  userName: string,
  settings: AppSettings
): void {
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape
  let y = addStandardHeader(doc, {
    title: 'ESTADO GENERAL DEL PARQUE DE COMPRESORES',
    subtitle: `Resumen de equipos, ubicación, horómetros acumulados y estado operativo`,
    userName,
    settings,
  });

  const rows = compressors.map((c) => [
    c.code,
    c.name,
    c.brand,
    c.model,
    c.building,
    `${c.currentHours.toLocaleString()} hrs`,
    `${c.avgDailyHours} h/d`,
    `Cat. ${c.criticality}`,
    c.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Código', 'Nombre', 'Marca', 'Modelo', 'Ubicación / Nave', 'Horómetro', 'Horas/Día', 'Crit.', 'Estado']],
    body: rows,
    theme: 'striped',
    headStyles: {fillColor: [30, 58, 138], fontSize: 8.5},
    styles: {fontSize: 8, cellPadding: 3},
  });

  addFooter(doc, settings);
  doc.save('Reporte_General_Compresores.pdf');
}

// 3. Historial de Horómetros
export function generateHourMetersReportPDF(
  readings: (HourMeterReading & {compressorCode?: string; compressorName?: string})[],
  userName: string,
  settings: AppSettings
): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = addStandardHeader(doc, {
    title: 'HISTORIAL DE CAPTURAS DE HORÓMETRO',
    subtitle: 'Bitácora cronológica inalterable de lecturas registradas',
    userName,
    settings,
  });

  const rows = readings.map((r) => [
    r.date,
    r.time,
    r.compressorCode || '-',
    `${r.currentHours.toLocaleString()} hrs`,
    r.loadedHours ? `${r.loadedHours.toLocaleString()} hrs` : 'N/A',
    `+${r.diffHours} hrs`,
    r.recordedBy,
    r.notes || '',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Fecha', 'Hora', 'Equipo', 'Horómetro', 'En Carga', 'Dif.', 'Registrado Por', 'Notas']],
    body: rows,
    theme: 'striped',
    headStyles: {fillColor: [30, 58, 138], fontSize: 8},
    styles: {fontSize: 7.5, cellPadding: 2},
  });

  addFooter(doc, settings);
  doc.save('Historial_Horometros.pdf');
}

// 4. Mantenimientos Próximos y Vencidos
export function generateMaintenancePlanReportPDF(
  calculations: MaintenanceCalculation[],
  isOverdueOnly: boolean,
  userName: string,
  settings: AppSettings
): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = addStandardHeader(doc, {
    title: isOverdueOnly ? 'REPORTE DE MANTENIMIENTOS VENCIDOS' : 'PROGRAMA DE MANTENIMIENTO PREVENTIVO Y PRÓXIMOS SERVICIOS',
    subtitle: isOverdueOnly ? 'Equipos y actividades que han superado el ciclo límite' : 'Monitoreo de semáforo preventivo por horas y fechas proyectadas',
    userName,
    settings,
  });

  const rows = calculations.map((c) => [
    c.compressorCode,
    c.activityName,
    `${c.nextMeter.toLocaleString()} hrs`,
    `${c.remainingHours.toLocaleString()} hrs`,
    `${c.consumedPercentage}%`,
    c.estimatedDate || c.nextDate || 'N/A',
    c.statusLabel,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Equipo', 'Actividad', 'Próx. Horómetro', 'Horas Restantes', '% Consumo', 'Fecha Est.', 'Estado']],
    body: rows,
    theme: 'striped',
    headStyles: {fillColor: isOverdueOnly ? [185, 28, 28] : [30, 58, 138], fontSize: 8},
    styles: {fontSize: 8, cellPadding: 2.5},
  });

  addFooter(doc, settings);
  doc.save(isOverdueOnly ? 'Mantenimientos_Vencidos.pdf' : 'Mantenimientos_Proximos.pdf');
}

// 5. Órdenes de Trabajo (Ficha / Reporte)
export function generateWorkOrdersReportPDF(
  orders: (WorkOrder & {compressorCode?: string})[],
  userName: string,
  settings: AppSettings
): void {
  const doc = new jsPDF('l', 'mm', 'a4');
  let y = addStandardHeader(doc, {
    title: 'BITÁCORA DE ÓRDENES DE TRABAJO',
    subtitle: 'Relación de órdenes de mantenimiento preventivo, correctivo e inspección',
    userName,
    settings,
  });

  const rows = orders.map((o) => [
    o.folio,
    o.compressorCode || '-',
    o.maintenanceType.toUpperCase(),
    o.priority.toUpperCase(),
    o.status.toUpperCase(),
    o.scheduledDate,
    o.assignedTo,
    o.executionDate || '-',
    o.description,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Folio', 'Equipo', 'Tipo', 'Prioridad', 'Estado', 'Fecha Prog.', 'Responsable', 'Fecha Ejec.', 'Descripción']],
    body: rows,
    theme: 'striped',
    headStyles: {fillColor: [30, 58, 138], fontSize: 8},
    styles: {fontSize: 7.5, cellPadding: 2.5},
  });

  addFooter(doc, settings);
  doc.save('Ordenes_de_Trabajo.pdf');
}

// 6. Inspecciones Realizadas
export function generateInspectionsReportPDF(
  inspections: (Inspection & {compressorCode?: string})[],
  userName: string,
  settings: AppSettings
): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = addStandardHeader(doc, {
    title: 'REPORTE DE INSPECCIONES OPERATIVAS Y DE SEGURIDAD',
    subtitle: 'Resultados de chequeos de campo y hallazgos en compresores',
    userName,
    settings,
  });

  const rows = inspections.map((i) => [
    i.inspectionNumber,
    i.date,
    i.compressorCode || '-',
    i.technicianName,
    `${i.compliancePercentage}%`,
    `${i.findingsCount} hallazgos`,
    i.overallResult.toUpperCase(),
    i.notes || '',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Folio', 'Fecha', 'Equipo', 'Técnico', 'Cumplimiento', 'Hallazgos', 'Resultado', 'Observaciones']],
    body: rows,
    theme: 'striped',
    headStyles: {fillColor: [30, 58, 138], fontSize: 8},
    styles: {fontSize: 8, cellPadding: 2.5},
  });

  addFooter(doc, settings);
  doc.save('Inspecciones_Realizadas.pdf');
}

// 7. Fallas Abiertas y Cerradas
export function generateFailuresReportPDF(
  failures: (Failure & {compressorCode?: string})[],
  userName: string,
  settings: AppSettings
): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = addStandardHeader(doc, {
    title: 'REGISTRO Y CONTROL DE FALLAS DE COMPRESORES',
    subtitle: 'Eventos de paro no programado, alarmas y reparaciones',
    userName,
    settings,
  });

  const rows = failures.map((f) => [
    f.folio,
    f.compressorCode || '-',
    f.occurredAt.split('T')[0],
    f.isMachineStopped ? 'SÍ (PARO)' : 'NO',
    f.alarmCode || 'S/N',
    f.priority.toUpperCase(),
    f.status.toUpperCase(),
    f.downtimeHours ? `${f.downtimeHours} h` : '-',
    f.symptom,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Folio', 'Equipo', 'Fecha', 'Paro', 'Alarma', 'Prioridad', 'Estado', 'T. Paro', 'Síntoma']],
    body: rows,
    theme: 'striped',
    headStyles: {fillColor: [185, 28, 28], fontSize: 8},
    styles: {fontSize: 7.5, cellPadding: 2},
  });

  addFooter(doc, settings);
  doc.save('Registro_de_Fallas.pdf');
}
