// Fotky pokladů a obrázků jen v tomhle zařízení (IndexedDB, Ondřej 31. 10. 2026): nikdy na server ani do zálohy postupu.
// Každý profil má svoje fotky (pole profile).
import { profile } from '../save/save.ts';
import { fitSize } from '../logic/hunt.ts';

const DB = 'schoolcraft-fotky', STORE = 'photos';
let dbp = null;
function db() {
  if (!dbp) dbp = new Promise((ok, no) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { const s = r.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true }); s.createIndex('profile', 'profile'); };
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
  });
  return dbp;
}
const tx = async (mode, fn) => { const d = await db(); return new Promise((ok, no) => { const t = d.transaction(STORE, mode); const res = fn(t.objectStore(STORE)); t.oncomplete = () => ok(res && res.result !== undefined ? res.result : undefined); t.onerror = () => no(t.error); }); };
// soubor z fotoaparátu zmenšit na JPEG (méně místa)
async function shrink(file) {
  const bmp = await createImageBitmap(file), s = fitSize(bmp.width, bmp.height);
  const c = document.createElement('canvas'); c.width = s.w; c.height = s.h; c.getContext('2d').drawImage(bmp, 0, 0, s.w, s.h);
  return new Promise(ok => c.toBlob(ok, 'image/jpeg', .8));
}
// kind: 'hunt' (poklad s písmenem) nebo 'drawing' (Adamův obrázek)
async function addPhoto(file, kind, letter = '', day = '') {
  const blob = await shrink(file);
  return tx('readwrite', s => s.add({ profile: profile.id, kind, letter, day, t: Date.now(), blob }));
}
async function listPhotos(kind) {
  const all = await tx('readonly', s => s.index('profile').getAll(profile.id));
  return (all || []).filter(p => p.kind === kind).sort((a, b) => b.t - a.t);
}
const deletePhoto = id => tx('readwrite', s => s.delete(id));
export { addPhoto, deletePhoto, listPhotos };
