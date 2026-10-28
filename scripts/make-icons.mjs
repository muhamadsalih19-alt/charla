// Renders the app icons from one SVG. Run: node scripts/make-icons.mjs
import sharp from 'sharp';

const icon = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#e0573f"/>
  <g transform="translate(${pad} ${pad}) scale(${(512 - 2 * pad) / 512})">
    <path d="M120 120 h272 a56 56 0 0 1 56 56 v128 a56 56 0 0 1 -56 56 h-150 l-74 64 v-64 h-48 a56 56 0 0 1 -56 -56 v-128 a56 56 0 0 1 56 -56 z" fill="#fff"/>
    <circle cx="186" cy="240" r="26" fill="#1f8a7a"/>
    <circle cx="256" cy="240" r="26" fill="#e0573f"/>
    <circle cx="326" cy="240" r="26" fill="#f2c14e"/>
  </g>
</svg>`;

const out = 'public/icons/';
await sharp(Buffer.from(icon(0))).resize(192).png().toFile(out + 'icon-192.png');
await sharp(Buffer.from(icon(0))).resize(512).png().toFile(out + 'icon-512.png');
await sharp(Buffer.from(icon(60))).resize(512).png().toFile(out + 'maskable-512.png');
await sharp(Buffer.from(icon(20))).resize(180).png().toFile(out + 'apple-touch-icon.png');
console.log('icons written');
