// Pixelové textury
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const pick = (r, a) => a[Math.floor(r() * a.length)];
function px(g, x, y, c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); }
function noise(g, r, cols, x0 = 0, y0 = 0, w = 16, h = 16) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) px(g, x, y, pick(r, cols)); }
function ore(g, r, cols) { for (let i = 0; i < 4; i++) { const x = 1 + Math.floor(r() * 12), y = 1 + Math.floor(r() * 12); [[0,0],[1,0],[0,1],[1,1],[2,1]].forEach(([dx, dy]) => { if (r() < .8) px(g, x + dx, y + dy, pick(r, cols)); }); } }
function planks(g, r, cols, dark) {
  noise(g, r, cols);
  for (let y = 0; y < 16; y++) {
    if (y % 4 === 3) for (let x = 0; x < 16; x++) px(g, x, y, dark);
    else { const k = Math.floor(y / 4); px(g, k % 2 ? 4 : 11, y, dark); }
  }
}
const DIRT = ['#866043', '#79553a', '#966c4a', '#6b4a30', '#5d4029'];
const STONE = ['#8f8f8f', '#828282', '#9a9a9a', '#767676', '#6c6c6c'];
const painters = {
  dirt(g, r) { noise(g, r, DIRT); },
  grass(g, r) { noise(g, r, DIRT); for (let x = 0; x < 16; x++) { const h = 3 + Math.floor(r() * 3); for (let y = 0; y < h; y++) px(g, x, y, pick(r, ['#5fa83a', '#539a31', '#6cb845', '#4a8b2b'])); } },
  stone(g, r) { noise(g, r, STONE); for (let i = 0; i < 6; i++) { const x = Math.floor(r() * 15), y = Math.floor(r() * 16); px(g, x, y, '#616161'); px(g, x + 1, y, '#5a5a5a'); } },
  ironOre(g, r) { painters.stone(g, r); ore(g, r, ['#d8af93', '#c4936f', '#ecd0b8']); },
  goldOre(g, r) { painters.stone(g, r); ore(g, r, ['#f2c94c', '#d8a23a', '#fff1a6']); },
  redstoneOre(g, r) { painters.stone(g, r); ore(g, r, ['#d02a1e', '#a01810', '#ff5a3c']); },
  lapisOre(g, r) { painters.stone(g, r); ore(g, r, ['#2f5ec4', '#1f45a0', '#5a86e8']); },
  diamondOre(g, r) { painters.stone(g, r); ore(g, r, ['#5de0e6', '#2fb8c4', '#b1f6f8']); },
  cobble(g, r) {
    noise(g, r, ['#7d7d7d', '#8a8a8a', '#6f6f6f', '#999999']);
    const bands = [[0, 4], [5, 9], [10, 13], [14, 16]];
    bands.forEach(([a, b], i) => {
      if (b < 16) for (let x = 0; x < 16; x++) px(g, x, b, '#4f4f4f');
      const xs = [2 + Math.floor(r() * 5), 9 + Math.floor(r() * 5)];
      xs.forEach(x => { for (let y = a; y < b; y++) px(g, x, y, '#555555'); });
    });
  },
  planks(g, r) { planks(g, r, ['#b8945f', '#a7834f', '#c39f69'], '#7c5f37'); },
  roof(g, r) { planks(g, r, ['#6b4428', '#5d3a22', '#7a5030'], '#3e2615'); },
  log(g, r) { for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) px(g, x, y, x % 5 === 0 || r() < .12 ? '#4a3622' : pick(r, ['#6b5132', '#5a432a', '#7a5e3b'])); },
  leavesAutumn(g, r) { noise(g, r, ['#d9822b', '#c0602a', '#e8a33c', '#b8481e', '#9a6a2e']); },
  leavesXmas(g, r) { painters.leaves(g, r); [[2, 3, '#e0402e'], [7, 2, '#f2d024'], [12, 4, '#2f7fd1'], [4, 9, '#f2d024'], [10, 8, '#e0402e'], [6, 13, '#2f7fd1'], [13, 12, '#f2d024']].forEach(([x, y, k]) => px(g, x, y, k)); },
  leaves(g, r) { noise(g, r, ['#3f8a2a', '#357a23', '#4c9c33', '#2c661c', '#24541a']); },
  glass(g, r) {
    g.fillStyle = '#a9dbea'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#eef9fc'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16);
    [[3,4],[4,3],[5,2],[10,12],[11,11],[12,10]].forEach(([x, y]) => px(g, x, y, '#ffffff'));
  },
  doorT(g, r) {
    planks(g, r, ['#8e6a3c', '#7d5c33', '#9b7646'], '#5a4024');
    g.fillStyle = '#a9dbea'; g.fillRect(3, 3, 4, 5); g.fillRect(9, 3, 4, 5);
  },
  doorB(g, r) { planks(g, r, ['#8e6a3c', '#7d5c33', '#9b7646'], '#5a4024'); px(g, 12, 3, '#2a2a2a'); px(g, 12, 4, '#2a2a2a'); },
  endStone(g, r) { noise(g, r, ['#dedb9c', '#e8e6a8', '#cfcb88', '#d6d290']); for (let i = 0; i < 5; i++) px(g, Math.floor(r() * 16), Math.floor(r() * 16), '#b8b470'); },
  endFrame(g, r) { noise(g, r, ['#3a6a5a', '#2e5a4c', '#467a68']); g.fillStyle = '#dedb9c'; g.fillRect(0, 10, 16, 6); for (let x = 0; x < 16; x += 3) px(g, x, 10, '#b8b470'); },
  quartz(g, r) { noise(g, r, ['#ece6dc', '#e2dbcf', '#f4efe6']); for (let x = 0; x < 16; x++) { px(g, x, 0, '#d2cabb'); px(g, x, 15, '#cbc2b2'); } },
  darkstone(g, r) { noise(g, r, ['#4a4a52', '#40404a', '#55555e', '#3a3a42']); },
  planksY(g, r) { planks(g, r, ['#e2b84a', '#d4a83a', '#ecc65e'], '#a8822a'); },
  roofRed(g, r) { planks(g, r, ['#b8392b', '#a8322a', '#c84a3a'], '#7a2018'); },
  roofBlue(g, r) { planks(g, r, ['#3a5ea8', '#30529a', '#4a6eb8'], '#203a70'); },
  obsidian(g, r) { noise(g, r, ['#1a1028', '#241638', '#2e1e48', '#160c22']); for (let i = 0; i < 6; i++) px(g, Math.floor(r() * 16), Math.floor(r() * 16), '#5a4a8a'); },
  portal(g, r) { noise(g, r, ['#7a2ad0', '#9a4af0', '#5a1aa0', '#b070ff']); },
  netherrack(g, r) { noise(g, r, ['#6a2a2a', '#7a3030', '#5a2020', '#8a3a3a']); },
  blackstone(g, r) { noise(g, r, ['#2a2830', '#36343c', '#1f1d24', '#403e48']); },
  soulsand(g, r) { noise(g, r, ['#4a3a2a', '#5a4632', '#3a2c20']); [[3, 4], [10, 9], [6, 12]].forEach(([x, y]) => { px(g, x, y, '#20160e'); px(g, x + 2, y, '#20160e'); px(g, x + 1, y + 2, '#20160e'); }); },
  lava(g, r) { noise(g, r, ['#e8641a', '#f2a030', '#d04a10', '#ffcc40']); },
  quartzOre(g, r) { painters.netherrack(g, r); ore(g, r, ['#f4f0e8', '#e0d8cc', '#ffffff']); },
  netherGoldOre(g, r) { painters.netherrack(g, r); ore(g, r, ['#f2c94c', '#e0b030', '#fff1a6']); },
  ancientDebris(g, r) { noise(g, r, ['#5a4038', '#4a3430', '#6a4c42']); for (let y = 3; y < 16; y += 5) for (let x = 0; x < 16; x++) if ((x + y) % 3) px(g, x, y, '#8a6a5a'); },
  netherBrick(g, r) { g.fillStyle = '#1e0c10'; g.fillRect(0, 0, 16, 16); for (let row = 0; row < 4; row++) { const off = row % 2 ? 4 : 0; for (let b = -1; b < 3; b++) { const x0 = b * 8 + off; for (let x = x0; x < x0 + 7; x++) for (let y = row * 4; y < row * 4 + 3; y++) if (x >= 0 && x < 16) px(g, x, y, pick(r, ['#3a1a1e', '#44202a', '#321418'])); } } },
  crimsonStem(g, r) { for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) px(g, x, y, x % 4 === 0 ? '#4a1a2a' : pick(r, ['#7a2a3a', '#8a3446', '#6a2232'])); },
  crimsonCap(g, r) { noise(g, r, ['#a01a1a', '#b82424', '#8a1414', '#c03030']); },
  warpedStem(g, r) { for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) px(g, x, y, x % 4 === 0 ? '#1e3a44' : pick(r, ['#3a5a6a', '#2e4e5e', '#467080'])); },
  warpedCap(g, r) { noise(g, r, ['#167a7a', '#1a8a8a', '#126a6a', '#20a0a0']); },
  goldBlock(g, r) { noise(g, r, ['#f2c94c', '#e0b030', '#f8d860']); for (let x = 0; x < 16; x++) { px(g, x, 0, '#fff1a6'); px(g, x, 15, '#b88a20'); } },
  bookshelf(g, r) {
    planks(g, r, ['#b8945f', '#a7834f', '#c39f69'], '#7c5f37');
    [1, 9].forEach(y0 => { for (let x = 1; x < 15; x += 2) { const k = pick(r, ['#c0392b', '#2f6fb0', '#3f9b3a', '#e0b324', '#7d4bc2']); g.fillStyle = k; g.fillRect(x, y0, 2, 5); } });
  },
  brick(g, r) {
    g.fillStyle = '#b8b0a8'; g.fillRect(0, 0, 16, 16);
    for (let row = 0; row < 4; row++) { const off = row % 2 ? 4 : 0; for (let b = -1; b < 3; b++) { const x0 = b * 8 + off; for (let x = x0; x < x0 + 7; x++) for (let y = row * 4; y < row * 4 + 3; y++) if (x >= 0 && x < 16) px(g, x, y, pick(r, ['#9c4a37', '#8a3f2e', '#a85540'])); } }
  },
  farmland(g, r) { noise(g, r, ['#5a3d27', '#4f3522', '#664630']); for (let x = 0; x < 16; x++) { px(g, x, 0, '#3f2a1a'); px(g, x, 5, '#47301e'); px(g, x, 10, '#47301e'); } },
  water(g, r) { noise(g, r, ['#3f76e4', '#3566d0', '#4a82ec', '#2f5ec4']); },
  flowerR(g, r) { flower(g, '#e0402e', '#f7e27a'); },
  flowerY(g, r) { flower(g, '#f2d024', '#7a4a1e'); },
  torch(g, r) {
    g.fillStyle = '#7a5e3b'; g.fillRect(7, 7, 2, 9);
    g.fillStyle = '#ff8a2a'; g.fillRect(7, 3, 2, 2); g.fillStyle = '#f7c548'; g.fillRect(7, 5, 2, 2); px(g, 7, 4, '#ffe9a0');
  },
};
function flower(g, petal, mid) {
  g.fillStyle = '#3f8a2a'; g.fillRect(8, 8, 1, 8); px(g, 7, 12, '#4c9c33'); px(g, 9, 11, '#4c9c33'); px(g, 6, 12, '#4c9c33');
  g.fillStyle = petal; g.fillRect(7, 4, 3, 1); g.fillRect(6, 5, 5, 2); g.fillRect(7, 7, 3, 1); px(g, 8, 5, mid); px(g, 8, 6, mid);
}
const texCache = {};
function texCanvas(name, dark) {
  const k = name + (dark ? ':d' : '');
  if (texCache[k]) return texCache[k].c;
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const g = c.getContext('2d');
  painters[name](g, rng(hashStr(name)));
  if (dark) { g.fillStyle = 'rgba(12,8,4,.55)'; g.fillRect(0, 0, 16, 16); }
  texCache[k] = { c, url: c.toDataURL() };
  return c;
}
function tex(name, dark) { texCanvas(name, dark); return texCache[name + (dark ? ':d' : '')].url; }

// praskliny: tři stupně, každý delší (stejné semínko, takže rostou)
const cracks = [null];
(function makeCracks() {
  const r = rng(77);
  const branches = [];
  for (let b = 0; b < 6; b++) { let x = 8, y = 8; const steps = []; for (let s = 0; s < 9; s++) { x += Math.round(r() * 2 - 1) || (b % 2 ? 1 : -1); y += Math.round(r() * 2 - 1) || (b < 3 ? -1 : 1); steps.push([x, y]); } branches.push(steps); }
  [2, 5, 9].forEach(L => {
    const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d');
    branches.forEach(st => st.slice(0, L).forEach(([x, y]) => { if (x >= 0 && x < 16 && y >= 0 && y < 16) px(g, x, y, 'rgba(18,12,8,.85)'); }));
    cracks.push(c.toDataURL());
  });
})();

export { DIRT, STONE, cracks, flower, hashStr, noise, ore, painters, pick, planks, px, rng, tex, texCache, texCanvas };
