import type {
  Compressor,
  MaintenanceActivity,
  MaintenanceCalculation,
  TrafficLightStatus,
  AppSettings,
  Alert,
} from '../types';
import {getDB} from '../db/indexedDb';

export function calculateMaintenanceStatus(
  activity: MaintenanceActivity,
  compressor: Compressor,
  settings?: AppSettings
): MaintenanceCalculation {
  const normalThreshold = settings?.trafficLightNormalPercent ?? 20; // > 20% available
  const upcomingThreshold = settings?.trafficLightUpcomingPercent ?? 10; // 10% - 20% available

  const currentHours = compressor.currentHours;
  const lastHours = activity.lastServiceHours;
  const interval = activity.intervalHours;

  let status: TrafficLightStatus = 'no_info';
  let statusLabel = 'Sin información';
  let colorClass = 'text-slate-500 bg-slate-100 border-slate-300';
  let nextMeter = 0;
  let remainingHours = 0;
  let consumedPercentage = 0;
  let estimatedDate: string | undefined = undefined;
  let nextDate: string | undefined = undefined;
  let remainingDays: number | undefined = undefined;

  // 1. Calculations by Hours
  if (interval > 0) {
    nextMeter = lastHours + interval;
    remainingHours = nextMeter - currentHours;
    const hoursElapsed = currentHours - lastHours;
    consumedPercentage = Math.round((hoursElapsed / interval) * 100);
    const availablePercentage = 100 - consumedPercentage;

    // Estimated date calculation based on avgDailyHours
    if (compressor.avgDailyHours && compressor.avgDailyHours > 0) {
      const daysToNext = remainingHours / compressor.avgDailyHours;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + Math.round(daysToNext));
      estimatedDate = targetDate.toISOString().split('T')[0];
    }

    // Status classification by Hours
    if (remainingHours <= 0) {
      status = 'overdue';
      statusLabel = 'VENCIDO';
      colorClass = 'text-red-700 bg-red-50 border-red-300';
    } else if (availablePercentage <= upcomingThreshold) {
      status = 'schedule';
      statusLabel = 'POR PROGRAMAR';
      colorClass = 'text-amber-800 bg-amber-50 border-amber-300';
    } else if (availablePercentage <= normalThreshold) {
      status = 'upcoming';
      statusLabel = 'PRÓXIMO';
      colorClass = 'text-yellow-800 bg-yellow-50 border-yellow-300';
    } else {
      status = 'normal';
      statusLabel = 'NORMAL';
      colorClass = 'text-emerald-700 bg-emerald-50 border-emerald-300';
    }
  }

  // 2. Calculations by Days (if activity specifies intervalDays)
  if (activity.intervalDays && activity.intervalDays > 0 && activity.lastServiceDate) {
    const lastDate = new Date(activity.lastServiceDate);
    if (!isNaN(lastDate.getTime())) {
      const targetDate = new Date(lastDate);
      targetDate.setDate(targetDate.getDate() + activity.intervalDays);
      nextDate = targetDate.toISOString().split('T')[0];

      const today = new Date();
      const diffTime = targetDate.getTime() - today.getTime();
      remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // If days is already overdue or more critical, upgrade status
      if (remainingDays <= 0 && status !== 'overdue') {
        status = 'overdue';
        statusLabel = 'VENCIDO (POR FECHA)';
        colorClass = 'text-red-700 bg-red-50 border-red-300';
      }
    }
  }

  return {
    activityId: activity.id,
    activityName: activity.name,
    compressorId: compressor.id,
    compressorName: compressor.name,
    compressorCode: compressor.code,
    nextMeter,
    remainingHours,
    consumedPercentage,
    nextDate,
    remainingDays,
    estimatedDate,
    status,
    statusLabel,
    colorClass,
  };
}

// Synchronize maintenance alerts in the DB based on calculations
export async function syncMaintenanceAlerts(): Promise<void> {
  const db = await getDB();
  const [compressors, activities, settingsList, existingAlerts] = await Promise.all([
    db.getAll('compressors'),
    db.getAll('maintenanceActivities'),
    db.getAll('appSettings'),
    db.getAll('alerts'),
  ]);

  const settings = settingsList[0];
  const compMap = new Map(compressors.map((c) => [c.id, c]));

  for (const act of activities) {
    if (!act.isActive) continue;
    const comp = compMap.get(act.compressorId);
    if (!comp || !comp.isActive) continue;

    const calc = calculateMaintenanceStatus(act, comp, settings);

    if (calc.status === 'overdue') {
      const existing = existingAlerts.find(
        (a) => a.relatedEntityType === 'maintenance' && a.relatedEntityId === act.id && a.type === 'maintenance_overdue' && a.status !== 'closed'
      );
      if (!existing) {
        const newAlert: Alert = {
          id: `al-maint-od-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          compressorId: comp.id,
          type: 'maintenance_overdue',
          level: 'critical',
          title: `Mantenimiento Vencido: ${act.name}`,
          description: `El equipo ${comp.code} (${comp.name}) tiene vencido el servicio "${act.name}" por ${Math.abs(calc.remainingHours)} hrs. Horómetro actual: ${comp.currentHours} hrs.`,
          date: new Date().toISOString().split('T')[0],
          status: 'new',
          relatedEntityType: 'maintenance',
          relatedEntityId: act.id,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          updatedBy: 'system',
          schemaVersion: 1,
        };
        await db.put('alerts', newAlert);
      }
    } else if (calc.status === 'schedule') {
      const existing = existingAlerts.find(
        (a) => a.relatedEntityType === 'maintenance' && a.relatedEntityId === act.id && a.type === 'maintenance_schedule' && a.status !== 'closed'
      );
      if (!existing) {
        const newAlert: Alert = {
          id: `al-maint-sc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          compressorId: comp.id,
          type: 'maintenance_schedule',
          level: 'important',
          title: `Programar Servicio: ${act.name}`,
          description: `El equipo ${comp.code} requiere programar "${act.name}". Quedan sólo ${calc.remainingHours} hrs disponibles.`,
          date: new Date().toISOString().split('T')[0],
          status: 'new',
          relatedEntityType: 'maintenance',
          relatedEntityId: act.id,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          updatedBy: 'system',
          schemaVersion: 1,
        };
        await db.put('alerts', newAlert);
      }
    } else if (calc.status === 'upcoming') {
      const existing = existingAlerts.find(
        (a) => a.relatedEntityType === 'maintenance' && a.relatedEntityId === act.id && a.type === 'maintenance_upcoming' && a.status !== 'closed'
      );
      if (!existing) {
        const newAlert: Alert = {
          id: `al-maint-up-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          compressorId: comp.id,
          type: 'maintenance_upcoming',
          level: 'warning',
          title: `Servicio Próximo: ${act.name}`,
          description: `El equipo ${comp.code} se acerca al servicio "${act.name}". Quedan ${calc.remainingHours} hrs (${calc.consumedPercentage}% consumido).`,
          date: new Date().toISOString().split('T')[0],
          status: 'new',
          relatedEntityType: 'maintenance',
          relatedEntityId: act.id,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          updatedBy: 'system',
          schemaVersion: 1,
        };
        await db.put('alerts', newAlert);
      }
    }
  }
}
