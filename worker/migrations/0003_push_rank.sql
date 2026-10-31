-- Upozornění na předběhnutí v žebříčku (31. 10. 2026): kdo ho chce, kdy naposledy přišlo, text pro service worker.
ALTER TABLE push_subs ADD COLUMN rank INTEGER NOT NULL DEFAULT 0;   -- 1 = upozornit, když hráče někdo předběhne
ALTER TABLE push_subs ADD COLUMN rank_day TEXT NOT NULL DEFAULT ''; -- den posledního upozornění na předběhnutí
ALTER TABLE push_subs ADD COLUMN news TEXT NOT NULL DEFAULT '';     -- text čekající na service worker (JSON title, body)
ALTER TABLE push_subs ADD COLUMN news_t INTEGER NOT NULL DEFAULT 0;
