import simpleGit from 'simple-git';
import fs from 'fs/promises';
import path from 'path';
import { db, initDb } from '../src/db.js';

const TMP = '.tmp_bd';
const repo = process.env.GITHUB_BD_REPO;
const pat = process.env.GITHUB_PAT;

if (!repo) {
  console.log('GITHUB_BD_REPO not set, skipping');
  process.exit(0);
}

const authRepo = pat ? repo.replace('https://', `https://${pat}:x-oauth-basic@`) : repo;
await simpleGit().clone(authRepo, TMP, { '--depth': 1 });

await initDb();

// Expect a JSON file like bd/quotes.json { quotes: [ {text,author,username,userId,createdAt} ] }
try {
  const file = path.join(TMP, 'quotes.json');
  const raw = await fs.readFile(file, 'utf-8');
  const { quotes } = JSON.parse(raw);
  
  const insert = db.prepare(`
    INSERT OR IGNORE INTO quotes (id,text,author,userId,username,createdAt) 
    VALUES (@id,@text,@author,@userId,@username,@createdAt)
  `);
  
  for (const q of quotes || []) {
    insert.run({ id: q.id || crypto.randomUUID(), ...q });
  }
  
  console.log('Seeded from GitHub bd repo');
} catch (e) {
  console.log('No quotes.json found in bd repo, skip');
} 