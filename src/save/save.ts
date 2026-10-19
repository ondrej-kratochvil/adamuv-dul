// Uložený postup v tabletu (localStorage). Před převodem starší verze se uloží záloha.
import { defaults, migrate, SCHEMA, type SaveState } from './schema';

export const KEY = 'adamuv-dul-v1';
export const BACKUP_KEY = 'adamuv-dul-zaloha';

function read(): SaveState {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch { /* soukromé okno: hraje se bez ukládání */ }
  if (!raw) return defaults();
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch {
    // poškozená data nemazat: odložit do zálohy a začít načisto
    try { localStorage.setItem(BACKUP_KEY, raw); } catch { /* nic */ }
    return defaults();
  }
  const old = (parsed as { schema?: number })?.schema ?? 1;
  if (old < SCHEMA) { try { localStorage.setItem(BACKUP_KEY, raw); } catch { /* nic */ } }
  return migrate(parsed);
}

export const save: SaveState = read();

export function persist(): void { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch { /* nic */ } }

// nahradí celý obsah uloženého stavu (save zůstává stejný objekt, ostatní moduly na něj drží odkaz)
export function replaceSave(next: SaveState): void {
  for (const k of Object.keys(save)) delete save[k];
  Object.assign(save, next);
}

export { defaults };
