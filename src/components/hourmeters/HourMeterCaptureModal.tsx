import React, {useState, useEffect} from 'react';
import {X, Gauge, AlertCircle, RefreshCw, AlertTriangle, Check} from 'lucide-react';
import type {Compressor, HourMeterReading} from '../../types';
import {PhotoCapture} from '../common/PhotoCapture';

interface HourMeterCaptureModalProps {
  isOpen: boolean;
  compressors: Compressor[];
  preselectedCompressorId?: string;
  currentUser: string;
  onClose: () => void;
  onSaveReading: (reading: HourMeterReading, updatedCompressorHours: number) => Promise<void>;
}

export const HourMeterCaptureModal: React.FC<HourMeterCaptureModalProps> = ({
  isOpen,
  compressors,
  preselectedCompressorId,
  currentUser,
  onClose,
  onSaveReading,
}) => {
  const activeCompressors = compressors.filter((c) => !c.deletedAt);

  const [compressorId, setCompressorId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [currentHours, setCurrentHours] = useState<number>(0);
  const [loadedHours, setLoadedHours] = useState<string>('');
  const [unloadedHours, setUnloadedHours] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);

  // Meter Replacement Mode toggle
  const [isMeterReplacement, setIsMeterReplacement] = useState<boolean>(false);
  const [replacementFinalHours, setReplacementFinalHours] = useState<number>(0);
  const [replacementNewInitialHours, setReplacementNewInitialHours] = useState<number>(0);
  const [replacementReason, setReplacementReason] = useState<string>('');
  const [replacementAuthorizedBy, setReplacementAuthorizedBy] = useState<string>('');

  const [anomalousWarning, setAnomalousWarning] = useState<string | null>(null);
  const [confirmAnomalous, setConfirmAnomalous] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().split(' ')[0].substring(0, 5));

    if (preselectedCompressorId) {
      setCompressorId(preselectedCompressorId);
    } else if (activeCompressors.length > 0) {
      setCompressorId(activeCompressors[0].id);
    }
  }, [isOpen, preselectedCompressorId]);

  const selectedCompressor = activeCompressors.find((c) => c.id === compressorId);
  const previousHours = selectedCompressor?.currentHours ?? 0;
  const diffHours = isMeterReplacement
    ? Math.max(0, currentHours - replacementNewInitialHours)
    : currentHours - previousHours;

  useEffect(() => {
    if (selectedCompressor && !isMeterReplacement) {
      setCurrentHours(selectedCompressor.currentHours);
    }
    setAnomalousWarning(null);
    setConfirmAnomalous(false);
  }, [compressorId, isMeterReplacement]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    const validationErrors: string[] = [];

    if (!selectedCompressor) {
      validationErrors.push('Debe seleccionar un compresor.');
      setErrors(validationErrors);
      return;
    }

    if (isMeterReplacement) {
      if (replacementFinalHours < previousHours) {
        validationErrors.push(
          `La lectura final del horómetro retirado (${replacementFinalHours}) no puede ser menor a la última registrada (${previousHours}).`
        );
      }
      if (replacementNewInitialHours < 0) {
        validationErrors.push('La lectura inicial del nuevo horómetro no puede ser negativa.');
      }
      if (currentHours < replacementNewInitialHours) {
        validationErrors.push(
          'La lectura actual del nuevo horómetro no puede ser menor a su lectura inicial.'
        );
      }
      if (!replacementReason.trim()) {
        validationErrors.push('Debe especificar el motivo del cambio de horómetro.');
      }
      if (!replacementAuthorizedBy.trim()) {
        validationErrors.push('Debe registrar quién autorizó el cambio de horómetro.');
      }
    } else {
      if (currentHours < 0) {
        validationErrors.push('El horómetro no puede ser un valor negativo.');
      }
      if (currentHours < previousHours) {
        validationErrors.push(
          `La lectura ingresada (${currentHours} hrs) no puede ser menor a la lectura anterior registrada (${previousHours} hrs). Si reemplazó el display o contador, active la opción "Reemplazo de Horómetro".`
        );
      }

      // Check abnormal jump (> 200 hours between readings)
      if (diffHours > 200 && !confirmAnomalous) {
        setAnomalousWarning(
          `La diferencia de horas (+${diffHours} hrs) es anormalmente alta para una sola captura. ¿Está seguro que la lectura ${currentHours} hrs es correcta?`
        );
        return;
      }
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const calculatedNewCompressorHours = isMeterReplacement
        ? previousHours + (replacementFinalHours - previousHours) + (currentHours - replacementNewInitialHours)
        : currentHours;

      const newReading: HourMeterReading = {
        id: `hm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        compressorId: selectedCompressor.id,
        date,
        time,
        currentHours: Number(currentHours),
        loadedHours: loadedHours ? Number(loadedHours) : undefined,
        unloadedHours: unloadedHours ? Number(unloadedHours) : undefined,
        diffHours: isMeterReplacement ? currentHours - replacementNewInitialHours : diffHours,
        notes: notes.trim() || undefined,
        photoUrl,
        recordedBy: currentUser || 'técnico',
        isMeterReplacement,
        replacementDetails: isMeterReplacement
          ? {
              previousMeterFinal: Number(replacementFinalHours),
              newMeterInitial: Number(replacementNewInitialHours),
              reason: replacementReason.trim(),
              authorizedBy: replacementAuthorizedBy.trim(),
            }
          : undefined,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        createdBy: currentUser || 'técnico',
        updatedBy: currentUser || 'técnico',
        schemaVersion: 1,
      };

      await onSaveReading(newReading, calculatedNewCompressorHours);
      onClose();
    } catch (err) {
      setErrors(['Error al guardar la captura de horómetro.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Captura Rápida de Horómetro</h2>
              <p className="text-xs text-slate-400">Actualización de horas de marcha y recálculo automático</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-xs text-red-700">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Error en la captura:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {anomalousWarning && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs text-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-900 font-bold">Lectura Anormalmente Alta</strong>
                  <p>{anomalousWarning}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="confirm_anom"
                  checked={confirmAnomalous}
                  onChange={(e) => setConfirmAnomalous(e.target.checked)}
                  className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="confirm_anom" className="font-bold text-amber-900 cursor-pointer">
                  Confirmo que verifiqué el display y la lectura es correcta (+{diffHours} hrs)
                </label>
              </div>
            </div>
          )}

          {/* Compressor Select */}
          <div>
            <label className="text-xs font-bold text-slate-700">Compresor de Aire *</label>
            <select
              required
              value={compressorId}
              onChange={(e) => setCompressorId(e.target.value)}
              className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold focus:border-blue-600 focus:outline-none bg-white"
            >
              {activeCompressors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name} ({c.currentHours.toLocaleString()} hrs registradas)
                </option>
              ))}
            </select>
          </div>

          {/* Previous Reading Info Box */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Lectura Anterior:</span>
              <strong className="text-slate-800 font-mono text-sm">
                {previousHours.toLocaleString()} hrs
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Horas Operadas:</span>
              <strong
                className={`font-mono text-sm ${
                  diffHours >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {diffHours >= 0 ? `+${diffHours.toLocaleString()}` : `${diffHours.toLocaleString()}`} hrs
              </strong>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Fecha de Lectura *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Hora *</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Current Reading input */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700">
                {isMeterReplacement ? 'Lectura Actual del Nuevo Horómetro *' : 'Horómetro Actual en Display *'}
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={currentHours}
                  onChange={(e) => setCurrentHours(Number(e.target.value))}
                  placeholder="Ej: 7850"
                  className="w-full rounded-xl border-2 border-blue-500 px-4 py-2.5 text-base font-mono font-bold text-slate-900 focus:outline-none shadow-xs"
                />
                <span className="absolute right-4 top-3 text-xs font-bold text-slate-400">HORAS</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Horas en Carga (Opcional)</label>
                <input
                  type="number"
                  min="0"
                  value={loadedHours}
                  onChange={(e) => setLoadedHours(e.target.value)}
                  placeholder="Ej: 6200"
                  className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Horas en Vacío (Opcional)</label>
                <input
                  type="number"
                  min="0"
                  value={unloadedHours}
                  onChange={(e) => setUnloadedHours(e.target.value)}
                  placeholder="Ej: 1650"
                  className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Meter Replacement Checkbox & Form */}
          <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-700" />
                <label
                  htmlFor="meter_rep_check"
                  className="text-xs font-bold text-blue-900 cursor-pointer"
                >
                  ¿Se reemplazó el horómetro / panel?
                </label>
              </div>
              <input
                type="checkbox"
                id="meter_rep_check"
                checked={isMeterReplacement}
                onChange={(e) => setIsMeterReplacement(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>

            {isMeterReplacement && (
              <div className="space-y-3 pt-2 border-t border-blue-200 text-xs">
                <p className="text-blue-800 text-[11px]">
                  Permite conservar el acumulado técnico ininterrumpido sin perder el historial.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Lectura Final Horómetro Anterior *</label>
                    <input
                      type="number"
                      required
                      min={previousHours}
                      value={replacementFinalHours}
                      onChange={(e) => setReplacementFinalHours(Number(e.target.value))}
                      className="w-full mt-1 rounded-lg border border-slate-300 p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Lectura Inicial Nuevo Horómetro *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={replacementNewInitialHours}
                      onChange={(e) => setReplacementNewInitialHours(Number(e.target.value))}
                      className="w-full mt-1 rounded-lg border border-slate-300 p-2 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Motivo del Reemplazo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Falla electrónica, cambio display..."
                      value={replacementReason}
                      onChange={(e) => setReplacementReason(e.target.value)}
                      className="w-full mt-1 rounded-lg border border-slate-300 p-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Autorizado Por *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ing. Jefe Mantenimiento"
                      value={replacementAuthorizedBy}
                      onChange={(e) => setReplacementAuthorizedBy(e.target.value)}
                      className="w-full mt-1 rounded-lg border border-slate-300 p-2"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Photo and Notes */}
          <div className="space-y-3">
            <PhotoCapture
              label="Foto del Display / Tablero (Opcional)"
              photos={photoUrl ? [photoUrl] : []}
              onChange={(photos) => setPhotoUrl(photos[0] || undefined)}
              maxPhotos={1}
            />

            <div>
              <label className="text-xs font-bold text-slate-700">Observaciones</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Presión observada, temperatura de descarga, comentarios del operador..."
                className="w-full mt-1 rounded-xl border border-slate-300 p-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>
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
              {isSubmitting ? 'Guardando...' : 'Guardar y Recalcular'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
