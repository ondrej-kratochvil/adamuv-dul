// Tlačítka „Poslat obrázek“ u domu, farmy, Přerova a Netheru (Web Share, app/device.js): Adam pošle obrázek rodině
import { $ } from '../core/dom.js';
import { setBtn } from './icons.js';
import { audio } from '../audio/sfx.js';
import { speak } from '../audio/speech.js';
import { shareCanvas } from '../app/device.js';
import { gx } from '../app/player.js';

function initShare() {
  document.querySelectorAll('[data-share]').forEach(b => {
    setBtn(b, 'share', '');
    b.addEventListener('click', async () => {
      audio();
      const c = $('#' + b.dataset.share); if (!c) return;
      const r = await shareCanvas(c, b.dataset.name, `Podívej, co jsem ${gx('postavil', 'postavila')} v Schoolcraftu!`);
      if (r === 'shared') speak('Obrázek je poslaný.');
      else if (r === 'downloaded') speak('Obrázek je uložený v tabletu.');
    });
  });
}
export { initShare };
