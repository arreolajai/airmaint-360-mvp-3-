import React, {useState, useEffect} from 'react';
import {X, Wrench, AlertCircle} from 'lucide-react';
import type {
  Compressor,
  MaintenanceActivity,
  WorkOrder,
  OrderPriority,
  MaintenanceType,
  AppSettings,
} from '../../types';

interface WorkOrderFormModalProps {
  isOpen: boolean;
  compressors: Compressor[];
  activities: MaintenanceActivity[];
  orderToEdit: WorkOrder | null;
  preselectedData?: {
    compressorId?: string;
    activityId?: string;
    originType?: 'manual' | 'preventive' | 'inspection' | 'failure';
    originId?: string;
    title?: string;
    priority?: OrderPriority;
  };
  settings: AppSettings | null;
  existingFolios: string[];
  currentUser: string;
  onClose: () => void;
  onSave: (order: WorkOrder) => Promise<void>;
}

export const WorkOrderFormModal: React.FC<WorkOrderFormModalProps> = ({
  isOpen,
  compressors,
  activities,
  orderToEdit,
  preselectedData,
  settings,
  existingFolios,
  currentUser,
  onClose,
  onSave,
}) => {
  const activeCompressors = compressors.filter((c) => !c.deletedAt);

  const [folio, setFolio] = useState('');
  const [compressorId, setCompressorId] = useState('');
  const [activityId, setActivityId] = useState<string>('');
  const [originType, setOriginType] = useState<'manual' | 'preventive' | 'inspection' | 'failure'>('manual');
  const [originId, setOriginId] = useState<string | undefined>(undefined);
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>('preventive');
  const [priority, setPriority] = useState<OrderPriority>('medium');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledHours, setScheduledHours] = useState<number | undefined>(undefined);
  const [assignedTo, setAssignedTo] = useState('Téc. Roberto Valdés');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (orderToEdit) {
      setFolio(orderToEdit.folio);
      setCompressorId(orderToEdit.compressorId);
      setActivityId(orderToEdit.activityId || '');
      setOriginType(orderToEdit.originType);
      setOriginId(orderToEdit.originId);
      setMaintenanceType(orderToEdit.maintenanceType);
      setPriority(orderToEdit.priority);
      setScheduledDate(orderToEdit.scheduledDate);
      setScheduledHours(orderToEdit.scheduledHours);
      setAssignedTo(orderToEdit.assignedTo);
      setDescription(orderToEdit.description);
      setInstructions(orderToEdit.instructions || '');
    } else {
      // Generate new sequential folio
      const currentYear = new Date().getFullYear();
      const nextNum = (settings?.initialWorkOrderFolio ?? 100) + existingFolios.length + 1;
      setFolio(`OT-${currentYear}-${String(nextNum).padStart(3, '0')}`);

      const compId = preselectedData?.compressorId || activeCompressors[0]?.id || '';
      setCompressorId(compId);
      setActivityId(preselectedData?.activityId || '');
      setOriginType(preselectedData?.originType || 'manual');
      setOriginId(preselectedData?.originId);
      setPriority(preselectedData?.priority || 'medium');

      const today = new Date().toISOString().split('T')[0];
      setScheduledDate(today);

      const targetComp = activeCompressors.find((c) => c.id === compId);
      setScheduledHours(targetComp?.currentHours);

      if (preselectedData?.activityId) {
        const act = activities.find((a) => a.id === preselectedData.activityId);
        if (act) {
          setDescription(`Servicio Programado: ${act.name}`);
          setInstructions(act.instructions || '');
          setMaintenanceType(act.maintenanceType);
        }
      } else if (preselectedData?.title) {
        setDescription(preselectedData.title);
      } else {
        setDescription('');
        setInstructions('');
      }
    }
    setErrors([]);
  }, [isOpen, orderToEdit, preselectedData]);

  if (!isOpen) return null;

  const compActivities = activities.filter((a) => a.compressorId === compressorId && a.isActive);

  const handleCompressorChange = (newCompId: string) => {
    setCompressorId(newCompId);
    const comp = activeCompressors.find((c) => c.id === newCompId);
    if (comp) {
      setScheduledHours(comp.currentHours);
    }
    setActivityId('');
  };

  const handleActivitySelect = (actId: string) => {
    setActivityId(actId);
    const act = activities.find((a) => a.id === actId);
    if (act) {
      setDescription(`Servicio Preventivo: ${act.name}`);
      setInstructions(act.instructions || '');
      setMaintenanceType(act.maintenanceType);
      setOriginType('preventive');
      setOriginId(act.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: string[] = [];

    if (!folio.trim()) validationErrors.push('El folio de la orden es obligatorio.');
    if (!compressorId) validationErrors.push('Debe seleccionar un compresor.');
    if (!scheduledDate) validationErrors.push('La fecha programada es obligatoria.');
    if (!assignedTo.trim()) validationErrors.push('Debe asignar un responsable a la orden.');
    if (!description.trim()) validationErrors.push('La descripción del trabajo es obligatoria.');

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const updatedOrder: WorkOrder = {
        id: orderToEdit?.id || `wo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        folio: folio.trim(),
        compressorId,
        activityId: activityId || undefined,
        originType,
        originId,
        maintenanceType,
        priority,
        status: orderToEdit?.status || 'scheduled',
        scheduledDate,
        scheduledHours: scheduledHours ? Number(scheduledHours) : undefined,
        assignedTo: assignedTo.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        history: orderToEdit?.history || [
          {
            timestamp: now,
            user: currentUser,
            action: 'Creación',
            details: `Orden creada con estado programada para ${scheduledDate}`,
          },
        ],
        isActive: true,
        createdAt: orderToEdit?.createdAt || now,
        updatedAt: now,
        createdBy: orderToEdit?.createdBy || currentUser,
        updatedBy: currentUser,
        schemaVersion: 1,
      };

      await onSave(updatedOrder);
      onClose();
    } catch (err) {
      setErrors(['Error al guardar la orden de trabajo.']);
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
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {orderToEdit ? `Editar Orden: ${orderToEdit.folio}` : 'Nueva Orden de Trabajo (OT)'}
              </h2>
              <p className="text-xs text-slate-400">Programación de intervención mecánica o correctiva</p>
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

          {/* Folio, Compressor and Activity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Folio de la Orden *</label>
              <input
                type="text"
                required
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold focus:border-blue-600 focus:outline-none uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Compresor de Aire *</label>
              <select
                required
                value={compressorId}
                onChange={(e) => handleCompressorChange(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold focus:border-blue-600 focus:outline-none bg-white"
              >
                {activeCompressors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} ({c.currentHours.toLocaleString()} hrs)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actividad vinculada (si aplica) */}
          {compActivities.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-700">
                Vincular a Actividad Preventiva del Plan (Opcional)
              </label>
              <select
                value={activityId}
                onChange={(e) => handleActivitySelect(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none bg-white font-medium"
              >
                <option value="">-- Sin actividad vinculada (Orden Manual / Correctiva) --</option>
                {compActivities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name} (Cada {a.intervalHours.toLocaleString()} hrs)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tipo, Prioridad y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Tipo de Mantenimiento</label>
              <select
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value as MaintenanceType)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none bg-white"
              >
                <option value="preventive">Preventivo</option>
                <option value="predictive">Predictivo</option>
                <option value="inspection">Inspección</option>
                <option value="safety">Seguridad</option>
                <option value="corrective_planned">Correctivo Planeado</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Prioridad *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as OrderPriority)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none bg-white font-bold"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica (Urgente)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Fecha Programada *</label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Responsable y Horómetro programado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Responsable Asignado *</label>
              <input
                type="text"
                required
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Nombre del técnico o cuadrilla"
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Horómetro Programado (hrs)</label>
              <input
                type="number"
                min="0"
                value={scheduledHours ?? ''}
                onChange={(e) => setScheduledHours(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Ej. 8000"
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-bold text-slate-700">Descripción del Trabajo a Realizar *</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Reemplazo general de aceite, filtro de aire y prueba de válvulas de alivio."
              className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none font-medium"
            />
          </div>

          {/* Instrucciones */}
          <div>
            <label className="text-xs font-bold text-slate-700">Instrucciones y Procedimiento de Seguridad</label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="1. Aplicar candado LOTO en interruptor principal. 2. Purgar tanque a 0 bar..."
              className="w-full mt-1 rounded-xl border border-slate-300 p-2.5 text-xs focus:border-blue-600 focus:outline-none"
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
              {isSubmitting ? 'Guardando...' : orderToEdit ? 'Actualizar Orden' : 'Crear Orden de Trabajo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
