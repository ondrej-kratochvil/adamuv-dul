// Aktivní hráč (logic/player.ts): Adam vestavěný ('adam'), ostatní jako data v uloženém postupu.
import { save } from '../save/save.ts';
import { ADAM } from '../content/player-adam.ts';
import { blankPlayer, g } from '../logic/player.ts';

function player() { const s = save.player; return s === 'adam' ? ADAM : s && typeof s === 'object' ? s : blankPlayer(); }
// oslovení: Adame (bez jména „kamaráde“)
function voc() { const p = player(); return p.voc || g(p, 'kamaráde', 'kamarádko'); }
// tvar podle rodu hráče: gx('Splnil', 'Splnila')
function gx(m, f) { return g(player(), m, f); }

export { gx, player, voc };
