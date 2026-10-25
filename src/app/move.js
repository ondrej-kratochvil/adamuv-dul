// Přestěhování z GitHub Pages na schoolcraft.games (Ondřej 25. 10. 2026). Prohlížeč drží postup zvlášť pro každou adresu,
// proto ho stará adresa nahraje na server (všechny profily na tabletu) a přesměruje na novou s kódy v části za #
// (ta se na server neposílá). Nová adresa postup stáhne, uloží ho do profilů a hru znovu načte.
import { $ } from '../core/dom.js';
import { PROFILES_KEY, MAIN_ID, keyFor, parseRegistry } from '../logic/profiles.ts';
import { migrate } from '../save/schema.ts';
import { profile, replaceSave } from '../save/save.ts';
import { backupOf, parseCode, weekOf, weekPoints } from '../logic/cloud.ts';
import { dayStr } from '../logic/calendar.ts';

const NEW = 'https://schoolcraft.games/';
const DONE = 'schoolcraft-presun'; // na staré adrese: už nahráno (kódy), další návštěva rovnou přesměruje
const api = async (path, opts = {}) => {
  const res = await fetch(NEW.slice(0, -1) + path, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) throw new Error((data && data.error) || `server ${res.status}`);
  return data;
};
const enc = o => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const dec = s => JSON.parse(decodeURIComponent(escape(atob(s))));
function overlay(text) {
  let el = $('#moveOverlay');
  if (!el) { el = document.createElement('div'); el.id = 'moveOverlay'; el.className = 'overlay'; el.innerHTML = '<div class="panel"><h2>Schoolcraft</h2><p class="move-text"></p></div>'; document.body.appendChild(el); }
  el.hidden = false; el.querySelector('.move-text').textContent = text;
}

// stará adresa: nahrát a přesměrovat (bez internetu se hraje dál tady a zkusí se to příště)
async function moveOut() {
  if (!/\.github\.io$/.test(location.hostname)) return false;
  let done = null; try { done = JSON.parse(localStorage.getItem(DONE) || 'null'); } catch (e) { done = null; }
  if (!done) {
    overlay('Hra se stěhuje na novou adresu schoolcraft.games. Přenáším postup…');
    try {
      const reg = parseRegistry(localStorage.getItem(PROFILES_KEY)), profiles = [];
      for (const p of reg.list) {
        const raw = localStorage.getItem(keyFor(p.id)); if (!raw) continue;
        const s = migrate(JSON.parse(raw)), pub = p.id === MAIN_ID; // testovací profily v žebříčku nejsou (rodič je může zapnout)
        const nick = (s.player === 'adam' ? 'Adam' : s.player && s.player.name) || p.name;
        const r = await api('/api/players', { method: 'POST', body: JSON.stringify({ nick, public: pub }) });
        const w = weekOf(dayStr());
        await api('/api/me', { method: 'PUT', headers: { Authorization: `Bearer ${r.id}.${r.secret}` }, body: JSON.stringify({ nick, public: pub, week: w, weekPoints: weekPoints(s.log, s.questLog || [], w), summary: { total: s.total, outfit: s.outfit }, save: backupOf(s) }) });
        profiles.push({ id: p.id, name: p.name, code: `${r.id}.${r.secret}`, pub });
      }
      done = { active: reg.active, profiles };
      localStorage.setItem(DONE, JSON.stringify(done));
    } catch (e) { const el = $('#moveOverlay'); if (el) el.hidden = true; return false; }
  }
  overlay('Hra je teď na adrese schoolcraft.games. Přesouvám tě tam…');
  location.replace(NEW + '#presun=' + enc(done));
  return true;
}

// nová adresa: stáhnout postup profilů ze serveru (jen když tu ještě nic není, nic nepřepíše)
async function moveIn() {
  const m = /^#presun=(.+)$/.exec(location.hash); if (!m) return false;
  const clear = () => history.replaceState(null, '', location.pathname + location.search);
  let data; try { data = dec(m[1]); } catch (e) { clear(); return false; }
  const reg = parseRegistry(localStorage.getItem(PROFILES_KEY));
  const main = localStorage.getItem(keyFor(MAIN_ID));
  if (main && (JSON.parse(main).total || 0) > 0) { clear(); return false; } // tady už se hraje: nepřepisovat
  overlay('Vítej na schoolcraft.games! Stahuji tvůj postup…');
  try {
    for (const p of data.profiles || []) {
      const c = parseCode(p.code); if (!c) continue;
      const r = await api('/api/me/save', { headers: { Authorization: `Bearer ${c.id}.${c.secret}` } });
      if (!r.save) continue;
      const s = migrate(r.save);
      s.cloud = { ...s.cloud, id: c.id, secret: c.secret, on: true, pub: p.pub !== false, last: 0, queue: [], error: '' };
      localStorage.setItem(keyFor(p.id), JSON.stringify(s));
      // i do paměti běžící stránky, jinak by ji při odchodu přepsala prázdným postupem
      if (p.id === profile.id) replaceSave(s);
      if (!reg.list.some(x => x.id === p.id)) reg.list.push({ id: p.id, name: p.name });
    }
    reg.active = reg.list.some(x => x.id === data.active) ? data.active : MAIN_ID;
    localStorage.setItem(PROFILES_KEY, JSON.stringify(reg));
  } catch (e) { overlay('Postup se teď nepodařilo stáhnout. Zkontroluj internet a otevři hru znovu ze staré adresy.'); return true; }
  clear(); location.reload();
  return true;
}

export { moveIn, moveOut };
