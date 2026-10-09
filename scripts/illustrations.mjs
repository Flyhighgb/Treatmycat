// Draws the flat illustrations in public/img/: one per topic, topic icons, and the homepage hero.
// To add a topic, add its prop drawing to `props` (keyed by topic slug), run `npm run art`, then `npm run og`.
import { writeFileSync } from 'node:fs';
const A='#c2571a', BG='#fbe9dc', P='#2f6f7e', Y='#f0b44c', W='#fff';
const cat = `<g transform="translate(46 22)">
<path d="M58 128 q46 4 40 -40" stroke="${A}" stroke-width="12" fill="none" stroke-linecap="round"/>
<ellipse cx="44" cy="108" rx="40" ry="38" fill="${A}"/>
<ellipse cx="44" cy="118" rx="20" ry="22" fill="#e07a3a"/>
<g transform="translate(2 -6) scale(1.3)"><path fill="${A}" d="M10 8l14 12h16L54 8v26c0 14-10 24-22 24S10 48 10 34z"/>
<circle cx="24" cy="34" r="3.5" fill="${W}"/><circle cx="40" cy="34" r="3.5" fill="${W}"/><path d="M28 42q4 4 8 0" stroke="${W}" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>
</g>`;
const props = {
  digestion: `<path d="M190 120 h100 a50 34 0 0 1 -100 0z" fill="${P}"/><rect x="186" y="114" width="108" height="10" rx="5" fill="${P}"/><circle cx="220" cy="112" r="9" fill="${Y}"/><circle cx="238" cy="108" r="10" fill="${Y}"/><circle cx="257" cy="112" r="9" fill="${Y}"/>`,
  'skin-and-parasites': `<circle cx="236" cy="82" r="38" fill="${W}" stroke="${P}" stroke-width="10"/><path d="M262 110 l30 32" stroke="${P}" stroke-width="14" stroke-linecap="round"/><circle cx="224" cy="74" r="4" fill="${A}"/><circle cx="244" cy="90" r="4" fill="${A}"/><circle cx="238" cy="68" r="3" fill="${A}"/>`,
  'food-and-treats': `<path d="M196 100 q40 -40 80 0 q-40 40 -80 0z" fill="${P}"/><path d="M276 100 l22 -20 v40z" fill="${P}"/><circle cx="214" cy="96" r="5" fill="${W}"/><path d="M236 86 q8 14 0 28 M250 86 q8 14 0 28" stroke="${Y}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  behavior: `<circle cx="240" cy="96" r="40" fill="${P}"/><path d="M206 80 q34 10 66 -10 M202 100 q40 14 76 -12 M212 122 q30 6 58 -22 M226 58 q-10 40 6 76" stroke="${Y}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M276 116 q30 20 14 40" stroke="${P}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  'health-conditions': `<path d="M240 146 l-44 -44 a24 24 0 0 1 44 -26 a24 24 0 0 1 44 26z" fill="${P}"/><rect x="233" y="80" width="14" height="40" rx="3" fill="${W}"/><rect x="220" y="93" width="40" height="14" rx="3" fill="${W}"/>`,
  'care-and-grooming': `<rect x="196" y="66" width="96" height="30" rx="12" fill="${P}"/><path d="${Array.from({length:9},(_,i)=>`M${206+i*10} 96 v26`).join(' ')}" stroke="${Y}" stroke-width="4" stroke-linecap="round"/>`,
  'toys-and-gear': `<path d="M292 158 L214 54" stroke="${P}" stroke-width="6" stroke-linecap="round"/><path d="M214 54 q-30 -8 -34 22 q22 -2 34 -22z" fill="${Y}"/><path d="M214 54 q-6 30 -36 34 q8 -24 36 -34z" fill="${A}"/><path d="M214 54 q-34 6 -30 -14" stroke="${P}" stroke-width="3" fill="none"/><ellipse cx="240" cy="150" rx="18" ry="11" fill="${P}"/><circle cx="254" cy="140" r="5" fill="${P}"/><path d="M222 152 q-14 4 -18 -6" stroke="${P}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  default: `<g fill="${P}"><ellipse cx="240" cy="112" rx="26" ry="22"/><ellipse cx="208" cy="80" rx="10" ry="13"/><ellipse cx="228" cy="64" rx="10" ry="13"/><ellipse cx="252" cy="64" rx="10" ry="13"/><ellipse cx="272" cy="80" rx="10" ry="13"/></g>`,
};
for (const [k, v] of Object.entries(props))
  writeFileSync(`public/img/${k}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="320" height="180"><rect width="320" height="180" rx="16" fill="${BG}"/>${cat}${v}</svg>\n`);

// Icons: just the prop, on a transparent background, for tiles and cards.
import { mkdirSync } from 'node:fs';
mkdirSync('public/img/icons', { recursive: true });
for (const [k, v] of Object.entries(props))
  writeFileSync(`public/img/icons/${k}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="176 28 128 128" width="144" height="144">${v}</svg>\n`);

// Homepage hero: the cat with a heart, a yarn ball and a paw, on a soft blob.
writeFileSync('public/img/hero.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 400" width="480" height="400">
<path d="M248 28c92 0 196 52 204 160 8 112-84 190-204 190S24 318 30 204C36 92 148 28 248 28z" fill="${BG}"/>
<g transform="translate(118 76) scale(1.7)">${cat.replace('translate(46 22)', 'translate(0 0)')}</g>
<g transform="translate(240 10) scale(.7)">${props['health-conditions']}</g>
<g transform="translate(-80 236) scale(.7)">${props.behavior}</g>
<g transform="translate(280 276) scale(.5)">${props.default}</g>
</svg>\n`);
