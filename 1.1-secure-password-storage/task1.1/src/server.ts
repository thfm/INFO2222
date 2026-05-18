import express from 'express';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { authRoutes } from './routes/auth.js';
import { adminRoutes } from './routes/admin.js';
import { openDbWithSchema } from './db/users.js';
import { ALGORITHM } from './crypto/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const dbPath = process.env.DB_PATH ?? join(projectRoot, 'data', 'app.db');
const db = openDbWithSchema(dbPath);

const app = express();
app.use(express.json({ limit: '4kb' }));
app.use('/', authRoutes(db));
app.use('/admin', adminRoutes(db));

const INDEX_HTML = readFileSync(join(__dirname, 'index.html'), 'utf8');
app.get('/', (_req, res) => res.type('html').send(INDEX_HTML));

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`[task1.1] Running with ALGORITHM=${ALGORITHM} on http://localhost:${port}`);
  console.log(`[task1.1] DB at ${dbPath}`);
  if (ALGORITHM !== 'argon2id') {
    console.warn('[task1.1] WARN: WEAK_MODE is ENABLED. Only use for Task 2 demo.');
  }
});
