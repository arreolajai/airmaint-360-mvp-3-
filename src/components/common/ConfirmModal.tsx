import React from 'react';
import {AlertTriangle, X} from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  requiresTypedConfirmation?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
  requiresTypedConfirmation,
  onConfirm,
  onCancel,
}) => {
  const [typedValue, setTypedValue] = React.useState('');

  if (!isOpen) return null;

  const isConfirmDisabled =
    requiresTypedConfirmation !== undefined &&
    typedValue.trim() !== requiresTypedConfirmation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl ${
              isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {requiresTypedConfirmation && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Para confirmar esta acción, escribe con exactitud{' '}
              <strong className="text-slate-900 font-mono">
                {requiresTypedConfirmation}
              </strong>
              :
            </p>
            <input
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={requiresTypedConfirmation}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-red-500 focus:outline-none"
            />
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isConfirmDisabled}
            onClick={() => {
              onConfirm();
              setTypedValue('');
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
