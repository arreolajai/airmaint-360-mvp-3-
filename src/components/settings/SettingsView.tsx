import React, {useState, useRef} from 'react';
import {
  Settings,
  Download,
  Upload,
  Database,
  FileSpreadsheet,
  Trash2,
  RefreshCcw,
  Shield,
  KeyRound,
  CheckCircle,
  AlertTriangle,
  Building,
  Check,
  FolderDown,
  GitBranch,
} from 'lucide-react';
import type {AppSettings, BackupData, User} from '../../types';
import {
  createFullBackup,
  restoreBackup,
  clearDemoData,
  resetDatabaseToFactory,
} from '../../db/indexedDb';
import {logAuditAction} from '../../services/auditService';
import {changeUserPassword} from '../../services/authService';
import {exportToCSV} from '../../services/csvService';
import {downloadProjectZip} from '../../services/zipService';
import {ConfirmModal} from '../common/ConfirmModal';

interface SettingsViewProps {
  settings: AppSettings | null;
  currentUser: User;
  onSaveSettings: (settings: AppSettings) => Promise<void>;
  onOpenAuditLog: () => void;
  onDataResetOrRestored: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  currentUser,
  onSaveSettings,
  onOpenAuditLog,
  onDataResetOrRestored,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Settings form states
  const [companyName, setCompanyName] = useState(settings?.companyName || '');
  const [plantName, setPlantName] = useState(settings?.plantName || '');
  const [confidentialityNotice, setConfidentialityNotice] = useState(
    settings?.confidentialityNotice || ''
  );
  const [buildingsText, setBuildingsText] = useState(settings?.buildingsList.join(', ') || '');
  const [areasText, setAreasText] = useState(settings?.areasList.join(', ') || '');
  const [normalPercent, setNormalPercent] = useState(settings?.trafficLightNormalPercent ?? 20);
  const [upcomingPercent, setUpcomingPercent] = useState(
    settings?.trafficLightUpcomingPercent ?? 10
  );
  const [autoLockMinutes, setAutoLockMinutes] = useState(settings?.autoLockMinutes ?? 10);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [operationMsg, setOperationMsg] = useState<{type: 'success' | 'error'; text: string} | null>(
    null
  );

  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{type: 'success' | 'error'; text: string} | null>(null);

  // Restore inspection preview modal state
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  // Clear demo confirmation modal state
  const [showClearDemoConfirm, setShowClearDemoConfirm] = useState(false);

  // Factory reset modal state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [adminPasswordForReset, setAdminPasswordForReset] = useState('');

  // 1. Save Settings Form
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppSettings = {
      id: settings?.id || 'default_settings',
      companyName: companyName.trim(),
      plantName: plantName.trim(),
      confidentialityNotice: confidentialityNotice.trim(),
      dateFormat: 'YYYY-MM-DD',
      buildingsList: buildingsText.split(',').map((s) => s.trim()).filter(Boolean),
      areasList: areasText.split(',').map((s) => s.trim()).filter(Boolean),
      trafficLightNormalPercent: Number(normalPercent),
      trafficLightUpcomingPercent: Number(upcomingPercent),
      trafficLightSchedulePercent: 0,
      maxDaysWithoutBackup: 7,
      maxDaysBetweenHourMeters: 3,
      initialWorkOrderFolio: settings?.initialWorkOrderFolio ?? 100,
      theme: 'light',
      autoLockMinutes: Number(autoLockMinutes),
      schemaVersion: 1,
    };

    await onSaveSettings(updated);
    await logAuditAction(currentUser.username, 'update', 'settings', 'Parámetros de configuración actualizados.');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // 2. Export JSON Backup
  const handleExportBackup = async () => {
    try {
      const backup = await createFullBackup();
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AIRMAINT360_RESPALDO_${new Date().toISOString().split('T')[0]}_${backup.backupId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await logAuditAction(
        currentUser.username,
        'backup',
        'backup',
        `Respaldo JSON generado exitosamente (${backup.backupId}).`
      );

      setOperationMsg({
        type: 'success',
        text: `Respaldo ${backup.backupId} exportado correctamente con suma de verificación (checksum) SHA-256.`,
      });
    } catch (err) {
      setOperationMsg({type: 'error', text: 'Error al generar el archivo de respaldo.'});
    }
  };

  // 3. Select JSON File to Restore
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as BackupData;

        if (!parsed.backupId || !parsed.data || !parsed.checksum) {
          setOperationMsg({
            type: 'error',
            text: 'El archivo seleccionado no es un respaldo válido de AIRMAINT 360.',
          });
          return;
        }

        setPendingBackup(parsed);
        setShowRestoreConfirm(true);
      } catch (err) {
        setOperationMsg({
          type: 'error',
          text: 'Error al leer el archivo JSON. Formato corrupto o inválido.',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 4. Confirm Restore
  const executeRestore = async () => {
    if (!pendingBackup) return;
    try {
      // Create automatic pre-restore backup first
      await createFullBackup();

      const result = await restoreBackup(pendingBackup);
      if (result.success) {
        await logAuditAction(
          currentUser.username,
          'restore',
          'backup',
          `Restauración efectuada desde respaldo ${pendingBackup.backupId}.`
        );
        setShowRestoreConfirm(false);
        setPendingBackup(null);
        setOperationMsg({
          type: 'success',
          text: `Restauración exitosa. ${JSON.stringify(result.counts || {})}`,
        });
        await onDataResetOrRestored();
      } else {
        setOperationMsg({type: 'error', text: result.message});
      }
    } catch (err) {
      setOperationMsg({type: 'error', text: 'Ocurrió un error inesperado al restaurar los datos.'});
    }
  };

  // 5. Clear Demo Data
  const handleClearDemo = async () => {
    try {
      await clearDemoData();
      await logAuditAction(
        currentUser.username,
        'deactivate',
        'settings',
        'Eliminación de datos de demostración.'
      );
      setShowClearDemoConfirm(false);
      setOperationMsg({type: 'success', text: 'Datos de demostración eliminados del sistema.'});
      await onDataResetOrRestored();
    } catch (err) {
      setOperationMsg({type: 'error', text: 'Error al eliminar datos de demostración.'});
    }
  };

  // 6. Reset to Factory
  const handleFactoryReset = async () => {
    try {
      await createFullBackup(); // Automatic security backup
      await resetDatabaseToFactory();
      await logAuditAction(
        currentUser.username,
        'restore',
        'settings',
        'Restablecimiento de fábrica de la aplicación.'
      );
      setShowResetConfirm(false);
      setOperationMsg({
        type: 'success',
        text: 'La base de datos ha sido restablecida al estado de fábrica inicial.',
      });
      await onDataResetOrRestored();
    } catch (err) {
      setOperationMsg({type: 'error', text: 'Error al restablecer la aplicación.'});
    }
  };

  // 7. Password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (newPassword !== confirmPassword) {
      setPwdMsg({type: 'error', text: 'La nueva contraseña y su confirmación no coinciden.'});
      return;
    }

    if (newPassword.length < 6) {
      setPwdMsg({type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.'});
      return;
    }

    const res = await changeUserPassword(currentUser.id, oldPassword, newPassword);
    if (res.success) {
      setPwdMsg({type: 'success', text: res.message});
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPwdMsg({type: 'error', text: res.message});
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Configuración y Administración del Sistema
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Parámetros de planta, seguridad, respaldos JSON y bitácora de auditoría
        </p>
      </div>

      {operationMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
            operationMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {operationMsg.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{operationMsg.text}</span>
          </div>
          <button onClick={() => setOperationMsg(null)} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      {/* Grid: Settings form & Backup module */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={handleSaveSettings}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Building className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Parámetros de Empresa y Planta</h3>
              </div>
              {saveSuccess && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                  <Check className="w-4 h-4" /> Guardado
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block">Nombre de la Empresa</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block">Nombre de la Planta</label>
                <input
                  type="text"
                  required
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="font-bold text-slate-700 block">Texto de Confidencialidad en Reportes</label>
              <input
                type="text"
                value={confidentialityNotice}
                onChange={(e) => setConfidentialityNotice(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block">Naves / Edificios (Separados por coma)</label>
                <input
                  type="text"
                  value={buildingsText}
                  onChange={(e) => setBuildingsText(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block">Áreas de Planta (Separadas por coma)</label>
                <input
                  type="text"
                  value={areasText}
                  onChange={(e) => setAreasText(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Traffic Light Thresholds */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <span className="font-bold text-slate-800 block">Umbrales del Semáforo de Mantenimiento</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-600 block">Límite Normal (% restante)</label>
                  <input
                    type="number"
                    min="15"
                    max="50"
                    value={normalPercent}
                    onChange={(e) => setNormalPercent(Number(e.target.value))}
                    className="w-full mt-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">&gt; {normalPercent}% disponible</span>
                </div>
                <div>
                  <label className="text-slate-600 block">Límite Próximo (% restante)</label>
                  <input
                    type="number"
                    min="5"
                    max="20"
                    value={upcomingPercent}
                    onChange={(e) => setUpcomingPercent(Number(e.target.value))}
                    className="w-full mt-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">10% - {upcomingPercent}% disponible</span>
                </div>
                <div>
                  <label className="text-slate-600 block">Bloqueo Inactividad (Min)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={autoLockMinutes}
                    onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                    className="w-full mt-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Defecto: 10 minutos</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
              >
                Guardar Configuración
              </button>
            </div>
          </form>

          {/* Change Password Form */}
          <form
            onSubmit={handleChangePassword}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <KeyRound className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Cambio de Contraseña Local ({currentUser.username})
              </h3>
            </div>

            {pwdMsg && (
              <div
                className={`p-2.5 rounded-lg text-xs ${
                  pwdMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {pwdMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block">Contraseña Actual *</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block">Nueva Contraseña *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block">Confirmar Contraseña *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition"
              >
                Actualizar Contraseña
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Respaldo y Recuperación (Section 16) */}
        <div className="space-y-6">
          {/* Card: Descargar Código Fuente para GitHub */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-5 shadow-md space-y-3.5 border border-slate-800">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-blue-600/30 text-sky-400 border border-blue-500/30">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Publicar en GitHub</h3>
                <p className="text-[11px] text-slate-300">Descarga del proyecto completo empaquetado</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Descarga el archivo <strong>.ZIP</strong> con todos los componentes, configuraciones, iconos PWA y documentación para subirlo a tu cuenta de GitHub.
            </p>

            <button
              onClick={async () => {
                const res = await downloadProjectZip();
                if (res.success) {
                  setOperationMsg({
                    type: 'success',
                    text: res.message || 'Archivo ZIP generado y descargado correctamente.',
                  });
                } else {
                  setOperationMsg({
                    type: 'error',
                    text: res.message || 'Error al descargar archivo comprimido.',
                  });
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98]"
            >
              <FolderDown className="w-4 h-4" />
              <span>Descargar Proyecto (.ZIP Verificado)</span>
            </button>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-300 space-y-1">
              <div className="text-slate-400 font-sans font-bold">Comandos para tu terminal local:</div>
              <div className="text-sky-300">git remote add origin https://github.com/TU_USER/repo.git</div>
              <div className="text-sky-300">git branch -M main</div>
              <div className="text-sky-300">git push -u origin main</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Respaldo y Recuperación</h3>
                <p className="text-[11px] text-slate-400">Protección integral de base de datos local</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* 1. Export JSON */}
              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Respaldo JSON Completo</span>
              </button>

              {/* 2. Import JSON */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl border border-blue-600 text-blue-700 hover:bg-blue-50 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Upload className="w-4 h-4" />
                <span>Importar y Restaurar Respaldo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelected}
                className="hidden"
              />

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-500 space-y-1">
                <span className="font-bold text-slate-700 block">Garantía de Seguridad:</span>
                <p>
                  • Validación estricta de estructura y suma de verificación SHA-256.
                  <br />
                  • Generación de respaldo preventivo antes de sobrescribir.
                </p>
              </div>

              {/* Auditoría Button */}
              <button
                onClick={onOpenAuditLog}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Consultar Bitácora de Auditoría</span>
              </button>
            </div>
          </div>

          {/* Destructive / Maintenance Operations */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Operaciones de Limpieza y Mantenimiento
            </h4>

            {/* Clear Demo Data */}
            <button
              onClick={() => setShowClearDemoConfirm(true)}
              className="w-full py-2 px-3 rounded-xl border border-amber-300 hover:bg-amber-50 text-amber-800 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <Trash2 className="w-4 h-4 text-amber-600" />
              <span>Borrar Datos de Demostración</span>
            </button>

            {/* Factory Reset */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2 px-3 rounded-xl border border-red-300 hover:bg-red-50 text-red-700 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <RefreshCcw className="w-4 h-4 text-red-600" />
              <span>Restablecer Aplicación a Cero</span>
            </button>
          </div>
        </div>
      </div>

      {/* Restore Preview and Confirmation Modal */}
      {showRestoreConfirm && pendingBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirmar Restauración de Respaldo</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Se reemplazará la información actual por el contenido del archivo de respaldo.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">ID del Respaldo:</span>
                <strong className="font-mono">{pendingBackup.backupId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha de Creación:</span>
                <span>{new Date(pendingBackup.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Compresores a restaurar:</span>
                <strong>{pendingBackup.data.compressors?.length || 0}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lecturas de Horómetro:</span>
                <strong>{pendingBackup.data.hourMeterReadings?.length || 0}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Órdenes de Trabajo:</span>
                <strong>{pendingBackup.data.workOrders?.length || 0}</strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              * Se generará un respaldo de seguridad automático antes de sobreescribir los datos.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowRestoreConfirm(false);
                  setPendingBackup(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={executeRestore}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
              >
                Confirmar y Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Demo Confirmation */}
      <ConfirmModal
        isOpen={showClearDemoConfirm}
        title="Borrar Datos de Demostración"
        message="¿Está seguro de eliminar los 3 compresores de prueba y sus historiales de ejemplo? Esta acción no se puede deshacer."
        confirmText="Sí, Borrar Datos Demo"
        isDestructive={true}
        onConfirm={handleClearDemo}
        onCancel={() => setShowClearDemoConfirm(false)}
      />

      {/* Factory Reset Modal with typed confirmation */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Restablecer Aplicación de Fábrica"
        message="Esta acción vaciará por completo la base de datos local y reinstalará el esquema base con los usuarios iniciales. Se guardará un respaldo previo en archivo descargable."
        confirmText="Restablecer Aplicación"
        isDestructive={true}
        requiresTypedConfirmation="RESTABLECER"
        onConfirm={handleFactoryReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
