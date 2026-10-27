-- LDR pivot, part 6: the `postcard-photos` storage bucket.
--
-- Private, images only, same limits as entry-photos. Object paths are
-- "<space_id>/<postcard_id>/<random>.<ext>".
--
-- Reading is stricter than entry-photos: being a space member isn't enough,
-- or your partner could fetch a locked postcard's image straight from
-- Storage and skip the unlock rule. Instead you can read an object only if
-- you can see (under postcards' own RLS, i.e. can_view_postcard) a postcards
-- row that references it. The postcards table's path checks stop a row from
-- referencing a photo that isn't its own.
--
-- Run after 20261027120400_postcards.sql. Safe to re-run.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'postcard-photos',
  'postcard-photos',
  false,
  15728640, -- 15 MB
  array['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "postcard photos: viewable with their postcard" on storage.objects;
create policy "postcard photos: viewable with their postcard"
on storage.objects for select
to authenticated
using (
  bucket_id = 'postcard-photos'
  and exists (
    select 1
    from public.postcards p
    where p.photo_path = objects.name
       or p.secondary_photo_path = objects.name
  )
);

drop policy if exists "postcard photos: members can upload to their space" on storage.objects;
create policy "postcard photos: members can upload to their space"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'postcard-photos'
  and is_space_member((storage.foldername(name))[1]::uuid)
);

-- Only the uploader can delete (used to clean up if saving the postcard row
-- fails, and when a sender deletes their postcard). No update policy —
-- postcard photos are never replaced in place.
drop policy if exists "postcard photos: uploader can delete" on storage.objects;
create policy "postcard photos: uploader can delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'postcard-photos'
  and owner_id = auth.uid()::text
);
