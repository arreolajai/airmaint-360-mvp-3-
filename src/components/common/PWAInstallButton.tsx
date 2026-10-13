import React, {useState} from 'react';
import {usePWAInstall} from '../../hooks/usePWAInstall';
import {Download, Smartphone, X} from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition active:scale-95"
        title="Instalar AIRMAINT 360 en este dispositivo"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-600" />
          <span>Instalar en iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Instalar en iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-3 text-sm text-slate-600 space-y-2">
                <p>1. Pulsa el botón <strong>Compartir</strong> <span className="inline-block px-1 bg-slate-100 rounded text-xs">⎋</span> en la barra de Safari.</p>
                <p>2. Desliza hacia abajo y selecciona <strong>Agregar al inicio</strong> <span className="inline-block px-1 bg-slate-100 rounded text-xs">➕</span>.</p>
                <p>3. Pulsa <strong>Agregar</strong> en la esquina superior derecha.</p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
