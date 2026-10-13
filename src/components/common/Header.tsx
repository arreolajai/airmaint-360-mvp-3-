import React, {useState} from 'react';
import {Bell, Lock, LogOut, Shield, User as UserIcon, Gauge, FolderDown} from 'lucide-react';
import type {User, AppSettings} from '../../types';
import {PWAInstallButton} from './PWAInstallButton';
import {downloadProjectZip} from '../../services/zipService';

interface HeaderProps {
  currentUser: User | null;
  settings: AppSettings | null;
  unreadAlertsCount: number;
  onOpenAlerts: () => void;
  onLockApp: () => void;
  onLogout: () => void;
  onOpenQuickActions: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  settings,
  unreadAlertsCount,
  onOpenAlerts,
  onLockApp,
  onLogout,
  onOpenQuickActions,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded text-[10px] border border-purple-200">Administrador</span>;
      case 'technician':
        return <span className="bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded text-[10px] border border-blue-200">Técnico</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px] border border-slate-200">Consulta</span>;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-xs z-30">
      {/* Mobile brand & Plant info */}
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white">
            <Gauge className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm text-slate-900 tracking-tight">AIRMAINT 360</span>
        </div>

        <div className="hidden sm:block">
          <div className="text-xs font-bold text-slate-800 leading-tight">
            {settings?.companyName || 'Industrias Neumáticas'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {settings?.plantName || 'Planta Principal'}
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Direct GitHub Source Code Download via Blob */}
        <button
          onClick={async () => {
            setIsDownloading(true);
            const res = await downloadProjectZip();
            setIsDownloading(false);
            if (!res.success) {
              alert(res.message || 'Error al descargar archivo comprimido.');
            }
          }}
          disabled={isDownloading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-blue-400 bg-white hover:bg-blue-50 text-slate-800 text-xs font-bold transition shadow-xs disabled:opacity-50"
          title="Descargar código fuente completo del proyecto en archivo .ZIP listo para subir a GitHub"
        >
          <FolderDown className={`w-4 h-4 text-blue-600 ${isDownloading ? 'animate-bounce' : ''}`} />
          <span className="hidden sm:inline">
            {isDownloading ? 'Preparando ZIP...' : 'Descargar ZIP (GitHub)'}
          </span>
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Quick action button for header */}
        <button
          onClick={onOpenQuickActions}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          title="Abrir menú de acción rápida"
        >
          <span>Acción Rápida</span>
        </button>

        {/* Alert Bell Button */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          title="Ver alertas"
        >
          <Bell className="w-5 h-5" />
          {unreadAlertsCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-xs">
              {unreadAlertsCount}
            </span>
          )}
        </button>

        {/* User Card */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="hidden lg:block text-right">
              <div className="text-xs font-bold text-slate-800 leading-tight">{currentUser.fullName}</div>
              <div className="mt-0.5">{getRoleBadge(currentUser.role)}</div>
            </div>

            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              {currentUser.username.substring(0, 2).toUpperCase()}
            </div>

            {/* Lock button */}
            <button
              onClick={onLockApp}
              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
              title="Bloquear pantalla (Seguridad)"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
