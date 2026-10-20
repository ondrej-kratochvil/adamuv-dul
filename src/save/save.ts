// Uložený postup v tabletu (localStorage). Před převodem starší verze se uloží záloha.
import { defaults, migrate, SCHEMA, type SaveState } from './schema';
import { PROFILES_KEY, activeProfile, backupKeyFor, keyFor, parseRegistry, type Registry } from '../logic/profiles';

// aktivní profil hráče (logic/profiles.ts); přepnutí profilu znovu načte stránku
function readRegistry(): Registry { try { return parseRegistry(localStorage.getItem(PROFILES_KEY)); } catch { return parseRegistry(null); } }
export const registry: Registry = readRegistry();
export const profile = activeProfile(registry);
export const KEY = keyFor(profile.id);
export const BACKUP_KEY = backupKeyFor(profile.id);
export function saveRegistry(): void { try { localStorage.setItem(PROFILES_KEY, JSON.stringify(registry)); } catch { /* nic */ } }

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
