-- Duplicitní statistiky (zjištěno 10. 11. 2026: 82 řádků dvakrát). Hra maže odeslanou dávku z fronty až po odpovědi
-- serveru a ukládá ji jen při viditelné stránce, takže po zavření nebo výpadku pošle stejné řádky znovu.
-- Stejný řádek (včetně času v poli Čas) od stejného hráče se teď uloží jen jednou (worker/index.ts INSERT OR IGNORE).
DELETE FROM events WHERE id NOT IN (SELECT MIN(id) FROM events GROUP BY player_id, data);
CREATE UNIQUE INDEX IF NOT EXISTS events_unique ON events (player_id, data);
