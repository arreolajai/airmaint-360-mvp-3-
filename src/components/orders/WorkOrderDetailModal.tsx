import React, {useState} from 'react';
import {
  X,
  Wrench,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  User as UserIcon,
  Check,
  Ban,
  Camera,
} from 'lucide-react';
import type {
  WorkOrder,
  Compressor,
  MaintenanceActivity,
  OrderStatus,
} from '../../types';
import {SignaturePad} from '../common/SignaturePad';
import {PhotoCapture} from '../common/PhotoCapture';

interface WorkOrderDetailModalProps {
  isOpen: boolean;
  order: WorkOrder;
  compressor?: Compressor;
  activity?: MaintenanceActivity;
  currentUser: string;
  onClose: () => void;
  onUpdateStatus: (
    updatedOrder: WorkOrder,
    isClosingPreventive: boolean,
    preventiveExecutionData?: {
      lastServiceHours: number;
      lastServiceDate: string;
    }
  ) => Promise<void>;
}

export const WorkOrderDetailModal: React.FC<WorkOrderDetailModalProps> = ({
  isOpen,
  order,
  compressor,
  activity,
  currentUser,
  onClose,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'execution' | 'history'>('info');

  // Execution form states
  const [workPerformed, setWorkPerformed] = useState(order.workPerformed || '');
  const [executionHours, setExecutionHours] = useState<number>(
    order.executionHours || compressor?.currentHours || 0
  );
  const [executionDate, setExecutionDate] = useState(
    order.executionDate || new Date().toISOString().split('T')[0]
  );
  const [actualDurationMinutes, setActualDurationMinutes] = useState<number>(
    order.actualDurationMinutes || 60
  );
  const [technicianName, setTechnicianName] = useState(order.technicianName || currentUser);
  const [signatureUrl, setSignatureUrl] = useState<string | undefined>(order.signatureUrl);
  const [photosBefore, setPhotosBefore] = useState<string[]>(order.photosBefore || []);
  const [photosAfter, setPhotosAfter] = useState<string[]>(order.photosAfter || []);

  // Cancellation state
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isClosed = order.status === 'closed' || order.status === 'completed';
  const isCancelled = order.status === 'cancelled';

  // Handle Close / Complete Order
  const handleCloseOrder = async () => {
    setErrors([]);
    const validationErrors: string[] = [];

    if (!workPerformed.trim()) {
      validationErrors.push('Debe detallar el trabajo técnico realizado para poder cerrar la orden.');
    }
    if (executionHours < 0) {
      validationErrors.push('El horómetro de ejecución no puede ser negativo.');
    }
    if (!executionDate) {
      validationErrors.push('La fecha de ejecución es obligatoria para el cierre.');
    }
    if (!technicianName.trim()) {
      validationErrors.push('El nombre del técnico ejecutor es obligatorio.');
    }
    if (activity?.photoRequired && photosAfter.length === 0) {
      validationErrors.push(
        'Esta actividad tiene configurada como obligatoria la evidencia fotográfica (Foto después).'
      );
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setActiveTab('execution');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const updatedOrder: WorkOrder = {
        ...order,
        status: 'closed',
        workPerformed: workPerformed.trim(),
        executionHours: Number(executionHours),
        executionDate,
        actualDurationMinutes: Number(actualDurationMinutes),
        technicianName: technicianName.trim(),
        signatureUrl,
        photosBefore,
        photosAfter,
        history: [
          ...order.history,
          {
            timestamp: now,
            user: currentUser,
            action: 'Cierre de Orden',
            details: `Orden cerrada exitosamente con horómetro ${executionHours} hrs por ${technicianName}`,
          },
        ],
        updatedAt: now,
        updatedBy: currentUser,
      };

      const isPreventive = order.maintenanceType === 'preventive' && !!order.activityId;
      await onUpdateStatus(updatedOrder, isPreventive, {
        lastServiceHours: Number(executionHours),
        lastServiceDate: executionDate,
      });
      onClose();
    } catch (err) {
      setErrors(['Error al cerrar la orden de trabajo.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change status to in_progress
  const handleStartOrder = async () => {
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const updated: WorkOrder = {
        ...order,
        status: 'in_progress',
        history: [
          ...order.history,
          {
            timestamp: now,
            user: currentUser,
            action: 'Inicio de Trabajo',
            details: 'La orden cambió a estado: En Proceso',
          },
        ],
        updatedAt: now,
        updatedBy: currentUser,
      };
      await onUpdateStatus(updated, false);
      setActiveTab('execution');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel order
  const handleCancelOrder = async () => {
    if (!cancellationReason.trim()) {
      setErrors(['Debe ingresar el motivo de cancelación.']);
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const updated: WorkOrder = {
        ...order,
        status: 'cancelled',
        cancellationReason: cancellationReason.trim(),
        history: [
          ...order.history,
          {
            timestamp: now,
            user: currentUser,
            action: 'Cancelación',
            details: `Orden cancelada por ${currentUser}. Motivo: ${cancellationReason}`,
          },
        ],
        updatedAt: now,
        updatedBy: currentUser,
      };
      await onUpdateStatus(updated, false);
      onClose();
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
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">{order.folio}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-blue-300">
                  {order.status}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                  {order.priority}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {compressor?.code} - {compressor?.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Datos de la Orden
          </button>
          <button
            onClick={() => setActiveTab('execution')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'execution'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Ejecución y Cierre Técnico
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            3. Historial de Cambios ({order.history.length})
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-xs text-red-700">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Requisitos pendientes para guardar:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* TAB 1: INFO */}
          {activeTab === 'info' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-medium">Equipo:</span>
                  <strong className="text-slate-900">{compressor?.code} ({compressor?.brand})</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Tipo Servicio:</span>
                  <strong className="text-slate-900 uppercase">{order.maintenanceType}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Fecha Programada:</span>
                  <strong className="text-slate-900">{order.scheduledDate}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Responsable:</span>
                  <strong className="text-slate-900">{order.assignedTo}</strong>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-bold uppercase text-[10px]">Descripción:</span>
                <p className="text-sm font-semibold text-slate-800 mt-1 bg-white p-3 rounded-xl border border-slate-200">
                  {order.description}
                </p>
              </div>

              {order.instructions && (
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Instrucciones:</span>
                  <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-200 whitespace-pre-line">
                    {order.instructions}
                  </p>
                </div>
              )}

              {activity && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="font-bold text-blue-900 block">Actividad Preventiva Vinculada</span>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    {activity.code} - {activity.name} (Ciclo cada {activity.intervalHours.toLocaleString()} hrs).
                    Al cerrar esta orden, se reiniciará el contador del plan preventivo.
                  </p>
                </div>
              )}

              {order.cancellationReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  <strong className="block font-bold">Orden Cancelada</strong>
                  <p className="mt-0.5">Motivo: {order.cancellationReason}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXECUTION & CLOSE */}
          {activeTab === 'execution' && (
            <div className="space-y-4 text-xs">
              {isClosed ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Orden Concluida y Cerrada</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-emerald-950">
                    <div>
                      <span className="text-emerald-700 block">Horómetro Ejecución:</span>
                      <strong className="font-mono">{order.executionHours?.toLocaleString()} hrs</strong>
                    </div>
                    <div>
                      <span className="text-emerald-700 block">Fecha Ejecución:</span>
                      <strong>{order.executionDate}</strong>
                    </div>
                    <div>
                      <span className="text-emerald-700 block">Tiempo Real:</span>
                      <strong>{order.actualDurationMinutes} minutos</strong>
                    </div>
                    <div>
                      <span className="text-emerald-700 block">Técnico:</span>
                      <strong>{order.technicianName}</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-emerald-700 block font-bold">Trabajo Realizado:</span>
                    <p className="mt-1 bg-white p-2.5 rounded-lg border border-emerald-200 text-slate-800">
                      {order.workPerformed}
                    </p>
                  </div>
                  {order.signatureUrl && (
                    <div>
                      <span className="text-emerald-700 block font-bold">Firma Registrada:</span>
                      <img src={order.signatureUrl} alt="Firma" className="h-16 mt-1 border rounded bg-white p-1" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status banner */}
                  <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl">
                    <span className="font-semibold text-slate-700">
                      Estado actual: <strong className="uppercase">{order.status}</strong>
                    </span>
                    {order.status === 'scheduled' && (
                      <button
                        type="button"
                        onClick={handleStartOrder}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition"
                      >
                        Iniciar Trabajo (En Proceso)
                      </button>
                    )}
                  </div>

                  {/* Form fields */}
                  <div>
                    <label className="font-bold text-slate-700 block">
                      Trabajo Realizado / Acciones Ejecutadas *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={workPerformed}
                      onChange={(e) => setWorkPerformed(e.target.value)}
                      placeholder="Describa a detalle el trabajo efectuado, refacciones cambiadas, ajustes mecánicos y pruebas funcionales..."
                      className="w-full mt-1 rounded-xl border border-slate-300 p-2.5 text-xs focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block">Horómetro de Ejecución *</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={executionHours}
                        onChange={(e) => setExecutionHours(Number(e.target.value))}
                        className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block">Fecha de Ejecución *</label>
                      <input
                        type="date"
                        required
                        value={executionDate}
                        onChange={(e) => setExecutionDate(e.target.value)}
                        className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block">Tiempo Real (Minutos)</label>
                      <input
                        type="number"
                        min="5"
                        value={actualDurationMinutes}
                        onChange={(e) => setActualDurationMinutes(Number(e.target.value))}
                        className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block">Nombre del Técnico *</label>
                    <input
                      type="text"
                      required
                      value={technicianName}
                      onChange={(e) => setTechnicianName(e.target.value)}
                      placeholder="Nombre del técnico responsable"
                      className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  {/* Photo Evidences Before & After */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <PhotoCapture
                      label="Fotos ANTES del servicio"
                      photos={photosBefore}
                      onChange={setPhotosBefore}
                      maxPhotos={2}
                    />
                    <PhotoCapture
                      label={`Fotos DESPUÉS ${activity?.photoRequired ? '(Obligatoria*)' : ''}`}
                      photos={photosAfter}
                      onChange={setPhotosAfter}
                      maxPhotos={2}
                    />
                  </div>

                  {/* Signature */}
                  <div className="pt-2">
                    <label className="font-bold text-slate-700 block mb-1">
                      Firma Digital del Técnico Ejecutor
                    </label>
                    <SignaturePad
                      initialSignature={signatureUrl}
                      onSave={setSignatureUrl}
                      onClear={() => setSignatureUrl(undefined)}
                    />
                  </div>

                  {/* Close button */}
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    {!showCancelPrompt ? (
                      <button
                        type="button"
                        onClick={() => setShowCancelPrompt(true)}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold"
                      >
                        Cancelar Orden
                      </button>
                    ) : (
                      <div className="flex-1 mr-3 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Motivo de cancelación..."
                          value={cancellationReason}
                          onChange={(e) => setCancellationReason(e.target.value)}
                          className="flex-1 p-2 border border-red-300 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleCancelOrder}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCancelPrompt(false)}
                          className="px-2 py-2 text-slate-500 text-xs"
                        >
                          No
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleCloseOrder}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                    >
                      {isSubmitting ? 'Cerrando...' : 'Finalizar y Cerrar Orden de Trabajo'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800">Bitácora Inalterable de la Orden</h4>
              <div className="divide-y divide-slate-100 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {order.history.map((h, i) => (
                  <div key={i} className="py-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{h.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(h.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{h.details}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Por: {h.user}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
