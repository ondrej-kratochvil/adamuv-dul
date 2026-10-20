// Jednorázová oprava sloupce Zařízení v tabulce (20. 10. 2026). Spouští se ručně v Apps Scriptu: Spustit → opravitZarizeni.
// Nic nemaže, jen doplní nebo přepíše sloupec Zařízení:
// - řádky z mobilu (ID začíná „tq6r-“), které dostaly výchozí název „tablet“ → „mobil táty“
// - zkoušky hry na mobilu 19. 10. (ID začíná „tq6r-mvgws8xj“) → „mobil táty (zkouška)“, ať jdou odfiltrovat
// - řádky bez názvu z 20. 10. 17:15–17:45 (Adam u dědy) → „počítač děda Bob“
// - ostatní řádky bez názvu (starší verze hry na tabletu) → „tablet“
// Když něco nesedí, Úpravy → Historie verzí v tabulce vrátí stav před spuštěním.
function opravitZarizeni() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), tz = ss.getSpreadsheetTimeZone();
  const report = [];
  ['Kola', 'Úlohy', 'Hodnocení'].forEach(name => {
    const sh = ss.getSheetByName(name); if (!sh || sh.getLastRow() < 2) return;
    const data = sh.getDataRange().getValues(), head = data[0];
    const iId = head.indexOf('ID'), iCas = head.indexOf('Čas');
    let iDev = head.indexOf('Zařízení');
    if (iDev < 0) { iDev = head.length; sh.getRange(1, iDev + 1).setValue('Zařízení').setFontWeight('bold'); }
    const out = [], counts = {};
    for (let r = 1; r < data.length; r++) {
      const id = String(data[r][iId] || ''), cur = String(data[r][iDev] || '');
      const c = data[r][iCas], cas = c instanceof Date ? Utilities.formatDate(c, tz, 'yyyy-MM-dd HH:mm:ss') : String(c || '');
      let dev = cur;
      if (id.indexOf('tq6r-mvgws8xj') === 0) dev = 'mobil táty (zkouška)';
      else if (id.indexOf('tq6r-') === 0 && cur === 'tablet') dev = 'mobil táty';
      else if (!cur && cas >= '2026-10-20 17:15:00' && cas <= '2026-10-20 17:45:00') dev = 'počítač děda Bob';
      else if (!cur) dev = 'tablet';
      if (dev !== cur) counts[dev] = (counts[dev] || 0) + 1;
      out.push([dev]);
    }
    sh.getRange(2, iDev + 1, out.length, 1).setValues(out);
    report.push(name + ': ' + (Object.keys(counts).map(k => k + ' ' + counts[k]).join(', ') || 'beze změny'));
  });
  Logger.log(report.join('\n'));
  return report.join('\n');
}
