import {getDB, hashString} from '../db/indexedDb';
import type {User, Role} from '../types';

export interface AuthSession {
  user: User;
  lastActivity: number;
  isLocked: boolean;
}

const SESSION_KEY = 'airmaint360_auth_session';

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export async function loginUser(username: string, passwordPlain: string): Promise<{success: boolean; user?: User; message: string}> {
  const db = await getDB();
  const user = await db.getFromIndex('users', 'by-username', username);

  if (!user || !user.isActive) {
    return {success: false, message: 'Usuario no encontrado o inactivo.'};
  }

  const inputHash = await hashString(passwordPlain);
  if (user.passwordHash !== inputHash) {
    return {success: false, message: 'Contraseña incorrecta.'};
  }

  const session: AuthSession = {
    user,
    lastActivity: Date.now(),
    isLocked: false,
  };
  saveSession(session);

  return {success: true, user, message: 'Inicio de sesión exitoso.'};
}

export async function unlockSession(passwordPlain: string): Promise<boolean> {
  const session = getStoredSession();
  if (!session) return false;

  const db = await getDB();
  const user = await db.get('users', session.user.id);
  if (!user) return false;

  const inputHash = await hashString(passwordPlain);
  if (user.passwordHash === inputHash) {
    session.isLocked = false;
    session.lastActivity = Date.now();
    saveSession(session);
    return true;
  }
  return false;
}

export async function changeUserPassword(userId: string, oldPasswordPlain: string, newPasswordPlain: string): Promise<{success: boolean; message: string}> {
  const db = await getDB();
  const user = await db.get('users', userId);
  if (!user) return {success: false, message: 'Usuario no encontrado.'};

  const oldHash = await hashString(oldPasswordPlain);
  if (user.passwordHash !== oldHash) {
    return {success: false, message: 'La contraseña actual no es correcta.'};
  }

  const newHash = await hashString(newPasswordPlain);
  user.passwordHash = newHash;
  user.updatedAt = new Date().toISOString();
  await db.put('users', user);

  // Update session if it's the current user
  const session = getStoredSession();
  if (session && session.user.id === userId) {
    session.user = user;
    saveSession(session);
  }

  return {success: true, message: 'Contraseña actualizada exitosamente.'};
}

export function checkPermission(role: Role, requiredRole: Role): boolean {
  if (role === 'admin') return true;
  if (role === 'technician') {
    return requiredRole === 'technician' || requiredRole === 'viewer';
  }
  if (role === 'viewer') {
    return requiredRole === 'viewer';
  }
  return false;
}
