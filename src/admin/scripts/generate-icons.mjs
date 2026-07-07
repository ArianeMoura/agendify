// Gera os PNGs de favicon/PWA a partir dos SVGs da marca em public/.
// Reproduzível: `node scripts/generate-icons.mjs`. Usa o `sharp` (já vem com o Next).
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const pub = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const icon = readFileSync(join(pub, "icon.svg"));
const favicon = readFileSync(join(pub, "favicon.svg"));
const maskable = readFileSync(join(pub, "icon-maskable.svg"));

const jobs = [
  [favicon, "favicon-16.png", 16],
  [favicon, "favicon-32.png", 32],
  [favicon, "favicon-48.png", 48],
  [favicon, "apple-touch-icon.png", 180],
  [icon, "icon-192.png", 192],
  [icon, "icon-512.png", 512],
  [maskable, "icon-maskable-512.png", 512],
];

await Promise.all(
  jobs.map(([svg, name, size]) =>
    sharp(svg, { density: 384 })
      .resize(size, size)
      .png()
      .toFile(join(pub, name))
      .then(() => console.log("✓", name, `${size}×${size}`))
  )
);

// favicon.ico multi-resolução (PNG-in-ICO, aceito por navegadores modernos).
async function buildIco(sizes) {
  const pngs = await Promise.all(
    sizes.map((s) => sharp(favicon, { density: 384 }).resize(s, s).png().toBuffer())
  );
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reservado
  header.writeUInt16LE(1, 2); // tipo: ícone
  header.writeUInt16LE(sizes.length, 4);
  const entries = [];
  let offset = 6 + sizes.length * 16;
  sizes.forEach((s, i) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(s >= 256 ? 0 : s, 0);
    e.writeUInt8(s >= 256 ? 0 : s, 1);
    e.writeUInt16LE(0, 4); // planos
    e.writeUInt16LE(32, 6); // bits/pixel
    e.writeUInt32LE(pngs[i].length, 8);
    e.writeUInt32LE(offset, 12);
    offset += pngs[i].length;
    entries.push(e);
  });
  return Buffer.concat([header, ...entries, ...pngs]);
}

const ico = await buildIco([16, 32, 48]);
writeFileSync(join(pub, "favicon.ico"), ico);
console.log("✓ favicon.ico 16/32/48");
