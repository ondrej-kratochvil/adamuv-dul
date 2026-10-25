// Zvířátka rodiny: obrázky, kdo je má a sekce v obrazovce Rodina (logic/pets.ts, content/pets.ts)
import { save } from '../save/save.ts';
import { player } from '../app/player.js';
import { PET_ART, WEAR_SHIFT, shiftWear } from '../content/pets.ts';
import { wornItems } from '../logic/family-wear.ts';
import { wearById } from '../content/family-wear.ts';
import { questsLeft, unlockedPets } from '../logic/pets.ts';
import { fam } from './family.js';
import { speak } from '../audio/speech.js';
import { audio, sfx } from '../audio/sfx.js';
import { LOCK_SVG } from '../ui/screens.js';

// klíč zvířátka v save.famWear (aby se nepletl s lidmi)
const petKey = pet => 'pet:' + pet.id;
const canDress = pet => !!WEAR_SHIFT[pet.kind];
function petCanvas(pet) {
  const c = document.createElement('canvas'); c.width = c.height = 16; c.className = 'px';
  const g = c.getContext('2d'), R = (x, y, w, h, k) => { g.fillStyle = k; g.fillRect(x, y, w, h); };
  PET_ART[pet.kind](R, pet.color, pet.stripes);
  // věci, které Adam zvířátku nasadil, posunuté na jeho hlavu
  if (WEAR_SHIFT[pet.kind] && save.famWear) wornItems(save.famWear, petKey(pet)).forEach(id => shiftWear(wearById(id).paint, pet.kind, R));
  return c;
}
// „babičky Ivy“ / „u vás doma“ (zvířátka hráčovy domácnosti)
function ownerText(pet) { return pet.owner === 'home' ? 'u vás doma' : fam(pet.owner).gen; }
// „Je to zvířátko babičky Ivy“ (2. pád, ten v datech rodiny je; review 25. 10. 2026: „Patří babičky Ivy“ byl špatný pád)
function petSay(pet) { const cap = pet.name[0].toUpperCase() + pet.name.slice(1); return pet.owner === 'home' ? `${cap}, ${pet.what}. Bydlí u vás doma.` : `${cap}, ${pet.what}. ${pet.plural ? 'Jsou to zvířátka' : 'Je to zvířátko'} ${ownerText(pet)}.`; }
// sekce Zvířátka nahoře v Rodině: odemčená s obrázkem a jménem, zamčená se zámkem
function renderPets(list, onPick) {
  const pets = player().pets || [];
  if (!pets.length) return;
  const done = save.questsDone || 0;
  list.insertAdjacentHTML('beforeend', `<h3 class="shop-h">Zvířátka (${Math.min(done, pets.length)} z ${pets.length})</h3>`);
  pets.forEach((pet, i) => {
    const open = i < done;
    const b = document.createElement('button'); b.className = 'shop-item pet-item' + (open ? '' : ' locked'); b.setAttribute('aria-label', open ? pet.name : 'zamčené zvířátko');
    const ic = document.createElement('span'); ic.className = 'shop-icon';
    if (open) ic.appendChild(petCanvas(pet)); else ic.textContent = '?';
    b.appendChild(ic);
    const nm = document.createElement('span'); nm.className = 'price'; nm.textContent = open ? pet.name : '?'; b.appendChild(nm);
    if (!open) b.insertAdjacentHTML('beforeend', LOCK_SVG);
    b.addEventListener('click', () => {
      audio();
      if (open) { sfx.sparkle(); if (onPick) onPick(petKey(pet)); speak(petSay(pet)); return; }
      const left = questsLeft(i, done); sfx.nope();
      // ve dnech, ne v úkolech (review 25. 10. 2026: „ještě 11 dnešních úkolů“ znělo jako jedenáct úkolů dnes)
      speak(left === 1 ? 'Tohle zvířátko přijde, až splníš dnešní úkol.' : `Tohle zvířátko přijde za ${left} ${left <= 4 ? 'dny' : 'dní'}, když každý den splníš dnešní úkol.`);
    });
    list.appendChild(b);
  });
}

// řada v Rodině: lidé a za každým jeho odemčená zvířátka (zvířátka domácnosti za tátou, jinak na začátku)
function familyRow(family) {
  const pets = unlockedPets(player(), save.questsDone || 0), out = [];
  const homeAfter = family.some(p => p.id === 'ondra') ? 'ondra' : null;
  if (!homeAfter) pets.filter(x => x.owner === 'home').forEach(pet => out.push({ key: petKey(pet), pet }));
  family.forEach(p => {
    out.push({ key: p.id, person: p });
    pets.filter(x => x.owner === p.id || (p.id === homeAfter && x.owner === 'home')).forEach(pet => out.push({ key: petKey(pet), pet }));
  });
  return out;
}

export { canDress, familyRow, ownerText, petCanvas, petKey, petSay, renderPets };
