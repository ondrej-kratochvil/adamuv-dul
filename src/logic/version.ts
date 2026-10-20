// Novinky mezi verzemi: od nejstarší po nejnovější (Ondřej 20. 10. 2026), ať Adam čte příběh, jak hra rostla.
export interface Change { version: number; date?: string; notes: string[] }
export function notesBetween(changes: readonly Change[], from: number, to: number): string[] {
  return changes.filter(c => c.version > from && c.version <= to).slice().sort((a, b) => a.version - b.version).flatMap(c => c.notes);
}
