-- Place details for cards: where it is, how pricey, what specifically it is.
-- All optional. `place_id` is the Google Places id when the card was created
-- from an autocomplete suggestion (lets us refresh details later). The free-
-- text `tags` column is left in place but the app no longer writes it.

alter table cards
  add column if not exists place_id text,
  add column if not exists address text,
  add column if not exists neighborhood text,
  -- 1 = $, 2 = $$, 3 = $$$, 4 = $$$$ (matches Google's INEXPENSIVE..VERY_EXPENSIVE).
  add column if not exists price_level smallint,
  -- Specific kinds of place, e.g. {omakase, ramen}; separate from the fixed
  -- `categories`.
  add column if not exists types text[] not null default '{}';

alter table cards
  drop constraint if exists cards_price_level_range;
alter table cards
  add constraint cards_price_level_range check (price_level is null or price_level between 1 and 4);
