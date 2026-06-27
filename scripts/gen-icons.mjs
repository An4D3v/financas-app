// gera os ícones do PWA (saco de dinheiro verde em fundo escuro) a partir de um SVG,
// usando sharp. rode com:  node scripts/gen-icons.mjs
import sharp from 'sharp'

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0d1117"/>
  <g transform="translate(64,64) scale(6)">
    <path d="M32 24c-13 0-20 9-20 20 0 9 8 13 20 13s20-4 20-13c0-11-7-20-20-20z" fill="#39d353"/>
    <path d="M23 25c2.2-4 2.2-8.6 0-12.6h18c-2.2 4-2.2 8.6 0 12.6z" fill="#2ea043"/>
    <rect x="22" y="21.5" width="20" height="5.5" rx="2.75" fill="#176f2c"/>
    <text x="32" y="51" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="800" fill="#06210f">$</text>
  </g>
</svg>`

const targets = [
  ['public/pwa-512x512.png', 512],
  ['public/pwa-192x192.png', 192],
  ['public/pwa-64x64.png', 64],
  ['public/maskable-icon-512x512.png', 512],
  ['public/apple-touch-icon.png', 180],
]

for (const [out, size] of targets) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out)
  console.log('✓', out)
}
