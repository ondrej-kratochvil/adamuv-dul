/**
 * Adamův důl: příjem statistik do tabulky Google.
 * Vložte do tabulky přes Rozšíření → Apps Script, uložte a nasaďte jako webovou aplikaci
 * (Spustit jako: já, Přístup: kdokoli). Návod: docs/google-tabulka.md.
 *
 * Hra posílá řádky s polem „Druh“: kolo → list Kola, úloha → list Úlohy, hodnocení → list Hodnocení.
 * List Stav se při každém odeslání přepíše aktuálním zvládnutím pater.
 * Každý řádek má ID; když hra pošle stejný řádek znovu (výpadek spojení), podruhé se nezapíše.
 */
const SHEETS = { 'kolo': 'Kola', 'úloha': 'Úlohy', 'hodnocení': 'Hodnocení' };

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const groups = {};
    (data.rows || []).forEach(r => {
      const name = SHEETS[r['Druh']] || 'Ostatní';
      const row = Object.assign({}, r); delete row['Druh'];
      (groups[name] = groups[name] || []).push(row);
    });
    let written = 0;
    Object.keys(groups).forEach(name => { written += appendRows(ss, name, groups[name]); });
    if (data.stav) writeState(ss, data.stav);
    return json({ ok: true, written: written });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json({ ok: true, info: 'Adamův důl: tabulka je připravená. Adresu této stránky vložte do hry (Pro rodiče → Statistiky do tabulky).' });
}

// připíše řádky; sloupce podle názvů klíčů, nové klíče přidají nový sloupec; řádky se známým ID přeskočí
function appendRows(ss, name, rows) {
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  let head = sh.getLastRow() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0] : [];
  rows.forEach(r => Object.keys(r).forEach(k => { if (head.indexOf(k) < 0) head.push(k); }));
  sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  sh.setFrozenRows(1);
  const idCol = head.indexOf('ID'), last = sh.getLastRow(), seen = {};
  if (idCol >= 0 && last > 1) {
    const from = Math.max(2, last - 3000);
    sh.getRange(from, idCol + 1, last - from + 1, 1).getValues().forEach(v => { seen[v[0]] = true; });
  }
  const out = rows.filter(r => !seen[r['ID']]).map(r => head.map(k => r[k] === undefined ? '' : r[k]));
  if (out.length) sh.getRange(sh.getLastRow() + 1, 1, out.length, head.length).setValues(out);
  return out.length;
}

function writeState(ss, st) {
  const sh = ss.getSheetByName('Stav') || ss.insertSheet('Stav', 0);
  sh.clear();
  const rows = [['Aktualizováno', st.aktualizace], ['Smaragdy', st.smaragdy], ['Řada dní', st.rada], ['Nejdelší řada', st.nejdelsiRada], ['', '']];
  sh.getRange(1, 1, rows.length, 2).setValues(rows);
  const p = st.patra || [];
  if (p.length) {
    const head = Object.keys(p[0]);
    sh.getRange(rows.length + 1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
    sh.getRange(rows.length + 2, 1, p.length, head.length).setValues(p.map(r => head.map(k => r[k])));
  }
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
