-- Skupiny v žebříčku (31. 10. 2026): žebříček a upozornění na předběhnutí jen mezi hráči jedné skupiny (rodina, třída),
-- do skupiny se vstupuje kódem pozvánky. Dosavadní hráči v žebříčku se převedou do jedné skupiny „Rodina“;
-- její kód se vygeneruje až v databázi (randomblob), ve veřejném repozitáři není.
CREATE TABLE groups (
  code TEXT PRIMARY KEY,                  -- kód pozvánky (12 znaků 0-9a-f)
  name TEXT NOT NULL,
  created INTEGER NOT NULL
);
ALTER TABLE players ADD COLUMN group_code TEXT NOT NULL DEFAULT '';
INSERT INTO groups (code, name, created) SELECT lower(hex(randomblob(6))), 'Rodina', unixepoch() * 1000 WHERE EXISTS (SELECT 1 FROM players WHERE public = 1);
UPDATE players SET group_code = (SELECT code FROM groups LIMIT 1) WHERE public = 1 AND EXISTS (SELECT 1 FROM groups);
CREATE INDEX players_group ON players (group_code, week, week_points DESC);
