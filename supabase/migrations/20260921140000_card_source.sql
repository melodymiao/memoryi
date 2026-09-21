-- Where a recommendation came from. Any combination of the three is allowed:
-- a person's name, a link, and/or a screenshot. The screenshot is stored in
-- the existing private `entry-photos` bucket at
-- "<space_id>/card-sources/<uuid>.<ext>" (so the existing storage policies,
-- which key off the leading space_id folder, already cover it);
-- `source_screenshot` holds that object path.

alter table cards
  add column if not exists source_person text,
  add column if not exists source_link text,
  add column if not exists source_screenshot text;

-- Make PostgREST pick up the new columns immediately (otherwise saves can fail
-- with "Could not find the '...' column of 'cards' in the schema cache").
notify pgrst, 'reload schema';
