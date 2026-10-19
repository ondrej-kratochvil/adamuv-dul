// Nápověda bez hlasu
import { G } from '../core/state.js';
import { $ } from '../core/dom.js';
import { noVoice } from '../audio/speech.js';

function updateHint() {
  const h = $('#hint');
  if (G.R && G.R.target && noVoice()) { h.hidden = false; h.textContent = 'Řekni nahlas: ' + G.R.say; }
  else h.hidden = true;
}

export { updateHint };
