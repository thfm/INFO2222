import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const pairs = [
  ['src/index.html', 'dist/index.html'],
  ['src/db/schema.sql', 'dist/db/schema.sql'],
];

for (const [src, dest] of pairs) {
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`Copied ${src} -> ${dest}`);
}
