-- Ranní upozornění (web push, 31. 10. 2026): zařízení, která chtějí upozornění, a klíč serveru pro podpis (VAPID).
CREATE TABLE push_subs (
  endpoint TEXT PRIMARY KEY,              -- adresa u služby upozornění (Google, Apple…), jen známé služby (worker/push.ts)
  p256dh TEXT NOT NULL DEFAULT '',        -- klíče zařízení (na pozdější šifrovaný obsah; teď se posílá prázdná zpráva)
  auth TEXT NOT NULL DEFAULT '',
  hour INTEGER NOT NULL DEFAULT 7,        -- v kolik (celá hodina, český čas)
  player_id TEXT,                         -- hráč, pokud je online (smazání hráče smaže i upozornění)
  created INTEGER NOT NULL,
  last_day TEXT NOT NULL DEFAULT '',      -- den posledního odeslání (RRRR-MM-DD), ať nepřijde dvakrát
  fails INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX push_subs_hour ON push_subs (hour, last_day);
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
