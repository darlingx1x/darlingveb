import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DISK_PATH = process.env.DISK_PATH || '/var/data';
const DB_FILE = path.join(DISK_PATH, 'quotes.sqlite');

export let db;

export async function initDb() {
  if (!fs.existsSync(DISK_PATH)) {
    fs.mkdirSync(DISK_PATH, { recursive: true });
  }
  
  db = new Database(DB_FILE);
  db.pragma('journal_mode = WAL');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      author TEXT,
      userId TEXT NOT NULL,
      username TEXT,
      createdAt TEXT NOT NULL
    );
  `);
} 