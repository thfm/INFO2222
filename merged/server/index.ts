import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { ALGORITHM } from './crypto/index.js';
import { clearUsers, openDbWithSchema } from './db/users.js';
import { adminRoutes } from './routes/admin.js';
import { authRoutes } from './routes/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const dbPath = process.env.DB_PATH ?? join(projectRoot, 'data', 'app.db');
const port = Number(process.env.PORT ?? 3000);
const isProduction = process.env.NODE_ENV === 'production';

const db = openDbWithSchema(dbPath);
clearUsers(db);
const app = express();

app.use(express.json({ limit: '4kb' }));
app.use('/api', authRoutes(db));
app.use('/api/admin', adminRoutes(db));

if (isProduction) {
  const distPath = join(projectRoot, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(join(distPath, 'index.html')));
} else {
  const vite = await createViteServer({
    root: projectRoot,
    appType: 'spa',
    server: { middlewareMode: true },
  });
  app.use(vite.middlewares);
}

app.listen(port, () => {
  console.log(`[contritrack] Secure password storage: ${ALGORITHM}`);
  console.log(`[contritrack] DB at ${dbPath}`);
  console.log('[contritrack] User records cleared on startup');
  console.log(`[contritrack] Running on http://localhost:${port}`);
  if (isProduction && !existsSync(join(projectRoot, 'dist', 'index.html'))) {
    console.warn('[contritrack] dist/index.html was not found. Run npm run build before production start.');
  }
});
