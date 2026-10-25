// Karta Hráč v nastavení (Schoolcraft): jméno, oslovení, rod, svátky, rodina s podobou a hláškami, soubor hráče.
import { $ } from '../core/dom.js';
import { persist, save } from '../save/save.ts';
import { player } from '../app/player.js';
import { ADAM } from '../content/player-adam.ts';
import { NAMEDAYS } from '../content/namedays.ts';
import { blankPlayer, exportPlayer, guessForms, importPlayer } from '../logic/player.ts';
import { famCanvas, loadFamily, renderNotes } from '../world/family.js';
import { applyName } from '../app/name.js';

// 2. pád pro „Vzkaz od …“: máma Pája → mámy Páji, děda Bob → dědy Boba (rodič může opravit)
const REL = { máma: 'mámy', táta: 'táty', babička: 'babičky', děda: 'dědy', brácha: 'bráchy', bratr: 'bratra', ségra: 'ségry', sestra: 'sestry', teta: 'tety', strejda: 'strejdy', bratranec: 'bratrance', sestřenice: 'sestřenice', praděda: 'pradědy', prababička: 'prababičky', kamarád: 'kamaráda', kamarádka: 'kamarádky' };
function genWord(w) {
  const low = w.toLocaleLowerCase('cs');
  if (REL[low]) return REL[low];
  if (/a$/.test(low)) return w.slice(0, -1) + (/[jťďňcčšžř]a$/.test(low) ? 'i' : 'y'); // Pája → Páji, Iva → Ivy
  if (/ek$/.test(low)) return w.slice(0, -2) + 'ka';                                   // Marek → Marka
  if (/[šžčřcj]$/.test(low)) return w + 'e';                                            // Tomáš → Tomáše
  if (/[aeiouyáéíóúůý]$/.test(low)) return w;
  return w + 'a';                                                                        // Bob → Boba
}
// ženský rod podle prvního slova (máma Pája, babička Iva…); rodič může zaškrtnout i ručně
const FEMALE = ['máma', 'mamka', 'babička', 'babi', 'prababička', 'teta', 'sestra', 'ségra', 'sestřenice', 'kamarádka', 'paní'];
const isFemaleName = name => FEMALE.includes(name.trim().split(/\s+/)[0].toLocaleLowerCase('cs'));
const genGuess = name => name.trim().split(/\s+/).map(genWord).join(' ');
// svátek podle kalendáře jmen (Adam → 24. 12.); přezdívky kalendář nezná
function namedayOf(name) {
  const n = name.trim().toLocaleLowerCase('cs');
  return Object.keys(NAMEDAYS).find(k => NAMEDAYS[k].toLocaleLowerCase('cs').split('|').includes(n));
}
const toDate = md => md ? `2000-${md}` : '';
const fromDate = v => /^\d{4}-\d\d-\d\d$/.test(v) ? v.slice(5) : undefined;

// vestavěný Adam se při první úpravě změní na vlastní kopii
function editable() {
  if (save.player === 'adam') save.player = JSON.parse(JSON.stringify(ADAM));
  else if (!save.player || typeof save.player !== 'object') save.player = blankPlayer();
  return save.player;
}
function changed(msg) { persist(); loadFamily(); applyName(); renderPlayerSet(); renderNotes(); if (msg) $('#plMsg').textContent = msg; }

let editId = null; // kdo z rodiny je v editoru (null = nikdo, '' = nový)
function renderPlayerSet() {
  const p = player();
  $('#plBuiltin').hidden = save.player !== 'adam';
  const set = (id, v) => { if (document.activeElement !== $(id)) $(id).value = v || ''; };
  set('#plName', p.name); set('#plVoc', p.voc); set('#plPoss', p.poss);
  set('#plBirthday', toDate(p.birthday)); set('#plNameday', toDate(p.nameday));
  document.querySelectorAll('#plGender [data-g]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.g === p.gender)));
  const list = $('#plFamily'); list.innerHTML = '';
  if (!p.family.length) list.innerHTML = '<p class="lbl-small">Zatím nikdo. Bez rodiny fandí hra sama.</p>';
  p.family.forEach(m => {
    const b = document.createElement('button'); b.className = 'fam-row'; b.type = 'button';
    b.appendChild(famCanvas(m));
    b.append(`${m.name}${m.role === 'mom' ? ' (máma)' : ''}${m.lines && m.lines.cheers.length ? `, ${m.lines.cheers.length} pochval` : ''}`);
    b.addEventListener('click', () => openEditor(m.id));
    list.appendChild(b);
  });
}

function openEditor(id) {
  editId = id;
  const m = player().family.find(x => x.id === id) || { name: '', gen: '', f: false, hair: '#6b4a2a', top: '#3f9b3a' };
  $('#feName').value = m.name; $('#feGen').value = m.gen;
  $('#feF').checked = !!m.f; $('#feMom').checked = m.role === 'mom'; $('#feLong').checked = !!m.long; $('#feGlasses').checked = !!m.glasses;
  $('#feBeard').checked = !!m.beard; $('#feBald').checked = !!m.bald; $('#feKid').checked = !!m.kid;
  $('#feHair').value = m.hair; $('#feTop').value = m.top; $('#feBirthday').value = toDate(m.birthday);
  $('#feHello').value = m.lines?.hello || ''; $('#feCheers').value = (m.lines?.cheers || []).join('\n'); $('#feEnc').value = (m.lines?.enc || []).join('\n');
  $('#btnFeDel').hidden = !id;
  $('#famEdit').hidden = false; facePreview();
  $('#famEdit').scrollIntoView({ block: 'nearest' }); $('#feName').focus({ preventScroll: true });
}
// náhled obličeje podle zaškrtnutých políček
function readEditor(base = {}) {
  const lines = s => s.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 60);
  const m = { ...base, name: $('#feName').value.trim(), gen: $('#feGen').value.trim() || genGuess($('#feName').value), f: $('#feF').checked || $('#feMom').checked || isFemaleName($('#feName').value), hair: $('#feHair').value, top: $('#feTop').value };
  for (const [k, el] of [['long', '#feLong'], ['glasses', '#feGlasses'], ['bald', '#feBald'], ['kid', '#feKid']]) { if ($(el).checked) m[k] = true; else delete m[k]; }
  if ($('#feBeard').checked) m.beard = typeof base.beard === 'string' ? base.beard : true; else delete m.beard;
  if ($('#feMom').checked) m.role = 'mom'; else delete m.role;
  const bd = fromDate($('#feBirthday').value); if (bd) m.birthday = bd; else delete m.birthday;
  const cheers = lines($('#feCheers').value), enc = lines($('#feEnc').value), hello = $('#feHello').value.trim();
  if (cheers.length || enc.length || hello) m.lines = { ...(base.lines || {}), cheers, enc, hello }; else delete m.lines;
  return m;
}
function facePreview() { const f = $('#feFace'); f.innerHTML = ''; f.appendChild(famCanvas({ id: '', ...readEditor() })); }

function initPlayerSet() {
  $('#plName').addEventListener('change', e => {
    const p = editable(), old = guessForms(p.name, p.gender), name = e.target.value.trim().slice(0, 30);
    if (!name) { renderPlayerSet(); return; }
    const f = guessForms(name, p.gender);
    if (!p.voc || p.voc === old.voc) p.voc = f.voc;   // oslovení a přivlastnění rodič nepřepsal: dopočítat
    if (!p.poss || p.poss === old.poss) p.poss = f.poss;
    if (!p.nameday) { const nd = namedayOf(name); if (nd) p.nameday = nd; }
    p.name = name; changed('Uloženo.');
  });
  $('#plVoc').addEventListener('change', e => { editable().voc = e.target.value.trim(); changed('Uloženo.'); });
  $('#plPoss').addEventListener('change', e => { editable().poss = e.target.value.trim(); changed('Uloženo.'); });
  $('#plBirthday').addEventListener('change', e => { const p = editable(), v = fromDate(e.target.value); if (v) p.birthday = v; else delete p.birthday; changed('Uloženo.'); });
  $('#plNameday').addEventListener('change', e => { const p = editable(), v = fromDate(e.target.value); if (v) p.nameday = v; else delete p.nameday; changed('Uloženo.'); });
  document.querySelectorAll('#plGender [data-g]').forEach(b => b.addEventListener('click', () => {
    const p = editable(), old = guessForms(p.name, p.gender);
    p.gender = b.dataset.g;
    const f = guessForms(p.name, p.gender);
    if (p.voc === old.voc) p.voc = f.voc; if (p.poss === old.poss) p.poss = f.poss;
    changed('Uloženo.');
  }));
  $('#btnFamAdd').addEventListener('click', () => openEditor(''));
  ['#feF', '#feLong', '#feGlasses', '#feBeard', '#feBald', '#feKid', '#feHair', '#feTop'].forEach(id => $(id).addEventListener('input', facePreview));
  $('#feMom').addEventListener('change', () => { if ($('#feMom').checked) { $('#feF').checked = true; facePreview(); } });
  $('#feName').addEventListener('input', () => { if (isFemaleName($('#feName').value)) $('#feF').checked = true; });
  $('#feName').addEventListener('change', () => { if (!$('#feGen').value.trim() || editId === '') $('#feGen').value = genGuess($('#feName').value); });
  $('#btnFeCancel').addEventListener('click', () => { $('#famEdit').hidden = true; editId = null; });
  $('#btnFeSave').addEventListener('click', () => {
    if (!$('#feName').value.trim()) { $('#feName').focus(); return; }
    const p = editable(), i = p.family.findIndex(x => x.id === editId);
    const m = readEditor(i >= 0 ? p.family[i] : { id: 'f' + Date.now().toString(36) });
    if (m.role === 'mom') p.family.forEach(x => { if (x.id !== m.id) delete x.role; }); // máma je jen jedna
    if (i >= 0) p.family[i] = m; else p.family.push(m);
    $('#famEdit').hidden = true; editId = null; changed(`Uloženo: ${m.name}.`);
  });
  $('#btnFeDel').addEventListener('click', () => {
    const p = editable(); p.family = p.family.filter(x => x.id !== editId);
    $('#famEdit').hidden = true; editId = null; changed('Smazáno.');
  });
  // soubor hráče: export a import jako postup
  const tx = $('#plText');
  $('#btnPlExport').addEventListener('click', () => {
    const text = exportPlayer(player());
    tx.hidden = false; tx.readOnly = true; tx.value = text;
    const sel = () => { tx.focus(); tx.select(); $('#plMsg').textContent = 'Text je označený, zkopírujte ho a pošlete.'; };
    try { navigator.clipboard.writeText(text).then(() => { $('#plMsg').textContent = 'Hráč je zkopírovaný do schránky. Na druhém zařízení ho vložte přes Vložit hráče.'; }, sel); } catch (e) { sel(); }
  });
  $('#btnPlImport').addEventListener('click', () => { tx.hidden = false; tx.readOnly = false; tx.value = ''; tx.placeholder = 'Sem vložte zkopírovaného hráče'; tx.focus(); $('#plMsg').textContent = ''; });
  tx.addEventListener('input', () => {
    if (tx.readOnly) return;
    const p = importPlayer(tx.value);
    if (!p) { $('#plMsg').textContent = tx.value.trim() ? 'Tohle není soubor hráče.' : ''; return; }
    save.player = p; tx.hidden = true; changed(`Nahráno: hraje ${p.name}, rodina ${p.family.length} lidí.`);
  });
}

export { genGuess, initPlayerSet, renderPlayerSet };
