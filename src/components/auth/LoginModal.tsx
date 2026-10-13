import React, {useState} from 'react';
import {Gauge, KeyRound, User as UserIcon, AlertCircle} from 'lucide-react';
import {loginUser} from '../../services/authService';
import {logAuditAction} from '../../services/auditService';
import type {User} from '../../types';

interface LoginModalProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({onLoginSuccess}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await loginUser(username.trim(), password);
      if (result.success && result.user) {
        await logAuditAction(result.user.username, 'login', 'auth', 'Inicio de sesión local exitoso.');
        onLoginSuccess(result.user);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al procesar el inicio de sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  const setCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-6 text-white text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner mb-3">
            <Gauge className="w-8 h-8 text-sky-300" />
          </div>
          <h2 className="text-xl font-black tracking-wide">AIRMAINT 360 MVP</h2>
          <p className="text-xs text-sky-200 mt-1">Control y Mantenimiento de Compresores Industriales</p>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-200 text-[10px] font-mono border border-sky-400/30">
            PWA OFFLINE-FIRST
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Usuario</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nombre de usuario"
                className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Contraseña</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            {isLoading ? 'Verificando...' : 'Ingresar al Sistema'}
          </button>

          {/* Quick Demo Credentials Helper */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 mb-2 text-center">
              Usuarios de Demostración Locales:
            </p>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <button
                type="button"
                onClick={() => setCredentials('admin', 'admin123')}
                className="p-1.5 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-[11px] transition"
              >
                <div className="font-bold text-purple-700">admin</div>
                <div className="text-[10px] text-slate-400">admin123</div>
              </button>
              <button
                type="button"
                onClick={() => setCredentials('tecnico', 'tec123')}
                className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-[11px] transition"
              >
                <div className="font-bold text-blue-700">tecnico</div>
                <div className="text-[10px] text-slate-400">tec123</div>
              </button>
              <button
                type="button"
                onClick={() => setCredentials('consulta', 'consulta123')}
                className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-[11px] transition"
              >
                <div className="font-bold text-slate-700">consulta</div>
                <div className="text-[10px] text-slate-400">consulta123</div>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
