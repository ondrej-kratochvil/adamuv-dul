// Novinky mezi verzemi: od nejstarší po nejnovější (Ondřej 20. 10. 2026), ať Adam čte příběh, jak hra rostla.
export interface Change { version: number; date?: string; notes: string[] }
export function changesBetween(changes: readonly Change[], from: number, to: number): Change[] {
  return changes.filter(c => c.version > from && c.version <= to).slice().sort((a, b) => a.version - b.version);
}
export function notesBetween(changes: readonly Change[], from: number, to: number): string[] {
  return changesBetween(changes, from, to).flatMap(c => c.notes);
}
// číslo verze k přečtení a ukázání (Adam rád sleduje čísla verzí Minecraftu, Ondřej 20. 10. 2026)
export const versionLabel = (v: number): string => `verze ${v}`;
