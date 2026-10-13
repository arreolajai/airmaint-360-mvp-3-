import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Gauge,
  CalendarClock,
  Wrench,
  ClipboardCheck,
  AlertOctagon,
  Bell,
  FileText,
  Settings,
  Zap,
} from 'lucide-react';
import type {Role} from '../../types';

export type NavItemKey =
  | 'dashboard'
  | 'compressors'
  | 'hourmeters'
  | 'maintenance'
  | 'orders'
  | 'inspections'
  | 'failures'
  | 'alerts'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentView: NavItemKey;
  onNavigate: (view: NavItemKey) => void;
  unreadAlertsCount: number;
  userRole?: Role;
  onOpenQuickActions: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  unreadAlertsCount,
  onOpenQuickActions,
}) => {
  const navItems: {key: NavItemKey; label: string; icon: React.ElementType; badge?: number}[] = [
    {key: 'dashboard', label: 'Inicio', icon: LayoutDashboard},
    {key: 'compressors', label: 'Compresores', icon: Cpu},
    {key: 'hourmeters', label: 'Horómetros', icon: Gauge},
    {key: 'maintenance', label: 'Mantenimiento', icon: CalendarClock},
    {key: 'orders', label: 'Órdenes de Trabajo', icon: Wrench},
    {key: 'inspections', label: 'Inspecciones', icon: ClipboardCheck},
    {key: 'failures', label: 'Fallas', icon: AlertOctagon},
    {key: 'alerts', label: 'Alertas', icon: Bell, badge: unreadAlertsCount},
    {key: 'reports', label: 'Reportes', icon: FileText},
    {key: 'settings', label: 'Configuración', icon: Settings},
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Gauge className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-extrabold text-sm tracking-wide text-white block">AIRMAINT 360</span>
          <span className="text-[10px] text-blue-400 font-mono tracking-wider uppercase">Control Industrial</span>
        </div>
      </div>

      {/* Quick Action Button in Sidebar */}
      <div className="p-3">
        <button
          onClick={onOpenQuickActions}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition active:scale-[0.98]"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>Acción Rápida</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white text-blue-700' : 'bg-red-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status info */}
      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Modo PWA Offline</span>
        <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Local
        </span>
      </div>
    </aside>
  );
};
