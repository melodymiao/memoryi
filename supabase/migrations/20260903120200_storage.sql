-- Storage bucket for entry photos.
--
-- Private bucket (public = false) — this is a private app, photos are served
-- via short-lived signed URLs (see src/lib/photos.ts), never a public URL.
--
-- Object path convention, enforced by the policies below (not by a DB
-- constraint): "<space_id>/<entry_id>/<filename>". The first path segment
-- being the space_id is what lets storage RLS reuse is_space_member().
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'entry-photos',
  'entry-photos',
  false,
  15728640, -- 15 MB — comfortably covers a single iPhone HEIC/JPEG photo
  array['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']
)
on conflict (id) do nothing;

create policy "members can view photos in their space"
on storage.objects for select
to authenticated
using (
  bucket_id = 'entry-photos'
  and is_space_member((storage.foldername(name))[1]::uuid)
);

create policy "members can upload photos to their space"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'entry-photos'
  and is_space_member((storage.foldername(name))[1]::uuid)
);

create policy "members can update photos in their space"
on storage.objects for update
to authenticated
using (
  bucket_id = 'entry-photos'
  and is_space_member((storage.foldername(name))[1]::uuid)
)
with check (
  bucket_id = 'entry-photos'
  and is_space_member((storage.foldername(name))[1]::uuid)
);

create policy "members can delete photos in their space"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'entry-photos'
  and is_space_member((storage.foldername(name))[1]::uuid)
);
