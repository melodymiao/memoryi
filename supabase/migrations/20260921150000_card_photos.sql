-- Photos for cards: the user's own uploads, as Storage object paths in the
-- private `entry-photos` bucket under "<space_id>/card-photos/<card_id>/", in
-- display order (same idea as entries.photos). The first one is the card's
-- list thumbnail.

alter table cards
  add column if not exists photos text[] not null default '{}';

-- Google Places photos were tried and dropped (cost + Google's terms); this
-- removes the column if an earlier version of this migration already added it.
alter table cards
  drop column if exists photo_ref;

notify pgrst, 'reload schema';
