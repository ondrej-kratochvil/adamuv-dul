// Ikony na tlačítkách (Adam ještě neumí přečíst všechno)
const ICONS = {
  next: '<path d="M6 4h3v2h2v2h2v2h2v4h-2v2h-2v2H9v2H6V4z"/><path d="M16 4h3v16h-3z"/>',
  retry: '<path d="M8 3h8v2h2v2h2v4h-3V8h-2V6H9v2H7v8h2v2h6v-2h2v-2h-2v-2h5v7h-2v2h-2v2H8v-2H6v-2H4V7h2V5h2V3z"/>',
  house: '<path d="M11 2h2v2h2v2h2v2h2v2h2v2h-2v10h-6v-6h-2v6H5V12H3v-2h2V8h2V6h2V4h2V2z"/>',
  back: '<path d="M14 4h3v3h-3v3h-3v4h3v3h3v3h-3v-3h-3v-3H8v-4h3V7h3V4z"/>',
  check: '<path d="M18 5h3v3h-2v2h-2v2h-2v2h-2v2h-2v2H9v-2H7v-2H5v-2H3V9h3v2h2v2h2v-2h2V9h2V7h2V5h2z"/>',
  sword: '<path d="M19 2h3v3h-1v2h-2v2h-2v2h-2v2h-2v2h1v2h-2v1H9v1H7v2H4v-3h2v-2h1v-2h1v-1h1v-2h2v1h2v-2h2V9h2V7h2V5h1V2z"/>',
  speaker: '<path d="M3 9h4l5-5h2v16h-2l-5-5H3V9zm14-1h2v2h1v4h-1v2h-2v-2h1v-4h-1V8z"/>',
  target: '<path d="M9 2h6v2h2v2h2v2h2v8h-2v2h-2v2h-2v2H9v-2H7v-2H5v-2H3V8h2V6h2V4h2V2zm0 4v2H7v8h2v2h6v-2h2V8h-2V6H9zm2 4h2v4h-2z"/>',
  tag: '<path d="M3 3h9l9 9-9 9-9-9V3zm4 3v3h3V6H7z"/>',
  refresh: '<path d="M11 2h2v2h2v2h-2v2h-2V6H8v2H6v8h2v2h8v-2h2v-6h3v7h-2v2h-2v2H7v-2H5v-2H3V7h2V5h2V3h4V2z"/>',
};
const iconSvg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;
function setBtn(b, icon, text) { b.innerHTML = `${iconSvg(icon)}<span class="lbl">${text}</span>`; }
function iconizeButtons(root = document) { root.querySelectorAll('[data-icon]').forEach(b => { if (!b.querySelector('svg')) setBtn(b, b.dataset.icon, b.textContent.trim()); }); }

export { ICONS, iconSvg, iconizeButtons, setBtn };
