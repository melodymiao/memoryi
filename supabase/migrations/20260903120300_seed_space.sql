-- The one space this app will ever have (see THEME.md / SCHEMA.md — no
-- public signup, always exactly one couple). Fixed id so the app and these
-- docs can reference it directly, instead of round-tripping through the
-- dashboard to look it up after applying migrations.
--
-- This row alone doesn't grant anyone access — RLS still requires a
-- matching space_members row, seeded by hand after your first anonymous
-- sign-in. See supabase/migrations/README.md.
insert into spaces (id, name)
values ('264f1118-4348-45f7-947e-69fbcb24c97c', 'us')
on conflict (id) do nothing;
