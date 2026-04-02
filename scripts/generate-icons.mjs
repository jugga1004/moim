import { writeFileSync } from 'fs';

// SVG 아이콘 (📖 모임기록 스타일)
function makeSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#4f46e5"/>
  <text x="50%" y="54%" font-size="${size * 0.55}" text-anchor="middle" dominant-baseline="middle" font-family="serif">📖</text>
</svg>`;
}

writeFileSync('public/icon-192.svg', makeSVG(192));
writeFileSync('public/icon-512.svg', makeSVG(512));
console.log('SVG icons created');
