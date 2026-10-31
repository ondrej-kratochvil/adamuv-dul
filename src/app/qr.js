// QR kód hráče: vykreslení (qrcode-generator) a čtení fotoaparátem (BarcodeDetector, jinak jsQR). Pravidla v logic/qr.ts.
import qrcode from 'qrcode-generator';
import jsQR from 'jsqr';

// QR do plátna: černé čtverečky, bílý okraj (4 moduly), ostré pixely
function drawQr(canvas, text, px = 6) {
  const q = qrcode(0, 'M'); q.addData(text); q.make();
  const n = q.getModuleCount(), m = 4, size = (n + 2 * m) * px;
  canvas.width = size; canvas.height = size;
  const g = canvas.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, size, size); g.fillStyle = '#000';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) g.fillRect((c + m) * px, (r + m) * px, px, px);
  return n;
}
// čtení: video ze zadního fotoaparátu, každých 250 ms pokus; onText(text) dostane první přečtený QR; vrací stop()
async function scanQr(video, onText) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
  video.srcObject = stream; video.setAttribute('playsinline', ''); await video.play().catch(() => {});
  const det = 'BarcodeDetector' in window ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;
  const cv = document.createElement('canvas'), g = cv.getContext('2d', { willReadFrequently: true });
  let alive = true, timer = 0;
  const stop = () => { alive = false; clearTimeout(timer); stream.getTracks().forEach(t => t.stop()); video.srcObject = null; };
  const tick = async () => {
    if (!alive) return;
    try {
      let text = '';
      if (video.videoWidth) {
        if (det) { const r = await det.detect(video); if (r.length) text = r[0].rawValue; }
        else { cv.width = video.videoWidth; cv.height = video.videoHeight; g.drawImage(video, 0, 0); const img = g.getImageData(0, 0, cv.width, cv.height); const r = jsQR(img.data, img.width, img.height); if (r) text = r.data; }
      }
      if (text && alive) { stop(); onText(text); return; }
    } catch (e) { /* další snímek */ }
    timer = setTimeout(tick, 250);
  };
  tick();
  return stop;
}
export { drawQr, scanQr };
