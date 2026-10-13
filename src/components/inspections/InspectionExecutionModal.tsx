import React, {useState, useEffect} from 'react';
import {
  X,
  ClipboardCheck,
  AlertTriangle,
  Check,
  XCircle,
  HelpCircle,
  Camera,
  AlertCircle,
} from 'lucide-react';
import type {
  Compressor,
  Inspection,
  InspectionItem,
  InspectionResult,
  OrderPriority,
} from '../../types';
import {SignaturePad} from '../common/SignaturePad';
import {PhotoCapture} from '../common/PhotoCapture';

interface InspectionExecutionModalProps {
  isOpen: boolean;
  compressors: Compressor[];
  preselectedCompressorId?: string;
  currentUser: string;
  existingInspectionsCount: number;
  onClose: () => void;
  onSaveInspection: (inspection: Inspection) => Promise<void>;
}

const DEFAULT_INSPECTION_POINTS = [
  {key: 'oil_level', label: '1. Nivel de aceite en mirilla correcto'},
  {key: 'oil_leaks', label: '2. Sin fugas de aceite en mangueras y conexiones'},
  {key: 'air_leaks', label: '3. Sin fugas de aire comprimido audibles o visibles'},
  {key: 'pressure', label: '4. Presión de descarga en rango de operación', hasNumeric: true, unit: 'PSI'},
  {key: 'temp', label: '5. Temperatura de descarga dentro del límite normal', hasNumeric: true, unit: '°C'},
  {key: 'noise', label: '6. Sin ruido anormal en cabina de compresión'},
  {key: 'vibration', label: '7. Sin vibraciones anormales en motor o tornillos'},
  {key: 'filters', label: '8. Filtros de aspiración sin saturación severa'},
  {key: 'coolers', label: '9. Panal de radiadores y enfriadores limpio'},
  {key: 'drain', label: '10. Drenaje automático de condensado operando'},
  {key: 'area', label: '11. Área perimetral despejada, ventilada y limpia'},
  {key: 'guards', label: '12. Guardas de protección mecánica instaladas'},
  {key: 'loto', label: '13. Señalización de seguridad y dispositivo LOTO listo'},
  {key: 'general', label: '14. Condición general del equipo apta para servicio'},
];

export const InspectionExecutionModal: React.FC<InspectionExecutionModalProps> = ({
  isOpen,
  compressors,
  preselectedCompressorId,
  currentUser,
  existingInspectionsCount,
  onClose,
  onSaveInspection,
}) => {
  const activeCompressors = compressors.filter((c) => !c.deletedAt);

  const [compressorId, setCompressorId] = useState('');
  const [technicianName, setTechnicianName] = useState(currentUser);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [signatureUrl, setSignatureUrl] = useState<string | undefined>(undefined);

  // Inspection item states
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().split(' ')[0].substring(0, 5));

    const selectedId = preselectedCompressorId || activeCompressors[0]?.id || '';
    setCompressorId(selectedId);
    setTechnicianName(currentUser);

    // Initialize 14 points
    const initialItems: InspectionItem[] = DEFAULT_INSPECTION_POINTS.map((pt) => ({
      id: `it-${pt.key}`,
      pointKey: pt.key,
      label: pt.label,
      result: 'pass',
      observation: '',
      priority: undefined,
      numericValue: pt.hasNumeric ? (pt.key === 'pressure' ? 115 : 82) : undefined,
      unit: pt.unit,
    }));
    setItems(initialItems);
    setErrors([]);
  }, [isOpen, preselectedCompressorId]);

  if (!isOpen) return null;

  const updateItemResult = (pointKey: string, result: InspectionResult) => {
    setItems((prev) =>
      prev.map((it) => (it.pointKey === pointKey ? {...it, result} : it))
    );
  };

  const updateItemObservation = (pointKey: string, observation: string) => {
    setItems((prev) =>
      prev.map((it) => (it.pointKey === pointKey ? {...it, observation} : it))
    );
  };

  const updateItemPriority = (pointKey: string, priority: OrderPriority) => {
    setItems((prev) =>
      prev.map((it) => (it.pointKey === pointKey ? {...it, priority} : it))
    );
  };

  const updateItemNumeric = (pointKey: string, numericValue: number) => {
    setItems((prev) =>
      prev.map((it) => (it.pointKey === pointKey ? {...it, numericValue} : it))
    );
  };

  // Calculations
  const applicableItems = items.filter((it) => it.result !== 'na');
  const passedItems = items.filter((it) => it.result === 'pass');
  const failedItems = items.filter((it) => it.result === 'fail');
  const compliancePercentage =
    applicableItems.length > 0
      ? Math.round((passedItems.length / applicableItems.length) * 100)
      : 100;

  const overallResult =
    failedItems.length === 0
      ? 'pass'
      : failedItems.some((f) => f.priority === 'critical' || f.priority === 'high')
      ? 'fail'
      : 'warning';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: string[] = [];

    if (!compressorId) validationErrors.push('Debe seleccionar un compresor.');
    if (!technicianName.trim()) validationErrors.push('El nombre del técnico es obligatorio.');

    // If result is 'fail', observation is mandatory
    failedItems.forEach((f) => {
      if (!f.observation || !f.observation.trim()) {
        validationErrors.push(`El punto "${f.label}" está marcado como INCORRECTO. La observación es obligatoria.`);
      }
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const currentYear = new Date().getFullYear();
      const nextNum = existingInspectionsCount + 1;
      const inspectionNumber = `INS-${currentYear}-${String(nextNum).padStart(3, '0')}`;

      const newInspection: Inspection = {
        id: `ins-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        inspectionNumber,
        compressorId,
        date,
        time,
        technicianName: technicianName.trim(),
        signatureUrl,
        overallResult,
        compliancePercentage,
        findingsCount: failedItems.length,
        items,
        notes: notes.trim() || undefined,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        createdBy: currentUser,
        updatedBy: currentUser,
        schemaVersion: 1,
      };

      await onSaveInspection(newInspection);
      onClose();
    } catch (err) {
      setErrors(['Error al guardar la inspección técnica.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Checklist de Inspección Técnica</h2>
              <p className="text-xs text-slate-400">Verificación operativa de 14 puntos de control en compresor</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live score banner */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500 font-medium">Cumplimiento:</span>{' '}
              <strong
                className={`text-sm font-black ${
                  compliancePercentage >= 90
                    ? 'text-emerald-700'
                    : compliancePercentage >= 75
                    ? 'text-amber-700'
                    : 'text-red-700'
                }`}
              >
                {compliancePercentage}%
              </strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Hallazgos:</span>{' '}
              <strong className={failedItems.length > 0 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                {failedItems.length}
              </strong>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
              overallResult === 'pass'
                ? 'bg-emerald-100 text-emerald-800'
                : overallResult === 'warning'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            Resultado: {overallResult}
          </span>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-xs text-red-700">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Atienda los siguientes puntos:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Equipment and Technician */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Compresor Inspeccionado *</label>
              <select
                required
                value={compressorId}
                onChange={(e) => setCompressorId(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold focus:border-blue-600 focus:outline-none bg-white"
              >
                {activeCompressors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} ({c.building})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Técnico Inspector *</label>
              <input
                type="text"
                required
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                placeholder="Nombre del técnico"
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* 14 Points Checklist */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 pb-1 border-b border-slate-200">
              Puntos Técnicos a Inspeccionar
            </h3>

            <div className="space-y-2.5">
              {items.map((item) => (
                <div
                  key={item.pointKey}
                  className={`p-3 rounded-xl border transition ${
                    item.result === 'fail'
                      ? 'border-red-300 bg-red-50/40'
                      : item.result === 'pass'
                      ? 'border-slate-200 bg-white hover:border-slate-300'
                      : 'border-slate-200 bg-slate-50 opacity-75'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">{item.label}</span>

                    {/* Radio-like buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateItemResult(item.pointKey, 'pass')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                          item.result === 'pass'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Correcto</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          updateItemResult(item.pointKey, 'fail');
                          if (!item.priority) updateItemPriority(item.pointKey, 'high');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                          item.result === 'fail'
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Incorrecto</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateItemResult(item.pointKey, 'na')}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                          item.result === 'na'
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <span>N/A</span>
                      </button>
                    </div>
                  </div>

                  {/* Numeric value if applicable */}
                  {item.numericValue !== undefined && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="text-slate-500">Valor medido:</span>
                      <input
                        type="number"
                        value={item.numericValue}
                        onChange={(e) => updateItemNumeric(item.pointKey, Number(e.target.value))}
                        className="w-24 rounded border border-slate-300 px-2 py-1 text-xs font-mono font-bold"
                      />
                      <span className="text-slate-500 font-bold">{item.unit}</span>
                    </div>
                  )}

                  {/* If Fail -> Mandatory observation & priority */}
                  {item.result === 'fail' && (
                    <div className="mt-2.5 pt-2 border-t border-red-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-red-900 block">
                          Observación del Hallazgo (Obligatorio) *
                        </label>
                        <input
                          type="text"
                          required
                          value={item.observation || ''}
                          onChange={(e) => updateItemObservation(item.pointKey, e.target.value)}
                          placeholder="Describa la anomalía, fuga o condición insegura..."
                          className="w-full mt-0.5 rounded-lg border border-red-300 p-1.5 bg-white text-xs text-red-900 focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-red-900 block">
                          Prioridad de Atención
                        </label>
                        <select
                          value={item.priority || 'high'}
                          onChange={(e) => updateItemPriority(item.pointKey, e.target.value as OrderPriority)}
                          className="w-full mt-0.5 rounded-lg border border-red-300 p-1.5 bg-white text-xs font-bold text-red-900 focus:outline-none"
                        >
                          <option value="critical">Crítica (Inmediata)</option>
                          <option value="high">Alta (Turno actual)</option>
                          <option value="medium">Media (Semanal)</option>
                          <option value="low">Baja (Monitoreo)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes and Digital Signature */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700">Comentarios Generales</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones adicionales sobre el cuarto de compresores o pruebas..."
                className="w-full mt-1 rounded-xl border border-slate-300 p-2.5 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Firma del Técnico Inspector
              </label>
              <SignaturePad onSave={setSignatureUrl} onClear={() => setSignatureUrl(undefined)} />
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
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Completar y Guardar Inspección'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
