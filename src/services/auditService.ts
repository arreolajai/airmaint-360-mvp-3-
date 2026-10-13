import {getDB} from '../db/indexedDb';
import type {AuditLog, AuditAction} from '../types';

export async function logAuditAction(
  user: string,
  action: AuditAction,
  module: AuditLog['module'],
  description: string,
  entityId?: string
): Promise<void> {
  try {
    const db = await getDB();
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user: user || 'sistema',
      action,
      module,
      entityId,
      description,
      schemaVersion: 1,
    };
    await db.put('auditLogs', log);
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}
