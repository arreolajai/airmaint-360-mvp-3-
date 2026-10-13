import React from 'react';
import {useOnlineStatus} from '../../hooks/usePWAInstall';
import {WifiOff} from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-18 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xl animate-bounce">
      <WifiOff className="w-4 h-4 text-white" />
      <span>Modo Sin Conexión — Trabajando con base de datos local (IndexedDB)</span>
    </div>
  );
};
