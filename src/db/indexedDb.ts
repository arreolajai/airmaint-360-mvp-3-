import {openDB, type DBSchema, type IDBPDatabase} from 'idb';
import type {
  Compressor,
  HourMeterReading,
  MaintenanceActivity,
  WorkOrder,
  Inspection,
  Failure,
  Alert,
  AuditLog,
  AppSettings,
  User,
  BackupData,
} from '../types';

interface AirMaintDB extends DBSchema {
  compressors: {
    key: string;
    value: Compressor;
    indexes: {'by-code': string; 'by-status': string};
  };
  hourMeterReadings: {
    key: string;
    value: HourMeterReading;
    indexes: {'by-compressor': string; 'by-date': string};
  };
  maintenanceActivities: {
    key: string;
    value: MaintenanceActivity;
    indexes: {'by-compressor': string; 'by-type': string};
  };
  workOrders: {
    key: string;
    value: WorkOrder;
    indexes: {'by-compressor': string; 'by-status': string; 'by-folio': string};
  };
  inspections: {
    key: string;
    value: Inspection;
    indexes: {'by-compressor': string; 'by-date': string};
  };
  failures: {
    key: string;
    value: Failure;
    indexes: {'by-compressor': string; 'by-status': string};
  };
  alerts: {
    key: string;
    value: Alert;
    indexes: {'by-status': string; 'by-level': string};
  };
  auditLogs: {
    key: string;
    value: AuditLog;
    indexes: {'by-timestamp': string; 'by-module': string};
  };
  appSettings: {
    key: string;
    value: AppSettings;
  };
  users: {
    key: string;
    value: User;
    indexes: {'by-username': string};
  };
}

const DB_NAME = 'airmaint360_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AirMaintDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<AirMaintDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AirMaintDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Compressors
        if (!db.objectStoreNames.contains('compressors')) {
          const compStore = db.createObjectStore('compressors', {keyPath: 'id'});
          compStore.createIndex('by-code', 'code', {unique: true});
          compStore.createIndex('by-status', 'status');
        }

        // HourMeterReadings
        if (!db.objectStoreNames.contains('hourMeterReadings')) {
          const hmStore = db.createObjectStore('hourMeterReadings', {keyPath: 'id'});
          hmStore.createIndex('by-compressor', 'compressorId');
          hmStore.createIndex('by-date', 'date');
        }

        // MaintenanceActivities
        if (!db.objectStoreNames.contains('maintenanceActivities')) {
          const mStore = db.createObjectStore('maintenanceActivities', {keyPath: 'id'});
          mStore.createIndex('by-compressor', 'compressorId');
          mStore.createIndex('by-type', 'maintenanceType');
        }

        // WorkOrders
        if (!db.objectStoreNames.contains('workOrders')) {
          const woStore = db.createObjectStore('workOrders', {keyPath: 'id'});
          woStore.createIndex('by-compressor', 'compressorId');
          woStore.createIndex('by-status', 'status');
          woStore.createIndex('by-folio', 'folio', {unique: true});
        }

        // Inspections
        if (!db.objectStoreNames.contains('inspections')) {
          const insStore = db.createObjectStore('inspections', {keyPath: 'id'});
          insStore.createIndex('by-compressor', 'compressorId');
          insStore.createIndex('by-date', 'date');
        }

        // Failures
        if (!db.objectStoreNames.contains('failures')) {
          const fStore = db.createObjectStore('failures', {keyPath: 'id'});
          fStore.createIndex('by-compressor', 'compressorId');
          fStore.createIndex('by-status', 'status');
        }

        // Alerts
        if (!db.objectStoreNames.contains('alerts')) {
          const aStore = db.createObjectStore('alerts', {keyPath: 'id'});
          aStore.createIndex('by-status', 'status');
          aStore.createIndex('by-level', 'level');
        }

        // AuditLogs
        if (!db.objectStoreNames.contains('auditLogs')) {
          const alStore = db.createObjectStore('auditLogs', {keyPath: 'id'});
          alStore.createIndex('by-timestamp', 'timestamp');
          alStore.createIndex('by-module', 'module');
        }

        // AppSettings
        if (!db.objectStoreNames.contains('appSettings')) {
          db.createObjectStore('appSettings', {keyPath: 'id'});
        }

        // Users
        if (!db.objectStoreNames.contains('users')) {
          const uStore = db.createObjectStore('users', {keyPath: 'id'});
          uStore.createIndex('by-username', 'username', {unique: true});
        }
      },
    });
  }
  return dbPromise;
}

// Generate simple browser SHA-256 for passwords and checksums
export async function hashString(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Initialize default settings and demo data if database is empty
export async function initDatabaseWithSeeds(): Promise<void> {
  const db = await getDB();
  const existingSettings = await db.get('appSettings', 'default_settings');

  if (!existingSettings) {
    const defaultSettings: AppSettings = {
      id: 'default_settings',
      companyName: 'Industrias Neumáticas del Norte S.A.',
      plantName: 'Planta Principal - Monterrey',
      confidentialityNotice: 'Información Confidencial de Mantenimiento Industrial - Uso Interno Exclusivo',
      dateFormat: 'YYYY-MM-DD',
      buildingsList: ['Nave 1 - Producción', 'Nave 2 - Ensamble', 'Nave 3 - Pintura', 'Cuarto de Compresores Central'],
      areasList: ['Línea de Ensamble A', 'Línea Automatizada B', 'Taller Mecánico', 'Cabina de Pintura', 'Servicios Auxiliares'],
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
    await db.put('appSettings', defaultSettings);
  }

  // Users seed
  const existingUsers = await db.getAll('users');
  if (existingUsers.length === 0) {
    const adminHash = await hashString('admin123');
    const tecHash = await hashString('tec123');
    const viewHash = await hashString('consulta123');

    const defaultUsers: User[] = [
      {
        id: 'usr-admin-1',
        username: 'admin',
        fullName: 'Ing. Carlos Mendoza (Admin)',
        role: 'admin',
        passwordHash: adminHash,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system',
        schemaVersion: 1,
      },
      {
        id: 'usr-tec-1',
        username: 'tecnico',
        fullName: 'Téc. Roberto Valdés',
        role: 'technician',
        passwordHash: tecHash,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system',
        schemaVersion: 1,
      },
      {
        id: 'usr-view-1',
        username: 'consulta',
        fullName: 'Supervisor de Turno (Consulta)',
        role: 'viewer',
        passwordHash: viewHash,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system',
        schemaVersion: 1,
      },
    ];

    for (const u of defaultUsers) {
      await db.put('users', u);
    }
  }

  // Demo compressors & related data
  const existingComp = await db.getAll('compressors');
  if (existingComp.length === 0) {
    await seedDemoData();
  }
}

export async function seedDemoData(): Promise<void> {
  const db = await getDB();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

  // 1. Three Compressors
  const demoCompressors: Compressor[] = [
    {
      id: 'comp-demo-01',
      code: 'CP-01',
      name: 'Compresor Tornillo GA-75 VSD',
      plant: 'Planta Principal - Monterrey',
      building: 'Cuarto de Compresores Central',
      area: 'Servicios Auxiliares',
      location: 'Bahía 1 - Lado Norte',
      brand: 'Atlas Copco',
      model: 'GA 75 VSD+',
      serialNumber: 'APF-928174',
      compressorType: 'Tornillo Rotativo con VSD',
      motorPower: '100 HP (75 kW)',
      capacity: '465 CFM',
      nominalPressure: '125 PSI (8.6 bar)',
      oilType: 'Roto-Inject Fluid HD (Sintético)',
      installationDate: '2023-01-15',
      initialHours: 1200,
      currentHours: 7850,
      avgDailyHours: 18,
      criticality: 'A',
      status: 'operating',
      observations: '[DATOS DE DEMOSTRACIÓN] Compresor principal de aire para toda la planta.',
      isActive: true,
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
      createdBy: 'admin',
      updatedBy: 'admin',
      deletedAt: null,
      schemaVersion: 1,
    },
    {
      id: 'comp-demo-02',
      code: 'CP-02',
      name: 'Compresor Tornillo Kaeser CSD-125',
      plant: 'Planta Principal - Monterrey',
      building: 'Cuarto de Compresores Central',
      area: 'Línea de Ensamble A',
      location: 'Bahía 2 - Lado Sur',
      brand: 'Kaeser',
      model: 'CSD 125',
      serialNumber: 'KAE-448201',
      compressorType: 'Tornillo Rotativo',
      motorPower: '125 HP (90 kW)',
      capacity: '550 CFM',
      nominalPressure: '115 PSI (7.9 bar)',
      oilType: 'Sigma Fluid S-460',
      installationDate: '2022-06-10',
      initialHours: 2500,
      currentHours: 9940,
      avgDailyHours: 16,
      criticality: 'B',
      status: 'operating',
      observations: '[DATOS DE DEMOSTRACIÓN] Respaldo primario y soporte de picos de demanda.',
      isActive: true,
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
      createdBy: 'admin',
      updatedBy: 'admin',
      deletedAt: null,
      schemaVersion: 1,
    },
    {
      id: 'comp-demo-03',
      code: 'CP-03',
      name: 'Compresor Ingersoll Rand Sierra OF',
      plant: 'Planta Principal - Monterrey',
      building: 'Nave 3 - Pintura',
      area: 'Cabina de Pintura',
      location: 'Exterior Nave 3',
      brand: 'Ingersoll Rand',
      model: 'Sierra SL-55',
      serialNumber: 'IR-773910',
      compressorType: 'Tornillo Libre de Aceite (Oil-Free)',
      motorPower: '75 HP (55 kW)',
      capacity: '320 CFM',
      nominalPressure: '100 PSI (7.0 bar)',
      oilType: 'Ultra Food Grade / Ultra Coolant',
      installationDate: '2023-11-20',
      initialHours: 500,
      currentHours: 3200,
      avgDailyHours: 12,
      criticality: 'A',
      status: 'stopped',
      observations: '[DATOS DE DEMOSTRACIÓN] Suministro de aire grado instrumento sin aceite para pintura.',
      isActive: true,
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
      createdBy: 'admin',
      updatedBy: 'admin',
      deletedAt: null,
      schemaVersion: 1,
    },
  ];

  for (const c of demoCompressors) {
    await db.put('compressors', c);
  }

  // 2. Hour Meter Readings History
  const demoReadings: HourMeterReading[] = [
    {
      id: 'hm-demo-1',
      compressorId: 'comp-demo-01',
      date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      time: '08:00',
      currentHours: 7760,
      loadedHours: 6200,
      unloadedHours: 1560,
      diffHours: 90,
      notes: '[DATOS DE DEMOSTRACIÓN] Lectura rutinaria inicio de semana',
      recordedBy: 'tecnico',
      isActive: true,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      createdBy: 'tecnico',
      updatedBy: 'tecnico',
      schemaVersion: 1,
    },
    {
      id: 'hm-demo-2',
      compressorId: 'comp-demo-01',
      date: dateStr,
      time: timeStr,
      currentHours: 7850,
      loadedHours: 6270,
      unloadedHours: 1580,
      diffHours: 90,
      notes: '[DATOS DE DEMOSTRACIÓN] Horómetro verificado en display Elektronikon',
      recordedBy: 'tecnico',
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: 'tecnico',
      updatedBy: 'tecnico',
      schemaVersion: 1,
    },
    {
      id: 'hm-demo-3',
      compressorId: 'comp-demo-02',
      date: dateStr,
      time: timeStr,
      currentHours: 9940,
      loadedHours: 8100,
      unloadedHours: 1840,
      diffHours: 80,
      notes: '[DATOS DE DEMOSTRACIÓN] Próximo a servicio mayor de 10,000 hrs',
      recordedBy: 'tecnico',
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: 'tecnico',
      updatedBy: 'tecnico',
      schemaVersion: 1,
    },
    {
      id: 'hm-demo-4',
      compressorId: 'comp-demo-03',
      date: dateStr,
      time: timeStr,
      currentHours: 3200,
      loadedHours: 2500,
      unloadedHours: 700,
      diffHours: 36,
      notes: '[DATOS DE DEMOSTRACIÓN] Unidad en pausa tras fin de turno de pintura',
      recordedBy: 'tecnico',
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: 'tecnico',
      updatedBy: 'tecnico',
      schemaVersion: 1,
    },
  ];

  for (const r of demoReadings) {
    await db.put('hourMeterReadings', r);
  }

  // 3. Maintenance Activities for Compressors
  const demoActivities: MaintenanceActivity[] = [
    // For CP-01 (Current: 7,850h)
    {
      id: 'act-demo-01',
      compressorId: 'comp-demo-01',
      code: 'PM-FA-01',
      name: 'Cambio de filtro de aire',
      description: 'Reemplazo del cartucho filtrante de admisión y limpieza de caja portafiltro.',
      maintenanceType: 'preventive',
      intervalHours: 2000,
      intervalDays: 180,
      lastServiceHours: 6000,
      lastServiceDate: '2025-10-01',
      estimatedDurationHours: 1.5,
      assignedRole: 'Técnico Mecánico',
      instructions: 'Despresurizar el equipo. Retirar tapa, extraer elemento, limpiar con trapo seco el interior, colocar nuevo filtro y verificar estanqueidad.',
      photoRequired: true,
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: 'admin',
      updatedBy: 'admin',
      schemaVersion: 1,
    },
    {
      id: 'act-demo-02',
      compressorId: 'comp-demo-01',
      code: 'PM-FO-01',
      name: 'Cambio de filtro de aceite',
      description: 'Reemplazo del filtro de aceite roscado de alta eficiencia.',
      maintenanceType: 'preventive',
      intervalHours: 4000,
      lastServiceHours: 4000,
      lastServiceDate: '2025-06-15',
      estimatedDurationHours: 1.0,
      assignedRole: 'Técnico Mecánico',
      instructions: 'Utilizar llave de banda adecuada. Lubricar junta con aceite limpio antes de montar. Apretar a mano 3/4 de vuelta.',
      photoRequired: true,
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: 'admin',
      updatedBy: 'admin',
      schemaVersion: 1,
    },
    {
      id: 'act-demo-03',
      compressorId: 'comp-demo-01',
      code: 'PM-LUB-01',
      name: 'Lubricación de rodamientos de motor principal',
      description: 'Engrase de rodamientos delantero y trasero con grasa poliurea para alta temperatura.',
      maintenanceType: 'preventive',
      intervalHours: 2000,
      intervalDays: 90,
      lastServiceHours: 6000,
      lastServiceDate: '2025-10-01',
      estimatedDurationHours: 0.5,
      assignedRole: 'Técnico Mecánico',
      instructions: 'Limpiar graseras. Aplicar 20 gramos de grasa Mobil Polyrex EM o equivalente con motor en marcha controlada.',
      photoRequired: false,
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: 'admin',
      updatedBy: 'admin',
      schemaVersion: 1,
    },
    // For CP-02 (Current: 9,940h, last major 8,000h, interval 2,000h -> upcoming!)
    {
      id: 'act-demo-04',
      compressorId: 'comp-demo-02',
      code: 'PM-OIL-02',
      name: 'Cambio de aceite y filtro separador',
      description: 'Drenado total de aceite sintético Sigma Fluid y cambio de cartucho separador aire/aceite.',
      maintenanceType: 'preventive',
      intervalHours: 2000,
      intervalDays: 180,
      lastServiceHours: 8000,
      lastServiceDate: '2025-07-20',
      estimatedDurationHours: 4.0,
      assignedRole: 'Técnico Senior',
      instructions: '1. Desfogar presión total a cero. 2. Drenar tanque separador y enfriador. 3. Reemplazar separador y grapar puente antiestático. 4. Rellenar con 45L de aceite nuevo.',
      photoRequired: true,
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: 'admin',
      updatedBy: 'admin',
      schemaVersion: 1,
    },
    {
      id: 'act-demo-05',
      compressorId: 'comp-demo-02',
      code: 'PM-CLN-02',
      name: 'Limpieza de radiadores y enfriadores',
      description: 'Soplado a contracorriente con aire y lavado de panales de enfriador de aceite y post-enfriador de aire.',
      maintenanceType: 'preventive',
      intervalHours: 1000,
      intervalDays: 60,
      lastServiceHours: 9000,
      lastServiceDate: '2025-09-01',
      estimatedDurationHours: 2.0,
      assignedRole: 'Técnico Mecánico',
      instructions: 'Bloquear equipo LOTO. Soplar aire de adentro hacia afuera a 30 PSI para remover pelusa y polvo.',
      photoRequired: true,
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: 'admin',
      updatedBy: 'admin',
      schemaVersion: 1,
    },
    // For CP-03 (Current: 3,200h, last 1,000h, interval 2,000h -> overdue!)
    {
      id: 'act-demo-06',
      compressorId: 'comp-demo-03',
      code: 'PM-CHK-03',
      name: 'Inspección de válvula check y descarga',
      description: 'Desarme, limpieza y cambio de empaque de la válvula de retención y válvula de presión mínima.',
      maintenanceType: 'preventive',
      intervalHours: 2000,
      intervalDays: 180,
      lastServiceHours: 1000,
      lastServiceDate: '2025-04-10',
      estimatedDurationHours: 3.0,
      assignedRole: 'Técnico Especialista',
      instructions: 'Revisar asiento de teflón, resorte de retorno y limpiar residuos de carbonización.',
      photoRequired: true,
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: 'admin',
      updatedBy: 'admin',
      schemaVersion: 1,
    },
  ];

  for (const a of demoActivities) {
    await db.put('maintenanceActivities', a);
  }

  // 4. Work Orders (1 open, 1 closed)
  const demoOrders: WorkOrder[] = [
    {
      id: 'wo-demo-01',
      folio: 'OT-2026-001',
      compressorId: 'comp-demo-02',
      activityId: 'act-demo-04',
      originType: 'preventive',
      originId: 'act-demo-04',
      maintenanceType: 'preventive',
      priority: 'high',
      status: 'scheduled',
      scheduledDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      scheduledHours: 10000,
      assignedTo: 'Téc. Roberto Valdés',
      description: 'Servicio Preventivo 10,000 Horas: Cambio de Aceite Sigma Fluid y Separador de Neblina.',
      instructions: 'Verificar kit de empaques, kit separador Kaeser ref #6.4212.0 y tambor de aceite en almacén antes de iniciar.',
      history: [
        {
          timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
          user: 'admin',
          action: 'Creación',
          details: 'Orden programada por proximidad de horómetro (9,940 hrs registradas).',
        },
      ],
      isActive: true,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      createdBy: 'admin',
      updatedBy: 'admin',
      schemaVersion: 1,
    },
    {
      id: 'wo-demo-02',
      folio: 'OT-2026-002',
      compressorId: 'comp-demo-01',
      activityId: 'act-demo-01',
      originType: 'preventive',
      originId: 'act-demo-01',
      maintenanceType: 'preventive',
      priority: 'medium',
      status: 'closed',
      scheduledDate: '2025-10-01',
      scheduledHours: 6000,
      assignedTo: 'Téc. Roberto Valdés',
      description: 'Reemplazo programado de filtro de admisión y soplado de radiador.',
      instructions: 'Reemplazar elemento filtrante de aire ref #1613-8004-00.',
      workPerformed: 'Se realizó el reemplazo del filtro de aire marca Atlas Copco original. Se limpió el ducto de aspiración con aspiradora industrial. Se probó hermeticidad de abrazaderas y se verificó caída de presión en vacío de 0.02 bar.',
      executionHours: 6000,
      executionDate: '2025-10-01',
      actualDurationMinutes: 85,
      technicianName: 'Roberto Valdés',
      signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10 25 Q 30 5, 50 25 T 90 20" stroke="blue" fill="none" stroke-width="2"/></svg>',
      photosBefore: [],
      photosAfter: [],
      history: [
        {
          timestamp: '2025-10-01T08:00:00Z',
          user: 'admin',
          action: 'Creación',
          details: 'Orden preventiva creada.',
        },
        {
          timestamp: '2025-10-01T11:30:00Z',
          user: 'tecnico',
          action: 'Cierre',
          details: 'Mantenimiento ejecutado con éxito y horómetro 6,000 hrs actualizado.',
        },
      ],
      isActive: true,
      createdAt: '2025-10-01T08:00:00Z',
      updatedAt: '2025-10-01T11:30:00Z',
      createdBy: 'admin',
      updatedBy: 'tecnico',
      schemaVersion: 1,
    },
  ];

  for (const o of demoOrders) {
    await db.put('workOrders', o);
  }

  // 5. Inspection with Findings
  const demoInspection: Inspection = {
    id: 'ins-demo-01',
    inspectionNumber: 'INS-2026-001',
    compressorId: 'comp-demo-02',
    date: dateStr,
    time: timeStr,
    technicianName: 'Roberto Valdés',
    overallResult: 'warning',
    compliancePercentage: 85.7,
    findingsCount: 2,
    items: [
      {id: 'it-1', pointKey: 'oil_level', label: 'Nivel de aceite correcto', result: 'pass'},
      {
        id: 'it-2',
        pointKey: 'oil_leaks',
        label: 'Sin fugas de aceite',
        result: 'fail',
        observation: 'Ligera fuga en conector flexible de retorno del enfriador',
        priority: 'high',
      },
      {
        id: 'it-3',
        pointKey: 'air_leaks',
        label: 'Sin fugas de aire visibles o audibles',
        result: 'fail',
        observation: 'Fuga audible de aire en purga automática inferior',
        priority: 'medium',
      },
      {id: 'it-4', pointKey: 'pressure', label: 'Presión normal', result: 'pass', numericValue: 114, unit: 'PSI'},
      {id: 'it-5', pointKey: 'temp', label: 'Temperatura normal', result: 'pass', numericValue: 88, unit: '°C'},
      {id: 'it-6', pointKey: 'noise', label: 'Sin ruido anormal', result: 'pass'},
      {id: 'it-7', pointKey: 'vibration', label: 'Sin vibración anormal', result: 'pass'},
      {id: 'it-8', pointKey: 'filters', label: 'Filtros sin obstrucción aparente', result: 'pass'},
      {id: 'it-9', pointKey: 'coolers', label: 'Enfriadores limpios', result: 'pass'},
      {id: 'it-10', pointKey: 'drain', label: 'Drenaje de condensado funcionando', result: 'pass'},
      {id: 'it-11', pointKey: 'area', label: 'Área limpia y despejada', result: 'pass'},
      {id: 'it-12', pointKey: 'guards', label: 'Guardas instaladas', result: 'pass'},
      {id: 'it-13', pointKey: 'loto', label: 'Señalización y LOTO disponibles', result: 'pass'},
      {id: 'it-14', pointKey: 'general', label: 'Condición general aceptable', result: 'pass'},
    ],
    notes: '[DATOS DE DEMOSTRACIÓN] Inspección semanal con 2 hallazgos reportados para atención.',
    isActive: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    createdBy: 'tecnico',
    updatedBy: 'tecnico',
    schemaVersion: 1,
  };
  await db.put('inspections', demoInspection);

  // 6. Failure
  const demoFailure: Failure = {
    id: 'fl-demo-01',
    folio: 'FL-2026-001',
    compressorId: 'comp-demo-03',
    occurredAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    symptom: 'Disparo térmico y paro automático durante ciclo de presurización',
    description: 'El compresor se apagó con código E-04 de sobretemperatura en cabina y presión baja en descarga.',
    alarmCode: 'AL-TEMP-108C',
    isMachineStopped: true,
    priority: 'critical',
    possibleCause: 'Restricción de flujo en serpentín exterior o falla de termostato',
    immediateAction: 'Se apagó el seccionador principal y se colocó candado de seguridad LOTO. Se solicitó revisión técnica.',
    assignedTo: 'Téc. Roberto Valdés',
    status: 'in_repair',
    downtimeHours: 14.5,
    isActive: true,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: now.toISOString(),
    createdBy: 'tecnico',
    updatedBy: 'tecnico',
    schemaVersion: 1,
  };
  await db.put('failures', demoFailure);

  // 7. Alerts
  const demoAlerts: Alert[] = [
    {
      id: 'al-demo-01',
      compressorId: 'comp-demo-03',
      type: 'critical_failure',
      level: 'critical',
      title: 'Falla Crítica - Compresor Detenido',
      description: 'El compresor CP-03 (Sierra OF) se encuentra detenido por sobretemperatura (Folio FL-2026-001).',
      date: dateStr,
      status: 'new',
      relatedEntityType: 'failure',
      relatedEntityId: 'fl-demo-01',
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: 'system',
      updatedBy: 'system',
      schemaVersion: 1,
    },
    {
      id: 'al-demo-02',
      compressorId: 'comp-demo-03',
      type: 'maintenance_overdue',
      level: 'important',
      title: 'Mantenimiento Vencido',
      description: 'Actividad PM-CHK-03 "Revisión de válvula check" superó las 2,000 hrs (vencida por 200 hrs).',
      date: dateStr,
      status: 'new',
      relatedEntityType: 'maintenance',
      relatedEntityId: 'act-demo-06',
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: 'system',
      updatedBy: 'system',
      schemaVersion: 1,
    },
    {
      id: 'al-demo-03',
      compressorId: 'comp-demo-02',
      type: 'maintenance_upcoming',
      level: 'warning',
      title: 'Mantenimiento Próximo a Vencer',
      description: 'Compresor CP-02 está a sólo 60 horas del servicio preventivo mayor de 10,000 hrs.',
      date: dateStr,
      status: 'viewed',
      relatedEntityType: 'maintenance',
      relatedEntityId: 'act-demo-04',
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: 'system',
      updatedBy: 'system',
      schemaVersion: 1,
    },
    {
      id: 'al-demo-04',
      compressorId: 'comp-demo-02',
      type: 'inspection_finding',
      level: 'warning',
      title: 'Hallazgos en Inspección',
      description: 'Inspección INS-2026-001 detectó fuga de aceite en manguera de enfriador.',
      date: dateStr,
      status: 'attended',
      relatedEntityType: 'inspection',
      relatedEntityId: 'ins-demo-01',
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: 'system',
      updatedBy: 'system',
      schemaVersion: 1,
    },
  ];

  for (const a of demoAlerts) {
    await db.put('alerts', a);
  }

  // 8. Audit Logs
  const demoAudit: AuditLog = {
    id: 'aud-demo-01',
    timestamp: now.toISOString(),
    user: 'admin',
    action: 'create',
    module: 'compressors',
    entityId: 'comp-demo-01',
    description: 'Carga inicial de datos de demostración para el sistema AIRMAINT 360.',
    schemaVersion: 1,
  };
  await db.put('auditLogs', demoAudit);
}

// Function to delete all demo data
export async function clearDemoData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(
    ['compressors', 'hourMeterReadings', 'maintenanceActivities', 'workOrders', 'inspections', 'failures', 'alerts'],
    'readwrite'
  );

  const compStore = tx.objectStore('compressors');
  const comps = await compStore.getAll();
  for (const c of comps) {
    if (c.observations?.includes('[DATOS DE DEMOSTRACIÓN]') || c.id.startsWith('comp-demo-')) {
      await compStore.delete(c.id);
    }
  }

  const hmStore = tx.objectStore('hourMeterReadings');
  const hms = await hmStore.getAll();
  for (const h of hms) {
    if (h.notes?.includes('[DATOS DE DEMOSTRACIÓN]') || h.id.startsWith('hm-demo-')) {
      await hmStore.delete(h.id);
    }
  }

  const actStore = tx.objectStore('maintenanceActivities');
  const acts = await actStore.getAll();
  for (const a of acts) {
    if (a.id.startsWith('act-demo-')) {
      await actStore.delete(a.id);
    }
  }

  const woStore = tx.objectStore('workOrders');
  const wos = await woStore.getAll();
  for (const w of wos) {
    if (w.id.startsWith('wo-demo-')) {
      await woStore.delete(w.id);
    }
  }

  const insStore = tx.objectStore('inspections');
  const inss = await insStore.getAll();
  for (const i of inss) {
    if (i.id.startsWith('ins-demo-') || i.notes?.includes('[DATOS DE DEMOSTRACIÓN]')) {
      await insStore.delete(i.id);
    }
  }

  const fStore = tx.objectStore('failures');
  const fs = await fStore.getAll();
  for (const f of fs) {
    if (f.id.startsWith('fl-demo-')) {
      await fStore.delete(f.id);
    }
  }

  const alStore = tx.objectStore('alerts');
  const als = await alStore.getAll();
  for (const a of als) {
    if (a.id.startsWith('al-demo-')) {
      await alStore.delete(a.id);
    }
  }

  await tx.done;
}

// Complete export to JSON backup
export async function createFullBackup(): Promise<BackupData> {
  const db = await getDB();
  const [
    compressors,
    hourMeterReadings,
    maintenanceActivities,
    workOrders,
    inspections,
    failures,
    alerts,
    auditLogs,
    settingsList,
    users,
  ] = await Promise.all([
    db.getAll('compressors'),
    db.getAll('hourMeterReadings'),
    db.getAll('maintenanceActivities'),
    db.getAll('workOrders'),
    db.getAll('inspections'),
    db.getAll('failures'),
    db.getAll('alerts'),
    db.getAll('auditLogs'),
    db.getAll('appSettings'),
    db.getAll('users'),
  ]);

  const appSettings = settingsList[0] || {
    id: 'default_settings',
    companyName: 'Industrias Neumáticas',
    plantName: 'Planta 1',
    confidentialityNotice: 'Confidencial',
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

  const payload = {
    compressors,
    hourMeterReadings,
    maintenanceActivities,
    workOrders,
    inspections,
    failures,
    alerts,
    auditLogs,
    appSettings,
    users,
  };

  const jsonString = JSON.stringify(payload);
  const checksum = await hashString(jsonString);

  return {
    backupId: `BCK-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    appVersion: '1.0.0',
    schemaVersion: 1,
    checksum,
    data: payload,
  };
}

// Restore backup with schema validation and checksum verification
export async function restoreBackup(backup: BackupData): Promise<{success: boolean; message: string; counts?: Record<string, number>}> {
  if (!backup || !backup.data || !backup.checksum) {
    return {success: false, message: 'Estructura de respaldo inválida. Faltan propiedades requeridas.'};
  }

  // Validate checksum
  const jsonString = JSON.stringify(backup.data);
  const calculatedChecksum = await hashString(jsonString);
  if (calculatedChecksum !== backup.checksum) {
    return {success: false, message: 'La suma de verificación (checksum) no coincide. El archivo podría estar corrupto o adulterado.'};
  }

  const db = await getDB();
  const tx = db.transaction(
    ['compressors', 'hourMeterReadings', 'maintenanceActivities', 'workOrders', 'inspections', 'failures', 'alerts', 'auditLogs', 'appSettings', 'users'],
    'readwrite'
  );

  // Clear existing
  await Promise.all([
    tx.objectStore('compressors').clear(),
    tx.objectStore('hourMeterReadings').clear(),
    tx.objectStore('maintenanceActivities').clear(),
    tx.objectStore('workOrders').clear(),
    tx.objectStore('inspections').clear(),
    tx.objectStore('failures').clear(),
    tx.objectStore('alerts').clear(),
    tx.objectStore('auditLogs').clear(),
    tx.objectStore('appSettings').clear(),
    tx.objectStore('users').clear(),
  ]);

  // Insert restored records
  const {
    compressors = [],
    hourMeterReadings = [],
    maintenanceActivities = [],
    workOrders = [],
    inspections = [],
    failures = [],
    alerts = [],
    auditLogs = [],
    appSettings,
    users = [],
  } = backup.data;

  for (const c of compressors) await tx.objectStore('compressors').put(c);
  for (const h of hourMeterReadings) await tx.objectStore('hourMeterReadings').put(h);
  for (const m of maintenanceActivities) await tx.objectStore('maintenanceActivities').put(m);
  for (const w of workOrders) await tx.objectStore('workOrders').put(w);
  for (const i of inspections) await tx.objectStore('inspections').put(i);
  for (const f of failures) await tx.objectStore('failures').put(f);
  for (const a of alerts) await tx.objectStore('alerts').put(a);
  for (const al of auditLogs) await tx.objectStore('auditLogs').put(al);
  if (appSettings) await tx.objectStore('appSettings').put(appSettings);
  for (const u of users) await tx.objectStore('users').put(u);

  await tx.done;

  return {
    success: true,
    message: 'Respaldo restaurado satisfactoriamente.',
    counts: {
      compresores: compressors.length,
      horometros: hourMeterReadings.length,
      mantenimientos: maintenanceActivities.length,
      ordenes: workOrders.length,
      inspecciones: inspections.length,
      fallas: failures.length,
    },
  };
}

// Reset application to factory state
export async function resetDatabaseToFactory(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(
    ['compressors', 'hourMeterReadings', 'maintenanceActivities', 'workOrders', 'inspections', 'failures', 'alerts', 'auditLogs', 'appSettings', 'users'],
    'readwrite'
  );

  await Promise.all([
    tx.objectStore('compressors').clear(),
    tx.objectStore('hourMeterReadings').clear(),
    tx.objectStore('maintenanceActivities').clear(),
    tx.objectStore('workOrders').clear(),
    tx.objectStore('inspections').clear(),
    tx.objectStore('failures').clear(),
    tx.objectStore('alerts').clear(),
    tx.objectStore('auditLogs').clear(),
    tx.objectStore('appSettings').clear(),
    tx.objectStore('users').clear(),
  ]);

  await tx.done;
  await initDatabaseWithSeeds();
}
