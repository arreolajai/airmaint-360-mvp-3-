import React, {useState, useEffect} from 'react';
import {X, CalendarClock, AlertCircle, Sparkles} from 'lucide-react';
import type {
  Compressor,
  MaintenanceActivity,
  MaintenanceType,
} from '../../types';

interface MaintenanceFormModalProps {
  isOpen: boolean;
  compressors: Compressor[];
  preselectedCompressorId?: string;
  activityToEdit: MaintenanceActivity | null;
  onClose: () => void;
  onSave: (activity: MaintenanceActivity) => Promise<void>;
}

export const MaintenanceFormModal: React.FC<MaintenanceFormModalProps> = ({
  isOpen,
  compressors,
  preselectedCompressorId,
  activityToEdit,
  onClose,
  onSave,
}) => {
  const activeCompressors = compressors.filter((c) => !c.deletedAt);

  const [compressorId, setCompressorId] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>('preventive');
  const [intervalHours, setIntervalHours] = useState<number>(2000);
  const [intervalDays, setIntervalDays] = useState<string>('180');
  const [lastServiceHours, setLastServiceHours] = useState<number>(0);
  const [lastServiceDate, setLastServiceDate] = useState<string>('');
  const [estimatedDurationHours, setEstimatedDurationHours] = useState<number>(2);
  const [assignedRole, setAssignedRole] = useState<string>('Técnico Mecánico');
  const [instructions, setInstructions] = useState<string>('');
  const [photoRequired, setPhotoRequired] = useState<boolean>(true);

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activityToEdit) {
      setCompressorId(activityToEdit.compressorId);
      setCode(activityToEdit.code);
      setName(activityToEdit.name);
      setDescription(activityToEdit.description);
      setMaintenanceType(activityToEdit.maintenanceType);
      setIntervalHours(activityToEdit.intervalHours);
      setIntervalDays(activityToEdit.intervalDays ? String(activityToEdit.intervalDays) : '');
      setLastServiceHours(activityToEdit.lastServiceHours);
      setLastServiceDate(activityToEdit.lastServiceDate);
      setEstimatedDurationHours(activityToEdit.estimatedDurationHours);
      setAssignedRole(activityToEdit.assignedRole);
      setInstructions(activityToEdit.instructions || '');
      setPhotoRequired(activityToEdit.photoRequired);
    } else {
      const selectedId = preselectedCompressorId || (activeCompressors[0]?.id ?? '');
      setCompressorId(selectedId);
      setCode(`PM-${Math.floor(100 + Math.random() * 900)}`);
      setName('');
      setDescription('');
      setMaintenanceType('preventive');
      setIntervalHours(2000);
      setIntervalDays('180');
      const comp = activeCompressors.find((c) => c.id === selectedId);
      setLastServiceHours(comp?.initialHours ?? 0);
      setLastServiceDate(new Date().toISOString().split('T')[0]);
      setEstimatedDurationHours(2);
      setAssignedRole('Técnico Mecánico');
      setInstructions('');
      setPhotoRequired(true);
    }
    setErrors([]);
  }, [activityToEdit, isOpen, preselectedCompressorId]);

  if (!isOpen) return null;

  // Preset quick templates
  const presets = [
    {name: 'Cambio de filtro de aire', interval: 2000, days: 180, duration: 1.5, type: 'preventive' as const},
    {name: 'Cambio de filtro de aceite', interval: 4000, days: 180, duration: 1.0, type: 'preventive' as const},
    {name: 'Cambio de aceite y separador', interval: 4000, days: 360, duration: 4.0, type: 'preventive' as const},
    {name: 'Análisis de aceite y espectrometría', interval: 2000, days: 90, duration: 0.5, type: 'predictive' as const},
    {name: 'Lubricación de rodamientos de motor', interval: 2000, days: 90, duration: 0.5, type: 'preventive' as const},
    {name: 'Limpieza de radiadores y enfriadores', interval: 1000, days: 60, duration: 2.0, type: 'preventive' as const},
    {name: 'Revisión y torque de válvula check', interval: 4000, days: 360, duration: 3.0, type: 'preventive' as const},
    {name: 'Medición de aislamiento de motor (Megger)', interval: 8000, days: 365, duration: 2.0, type: 'predictive' as const},
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setName(preset.name);
    setIntervalHours(preset.interval);
    setIntervalDays(String(preset.days));
    setEstimatedDurationHours(preset.duration);
    setMaintenanceType(preset.type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: string[] = [];

    if (!compressorId) validationErrors.push('Debe seleccionar un compresor.');
    if (!code.trim()) validationErrors.push('El código de la actividad es obligatorio.');
    if (!name.trim()) validationErrors.push('El nombre de la actividad es obligatorio.');
    if (intervalHours <= 0) validationErrors.push('El intervalo en horas debe ser mayor a 0.');
    if (lastServiceHours < 0) validationErrors.push('El horómetro del último servicio no puede ser negativo.');

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const activity: MaintenanceActivity = {
        id: activityToEdit?.id || `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        compressorId,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim(),
        maintenanceType,
        intervalHours: Number(intervalHours),
        intervalDays: intervalDays ? Number(intervalDays) : undefined,
        lastServiceHours: Number(lastServiceHours),
        lastServiceDate: lastServiceDate || now.split('T')[0],
        estimatedDurationHours: Number(estimatedDurationHours),
        assignedRole: assignedRole.trim(),
        instructions: instructions.trim(),
        photoRequired,
        isActive: true,
        createdAt: activityToEdit?.createdAt || now,
        updatedAt: now,
        createdBy: activityToEdit?.createdBy || 'usuario',
        updatedBy: 'usuario',
        schemaVersion: 1,
      };

      await onSave(activity);
      onClose();
    } catch (err) {
      setErrors(['Error al guardar la actividad de mantenimiento.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {activityToEdit ? 'Editar Actividad de Mantenimiento' : 'Nueva Actividad Preventiva'}
              </h2>
              <p className="text-xs text-slate-400">Planificación por horas acumuladas y ciclos de tiempo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-xs text-red-700">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Errores en el formulario:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick presets helper */}
          {!activityToEdit && (
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 mb-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Plantillas Frecuentes para Compresores de Aire:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="text-[11px] px-2 py-1 rounded-lg bg-white border border-blue-200 text-blue-800 hover:bg-blue-600 hover:text-white transition font-medium"
                  >
                    {p.name} ({p.interval}h)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Compressor & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Compresor Asignado *</label>
              <select
                required
                value={compressorId}
                onChange={(e) => setCompressorId(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold focus:border-blue-600 focus:outline-none bg-white"
              >
                {activeCompressors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} ({c.currentHours.toLocaleString()} hrs)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Código Actividad *</label>
              <input
                type="text"
                required
                placeholder="PM-OIL-01"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold focus:border-blue-600 focus:outline-none uppercase"
              />
            </div>
          </div>

          {/* Name & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Nombre de la Actividad *</label>
              <input
                type="text"
                required
                placeholder="Ej. Cambio de Aceite y Separador Aire/Aceite"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Tipo de Mantenimiento</label>
              <select
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value as MaintenanceType)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none bg-white font-medium"
              >
                <option value="preventive">Preventivo</option>
                <option value="predictive">Predictivo</option>
                <option value="inspection">Inspección</option>
                <option value="safety">Seguridad</option>
                <option value="corrective_planned">Correctivo Planeado</option>
              </select>
            </div>
          </div>

          {/* Intervals & Last Service */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="text-xs font-bold text-slate-700">Intervalo Horas *</label>
              <input
                type="number"
                min="1"
                required
                value={intervalHours}
                onChange={(e) => setIntervalHours(Number(e.target.value))}
                className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Intervalo Días (Opc.)</label>
              <input
                type="number"
                min="0"
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
                placeholder="180"
                className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Último Serv. (Horas) *</label>
              <input
                type="number"
                min="0"
                required
                value={lastServiceHours}
                onChange={(e) => setLastServiceHours(Number(e.target.value))}
                className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Último Serv. (Fecha)</label>
              <input
                type="date"
                value={lastServiceDate}
                onChange={(e) => setLastServiceDate(e.target.value)}
                className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Duration, Responsible and Evidence */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Duración Est. (Horas)</label>
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={estimatedDurationHours}
                onChange={(e) => setEstimatedDurationHours(Number(e.target.value))}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Perfil Responsable</label>
              <input
                type="text"
                value={assignedRole}
                onChange={(e) => setAssignedRole(e.target.value)}
                placeholder="Técnico Mecánico Senior"
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={photoRequired}
                  onChange={(e) => setPhotoRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Evidencia fotográfica obligatoria</span>
              </label>
            </div>
          </div>

          {/* Instructions and Description */}
          <div>
            <label className="text-xs font-bold text-slate-700">Instrucciones de Trabajo</label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="1. Despresurizar el circuito a 0 PSI. 2. Bloquear LOTO. 3. Reemplazar pieza..."
              className="w-full mt-1 rounded-xl border border-slate-300 p-2 text-xs focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : activityToEdit ? 'Actualizar Actividad' : 'Guardar Actividad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
