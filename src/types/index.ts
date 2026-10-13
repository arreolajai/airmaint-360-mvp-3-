export type Role = 'admin' | 'technician' | 'viewer';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  passwordHash: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  schemaVersion: number;
}

export type CompressorStatus =
  | 'operating'
  | 'stopped'
  | 'maintenance'
  | 'standby'
  | 'out_of_service';

export type Criticality = 'A' | 'B' | 'C';

export interface Compressor {
  id: string;
  code: string;
  name: string;
  photoUrl?: string;
  plant: string;
  building: string; // Nave
  area: string;
  location: string;
  brand: string;
  model: string;
  serialNumber: string;
  compressorType: string; // Tornillo rotativo, Pistón, Centrífugo, etc.
  motorPower: string; // HP / kW
  capacity: string; // CFM / m3/min
  nominalPressure: string; // PSI / bar
  oilType: string;
  installationDate: string;
  initialHours: number;
  currentHours: number;
  avgDailyHours: number;
  criticality: Criticality;
  status: CompressorStatus;
  observations?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  deletedAt?: string | null;
  schemaVersion: number;
}

export interface HourMeterReplacementDetails {
  previousMeterFinal: number;
  newMeterInitial: number;
  reason: string;
  authorizedBy: string;
}

export interface HourMeterReading {
  id: string;
  compressorId: string;
  date: string;
  time: string;
  currentHours: number;
  loadedHours?: number; // Horas en carga
  unloadedHours?: number; // Horas en vacío
  diffHours: number;
  notes?: string;
  photoUrl?: string;
  recordedBy: string;
  isMeterReplacement?: boolean;
  replacementDetails?: HourMeterReplacementDetails;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  schemaVersion: number;
}

export type MaintenanceType =
  | 'preventive'
  | 'predictive'
  | 'inspection'
  | 'safety'
  | 'corrective_planned';

export interface MaintenanceActivity {
  id: string;
  compressorId: string;
  code: string;
  name: string;
  description: string;
  maintenanceType: MaintenanceType;
  intervalHours: number;
  intervalDays?: number;
  lastServiceHours: number;
  lastServiceDate: string;
  estimatedDurationHours: number;
  assignedRole: string;
  instructions?: string;
  photoRequired: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  schemaVersion: number;
}

export type TrafficLightStatus =
  | 'normal'
  | 'upcoming'
  | 'schedule'
  | 'overdue'
  | 'no_info';

export interface MaintenanceCalculation {
  activityId: string;
  activityName: string;
  compressorId: string;
  compressorName: string;
  compressorCode: string;
  nextMeter: number;
  remainingHours: number;
  consumedPercentage: number;
  nextDate?: string;
  remainingDays?: number;
  estimatedDate?: string;
  status: TrafficLightStatus;
  statusLabel: string;
  colorClass: string;
}

export type OrderPriority = 'low' | 'medium' | 'high' | 'critical';

export type OrderStatus =
  | 'new'
  | 'scheduled'
  | 'in_progress'
  | 'pending'
  | 'completed'
  | 'closed'
  | 'cancelled';

export interface OrderHistoryEntry {
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface WorkOrder {
  id: string;
  folio: string; // Ej: OT-2026-001
  compressorId: string;
  activityId?: string;
  originType: 'manual' | 'preventive' | 'inspection' | 'failure';
  originId?: string;
  maintenanceType: MaintenanceType;
  priority: OrderPriority;
  status: OrderStatus;
  scheduledDate: string;
  scheduledHours?: number;
  assignedTo: string;
  description: string;
  instructions?: string;
  workPerformed?: string;
  executionHours?: number;
  executionDate?: string;
  actualDurationMinutes?: number;
  technicianName?: string;
  signatureUrl?: string;
  photosBefore?: string[];
  photosAfter?: string[];
  cancellationReason?: string;
  history: OrderHistoryEntry[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  schemaVersion: number;
}

export type InspectionResult = 'pass' | 'fail' | 'na';

export interface InspectionItem {
  id: string;
  pointKey: string;
  label: string;
  result: InspectionResult;
  observation?: string;
  priority?: OrderPriority;
  photoUrl?: string;
  numericValue?: number;
  unit?: string;
  createdWorkOrderId?: string;
}

export interface Inspection {
  id: string;
  inspectionNumber: string; // Ej: INS-2026-001
  compressorId: string;
  date: string;
  time: string;
  technicianName: string;
  signatureUrl?: string;
  overallResult: 'pass' | 'fail' | 'warning';
  compliancePercentage: number;
  findingsCount: number;
  items: InspectionItem[];
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  schemaVersion: number;
}

export type FailureStatus =
  | 'open'
  | 'in_analysis'
  | 'in_repair'
  | 'resolved'
  | 'closed';

export interface Failure {
  id: string;
  folio: string; // Ej: FL-2026-001
  compressorId: string;
  occurredAt: string;
  symptom: string;
  description: string;
  alarmCode?: string;
  isMachineStopped: boolean;
  priority: OrderPriority;
  possibleCause?: string;
  immediateAction?: string;
  assignedTo?: string;
  status: FailureStatus;
  photos?: string[];
  downtimeHours?: number;
  resolvedAt?: string;
  relatedWorkOrderId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  schemaVersion: number;
}

export type AlertLevel = 'info' | 'warning' | 'important' | 'critical';

export type AlertType =
  | 'maintenance_upcoming'
  | 'maintenance_schedule'
  | 'maintenance_overdue'
  | 'order_delayed'
  | 'inspection_finding'
  | 'critical_failure'
  | 'meter_pending'
  | 'backup_pending';

export type AlertStatus = 'new' | 'viewed' | 'attended' | 'closed';

export interface Alert {
  id: string;
  compressorId?: string;
  type: AlertType;
  level: AlertLevel;
  title: string;
  description: string;
  date: string;
  status: AlertStatus;
  relatedEntityType:
    | 'compressor'
    | 'maintenance'
    | 'order'
    | 'inspection'
    | 'failure'
    | 'backup';
  relatedEntityId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  schemaVersion: number;
}

export type AuditAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'close'
  | 'cancel'
  | 'deactivate'
  | 'import'
  | 'export'
  | 'backup'
  | 'restore'
  | 'meter_reading';

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: AuditAction;
  module:
    | 'compressors'
    | 'hourmeters'
    | 'maintenance'
    | 'orders'
    | 'inspections'
    | 'failures'
    | 'alerts'
    | 'auth'
    | 'backup'
    | 'settings';
  entityId?: string;
  description: string;
  schemaVersion: number;
}

export interface AppSettings {
  id: string;
  companyName: string;
  plantName: string;
  logoUrl?: string;
  confidentialityNotice: string;
  dateFormat: string;
  buildingsList: string[]; // Naves
  areasList: string[];
  trafficLightNormalPercent: number; // Def: 20
  trafficLightUpcomingPercent: number; // Def: 10
  trafficLightSchedulePercent: number; // Def: 0
  maxDaysWithoutBackup: number; // Def: 7
  maxDaysBetweenHourMeters: number; // Def: 3
  initialWorkOrderFolio: number;
  theme: 'light' | 'dark';
  autoLockMinutes: number; // Def: 10
  schemaVersion: number;
}

export interface BackupData {
  backupId: string;
  timestamp: string;
  appVersion: string;
  schemaVersion: number;
  checksum: string;
  data: {
    compressors: Compressor[];
    hourMeterReadings: HourMeterReading[];
    maintenanceActivities: MaintenanceActivity[];
    workOrders: WorkOrder[];
    inspections: Inspection[];
    failures: Failure[];
    alerts: Alert[];
    auditLogs: AuditLog[];
    appSettings: AppSettings;
    users: User[];
  };
}
