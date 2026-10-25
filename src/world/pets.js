// Zvířátka rodiny: obrázky, kdo je má a sekce v obrazovce Rodina (logic/pets.ts, content/pets.ts)
import { save } from '../save/save.ts';
import { player } from '../app/player.js';
import { PET_ART } from '../content/pets.ts';
import { questsLeft } from '../logic/pets.ts';
import { fam } from './family.js';
import { speak } from '../audio/speech.js';
import { audio, sfx } from '../audio/sfx.js';
import { LOCK_SVG } from '../ui/screens.js';

function petCanvas(pet) {
  const c = document.createElement('canvas'); c.width = c.height = 16; c.className = 'px';
  const g = c.getContext('2d');
  PET_ART[pet.kind]((x, y, w, h, k) => { g.fillStyle = k; g.fillRect(x, y, w, h); }, pet.color, pet.stripes);
  return c;
}
// „babičky Ivy“ / „u vás doma“ (zvířátka hráčovy domácnosti)
function ownerText(pet) { return pet.owner === 'home' ? 'u vás doma' : fam(pet.owner).gen; }
function petSay(pet) { return pet.owner === 'home' ? `${pet.name}, ${pet.what}. Bydlí u vás doma.` : `${pet.name}, ${pet.what}. Patří ${ownerText(pet)}.`; }
// sekce Zvířátka nahoře v Rodině: odemčená s obrázkem a jménem, zamčená se zámkem
function renderPets(list) {
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
      if (open) { sfx.sparkle(); speak(petSay(pet)); return; }
      const left = questsLeft(i, done); sfx.nope();
      // ve dnech, ne v úkolech (review 25. 10. 2026: „ještě 11 dnešních úkolů“ znělo jako jedenáct úkolů dnes)
      speak(left === 1 ? 'Tohle zvířátko přijde, až splníš dnešní úkol.' : `Tohle zvířátko přijde za ${left} ${left <= 4 ? 'dny' : 'dní'}, když každý den splníš dnešní úkol.`);
    });
    list.appendChild(b);
  });
}

export { ownerText, petCanvas, petSay, renderPets };
