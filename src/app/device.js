// Funkce zařízení jako u nainstalované aplikace (Ondřej 31. 10. 2026): trvalé úložiště, nezhasínání obrazovky v kole,
// vibrace, číslo na ikoně (nesplněný dnešní úkol) a sdílení obrázku. Co zařízení neumí, se tiše vynechá.
const VIB_KEY = 'schoolcraft-vibrace'; // patří zařízení (vibrace umí jen Android)

// postup v localStorage: požádat prohlížeč, ať ho při nedostatku místa nemaže
async function persistStorage() {
  try { if (navigator.storage && navigator.storage.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); } catch (e) { /* neumí */ }
}
async function storageProtected() {
  try { return navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : null; } catch (e) { return null; }
}

// obrazovka během kola nezhasne (přemýšlení nad úlohou); po návratu do aplikace se zámek obnoví
let wake = null, wantWake = false;
async function keepAwake(on) {
  wantWake = on;
  try {
    if (on && !wake && 'wakeLock' in navigator && document.visibilityState === 'visible') { const w = await navigator.wakeLock.request('screen'); if (!wantWake) { w.release(); return; } wake = w; w.addEventListener('release', () => { if (wake === w) wake = null; }); }
    else if (!on && wake) { const w = wake; wake = null; await w.release(); }
  } catch (e) { /* neumí nebo nedovolí */ }
}
document.addEventListener('visibilitychange', () => { if (wantWake && document.visibilityState === 'visible') keepAwake(true); });

function vibrationOn() { try { return localStorage.getItem(VIB_KEY) !== 'off'; } catch (e) { return true; } }
function setVibration(on) { try { localStorage.setItem(VIB_KEY, on ? 'on' : 'off'); } catch (e) { /* nic */ } }
const canVibrate = () => typeof navigator.vibrate === 'function';
function buzz(pattern) { if (vibrationOn() && canVibrate()) try { navigator.vibrate(pattern); } catch (e) { /* nic */ } }

// číslo na ikoně aplikace: 1 = dnešní úkol čeká
function setBadge(n) {
  try { if (n && navigator.setAppBadge) navigator.setAppBadge(n).catch(() => {}); else if (!n && navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {}); } catch (e) { /* neumí */ }
}

// obrázek z plátna poslat (WhatsApp, Messenger…), jinak stáhnout; vrací 'shared' | 'downloaded' | 'cancel'
async function shareCanvas(canvas, name, text) {
  const blob = await new Promise(ok => canvas.toBlob(ok, 'image/png'));
  if (!blob) return 'cancel';
  const file = new File([blob], `${name}.png`, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Schoolcraft', text }); return 'shared'; } catch (e) { return 'cancel'; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return 'downloaded';
}
export { buzz, canVibrate, keepAwake, persistStorage, setBadge, setVibration, shareCanvas, storageProtected, vibrationOn };
