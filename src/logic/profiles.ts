// Profily hráčů (Ondřej 20. 10. 2026: testovat bez zásahu do Adamových statistik; hru si může zahrát i někdo jiný).
// Adamův profil zůstává pod původním klíčem, ostatní mají klíč s příponou. Seznam profilů je zvlášť (PROFILES_KEY).
export const MAIN_ID = 'adam';
export const PROFILES_KEY = 'adamuv-dul-profily';
export interface Profile { id: string; name: string }
export interface Registry { active: string; list: Profile[] }

export const defaultRegistry = (): Registry => ({ active: MAIN_ID, list: [{ id: MAIN_ID, name: 'Adam' }] });
export const keyFor = (id: string): string => id === MAIN_ID ? 'adamuv-dul-v1' : `adamuv-dul-v1:${id}`;
export const backupKeyFor = (id: string): string => id === MAIN_ID ? 'adamuv-dul-zaloha' : `adamuv-dul-zaloha:${id}`;

// načte seznam z textu; poškozený nebo chybějící = jen Adam
export function parseRegistry(raw: string | null): Registry {
  try {
    const r = JSON.parse(raw || '');
    if (!r || !Array.isArray(r.list)) return defaultRegistry();
    const list = r.list.filter((p: Profile) => p && typeof p.id === 'string' && typeof p.name === 'string');
    if (!list.some((p: Profile) => p.id === MAIN_ID)) list.unshift(defaultRegistry().list[0]);
    return { active: list.some((p: Profile) => p.id === r.active) ? r.active : MAIN_ID, list };
  } catch { return defaultRegistry(); }
}
// nový profil; vrací jeho id
export function addProfile(r: Registry, name: string, rng: () => number = Math.random): string {
  const id = 'p' + Math.floor(rng() * 36 ** 5).toString(36);
  r.list.push({ id, name: name.trim().slice(0, 24) || 'Host' });
  return id;
}
// smazat jde každý profil kromě Adamova; aktivní se přepne na Adama
export function removeProfile(r: Registry, id: string): boolean {
  if (id === MAIN_ID) return false;
  const n = r.list.length; r.list = r.list.filter(p => p.id !== id);
  if (r.active === id) r.active = MAIN_ID;
  return r.list.length < n;
}
export const activeProfile = (r: Registry): Profile => r.list.find(p => p.id === r.active) || r.list[0];
