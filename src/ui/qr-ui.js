// QR kód hráče ve hře: čtečka (okno s fotoaparátem) a stažení hráče z kódu na novém zařízení (app/qr.js, logic/qr.ts)
import { $ } from '../core/dom.js';
import { BACKUP_KEY } from '../save/save.ts';
import { codeFromText } from '../logic/qr.ts';
import { scanQr } from '../app/qr.js';
import { restoreFromCode } from '../app/cloud.js';

let stopScan = null;
function closeScanner() { if (stopScan) { stopScan(); stopScan = null; } $('#scanOverlay').hidden = true; }
// otevře čtečku; onCode(kód) dostane platný kód hráče
async function openScanner(onCode) {
  $('#scanMsg').textContent = 'Namiřte fotoaparát na QR kód z druhého zařízení.';
  $('#scanOverlay').hidden = false;
  try {
    stopScan = await scanQr($('#scanVideo'), text => {
      stopScan = null;
      const code = codeFromText(text);
      if (code) { closeScanner(); onCode(code); }
      else { $('#scanMsg').textContent = 'Tohle není QR kód hráče ze Schoolcraftu. Zkuste to znovu.'; openScanner(onCode); }
    });
  } catch (e) {
    $('#scanMsg').textContent = e && e.name === 'NotAllowedError' ? 'Fotoaparát není povolený. Povolte ho v prohlížeči (u dětského účtu ve Family Link), nebo kód vložte ručně.' : 'Fotoaparát se nepodařilo spustit. Kód jde vložit i ručně.';
  }
}
// nové zařízení (ještě nikdo nehraje): stáhnout hráče z kódu bez zámku (kód je tajný klíč hráče)
function askCodeRestore(code) {
  $('#codeMsg').textContent = '';
  $('#codeOverlay').hidden = false;
  $('#btnCodeYes').onclick = async () => {
    $('#codeMsg').textContent = 'Stahuji…';
    try { await restoreFromCode(code, BACKUP_KEY); location.reload(); }
    catch (e) { $('#codeMsg').textContent = 'Nepovedlo se: ' + (e && e.message || e) + '. Je zařízení připojené k internetu?'; }
  };
}
function initQrUi() {
  $('#btnScanStop').addEventListener('click', closeScanner);
  $('#btnCodeNo').addEventListener('click', () => { $('#codeOverlay').hidden = true; });
}
export { askCodeRestore, closeScanner, initQrUi, openScanner };
