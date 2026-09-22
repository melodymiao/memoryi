-- Coordinates for "near me" filtering. Set when a card is created from a place
-- suggestion; cards made by hand (or before this migration) have none and are
-- left out of distance filters until re-picked.

alter table cards
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

notify pgrst, 'reload schema';
