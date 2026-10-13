import React, {useState, useEffect, useCallback, useRef} from 'react';
import type {
  Compressor,
  HourMeterReading,
  MaintenanceActivity,
  MaintenanceCalculation,
  WorkOrder,
  Inspection,
  Failure,
  Alert,
  AuditLog,
  AppSettings,
  User,
  InspectionItem,
  AlertStatus,
} from './types';
import {
  getDB,
  initDatabaseWithSeeds,
} from './db/indexedDb';
import {
  calculateMaintenanceStatus,
  syncMaintenanceAlerts,
} from './services/calculationService';
import {
  getStoredSession,
  saveSession,
  clearSession,
} from './services/authService';
import {logAuditAction} from './services/auditService';

// Layout & Common Components
import {Sidebar, type NavItemKey} from './components/common/Sidebar';
import {BottomNav} from './components/common/BottomNav';
import {Header} from './components/common/Header';
import {QuickActionsModal} from './components/common/QuickActionsModal';
import {OfflineIndicator} from './components/common/OfflineIndicator';

// Auth Components
import {LoginModal} from './components/auth/LoginModal';
import {LockScreen} from './components/auth/LockScreen';

// Views
import {DashboardView} from './components/dashboard/DashboardView';
import {CompressorListView} from './components/compressors/CompressorListView';
import {CompressorDetailView} from './components/compressors/CompressorDetailView';
import {CompressorFormModal} from './components/compressors/CompressorFormModal';

import {HourMeterListView} from './components/hourmeters/HourMeterListView';
import {HourMeterCaptureModal} from './components/hourmeters/HourMeterCaptureModal';

import {MaintenancePlansView} from './components/maintenance/MaintenancePlansView';
import {MaintenanceFormModal} from './components/maintenance/MaintenanceFormModal';

import {WorkOrdersView} from './components/orders/WorkOrdersView';
import {WorkOrderFormModal} from './components/orders/WorkOrderFormModal';
import {WorkOrderDetailModal} from './components/orders/WorkOrderDetailModal';

import {InspectionsView} from './components/inspections/InspectionsView';
import {InspectionExecutionModal} from './components/inspections/InspectionExecutionModal';
import {InspectionDetailModal} from './components/inspections/InspectionDetailModal';

import {FailuresView} from './components/failures/FailuresView';
import {FailureFormModal} from './components/failures/FailureFormModal';

import {AlertsView} from './components/alerts/AlertsView';
import {ReportsView} from './components/reports/ReportsView';
import {SettingsView} from './components/settings/SettingsView';
import {AuditLogModal} from './components/settings/AuditLogModal';

export default function App() {
  // Navigation & View state
  const [currentView, setCurrentView] = useState<NavItemKey>('dashboard');
  const [selectedCompressor, setSelectedCompressor] = useState<Compressor | null>(null);

  // Auth & Session state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Entities state
  const [compressors, setCompressors] = useState<Compressor[]>([]);
  const [hourMeterReadings, setHourMeterReadings] = useState<HourMeterReading[]>([]);
  const [maintenanceActivities, setMaintenanceActivities] = useState<MaintenanceActivity[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [failures, setFailures] = useState<Failure[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Modal open states
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isCompressorFormOpen, setIsCompressorFormOpen] = useState(false);
  const [compressorToEdit, setCompressorToEdit] = useState<Compressor | null>(null);

  const [isHourMeterModalOpen, setIsHourMeterModalOpen] = useState(false);
  const [preselectedMeterCompId, setPreselectedMeterCompId] = useState<string | undefined>();

  const [isMaintenanceFormOpen, setIsMaintenanceFormOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<MaintenanceActivity | null>(null);

  const [isWorkOrderFormOpen, setIsWorkOrderFormOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<WorkOrder | null>(null);
  const [preselectedOrderData, setPreselectedOrderData] = useState<any>(undefined);

  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  const [failureToEdit, setFailureToEdit] = useState<Failure | null>(null);

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Inactivity Timer (10 minutes)
  const lastActivityRef = useRef<number>(Date.now());

  // Load all data from IndexedDB
  const reloadData = useCallback(async () => {
    try {
      const db = await getDB();
      const [
        comps,
        readings,
        acts,
        orders,
        inss,
        fails,
        alrts,
        audits,
        settingList,
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
      ]);

      setCompressors(comps);
      setHourMeterReadings(
        readings.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime())
      );
      setMaintenanceActivities(acts);
      setWorkOrders(orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setInspections(inss.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime()));
      setFailures(fails.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()));
      setAlerts(alrts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setAuditLogs(audits.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setSettings(settingList[0] || null);

      // Also refresh selected compressor if one is currently viewed
      if (selectedCompressor) {
        const refreshed = comps.find((c) => c.id === selectedCompressor.id);
        if (refreshed) setSelectedCompressor(refreshed);
      }
    } catch (err) {
      console.error('Error reloading data:', err);
    }
  }, [selectedCompressor]);

  // Initial App Mount
  useEffect(() => {
    async function init() {
      try {
        await initDatabaseWithSeeds();
        await syncMaintenanceAlerts();
        await reloadData();

        // Restore auth session
        const session = getStoredSession();
        if (session && session.user) {
          setCurrentUser(session.user);
          setIsLocked(session.isLocked);
        }
      } catch (err) {
        console.error('Initialization failed:', err);
      } finally {
        setIsInitializing(false);
      }
    }
    init();
  }, []);

  // Inactivity tracking (10 min by default)
  useEffect(() => {
    if (!currentUser || isLocked) return;

    const timeoutMs = (settings?.autoLockMinutes ?? 10) * 60 * 1000;

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= timeoutMs) {
        setIsLocked(true);
        const session = getStoredSession();
        if (session) {
          session.isLocked = true;
          saveSession(session);
        }
      }
    }, 15000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      clearInterval(interval);
    };
  }, [currentUser, isLocked, settings?.autoLockMinutes]);

  // Derived calculations for maintenance activities
  const calculations: MaintenanceCalculation[] = React.useMemo(() => {
    const compMap = new Map(compressors.map((c) => [c.id, c]));
    return maintenanceActivities
      .filter((a) => a.isActive)
      .map((a) => {
        const comp = compMap.get(a.compressorId);
        if (!comp) return null;
        return calculateMaintenanceStatus(a, comp, settings || undefined);
      })
      .filter(Boolean) as MaintenanceCalculation[];
  }, [compressors, maintenanceActivities, settings]);

  const unreadAlertsCount = alerts.filter(
    (a) => a.status === 'new' && (a.level === 'critical' || a.level === 'important' || a.level === 'warning')
  ).length;

  // Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsLocked(false);
  };

  const handleLogout = async () => {
    if (currentUser) {
      await logAuditAction(currentUser.username, 'logout', 'auth', 'Cierre de sesión local voluntario.');
    }
    clearSession();
    setCurrentUser(null);
    setIsLocked(false);
  };

  const handleManualLock = () => {
    setIsLocked(true);
    const session = getStoredSession();
    if (session) {
      session.isLocked = true;
      saveSession(session);
    }
  };

  // Quick Action Dispatcher
  const handleQuickAction = (action: 'capture_meter' | 'create_order' | 'run_inspection' | 'report_failure') => {
    switch (action) {
      case 'capture_meter':
        setPreselectedMeterCompId(undefined);
        setIsHourMeterModalOpen(true);
        break;
      case 'create_order':
        setOrderToEdit(null);
        setPreselectedOrderData(undefined);
        setIsWorkOrderFormOpen(true);
        break;
      case 'run_inspection':
        setIsInspectionModalOpen(true);
        break;
      case 'report_failure':
        setFailureToEdit(null);
        setIsFailureModalOpen(true);
        break;
    }
  };

  // Deep Link navigation from alerts
  const handleOpenAlertEntity = (type: Alert['relatedEntityType'], entityId?: string) => {
    switch (type) {
      case 'compressor':
        if (entityId) {
          const comp = compressors.find((c) => c.id === entityId);
          if (comp) {
            setSelectedCompressor(comp);
            setCurrentView('compressors');
          }
        } else {
          setCurrentView('compressors');
        }
        break;
      case 'maintenance':
        setCurrentView('maintenance');
        break;
      case 'order':
        if (entityId) {
          const ord = workOrders.find((o) => o.id === entityId);
          if (ord) setSelectedWorkOrder(ord);
        }
        setCurrentView('orders');
        break;
      case 'inspection':
        if (entityId) {
          const ins = inspections.find((i) => i.id === entityId);
          if (ins) setSelectedInspection(ins);
        }
        setCurrentView('inspections');
        break;
      case 'failure':
        setCurrentView('failures');
        break;
      default:
        setCurrentView('dashboard');
    }
  };

  // Save Compressor
  const handleSaveCompressor = async (comp: Compressor) => {
    const db = await getDB();
    await db.put('compressors', comp);
    await logAuditAction(
      currentUser?.username || 'admin',
      compressors.some((c) => c.id === comp.id) ? 'update' : 'create',
      'compressors',
      `Compresor guardado: ${comp.code} (${comp.name})`,
      comp.id
    );
    await syncMaintenanceAlerts();
    await reloadData();
  };

  // Deactivate Compressor (logical deletion)
  const handleDeactivateCompressor = async (comp: Compressor) => {
    if (confirm(`¿Está seguro de desactivar el compresor ${comp.code}? Se conservará todo su historial inalterable.`)) {
      const db = await getDB();
      const updated = {...comp, status: 'out_of_service' as const, deletedAt: new Date().toISOString()};
      await db.put('compressors', updated);
      await logAuditAction(
        currentUser?.username || 'admin',
        'deactivate',
        'compressors',
        `Compresor desactivado: ${comp.code}`,
        comp.id
      );
      if (selectedCompressor?.id === comp.id) setSelectedCompressor(null);
      await reloadData();
    }
  };

  // Save Hour Meter Reading & recalculate
  const handleSaveHourMeterReading = async (
    reading: HourMeterReading,
    updatedCompressorHours: number
  ) => {
    const db = await getDB();
    await db.put('hourMeterReadings', reading);

    // Update compressor currentHours
    const comp = compressors.find((c) => c.id === reading.compressorId);
    if (comp) {
      const updatedComp: Compressor = {
        ...comp,
        currentHours: updatedCompressorHours,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.username || 'tecnico',
      };
      await db.put('compressors', updatedComp);
    }

    await logAuditAction(
      currentUser?.username || 'tecnico',
      'meter_reading',
      'hourmeters',
      `Horómetro registrado: ${reading.currentHours} hrs (+${reading.diffHours} hrs) para equipo ${comp?.code}`,
      reading.id
    );

    await syncMaintenanceAlerts();
    await reloadData();
  };

  // Save Maintenance Activity
  const handleSaveActivity = async (activity: MaintenanceActivity) => {
    const db = await getDB();
    await db.put('maintenanceActivities', activity);
    await logAuditAction(
      currentUser?.username || 'admin',
      maintenanceActivities.some((a) => a.id === activity.id) ? 'update' : 'create',
      'maintenance',
      `Actividad de mantenimiento guardada: ${activity.name} (${activity.code})`,
      activity.id
    );
    await syncMaintenanceAlerts();
    await reloadData();
  };

  // Save Work Order
  const handleSaveWorkOrder = async (order: WorkOrder) => {
    const db = await getDB();
    await db.put('workOrders', order);
    await logAuditAction(
      currentUser?.username || 'usuario',
      workOrders.some((o) => o.id === order.id) ? 'update' : 'create',
      'orders',
      `Orden de trabajo guardada: ${order.folio}`,
      order.id
    );
    await reloadData();
  };

  // Update Work Order Status and close preventive
  const handleUpdateOrderStatus = async (
    updatedOrder: WorkOrder,
    isClosingPreventive: boolean,
    preventiveExecutionData?: {lastServiceHours: number; lastServiceDate: string}
  ) => {
    const db = await getDB();
    await db.put('workOrders', updatedOrder);

    // If preventive order is closed -> update the maintenance activity last service hours & date!
    if (isClosingPreventive && updatedOrder.activityId && preventiveExecutionData) {
      const act = maintenanceActivities.find((a) => a.id === updatedOrder.activityId);
      if (act) {
        const updatedAct: MaintenanceActivity = {
          ...act,
          lastServiceHours: preventiveExecutionData.lastServiceHours,
          lastServiceDate: preventiveExecutionData.lastServiceDate,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.username || 'tecnico',
        };
        await db.put('maintenanceActivities', updatedAct);

        await logAuditAction(
          currentUser?.username || 'tecnico',
          'close',
          'maintenance',
          `Plan preventivo reiniciado: ${act.name} tras cierre de OT ${updatedOrder.folio}`,
          act.id
        );
      }
    }

    await logAuditAction(
      currentUser?.username || 'usuario',
      updatedOrder.status === 'closed' ? 'close' : 'update',
      'orders',
      `Orden ${updatedOrder.folio} actualizada a estado: ${updatedOrder.status}`,
      updatedOrder.id
    );

    await syncMaintenanceAlerts();
    await reloadData();
    if (selectedWorkOrder?.id === updatedOrder.id) {
      setSelectedWorkOrder(updatedOrder);
    }
  };

  // Save Inspection & auto-create alerts for findings
  const handleSaveInspection = async (inspection: Inspection) => {
    const db = await getDB();
    await db.put('inspections', inspection);

    const comp = compressors.find((c) => c.id === inspection.compressorId);

    // Auto-create alerts for failed items
    for (const it of inspection.items) {
      if (it.result === 'fail') {
        const findingAlert: Alert = {
          id: `al-ins-find-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          compressorId: inspection.compressorId,
          type: 'inspection_finding',
          level: it.priority === 'critical' ? 'critical' : it.priority === 'high' ? 'important' : 'warning',
          title: `Hallazgo en Inspección: ${comp?.code || ''}`,
          description: `Punto: ${it.label}. Observación: ${it.observation || 'Anomalía detectada'}`,
          date: inspection.date,
          status: 'new',
          relatedEntityType: 'inspection',
          relatedEntityId: inspection.id,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: currentUser?.username || 'tecnico',
          updatedBy: currentUser?.username || 'tecnico',
          schemaVersion: 1,
        };
        await db.put('alerts', findingAlert);
      }
    }

    await logAuditAction(
      currentUser?.username || 'tecnico',
      'create',
      'inspections',
      `Inspección técnica guardada: ${inspection.inspectionNumber} (${inspection.compliancePercentage}% cumplimiento)`,
      inspection.id
    );

    await reloadData();
  };

  // Save Failure & auto-create critical alert
  const handleSaveFailure = async (failure: Failure) => {
    const db = await getDB();
    await db.put('failures', failure);

    const comp = compressors.find((c) => c.id === failure.compressorId);

    // Auto-create critical alert if machine stopped
    if (failure.isMachineStopped) {
      const failureAlert: Alert = {
        id: `al-fail-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        compressorId: failure.compressorId,
        type: 'critical_failure',
        level: 'critical',
        title: `Falla con Paro de Equipo: ${comp?.code || ''}`,
        description: `Compresor detenido por falla (${failure.folio}): ${failure.symptom}. Alarma: ${failure.alarmCode || 'S/N'}`,
        date: failure.occurredAt.split('T')[0],
        status: 'new',
        relatedEntityType: 'failure',
        relatedEntityId: failure.id,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser?.username || 'tecnico',
        updatedBy: currentUser?.username || 'tecnico',
        schemaVersion: 1,
      };
      await db.put('alerts', failureAlert);
    }

    await logAuditAction(
      currentUser?.username || 'tecnico',
      failures.some((f) => f.id === failure.id) ? 'update' : 'create',
      'failures',
      `Falla registrada: ${failure.folio} (${failure.symptom})`,
      failure.id
    );

    await reloadData();
  };

  // Update alert status
  const handleUpdateAlertStatus = async (alertId: string, status: AlertStatus) => {
    const db = await getDB();
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) {
      const updated = {...alert, status, updatedAt: new Date().toISOString()};
      await db.put('alerts', updated);
      await reloadData();
    }
  };

  // Create Order from Activity
  const handleCreateOrderFromActivity = (activity: MaintenanceActivity, comp: Compressor) => {
    setOrderToEdit(null);
    setPreselectedOrderData({
      compressorId: comp.id,
      activityId: activity.id,
      originType: 'preventive',
      originId: activity.id,
      title: `Servicio Preventivo: ${activity.name}`,
      priority: 'high',
    });
    setIsWorkOrderFormOpen(true);
  };

  // Create Order from Inspection Finding
  const handleCreateOrderFromFinding = (item: InspectionItem, inspection: Inspection) => {
    setOrderToEdit(null);
    setPreselectedOrderData({
      compressorId: inspection.compressorId,
      originType: 'inspection',
      originId: inspection.id,
      title: `Corrección de Hallazgo: ${item.label}`,
      priority: item.priority || 'high',
    });
    setIsWorkOrderFormOpen(true);
  };

  // Create Order from Failure
  const handleCreateOrderFromFailure = (failure: Failure, comp: Compressor) => {
    setOrderToEdit(null);
    setPreselectedOrderData({
      compressorId: comp.id,
      originType: 'failure',
      originId: failure.id,
      title: `Reparación de Falla: ${failure.symptom}`,
      priority: failure.priority,
    });
    setIsWorkOrderFormOpen(true);
  };

  // Save Settings
  const handleSaveSettings = async (newSettings: AppSettings) => {
    const db = await getDB();
    await db.put('appSettings', newSettings);
    setSettings(newSettings);
    await reloadData();
  };

  // Render view router
  const renderCurrentView = () => {
    // If inside compressor detail
    if (currentView === 'compressors' && selectedCompressor) {
      const compCalcs = calculations.filter((c) => c.compressorId === selectedCompressor.id);
      const compReadings = hourMeterReadings.filter((r) => r.compressorId === selectedCompressor.id);
      const compOrders = workOrders.filter((w) => w.compressorId === selectedCompressor.id);
      const compInspections = inspections.filter((i) => i.compressorId === selectedCompressor.id);
      const compFailures = failures.filter((f) => f.compressorId === selectedCompressor.id);

      return (
        <CompressorDetailView
          compressor={selectedCompressor}
          calculations={compCalcs}
          readings={compReadings}
          workOrders={compOrders}
          inspections={compInspections}
          failures={compFailures}
          settings={settings}
          userName={currentUser?.fullName || 'Usuario'}
          onBack={() => setSelectedCompressor(null)}
          onEdit={() => {
            setCompressorToEdit(selectedCompressor);
            setIsCompressorFormOpen(true);
          }}
          onCaptureMeter={() => {
            setPreselectedMeterCompId(selectedCompressor.id);
            setIsHourMeterModalOpen(true);
          }}
          onNewOrder={() => {
            setOrderToEdit(null);
            setPreselectedOrderData({compressorId: selectedCompressor.id});
            setIsWorkOrderFormOpen(true);
          }}
          onNewInspection={() => {
            setIsInspectionModalOpen(true);
          }}
          onReportFailure={() => {
            setFailureToEdit(null);
            setIsFailureModalOpen(true);
          }}
        />
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            compressors={compressors}
            calculations={calculations}
            workOrders={workOrders}
            failures={failures}
            inspections={inspections}
            alerts={alerts}
            onNavigate={(view) => {
              setSelectedCompressor(null);
              setCurrentView(view);
            }}
            onOpenQuickActions={() => setIsQuickActionsOpen(true)}
          />
        );

      case 'compressors':
        return (
          <CompressorListView
            compressors={compressors}
            onSelectCompressor={(c) => setSelectedCompressor(c)}
            onNewCompressor={() => {
              setCompressorToEdit(null);
              setIsCompressorFormOpen(true);
            }}
            onEditCompressor={(c) => {
              setCompressorToEdit(c);
              setIsCompressorFormOpen(true);
            }}
            onDeactivateCompressor={handleDeactivateCompressor}
            onCaptureMeter={(c) => {
              setPreselectedMeterCompId(c.id);
              setIsHourMeterModalOpen(true);
            }}
          />
        );

      case 'hourmeters':
        return (
          <HourMeterListView
            readings={hourMeterReadings}
            compressors={compressors}
            onOpenCaptureModal={() => {
              setPreselectedMeterCompId(undefined);
              setIsHourMeterModalOpen(true);
            }}
          />
        );

      case 'maintenance':
        return (
          <MaintenancePlansView
            calculations={calculations}
            activities={maintenanceActivities}
            compressors={compressors}
            onNewActivity={() => {
              setActivityToEdit(null);
              setIsMaintenanceFormOpen(true);
            }}
            onEditActivity={(act) => {
              setActivityToEdit(act);
              setIsMaintenanceFormOpen(true);
            }}
            onCreateOrderFromActivity={handleCreateOrderFromActivity}
          />
        );

      case 'orders':
        return (
          <WorkOrdersView
            orders={workOrders}
            compressors={compressors}
            onSelectOrder={(ord) => setSelectedWorkOrder(ord)}
            onNewOrder={() => {
              setOrderToEdit(null);
              setPreselectedOrderData(undefined);
              setIsWorkOrderFormOpen(true);
            }}
          />
        );

      case 'inspections':
        return (
          <InspectionsView
            inspections={inspections}
            compressors={compressors}
            onSelectInspection={(ins) => setSelectedInspection(ins)}
            onNewInspection={() => setIsInspectionModalOpen(true)}
          />
        );

      case 'failures':
        return (
          <FailuresView
            failures={failures}
            compressors={compressors}
            onNewFailure={() => {
              setFailureToEdit(null);
              setIsFailureModalOpen(true);
            }}
            onEditFailure={(fail) => {
              setFailureToEdit(fail);
              setIsFailureModalOpen(true);
            }}
            onCreateOrderFromFailure={handleCreateOrderFromFailure}
          />
        );

      case 'alerts':
        return (
          <AlertsView
            alerts={alerts}
            onOpenEntity={handleOpenAlertEntity}
            onUpdateAlertStatus={handleUpdateAlertStatus}
          />
        );

      case 'reports':
        return (
          <ReportsView
            compressors={compressors}
            calculations={calculations}
            readings={hourMeterReadings}
            workOrders={workOrders}
            inspections={inspections}
            failures={failures}
            settings={settings}
            userName={currentUser?.fullName || 'Usuario'}
          />
        );

      case 'settings':
        return (
          <SettingsView
            settings={settings}
            currentUser={currentUser!}
            onSaveSettings={handleSaveSettings}
            onOpenAuditLog={() => setIsAuditModalOpen(true)}
            onDataResetOrRestored={reloadData}
          />
        );

      default:
        return null;
    }
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-3">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold tracking-wide">Cargando AIRMAINT 360 MVP...</span>
        <span className="text-xs text-slate-400">Verificando base de datos IndexedDB local</span>
      </div>
    );
  }

  // If not logged in -> Show Login Modal
  if (!currentUser) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  // If locked -> Show Lock Screen
  if (isLocked) {
    return (
      <LockScreen
        user={currentUser}
        onUnlocked={() => setIsLocked(false)}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-100 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          setSelectedCompressor(null);
          setCurrentView(view);
        }}
        unreadAlertsCount={unreadAlertsCount}
        userRole={currentUser.role}
        onOpenQuickActions={() => setIsQuickActionsOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          currentUser={currentUser}
          settings={settings}
          unreadAlertsCount={unreadAlertsCount}
          onOpenAlerts={() => {
            setSelectedCompressor(null);
            setCurrentView('alerts');
          }}
          onLockApp={handleManualLock}
          onLogout={handleLogout}
          onOpenQuickActions={() => setIsQuickActionsOpen(true)}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderCurrentView()}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav
          currentView={currentView}
          onNavigate={(view) => {
            setSelectedCompressor(null);
            setCurrentView(view);
          }}
          unreadAlertsCount={unreadAlertsCount}
          onOpenQuickActions={() => setIsQuickActionsOpen(true)}
        />
      </div>

      {/* Non-intrusive Offline Notification Badge */}
      <OfflineIndicator />

      {/* Quick Actions Floating Modal */}
      <QuickActionsModal
        isOpen={isQuickActionsOpen}
        onClose={() => setIsQuickActionsOpen(false)}
        onAction={handleQuickAction}
      />

      {/* Compressor Create / Edit Modal */}
      <CompressorFormModal
        isOpen={isCompressorFormOpen}
        compressorToEdit={compressorToEdit}
        existingCodes={compressors.map((c) => c.code)}
        settings={settings}
        onClose={() => {
          setIsCompressorFormOpen(false);
          setCompressorToEdit(null);
        }}
        onSave={handleSaveCompressor}
      />

      {/* Hour Meter Capture Modal */}
      <HourMeterCaptureModal
        isOpen={isHourMeterModalOpen}
        compressors={compressors}
        preselectedCompressorId={preselectedMeterCompId}
        currentUser={currentUser.fullName}
        onClose={() => {
          setIsHourMeterModalOpen(false);
          setPreselectedMeterCompId(undefined);
        }}
        onSaveReading={handleSaveHourMeterReading}
      />

      {/* Maintenance Activity Modal */}
      <MaintenanceFormModal
        isOpen={isMaintenanceFormOpen}
        compressors={compressors}
        preselectedCompressorId={selectedCompressor?.id}
        activityToEdit={activityToEdit}
        onClose={() => {
          setIsMaintenanceFormOpen(false);
          setActivityToEdit(null);
        }}
        onSave={handleSaveActivity}
      />

      {/* Work Order Form Modal */}
      <WorkOrderFormModal
        isOpen={isWorkOrderFormOpen}
        compressors={compressors}
        activities={maintenanceActivities}
        orderToEdit={orderToEdit}
        preselectedData={preselectedOrderData}
        settings={settings}
        existingFolios={workOrders.map((o) => o.folio)}
        currentUser={currentUser.fullName}
        onClose={() => {
          setIsWorkOrderFormOpen(false);
          setOrderToEdit(null);
          setPreselectedOrderData(undefined);
        }}
        onSave={handleSaveWorkOrder}
      />

      {/* Work Order Detail & Execution Modal */}
      {selectedWorkOrder && (
        <WorkOrderDetailModal
          isOpen={true}
          order={selectedWorkOrder}
          compressor={compressors.find((c) => c.id === selectedWorkOrder.compressorId)}
          activity={maintenanceActivities.find((a) => a.id === selectedWorkOrder.activityId)}
          currentUser={currentUser.fullName}
          onClose={() => setSelectedWorkOrder(null)}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      )}

      {/* Inspection Execution Checklist Modal */}
      <InspectionExecutionModal
        isOpen={isInspectionModalOpen}
        compressors={compressors}
        preselectedCompressorId={selectedCompressor?.id}
        currentUser={currentUser.fullName}
        existingInspectionsCount={inspections.length}
        onClose={() => setIsInspectionModalOpen(false)}
        onSaveInspection={handleSaveInspection}
      />

      {/* Inspection Detail Modal */}
      {selectedInspection && (
        <InspectionDetailModal
          isOpen={true}
          inspection={selectedInspection}
          compressor={compressors.find((c) => c.id === selectedInspection.compressorId)}
          onClose={() => setSelectedInspection(null)}
          onCreateOrderFromFinding={handleCreateOrderFromFinding}
        />
      )}

      {/* Failure Form Modal */}
      <FailureFormModal
        isOpen={isFailureModalOpen}
        compressors={compressors}
        preselectedCompressorId={selectedCompressor?.id}
        failureToEdit={failureToEdit}
        existingFailuresCount={failures.length}
        currentUser={currentUser.fullName}
        onClose={() => {
          setIsFailureModalOpen(false);
          setFailureToEdit(null);
        }}
        onSave={handleSaveFailure}
      />

      {/* Audit Log Modal */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        logs={auditLogs}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
}
