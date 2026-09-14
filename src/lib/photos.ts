import { supabase } from "./supabase"

/**
 * Entry photo storage. Bucket is private (supabase/migrations/*_storage.sql)
 * — photos are only ever served via short-lived signed URLs, never a public
 * URL. Object paths are "<space_id>/<entry_id>/<random>.<ext>"; the
 * space_id prefix is what storage RLS checks against space_members.
 */

const BUCKET = "entry-photos"

function extensionOf(filename: string): string {
  const i = filename.lastIndexOf(".")
  return i === -1 ? "" : filename.slice(i)
}

/** Uploads a photo for an entry and returns its Storage object path
 * (what you'd put in `entries.photos`). */
export async function uploadEntryPhoto(spaceId: string, entryId: string, file: File): Promise<string> {
  const path = `${spaceId}/${entryId}/${crypto.randomUUID()}${extensionOf(file.name)}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error
  return path
}

/** Signed, time-limited URL for displaying a photo. */
export async function getEntryPhotoUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds)
  if (error || !data) throw error ?? new Error("Failed to create signed URL")
  return data.signedUrl
}

export async function deleteEntryPhoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw error
}
