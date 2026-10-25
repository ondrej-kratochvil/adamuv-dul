// Zvířátka rodiny se odemykají postupně: jedno za každý splněný dnešní úkol (Ondřej 25. 10. 2026: „Nechci, aby měl
// Adámek zvířátka ve hře hned. Měla by se odemykat postupně za splněné úkoly.“). Pořadí = pořadí v datech hráče.
import type { Pet, Player } from './player';

export const unlockedPets = (p: Player, questsDone: number): Pet[] => (p.pets || []).slice(0, Math.max(0, questsDone));
// zvířátko, které právě přibylo po n-tém splněném úkolu (null = žádné, třeba když už jsou všechna)
export const petForQuest = (p: Player, questsDone: number): Pet | null => (p.pets || [])[questsDone - 1] || null;
// kolik úkolů ještě chybí do odemčení zvířátka na pozici i
export const questsLeft = (index: number, questsDone: number): number => Math.max(0, index + 1 - questsDone);
