-- Fixed, multi-select card categories.
--
-- Replaces the free-text `category` column with a `categories` array limited
-- to the twelve slugs below (keep in sync with src/lib/categories.ts). The old
-- `category` and `tags` columns are left in place — nothing is dropped — but
-- the app no longer writes `category`.

alter table cards
  add column if not exists categories text[] not null default '{}';

-- Carry over existing cards whose free-text category matches (or clearly
-- aliases) one of the fixed slugs. Anything else stays empty; the app falls
-- back to showing the old text until the card is edited.
update cards
set categories = array[
  case lower(trim(category))
    when 'activity' then 'active'
    when 'restaurant' then 'food'
    when 'coffee' then 'cafe'
    else lower(trim(category))
  end
]
where category is not null
  and cardinality(categories) = 0
  and lower(trim(category)) in (
    'food', 'cafe', 'bars', 'dessert', 'shopping', 'home',
    'entertainment', 'nature', 'culture', 'travel', 'active', 'events',
    'activity', 'restaurant', 'coffee'
  );

alter table cards
  drop constraint if exists cards_categories_allowed;
alter table cards
  add constraint cards_categories_allowed check (
    categories <@ array[
      'food', 'cafe', 'bars', 'dessert', 'shopping', 'home',
      'entertainment', 'nature', 'culture', 'travel', 'active', 'events'
    ]::text[]
  );

-- Filtering by category ("any card containing X").
create index if not exists cards_categories_idx on cards using gin (categories);
