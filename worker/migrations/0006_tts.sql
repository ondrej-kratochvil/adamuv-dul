-- Přirozený hlas (požadavek Honzy 9. 11. 2026, než vystaví klíč Google): každá věta se u Googlu platí jen jednou.
-- tts_audio: hotové MP3 sdílené všemi hráči (klíč = otisk hlasu, rychlosti a textu, src/logic/tts.ts ttsKey).
-- tts_usage: kolik znaků šlo za den Googlu (UTC), hlídá denní a měsíční strop (worker/index.ts).
CREATE TABLE IF NOT EXISTS tts_audio (
  key TEXT PRIMARY KEY,
  mp3 BLOB NOT NULL,
  chars INTEGER NOT NULL,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS tts_usage (
  day TEXT PRIMARY KEY,
  chars INTEGER NOT NULL DEFAULT 0,
  calls INTEGER NOT NULL DEFAULT 0,
  refused INTEGER NOT NULL DEFAULT 0
);
