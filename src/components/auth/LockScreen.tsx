import React, {useState} from 'react';
import {Lock, KeyRound, AlertCircle, LogOut} from 'lucide-react';
import {unlockSession} from '../../services/authService';
import type {User} from '../../types';

interface LockScreenProps {
  user: User;
  onUnlocked: () => void;
  onLogout: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({user, onUnlocked, onLogout}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(false);

    const ok = await unlockSession(password);
    setIsVerifying(false);
    if (ok) {
      onUnlocked();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-white">Sesión Bloqueada</h2>
          <p className="text-xs text-slate-400 mt-1">Por inactividad o seguridad local</p>
          <div className="mt-2 text-sm font-semibold text-blue-400">{user.fullName}</div>
          <span className="text-[10px] text-slate-500 font-mono uppercase">({user.role})</span>
        </div>

        <form onSubmit={handleUnlock} className="space-y-3">
          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-800">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Contraseña incorrecta</span>
            </div>
          )}

          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña para desbloquear"
              className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow transition disabled:opacity-50"
          >
            {isVerifying ? 'Desbloqueando...' : 'Desbloquear'}
          </button>
        </form>

        <button
          onClick={onLogout}
          className="flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-red-400 mx-auto transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cambiar de usuario</span>
        </button>
      </div>
    </div>
  );
};
