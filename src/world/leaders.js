// Žebříček (Schoolcraft online, Ondřej 24. 10. 2026): týdenní body, postavička v oblečení a co kdo má postavené.
// Co má jiný hráč víc než ty, je zvýrazněné (motivace dohnat bratrance a spolužáky).
import { $ } from '../core/dom.js';
import { save } from '../save/save.ts';
import { speak } from '../audio/speech.js';
import { audio } from '../audio/sfx.js';
import { show } from '../ui/screens.js';
import { pickCanvas, playerCanvas, tierOf } from '../gfx/player.js';
import { leaderboard, summary, syncCloud } from '../app/cloud.js';
import { FARM_STAGES } from './farm.js';

const withPoints = n => `${n} ${n === 1 ? 'bodem' : 'body'}`; // „s 15 body“ (7. pád)
const pointWord = n => n === 1 ? 'bod' : n >= 2 && n <= 4 ? 'body' : 'bodů';
// odznáčky: [klíč, text na obrazovku, text pro hlas] (jen co hráč má)
function badges(s) {
  const out = [];
  out.push(['house', s.house >= 12 ? 'dům hotový' : `dům ${s.house}/12`, s.house >= 12 ? 'hotový dům' : `${s.house} dílů domu`]);
  if (s.farm) out.push(['farm', `farma ${s.farm}/${FARM_STAGES.length}`, `na farmě ${s.farm} dílů`]);
  if (s.village) out.push(['village', `vesnice ${s.village}`, `${s.village} hotových budov ve vesnici`]);
  if (s.pets) out.push(['pets', `zvířátka ${s.pets}`, `${s.pets} zvířátek`]);
  if (s.babies) out.push(['babies', `mláďata ${s.babies}`, `${s.babies} mláďat na farmě`]);
  if (s.portal) out.push(['portal', 'portál do Netheru', 'portál do Netheru']);
  if (s.dragon) out.push(['dragon', `drak ${s.dragon}×`, 'poraženého draka']);
  if (s.streak > 1) out.push(['streak', `řada ${s.streak} dní`, `řadu ${s.streak} dní`]);
  return out;
}
// má víc než já?
const more = (k, s, m) => k === 'portal' ? s.portal && !m.portal : (s[k] || 0) > (m[k] || 0);
function avatar(s) {
  const w = document.createElement('span'); w.className = 'lead-av';
  w.appendChild(playerCanvas(s.outfit || {}));
  w.appendChild(pickCanvas(tierOf(s.total || 0), 'lead-pick'));
  return w;
}
async function openLeaders() {
  audio(); show('leaders');
  const list = $('#leadList'), info = $('#leadInfo'); list.innerHTML = '';
  if (!save.cloud.on) { info.textContent = 'Online hraní je vypnuté. Zapnout ho může rodič v nastavení (karta Online).'; speak(info.textContent); return; }
  info.textContent = 'Načítám…';
  await syncCloud(true); // ať jsi v žebříčku i s posledním kolem
  let data;
  try { data = await leaderboard(); } catch (e) { info.textContent = 'Žebříček teď nejde načíst. Zkus to, až bude internet.'; speak(info.textContent); return; }
  const mine = summary(), rows = data.players || [];
  info.textContent = rows.length ? 'Body za tento týden: povedené kolo 1 bod, splněný dnešní úkol 3 body. V pondělí se začíná znovu.' : 'Zatím tu nikdo není.';
  rows.forEach((r, i) => {
    const li = document.createElement('li'); li.className = 'lead-row' + (r.me ? ' me' : '');
    li.insertAdjacentHTML('beforeend', `<b class="lead-rank">${i + 1}.</b>`);
    li.appendChild(avatar(r.summary));
    const main = document.createElement('div'); main.className = 'lead-main';
    main.insertAdjacentHTML('beforeend', `<div class="lead-top"><span class="lead-nick"></span><span class="lead-pts">${r.points} ${pointWord(r.points)}</span></div><div class="lead-badges"></div>`);
    main.querySelector('.lead-nick').textContent = r.me ? `${r.nick} (ty)` : r.nick;
    const bx = main.querySelector('.lead-badges'), bs = badges(r.summary);
    bs.forEach(([k, t]) => { const b = document.createElement('span'); b.className = 'lead-badge' + (!r.me && more(k, r.summary, mine) ? ' more' : ''); b.textContent = t; bx.appendChild(b); });
    li.appendChild(main);
    li.addEventListener('click', () => {
      audio();
      const extra = r.me ? [] : bs.filter(([k]) => more(k, r.summary, mine)).map(b => b[2]);
      speak(`${r.me ? 'Ty máš' : r.nick + ' má'} ${r.points} ${pointWord(r.points)}.` + (bs.length ? ` ${r.me ? 'Máš' : 'Má'} ${bs.map(b => b[2]).join(', ')}.` : '') + (extra.length ? ` To ty ještě nemáš: ${extra.join(', ')}.` : ''));
    });
    list.appendChild(li);
  });
  const top = rows[0], me = rows.find(x => x.me);
  speak(top ? `Žebříček tohoto týdne. Vede ${top.me ? 'ty' : top.nick} s ${withPoints(top.points)}.` + (me && !top.me ? ` Ty máš ${me.points} ${pointWord(me.points)}.` : '') : 'Žebříček je zatím prázdný.');
}

export { badges, openLeaders };
