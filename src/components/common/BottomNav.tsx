import React, {useState} from 'react';
import {
  LayoutDashboard,
  Cpu,
  Gauge,
  Wrench,
  MoreHorizontal,
  CalendarClock,
  ClipboardCheck,
  AlertOctagon,
  Bell,
  FileText,
  Settings,
  X,
  Zap,
} from 'lucide-react';
import type {NavItemKey} from './Sidebar';

interface BottomNavProps {
  currentView: NavItemKey;
  onNavigate: (view: NavItemKey) => void;
  unreadAlertsCount: number;
  onOpenQuickActions: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  unreadAlertsCount,
  onOpenQuickActions,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainItems: {key: NavItemKey; label: string; icon: React.ElementType}[] = [
    {key: 'dashboard', label: 'Inicio', icon: LayoutDashboard},
    {key: 'compressors', label: 'Equipos', icon: Cpu},
    {key: 'hourmeters', label: 'Horómetro', icon: Gauge},
    {key: 'orders', label: 'Órdenes', icon: Wrench},
  ];

  const moreItems: {key: NavItemKey; label: string; icon: React.ElementType; badge?: number}[] = [
    {key: 'maintenance', label: 'Planes de Mantenimiento', icon: CalendarClock},
    {key: 'inspections', label: 'Inspecciones Técnicas', icon: ClipboardCheck},
    {key: 'failures', label: 'Registro de Fallas', icon: AlertOctagon},
    {key: 'alerts', label: 'Centro de Alertas', icon: Bell, badge: unreadAlertsCount},
    {key: 'reports', label: 'Generación de Reportes', icon: FileText},
    {key: 'settings', label: 'Configuración y Respaldo', icon: Settings},
  ];

  return (
    <>
      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 flex items-center justify-around h-16 px-2 safe-area-pb">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setShowMoreMenu(false);
                onNavigate(item.key);
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition ${
                isActive ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-blue-400 stroke-[2.2]' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Center Floating Quick Action Button on Mobile */}
        <button
          onClick={onOpenQuickActions}
          className="flex flex-col items-center justify-center -mt-5 mx-1"
          title="Acción rápida"
        >
          <div className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 border-2 border-slate-900 active:scale-95 transition">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <span className="text-[9px] text-slate-400 mt-0.5 font-medium">Rápido</span>
        </button>

        {/* More Options Button */}
        <button
          onClick={() => setShowMoreMenu(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition relative ${
            moreItems.some((m) => m.key === currentView) ? 'text-blue-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>Más</span>
          {unreadAlertsCount > 0 && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>
      </nav>

      {/* More Options Drawer Sheet */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 animate-in fade-in">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Módulos del Sistema</h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setShowMoreMenu(false);
                      onNavigate(item.key);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                      isActive
                        ? 'border-blue-500 bg-blue-950/60 text-white'
                        : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-blue-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{item.label}</div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] text-red-400 font-bold block">
                          {item.badge} pendientes
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
