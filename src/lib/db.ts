import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'studio.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user            TEXT NOT NULL,
      started_at      TEXT NOT NULL,
      ended_at        TEXT,
      gpu_instance_id TEXT
    );

    CREATE TABLE IF NOT EXISTS usage (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user         TEXT NOT NULL,
      date         TEXT NOT NULL,
      seconds_used INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS prompt_log (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user         TEXT NOT NULL,
      timestamp    TEXT NOT NULL,
      prompt       TEXT NOT NULL,
      blocked      INTEGER NOT NULL DEFAULT 0,
      block_reason TEXT
    );
  `);

  const defaults: Record<string, string> = {
    daily_limit_minutes: '480',
    hard_cutoff_time: '20:00',
    idle_timeout_minutes: '20',
    allowed_models: JSON.stringify([
      'runway-gen3',
      'pika-2.0',
      'kling-1.6',
      'haiper-2.0',
      'minimax-video',
      'luma-dream-machine',
      'stable-video-diffusion',
    ]),
  };

  const upsert = db.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
  );

  for (const [key, value] of Object.entries(defaults)) {
    upsert.run(key, value);
  }
}
