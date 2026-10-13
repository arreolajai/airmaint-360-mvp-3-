import React, {useState, useEffect} from 'react';
import {X, AlertOctagon, AlertCircle, AlertTriangle} from 'lucide-react';
import type {
  Compressor,
  Failure,
  FailureStatus,
  OrderPriority,
} from '../../types';
import {PhotoCapture} from '../common/PhotoCapture';

interface FailureFormModalProps {
  isOpen: boolean;
  compressors: Compressor[];
  preselectedCompressorId?: string;
  failureToEdit: Failure | null;
  existingFailuresCount: number;
  currentUser: string;
  onClose: () => void;
  onSave: (failure: Failure) => Promise<void>;
}

export const FailureFormModal: React.FC<FailureFormModalProps> = ({
  isOpen,
  compressors,
  preselectedCompressorId,
  failureToEdit,
  existingFailuresCount,
  currentUser,
  onClose,
  onSave,
}) => {
  const activeCompressors = compressors.filter((c) => !c.deletedAt);

  const [folio, setFolio] = useState('');
  const [compressorId, setCompressorId] = useState('');
  const [occurredDate, setOccurredDate] = useState('');
  const [occurredTime, setOccurredTime] = useState('');
  const [symptom, setSymptom] = useState('');
  const [description, setDescription] = useState('');
  const [alarmCode, setAlarmCode] = useState('');
  const [isMachineStopped, setIsMachineStopped] = useState(true);
  const [priority, setPriority] = useState<OrderPriority>('high');
  const [possibleCause, setPossibleCause] = useState('');
  const [immediateAction, setImmediateAction] = useState('');
  const [assignedTo, setAssignedTo] = useState(currentUser);
  const [status, setStatus] = useState<FailureStatus>('open');
  const [photos, setPhotos] = useState<string[]>([]);
  const [resolvedDate, setResolvedDate] = useState('');
  const [resolvedTime, setResolvedTime] = useState('');

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (failureToEdit) {
      setFolio(failureToEdit.folio);
      setCompressorId(failureToEdit.compressorId);
      const [d, t] = failureToEdit.occurredAt.split('T');
      setOccurredDate(d || '');
      setOccurredTime(t ? t.substring(0, 5) : '08:00');
      setSymptom(failureToEdit.symptom);
      setDescription(failureToEdit.description);
      setAlarmCode(failureToEdit.alarmCode || '');
      setIsMachineStopped(failureToEdit.isMachineStopped);
      setPriority(failureToEdit.priority);
      setPossibleCause(failureToEdit.possibleCause || '');
      setImmediateAction(failureToEdit.immediateAction || '');
      setAssignedTo(failureToEdit.assignedTo || currentUser);
      setStatus(failureToEdit.status);
      setPhotos(failureToEdit.photos || []);

      if (failureToEdit.resolvedAt) {
        const [rd, rt] = failureToEdit.resolvedAt.split('T');
        setResolvedDate(rd || '');
        setResolvedTime(rt ? rt.substring(0, 5) : '');
      } else {
        setResolvedDate('');
        setResolvedTime('');
      }
    } else {
      const currentYear = new Date().getFullYear();
      const nextNum = existingFailuresCount + 1;
      setFolio(`FL-${currentYear}-${String(nextNum).padStart(3, '0')}`);

      const selectedId = preselectedCompressorId || activeCompressors[0]?.id || '';
      setCompressorId(selectedId);

      const now = new Date();
      setOccurredDate(now.toISOString().split('T')[0]);
      setOccurredTime(now.toTimeString().split(' ')[0].substring(0, 5));

      setSymptom('');
      setDescription('');
      setAlarmCode('');
      setIsMachineStopped(true);
      setPriority('high');
      setPossibleCause('');
      setImmediateAction('');
      setAssignedTo(currentUser);
      setStatus('open');
      setPhotos([]);
      setResolvedDate('');
      setResolvedTime('');
    }
    setErrors([]);
  }, [isOpen, failureToEdit, preselectedCompressorId]);

  if (!isOpen) return null;

  // Calculate downtime hours if both dates are present
  let calculatedDowntime: number | undefined = undefined;
  if (occurredDate && occurredTime && resolvedDate && resolvedTime) {
    const start = new Date(`${occurredDate}T${occurredTime}:00`);
    const end = new Date(`${resolvedDate}T${resolvedTime}:00`);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
      const diffMs = end.getTime() - start.getTime();
      calculatedDowntime = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: string[] = [];

    if (!compressorId) validationErrors.push('Debe seleccionar el compresor afectado.');
    if (!symptom.trim()) validationErrors.push('El síntoma principal de la falla es obligatorio.');
    if (!description.trim()) validationErrors.push('La descripción de la falla es obligatoria.');

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const occurredAt = `${occurredDate}T${occurredTime}:00Z`;
      const resolvedAt =
        resolvedDate && resolvedTime ? `${resolvedDate}T${resolvedTime}:00Z` : undefined;

      const newFailure: Failure = {
        id: failureToEdit?.id || `fl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        folio,
        compressorId,
        occurredAt,
        symptom: symptom.trim(),
        description: description.trim(),
        alarmCode: alarmCode.trim() || undefined,
        isMachineStopped,
        priority,
        possibleCause: possibleCause.trim() || undefined,
        immediateAction: immediateAction.trim() || undefined,
        assignedTo: assignedTo.trim() || undefined,
        status,
        photos,
        downtimeHours: calculatedDowntime ?? failureToEdit?.downtimeHours,
        resolvedAt,
        isActive: true,
        createdAt: failureToEdit?.createdAt || now,
        updatedAt: now,
        createdBy: failureToEdit?.createdBy || currentUser,
        updatedBy: currentUser,
        schemaVersion: 1,
      };

      await onSave(newFailure);
      onClose();
    } catch (err) {
      setErrors(['Error al registrar la falla.']);
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
            <div className="p-2 bg-rose-600 rounded-lg text-white">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {failureToEdit ? `Editar Falla: ${failureToEdit.folio}` : 'Reportar Falla / Alarma en Compresor'}
              </h2>
              <p className="text-xs text-slate-400">Control de anomalías, paros imprevistos y tiempos muertos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-red-700">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Errores encontrados:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Folio & Compressor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block">Folio de Falla *</label>
              <input
                type="text"
                required
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold uppercase focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block">Compresor Afectado *</label>
              <select
                required
                value={compressorId}
                onChange={(e) => setCompressorId(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 font-bold bg-white focus:outline-none"
              >
                {activeCompressors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} ({c.building})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date, Time and Machine Stopped */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="font-bold text-slate-700 block">Fecha del Evento *</label>
              <input
                type="date"
                required
                value={occurredDate}
                onChange={(e) => setOccurredDate(e.target.value)}
                className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block">Hora del Evento *</label>
              <input
                type="time"
                required
                value={occurredTime}
                onChange={(e) => setOccurredTime(e.target.value)}
                className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={isMachineStopped}
                  onChange={(e) => setIsMachineStopped(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                />
                <span className={isMachineStopped ? 'text-red-700' : 'text-slate-600'}>
                  ¿Equipo detenido (Paro total)?
                </span>
              </label>
            </div>
          </div>

          {/* Symptom, Alarm code & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block">Síntoma Principal *</label>
              <input
                type="text"
                required
                placeholder="Ej. Sobretemperatura en aire de descarga / Ruido en rodamiento"
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block">Código Alarma / Display</label>
              <input
                type="text"
                placeholder="AL-TEMP-108C / E-04"
                value={alarmCode}
                onChange={(e) => setAlarmCode(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 font-mono uppercase focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block">Prioridad *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as OrderPriority)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 font-bold bg-white focus:outline-none"
              >
                <option value="critical">Crítica (Paro total / Inmediato)</option>
                <option value="high">Alta (Riesgo inminente)</option>
                <option value="medium">Media (Anomalía detectada)</option>
                <option value="low">Baja (Observación)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block">Estado de la Falla</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FailureStatus)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 font-bold bg-white focus:outline-none uppercase"
              >
                <option value="open">Abierta</option>
                <option value="in_analysis">En Análisis</option>
                <option value="in_repair">En Reparación</option>
                <option value="resolved">Corregida</option>
                <option value="closed">Cerrada</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block">Responsable Asignado</label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Técnico a cargo"
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none"
              />
            </div>
          </div>

          {/* Description & Action */}
          <div>
            <label className="font-bold text-slate-700 block">Descripción Detallada del Suceso *</label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalle de lo ocurrido, condiciones ambientales o parámetros anómalos previos..."
              className="w-full mt-1 rounded-xl border border-slate-300 p-2.5 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block">Posible Causa Estimada</label>
              <input
                type="text"
                value={possibleCause}
                onChange={(e) => setPossibleCause(e.target.value)}
                placeholder="Filtro saturado, bajo nivel de aceite..."
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block">Acción Inmediata Tomada</label>
              <input
                type="text"
                value={immediateAction}
                onChange={(e) => setImmediateAction(e.target.value)}
                placeholder="Se aplicó LOTO, se apagó seccionador..."
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none"
              />
            </div>
          </div>

          {/* Downtime closure fields */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="font-bold text-slate-800 block">Término de la Falla y Tiempo de Paro</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-600 block">Fecha de Solución</label>
                <input
                  type="date"
                  value={resolvedDate}
                  onChange={(e) => setResolvedDate(e.target.value)}
                  className="w-full mt-1 rounded-lg border border-slate-300 px-2 py-1.5 bg-white"
                />
              </div>
              <div>
                <label className="text-slate-600 block">Hora de Solución</label>
                <input
                  type="time"
                  value={resolvedTime}
                  onChange={(e) => setResolvedTime(e.target.value)}
                  className="w-full mt-1 rounded-lg border border-slate-300 px-2 py-1.5 bg-white"
                />
              </div>
              <div>
                <label className="text-slate-600 block">Tiempo de Paro Calculado</label>
                <div className="mt-1 font-mono font-bold text-slate-900 py-1.5">
                  {calculatedDowntime !== undefined ? `${calculatedDowntime} hrs` : 'No calculado aún'}
                </div>
              </div>
            </div>
          </div>

          {/* Photo Capture */}
          <PhotoCapture
            label="Evidencia Fotográfica de la Falla"
            photos={photos}
            onChange={setPhotos}
            maxPhotos={3}
          />

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : failureToEdit ? 'Actualizar Falla' : 'Registrar Falla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
