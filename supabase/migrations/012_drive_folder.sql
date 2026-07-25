-- Google Drive folder per wedding (guest photo archive).
-- Run in the Supabase SQL editor.

alter table public.weddings
  add column if not exists drive_folder_id  text,
  add column if not exists drive_folder_url text;
