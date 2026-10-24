// Věty v patře Čtení jako ve slabikáři ALTER („EMA MÁ MÍSU.“, „PEPA MÁ PILU.“; Ondřej 24. 10. 2026: „Přidej věty“).
// Dítě větu přečte a kopne do obrázku, o kterém věta je. Věta = kdo + co dělá + co (4. pád);
// hra bere jen věty, které jdou přečíst se zapnutými písmeny (logic/letters.ts wordFits).
// kdo: jména a lidé ze slabikáře; MÁME = my
export const WHO: string[] = ['EMA', 'OLA', 'ELA', 'EMIL', 'LEO', 'MÁMA', 'PEPA', 'TOM', 'TÁTA', 'TETA', 'MÍLA', 'SAM', 'JULA', 'OTA', 'LILI'];
// co: klíč = obrázek v content/pictures.ts, hodnota = slovo ve 4. pádě
export const OBJ: Record<string, string> = { MÍSA: 'MÍSU', MASO: 'MASO', SŮL: 'SŮL', LAMA: 'LAMU', SLÁMA: 'SLÁMU', PILA: 'PILU', MAPA: 'MAPU', LUPA: 'LUPU', PES: 'PSA', OSEL: 'OSLA', LOS: 'LOSA', ÚL: 'ÚL' };
// co dělá a s čím to dává smysl
export const VERBS: { v: string; objs: string[] }[] = [
  { v: 'MÁ', objs: Object.keys(OBJ) },
  { v: 'SOLÍ', objs: ['MASO'] },
  { v: 'LEPÍ', objs: ['MAPA'] },
  { v: 'MELE', objs: ['SŮL'] },
];
