-- Table-level privileges for `authenticated`.
--
-- RLS policies (20260903120100_rls.sql) only narrow what a role *can* touch
-- among rows it already has a base grant for — they don't substitute for the
-- grant itself. Postgres still checks GRANT first, so with no GRANT the
-- error is "permission denied for table X", not an RLS-shaped 0-rows result.
-- The Studio's Table Editor issues these grants automatically when you
-- create a table there; the hand-written migrations in this folder never
-- did, so every authenticated request has been rejected before RLS even
-- runs. Scoped to match what each RLS policy set already allows (see
-- 20260903120100_rls.sql): spaces/space_members are select-only from the
-- client, cards/entries get full CRUD.
grant select on spaces to authenticated;
grant select on space_members to authenticated;
grant select, insert, update, delete on cards to authenticated;
grant select, insert, update, delete on entries to authenticated;
