-- Create public avatars bucket for profile icons
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, '{image/jpeg,image/png,image/gif,image/webp}')
on conflict (id) do nothing;

-- Allow anyone to read avatars (public)
create policy "avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
create policy "avatars: auth upload" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- Allow users to update/delete their own avatar
create policy "avatars: auth update" on storage.objects
  for update using (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "avatars: auth delete" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.role() = 'authenticated');
