// Materiál nástroje podle zvládnutí jeho pater. Dosažený materiál se nikdy nebere (drží se nejvyšší).
import { MATERIAL_STEPS, TOOLS, type Tool } from '../content/tools';
import { levelProgress, type Stats } from './mastery';

export function toolProgress(stats: Stats, t: Tool): { got: number; all: number } {
  return t.levels.reduce((a, lv) => { const p = levelProgress(stats, lv); return { got: a.got + p.got, all: a.all + p.all }; }, { got: 0, all: 0 });
}
// nejvyšší materiál, na který má Adam teď nárok (0 = dřevo)
export function toolStage(stats: Stats, t: Tool): number {
  const { got, all } = toolProgress(stats, t), f = all ? got / all : 0;
  let s = 0;
  MATERIAL_STEPS.forEach((step, i) => { if (f >= step) s = i; });
  return s;
}
// kolik zvládnutých úkolů chybí k dalšímu materiálu
export function toolNeed(stats: Stats, t: Tool, stage: number): number {
  if (stage >= MATERIAL_STEPS.length - 1) return 0;
  const { got, all } = toolProgress(stats, t);
  return Math.max(0, Math.ceil(MATERIAL_STEPS[stage + 1] * all) - got);
}
// porovná s uloženým nejvyšším stavem; vrátí nově odemčené (a uložený stav posune)
export function updateTools(stats: Stats, stages: Record<string, number>): { tool: Tool; stage: number }[] {
  const out: { tool: Tool; stage: number }[] = [];
  for (const t of TOOLS) {
    const now = toolStage(stats, t), was = stages[t.id] ?? 0;
    if (now > was) { stages[t.id] = now; out.push({ tool: t, stage: now }); }
    else if (stages[t.id] === undefined) stages[t.id] = was;
  }
  return out;
}
