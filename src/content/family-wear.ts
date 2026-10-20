// Převlékání rodiny (Ondřej 20. 10. 2026: „Podívej se, co jsem dal na hlavu babičce!“). Adam kupuje kousky za smaragdy
// a dává je na portréty. Koupený kousek má napořád a může ho dát komukoli. Kreslí se přes portrét 16 × 16
// (obličej x 4–11, y 3–10, oči y 6, nos y 7–8, pusa y 9). Na každém místě (slot) jeden kousek.
import type { Painter } from './pictures';

export type Slot = 'head' | 'eyes' | 'nose' | 'mouth';
export interface Wear { id: string; name: string; acc: string; slot: Slot; price: number; need?: number; paint: (R: Painter) => void }
export const SLOT_NAMES: Record<Slot, string> = { head: 'Na hlavu', eyes: 'Na oči', nose: 'Na nos', mouth: 'Na pusu' };

export const WEAR: Wear[] = [
  // na hlavu
  { id: 'cepice', name: 'čepice s bambulí', acc: 'čepici s bambulí', slot: 'head', price: 8, paint: R => { R(4, 1, 8, 3, '#c62f2f'); R(4, 3, 8, 1, '#f4f4f4'); R(7, 0, 2, 1, '#f4f4f4'); } },
  { id: 'kovboj', name: 'kovbojský klobouk', acc: 'kovbojský klobouk', slot: 'head', price: 12, paint: R => { R(5, 0, 6, 3, '#8a5a2e'); R(5, 2, 6, 1, '#3a2414'); R(2, 3, 12, 1, '#7a4a24'); } },
  { id: 'hornik', name: 'helma horníka', acc: 'helmu horníka', slot: 'head', price: 12, paint: R => { R(3, 1, 10, 3, '#f2c94c'); R(3, 3, 10, 1, '#c9a020'); R(7, 1, 2, 2, '#fff6b0'); } },
  { id: 'kuchar', name: 'kuchařská čepice', acc: 'kuchařskou čepici', slot: 'head', price: 10, paint: R => { R(4, 0, 8, 2, '#ffffff'); R(5, 2, 6, 1, '#ffffff'); R(5, 3, 6, 1, '#d8d8d8'); R(4, 0, 1, 1, '#e8e8e8'); R(11, 0, 1, 1, '#e8e8e8'); } },
  { id: 'vikinsky', name: 'vikingská helma', acc: 'vikingskou helmu', slot: 'head', price: 15, paint: R => { R(4, 1, 8, 3, '#9a9a9a'); R(4, 3, 8, 1, '#6c6c6c'); R(2, 0, 2, 1, '#efe9dc'); R(2, 1, 1, 2, '#efe9dc'); R(12, 0, 2, 1, '#efe9dc'); R(13, 1, 1, 2, '#efe9dc'); } },
  { id: 'party', name: 'párty klobouček', acc: 'párty klobouček', slot: 'head', price: 8, paint: R => { R(7, 0, 2, 1, '#f2c94c'); R(6, 1, 4, 1, '#2f7fd1'); R(5, 2, 6, 1, '#e8459a'); R(5, 3, 6, 1, '#3f9b3a'); } },
  { id: 'zajic', name: 'zaječí uši', acc: 'zaječí uši', slot: 'head', price: 10, paint: R => { R(5, 0, 2, 3, '#f4f4f4'); R(9, 0, 2, 3, '#f4f4f4'); R(6, 0, 1, 2, '#f0a8b0'); R(9, 0, 1, 2, '#f0a8b0'); } },
  { id: 'paruka', name: 'duhová paruka', acc: 'duhovou paruku', slot: 'head', price: 18, paint: R => { ['#c62f2f', '#f08c1e', '#f2c94c', '#3f9b3a', '#2f7fd1', '#7d4bc2'].forEach((c, i) => { R(1 + i * 2, 0, 2, 3, c); R(1 + i * 2, 1, 2, 2, c); }); R(1, 3, 3, 6, '#7d4bc2'); R(12, 3, 3, 6, '#c62f2f'); } },
  { id: 'dyne', name: 'dýně', acc: 'dýni na hlavu', slot: 'head', price: 15, paint: R => { R(3, 1, 10, 10, '#e8862a'); R(7, 0, 2, 1, '#3f8a2a'); R(5, 3, 1, 8, '#c8681a'); R(10, 3, 1, 8, '#c8681a'); R(5, 4, 2, 2, '#1d1712'); R(9, 4, 2, 2, '#1d1712'); R(5, 8, 6, 1, '#1d1712'); R(6, 9, 1, 1, '#1d1712'); R(9, 9, 1, 1, '#1d1712'); } },
  // vzácná: jen za zvládnuté úkoly (podíl ze všech, jako vzácné věci v obchodě)
  { id: 'koruna', name: 'zlatá koruna', acc: 'zlatou korunu', slot: 'head', price: 40, need: .25, paint: R => { R(4, 2, 8, 2, '#f2c94c'); R(4, 0, 1, 2, '#f2c94c'); R(7, 0, 2, 2, '#f2c94c'); R(11, 0, 1, 2, '#f2c94c'); R(6, 2, 1, 1, '#c62f2f'); R(9, 2, 1, 1, '#2f7fd1'); R(4, 3, 8, 1, '#c9a020'); } },
  // na oči
  { id: 'slunecni', name: 'sluneční brýle', acc: 'sluneční brýle', slot: 'eyes', price: 8, paint: R => { R(4, 5, 8, 1, '#161616'); R(4, 6, 3, 2, '#161616'); R(9, 6, 3, 2, '#161616'); R(5, 6, 1, 1, '#5a5a5a'); R(10, 6, 1, 1, '#5a5a5a'); } },
  { id: 'srdicka', name: 'srdíčkové brýle', acc: 'srdíčkové brýle', slot: 'eyes', price: 10, paint: R => { [4, 9].forEach(x => { R(x, 5, 1, 1, '#e8459a'); R(x + 2, 5, 1, 1, '#e8459a'); R(x, 6, 3, 1, '#e8459a'); R(x + 1, 7, 1, 1, '#e8459a'); }); R(7, 6, 2, 1, '#e8459a'); } },
  { id: 'pirat', name: 'pirátská páska', acc: 'pirátskou pásku', slot: 'eyes', price: 10, paint: R => { R(3, 4, 10, 1, '#161616'); R(8, 5, 3, 3, '#161616'); } },
  { id: 'potapec', name: 'potápěčské brýle', acc: 'potápěčské brýle', slot: 'eyes', price: 12, paint: R => { R(3, 6, 1, 1, '#161616'); R(12, 6, 1, 1, '#161616'); R(4, 5, 8, 3, '#2f7fd1'); R(5, 6, 2, 1, '#bfe3f5'); R(9, 6, 2, 1, '#bfe3f5'); } },
  // na nos
  { id: 'klaun', name: 'klaunský nos', acc: 'klaunský nos', slot: 'nose', price: 6, paint: R => { R(7, 7, 2, 2, '#e02020'); R(7, 7, 1, 1, '#ff8080'); } },
  { id: 'rypacek', name: 'prasečí rypáček', acc: 'prasečí rypáček', slot: 'nose', price: 8, paint: R => { R(6, 7, 4, 2, '#f0a8b0'); R(7, 8, 1, 1, '#a85060'); R(8, 8, 1, 1, '#a85060'); } },
  // na pusu
  { id: 'knir', name: 'knír', acc: 'knír', slot: 'mouth', price: 8, paint: R => { R(5, 8, 6, 1, '#3a2414'); R(4, 9, 1, 1, '#3a2414'); R(11, 9, 1, 1, '#3a2414'); } },
  { id: 'carodej', name: 'čarodějné vousy', acc: 'čarodějné vousy', slot: 'mouth', price: 15, paint: R => { R(5, 9, 6, 3, '#f4f4f4'); R(6, 12, 4, 2, '#f4f4f4'); R(7, 14, 2, 1, '#f4f4f4'); R(7, 9, 2, 1, '#9b4a3c'); } },
  { id: 'dudlik', name: 'dudlík', acc: 'dudlík', slot: 'mouth', price: 6, paint: R => { R(6, 9, 4, 1, '#2f7fd1'); R(7, 10, 2, 1, '#f2c94c'); } },
  { id: 'jazyk', name: 'vyplazený jazyk', acc: 'vyplazený jazyk', slot: 'mouth', price: 6, paint: R => { R(7, 9, 2, 1, '#9b4a3c'); R(7, 10, 2, 1, '#e86080'); } },
];
export const wearById = (id: string): Wear | undefined => WEAR.find(w => w.id === id);
