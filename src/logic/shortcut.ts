// Zkratky na ikoně aplikace (manifest „shortcuts“, Ondřej 31. 10. 2026): podržením ikony rovnou dnešní úkol nebo procvičování.
export type Shortcut = 'quest' | 'practice' | null;
export function shortcutTarget(search: string): Shortcut {
  const go = new URLSearchParams(search).get('go');
  return go === 'ukol' ? 'quest' : go === 'procvicit' ? 'practice' : null;
}
