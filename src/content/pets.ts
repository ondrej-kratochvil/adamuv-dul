// Zvířátka rodiny (Ondřej 25. 10. 2026: „Adam by chtěl, aby v rodině byla i naše zvířátka“). Kdo je má, jak se jmenují
// a druhy jsou v datech hráče (content/player-adam.ts); tady jsou jen pixelové obrázky 16 × 16 podle druhu.
// Barvy, které rodina neřekla, jsou provizorní (color v datech hráče je přepíše).
export type Painter = (x: number, y: number, w: number, h: number, color: string) => void;
export type PetKind = 'snake' | 'rabbit' | 'mice' | 'cat' | 'dog' | 'parrot' | 'aquarium' | 'hamster';
export const PET_KINDS: PetKind[] = ['snake', 'rabbit', 'mice', 'cat', 'dog', 'parrot', 'aquarium', 'hamster'];

const EYE = '#111111';
export const PET_ART: Record<PetKind, (R: Painter, color?: string, stripes?: boolean) => void> = {
  // užovka červená: oranžovočervená s tmavšími skvrnami, esovitě stočená
  snake: (R, c = '#e0612e') => {
    const D = '#9a2a14';
    R(1, 12, 6, 2, c); R(5, 10, 2, 3, c); R(5, 9, 6, 2, c); R(10, 6, 2, 4, c); R(8, 5, 4, 2, c); R(7, 3, 2, 3, c); R(7, 2, 5, 2, c); R(11, 2, 3, 3, c);
    R(2, 12, 1, 2, D); R(5, 11, 2, 1, D); R(8, 9, 1, 2, D); R(10, 7, 2, 1, D); R(7, 4, 2, 1, D);
    R(13, 3, 1, 1, EYE); R(14, 4, 2, 1, '#c0392b');
  },
  // zakrslý králík: krátké uši, kulaté tělo
  rabbit: (R, c = '#b9a48a') => {
    R(3, 8, 9, 6, c); R(9, 5, 5, 5, c); R(10, 2, 2, 4, c); R(12, 2, 1, 3, c); R(10, 3, 1, 2, '#e8b4b4');
    R(12, 6, 1, 1, EYE); R(14, 8, 1, 1, '#e88a9a'); R(2, 9, 2, 2, '#f4f4f4'); R(4, 14, 2, 1, c); R(10, 14, 2, 1, c);
  },
  // dvě bílé myšky s růžovýma ušima a ocásky
  mice: (R) => {
    const W = '#f4f4f4', P = '#f0a8b8';
    R(1, 10, 5, 3, W); R(5, 9, 2, 3, W); R(5, 8, 1, 1, P); R(6, 10, 1, 1, '#c0392b'); R(0, 12, 1, 1, P);
    R(9, 6, 5, 3, W); R(13, 5, 2, 3, W); R(13, 4, 1, 1, P); R(14, 6, 1, 1, '#c0392b'); R(8, 8, 1, 1, P); R(7, 9, 1, 1, P);
  },
  // kočka: sedící z boku; stripes = mourovatá
  cat: (R, c = '#8a8a8a', stripes = false) => {
    R(3, 8, 8, 6, c); R(9, 4, 5, 5, c); R(9, 3, 1, 1, c); R(13, 3, 1, 1, c); R(1, 7, 2, 2, c); R(2, 9, 1, 4, c);
    R(10, 6, 1, 1, '#7ac043'); R(12, 6, 1, 1, '#7ac043'); R(11, 7, 1, 1, '#e88a9a'); R(4, 14, 2, 1, c); R(9, 14, 2, 1, c);
    if (stripes) { const S = '#4a4a4a'; R(5, 8, 1, 6, S); R(7, 8, 1, 6, S); R(10, 4, 1, 1, S); R(12, 4, 1, 1, S); R(1, 7, 1, 1, S); }
  },
  // bernský salašnický pes: černý, bílá hruď a lysina, hnědé tváře a nohy
  dog: (R) => {
    const K = '#1d1712', W = '#f4f4f4', B = '#a5622e';
    R(2, 7, 9, 5, K); R(9, 4, 5, 5, K); R(8, 4, 2, 4, K); R(11, 4, 1, 4, W); R(10, 8, 4, 2, B); R(9, 9, 3, 3, W);
    R(10, 6, 1, 1, '#d8a060'); R(13, 6, 1, 1, '#d8a060'); R(14, 8, 1, 1, K);
    R(3, 12, 2, 3, B); R(8, 12, 2, 3, B); R(3, 14, 2, 1, W); R(8, 14, 2, 1, W); R(1, 6, 2, 3, K);
  },
  // papoušek na bidýlku
  parrot: (R, c = '#4caf50') => {
    R(1, 13, 14, 1, '#7a5230'); R(6, 4, 5, 9, c); R(7, 2, 4, 3, c); R(10, 3, 2, 2, '#f2c94c'); R(11, 4, 1, 1, '#333333');
    R(8, 3, 1, 1, EYE); R(5, 6, 2, 6, '#2e7d32'); R(7, 12, 2, 3, c); R(7, 13, 1, 1, '#555555'); R(9, 13, 1, 1, '#555555');
  },
  // akvárium dědy Rudy: skaláry (stříbrné s černými pruhy) a vodní rostliny
  aquarium: (R) => {
    R(0, 2, 16, 1, '#555555'); R(0, 15, 16, 1, '#555555'); R(0, 2, 1, 14, '#555555'); R(15, 2, 1, 14, '#555555');
    R(1, 3, 14, 12, '#bfe3f7'); R(1, 13, 14, 2, '#d8c38a');
    R(2, 6, 1, 7, '#2e8b3a'); R(3, 8, 1, 5, '#3fa04a'); R(13, 5, 1, 8, '#2e8b3a'); R(12, 9, 1, 4, '#3fa04a'); R(4, 10, 1, 3, '#2e8b3a');
    const fish = (x: number, y: number) => { R(x, y, 3, 3, '#e8e8e8'); R(x + 1, y - 2, 1, 2, '#e8e8e8'); R(x + 1, y + 3, 1, 2, '#e8e8e8'); R(x + 1, y - 1, 1, 5, '#222222'); R(x + 3, y + 1, 1, 1, '#d8d8d8'); R(x, y + 1, 1, 1, EYE); };
    fish(5, 6); fish(9, 9);
  },
  // křeček: kulatý, bílé bříško
  hamster: (R, c = '#d9a45a') => {
    R(3, 7, 10, 7, c); R(4, 6, 8, 1, c); R(4, 5, 2, 2, c); R(10, 5, 2, 2, c); R(4, 5, 1, 1, '#e8b4b4'); R(11, 5, 1, 1, '#e8b4b4');
    R(5, 10, 6, 4, '#f6eee0'); R(6, 8, 1, 1, EYE); R(9, 8, 1, 1, EYE); R(7, 9, 2, 1, '#e88a9a'); R(4, 14, 2, 1, '#e8b4b4'); R(10, 14, 2, 1, '#e8b4b4');
  },
};

// Převlékání zvířátek (Ondřej 25. 10. 2026): věci z obchodu jsou kreslené na lidský obličej (oči na řádku 6, střed x 8);
// u zvířátka se posunou na jeho hlavu. null = převléct nejde (akvárium).
export const WEAR_SHIFT: Record<PetKind, [number, number] | null> = {
  snake: [4, -3], rabbit: [4, 1], mice: [6, -1], cat: [3, 0], dog: [3, 0], parrot: [1, -3], aquarium: null, hamster: [0, 2],
};
