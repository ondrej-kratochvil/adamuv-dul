// Schoolcraft online (server worker/index.ts): přihlášení zařízení, týdenní body do žebříčku, co se zálohuje.
import type { LogEntry } from '../save/schema';
import { dayNum } from './calendar';

// on = posílat na server (záloha, statistiky), pub = být vidět v žebříčku (testovací profil se zálohuje, ale v žebříčku není)
export interface Cloud { id: string; secret: string; on: boolean; pub: boolean; nick: string; last: number; queue: Record<string, unknown>[]; error: string }
// online jen se souhlasem rodiče (31. 10. 2026): nový hráč začíná vypnutý, zapne se v úvodním nastavení nebo na kartě Online
export const cloudDefaults = (): Cloud => ({ id: '', secret: '', on: false, pub: true, nick: '', last: 0, queue: [], error: '' });
export const QUEUE_MAX = 2000, EVENTS_BATCH = 100, PUSH_EVERY_MS = 30000;

// pondělí týdne podle místního času zařízení (stejně jako server, worker/logic.ts weekKey)
export function weekOf(ds: string): string {
  const [y, m, d] = ds.split('-').map(Number), t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() - (t.getUTCDay() + 6) % 7);
  return t.toISOString().slice(0, 10);
}
// body za týden: povedené kolo 1, splněný dnešní úkol 3 (rozhodnutí Ondřeje 24. 10. 2026: týdenní body, od pondělí znovu)
export const QUEST_POINTS = 3;
export function weekPoints(log: readonly Pick<LogEntry, 'd' | 'ok' | 'quit'>[], questLog: readonly string[], week: string): number {
  const inWeek = (ds: string) => dayNum(ds) >= dayNum(week) && dayNum(ds) < dayNum(week) + 7;
  return log.filter(e => e.ok && !e.quit && inWeek(e.d)).length + QUEST_POINTS * questLog.filter(inWeek).length;
}
// kód pro přenos na jiné zařízení: „id.tajemstvi“
export const codeOf = (c: Pick<Cloud, 'id' | 'secret'>): string => c.id && c.secret ? `${c.id}.${c.secret}` : '';
export function parseCode(s: string): { id: string; secret: string } | null {
  const m = /^\s*([a-f0-9-]{36})\.([a-f0-9]{64})\s*$/.exec(s || '');
  return m ? { id: m[1], secret: m[2] } : null;
}
// záloha na serveru: celý postup bez přihlašovacích údajů a bez nastavení tabulky Google (patří k zařízení)
export function backupOf(save: Record<string, unknown>): Record<string, unknown> {
  const { cloud: _c, sync: _s, ...rest } = save; void _c; void _s;
  return rest;
}
