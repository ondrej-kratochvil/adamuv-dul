// Řada dní
import { $ } from '../core/dom.js';
import { persist, save } from '../save/save.js';
import { OUTFIT, outfitIcon } from '../gfx/player.js';
import { speak } from '../audio/speech.js';
import { audio } from '../audio/sfx.js';
import { sprIcon } from '../world/farm.js';
import { BABIES, BABY_DAYS, babyCanvas, weekKey } from '../world/babies.js';

// den se počítá, když má Adam aspoň jedno povedené kolo; totem (z obchodu) zachrání řadu při jednom vynechaném dni
const TOTEM_PRICE = 20, STREAK_BONUS_MAX = 10;
const pad2 = n => String(n).padStart(2, '0');
const dayStr = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const dayNum = str => { const [y, m, d] = str.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
const dayWord = n => n === 1 ? 'den' : n >= 2 && n <= 4 ? 'dny' : 'dní';
// jak řada stojí dnes (bez zápisu): hraje se dál, nebo už spadla
function streakNow() {
  const st = save.streak; if (!st.last) return { count: 0, today: false, saved: false };
  const gap = dayNum(dayStr()) - dayNum(st.last);
  if (gap === 0) return { count: st.count, today: true, saved: false };
  if (gap === 1) return { count: st.count, today: false, saved: false };
  if (gap === 2 && st.totem > 0) return { count: st.count, today: false, saved: true };
  return { count: 0, today: false, saved: false };
}
// zapíše dnešní den po povedeném kole; vrací, co se stalo
function registerDay() {
  const st = save.streak, today = dayStr();
  if (st.last === today) return null;
  const gap = st.last ? dayNum(today) - dayNum(st.last) : 99;
  let usedTotem = false;
  if (gap === 1) st.count++;
  else if (gap === 2 && st.totem > 0) { st.totem--; st.count++; usedTotem = true; }
  else st.count = 1;
  const prevBest = st.best;
  st.last = today; st.best = Math.max(st.best, st.count);
  st.days = [...st.days.filter(d => dayNum(today) - dayNum(d) < 60), today];
  const bonus = Math.min(st.count, STREAK_BONUS_MAX);
  save.emeralds += bonus; save.obsidian = (save.obsidian || 0) + 1;
  const wk = weekKey(today); save.weeks[wk] = (save.weeks[wk] || 0) + 1;
  let baby = null;
  if (save.weeks[wk] === BABY_DAYS && save.babies.length < BABIES.length) { baby = BABIES[save.babies.length]; save.babies.push(baby.id); }
  persist();
  return { count: st.count, bonus, usedTotem, prevBest, obsidian: save.obsidian, baby, weekDays: save.weeks[wk] };
}
function renderStreakBtn() {
  const b = $('#btnStreak'); const n = streakNow();
  b.innerHTML = ''; b.appendChild(sprIcon(n.today ? 'campfire' : 'campfireOut')); b.append(String(n.count));
  b.classList.toggle('hot', n.today); b.classList.toggle('cold', !n.today);
}
function openStreak() {
  audio();
  const n = streakNow(), st = save.streak;
  $('#streakBig').innerHTML = ''; $('#streakBig').appendChild(sprIcon(n.today ? 'campfire' : 'campfireOut'));
  $('#streakBig').insertAdjacentHTML('beforeend', `<div><b>${n.count} ${dayWord(n.count)}</b><br>v řadě</div>`);
  const week = $('#streakWeek'); week.innerHTML = '';
  const names = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); const ds = dayStr(d);
    const on = st.days.includes(ds);
    const el = document.createElement('div'); el.className = 'day' + (on ? ' on' : '') + (i === 0 ? ' today' : '');
    const box = document.createElement('span'); if (on) box.appendChild(sprIcon('campfire'));
    el.appendChild(box); el.append(names[d.getDay()]); week.appendChild(el);
  }
  const info = $('#streakInfo'); info.innerHTML = '';
  const line = (icon, text) => { const p = document.createElement('p'); if (icon) p.appendChild(icon); p.append(text); info.appendChild(p); };
  line(null, n.today ? 'Dnes máš hotovo. Přijď zase zítra!' : 'Dnes ještě chybí jedno povedené kolo.');
  line(sprIcon('emerald'), `Za první povedené kolo dne dostaneš tolik smaragdů, kolik dní máš v řadě (nejvíc ${STREAK_BONUS_MAX}).`);
  const crown = OUTFIT.hat.find(h => h.id === 'koruna');
  line(outfitIcon('hat', crown), st.best >= crown.streak ? 'Královskou korunu už máš v šatníku.' : `Za ${crown.streak} dní v řadě dostaneš královskou korunu.`);
  const wd = (save.weeks || {})[weekKey(dayStr())] || 0, nextBaby = BABIES[(save.babies || []).length];
  if (nextBaby) { const bc = babyCanvas(nextBaby); line(bc, wd >= BABY_DAYS ? 'Tento týden už mládě máš. Další týden můžeš mít další.' : `Tento týden máš ${wd} z ${BABY_DAYS} dní. Pak se na farmě narodí ${nextBaby.name}.`); }
  line(sprIcon('totem'), st.totem > 0 ? (n.saved ? 'Včera jsi nehrál, ale totem tvou řadu zachrání, když dnes zahraješ.' : 'Máš totem. Když jeden den vynecháš, řada nespadne.') : `Totem z obchodu (${TOTEM_PRICE} smaragdů) zachrání řadu, když jeden den vynecháš.`);
  if (st.best) line(null, `Nejdelší řada: ${st.best} ${dayWord(st.best)}.`);
  $('#streakOverlay').hidden = false;
  speak(n.count ? `Hraješ ${n.count} ${dayWord(n.count)} v řadě.` + (n.today ? ' Přijď zase zítra!' : ' Dnes si ještě zahraj, ať řada nespadne.') : 'Zahraj si každý den a postav si řadu.');
}

export { STREAK_BONUS_MAX, TOTEM_PRICE, dayNum, dayStr, dayWord, openStreak, pad2, registerDay, renderStreakBtn, streakNow };
