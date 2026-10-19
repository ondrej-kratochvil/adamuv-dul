// Nástroje a zbraně z materiálů (Ondřej, 19. 10. 2026: Adam má rád meč, motyku… z různých materiálů a s očarováním;
// zamčené mají být vidět, ať ví, co ho čeká). Každý nástroj patří k patrům; materiál roste se zvládnutím těch pater.
export interface Material { id: string; m: string; f: string; head: string; dark: string }
export const MATERIALS: Material[] = [
  { id: 'wood', m: 'dřevěný', f: 'dřevěná', head: '#a37f4c', dark: '#6b4a31' },
  { id: 'stone', m: 'kamenný', f: 'kamenná', head: '#9a9a9a', dark: '#5c5c5c' },
  { id: 'iron', m: 'železný', f: 'železná', head: '#e2e2e2', dark: '#8f8f8f' },
  { id: 'gold', m: 'zlatý', f: 'zlatá', head: '#f2c94c', dark: '#c9a227' },
  { id: 'diamond', m: 'diamantový', f: 'diamantová', head: '#5de0e6', dark: '#1f8f99' },
  { id: 'netherite', m: 'netheritový', f: 'netheritová', head: '#4a4245', dark: '#2b2628' },
];
// podíl zvládnutých úkolů v patrech nástroje, od kterého je materiál k dispozici (netherit až při všech)
export const MATERIAL_STEPS = [0, .2, .4, .6, .8, 1];

export interface Tool { id: 'sword' | 'axe' | 'shovel' | 'hoe'; name: string; fem: boolean; levels: string[]; levelNames: string; map: string[] }
// mapy 16 × 16: H hlava (materiál), D tmavší hrana, S násada, K tmavá násada
export const TOOLS: Tool[] = [
  { id: 'sword', name: 'meč', fem: false, levels: ['math', 'numbers'], levelNames: 'Počty a Čísla', map: [
    '..............DD', '.............DHD', '............DHD.', '...........DHD..', '..........DHD...', '.........DHD....', '........DHD.....', '...KK..DHD......',
    '...KDKDHD.......', '....KDHD........', '....SKD.........', '...SKKDK........', '..SK...K........', '.SK.............', 'KK..............', '................'] },
  { id: 'axe', name: 'sekera', fem: true, levels: ['writing'], levelNames: 'Psaní', map: [
    '................', '......DD........', '.....DHHD.......', '....DHHHSD......', '....DHHSKHD.....', '.....DSKHHD.....', '.....SK.DD......', '....SK..........',
    '...SK...........', '..SK............', '.SK.............', 'SK..............', 'K...............', '................', '................', '................'] },
  { id: 'shovel', name: 'lopata', fem: true, levels: ['letters', 'syllables'], levelNames: 'Písmena a Slabiky', map: [
    '................', '..........DDD...', '.........DHHHD..', '.........DHHHD..', '.........DHHD...', '........SKDD....', '.......SK.......', '......SK........',
    '.....SK.........', '....SK..........', '...SK...........', '..SK............', '.SK.............', 'KK..............', '................', '................'] },
  { id: 'hoe', name: 'motyka', fem: true, levels: ['words', 'reading'], levelNames: 'Slova a Čtení', map: [
    '................', '.......DDDD.....', '......DHHHSD....', '.......DDSK.....', '........SK......', '.......SK.......', '......SK........', '.....SK.........',
    '....SK..........', '...SK...........', '..SK............', '.SK.............', 'KK..............', '................', '................', '................'] },
];
export const toolName = (t: Tool, mat: number): string => `${t.fem ? MATERIALS[mat].f : MATERIALS[mat].m} ${t.name}`;
