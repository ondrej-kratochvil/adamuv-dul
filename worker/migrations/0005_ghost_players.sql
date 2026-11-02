-- Prázdné účty mimo skupiny (Ondřej 2. 11. 2026: v žebříčku skupiny Rodina desítky hráčů „Hráč“ a několikrát Adam s 0 body).
-- Do 31. 10. 2026 bylo online zapnuté hned (i pro roboty, kteří stránku jen otevřeli) a migrace 0004 dala do skupiny
-- všechny veřejné účty. Kdo nikdy neposlal žádnou statistiku (nehrál online ani jedno kolo), ze skupiny vypadne.
-- Účet sám zůstává (zařízení se může dál přihlásit a do skupiny se znovu připojit kódem).
UPDATE players SET group_code = '' WHERE group_code <> '' AND NOT EXISTS (SELECT 1 FROM events WHERE events.player_id = players.id);
