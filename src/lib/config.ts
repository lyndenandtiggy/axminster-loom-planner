import { getDb } from './db';

const DEFAULTS: Record<string, string> = {
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

export function getSetting(key: string): string {
  const db = getDb();
  const row = db
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(key) as { value: string } | undefined;
  return row?.value ?? DEFAULTS[key] ?? '';
}

export function getAllSettings(): Record<string, string> {
  const db = getDb();
  const rows = db
    .prepare('SELECT key, value FROM settings')
    .all() as { key: string; value: string }[];

  const result: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

export function setSetting(key: string, value: string): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, value);
}
