import { supabase } from "../lib/supabase"
import { ensureSession } from "../lib/auth"
import { deletePostcardPhotos, uploadPostcardPhoto } from "../lib/photos"
import { getMySpaceId } from "./spaces"
import { step } from "./step"
import { useLoader } from "./useLoader"
import type { Postcard } from "../types/database"

/**
 * Who can see what is decided entirely by the database (can_view_postcard()
 * in supabase/migrations/20261027120400_postcards.sql): you always see your
 * own; you see your partner's only while it's unexpired and you have an
 * unexpired one of your own. So listPostcards() needs no filtering — locked
 * postcards just aren't returned. Lifetime comes from
 * spaces.postcard_ttl_hours; expires_at is set by the database.
 */

/** Every postcard you're allowed to see, newest first. */
export async function listPostcards(): Promise<Postcard[]> {
  const spaceId = await getMySpaceId()
  const { data, error } = await supabase
    .from("postcards")
    .select("*")
    .eq("space_id", spaceId)
    .order("created_at", { ascending: false })
    .returns<Postcard[]>()

  if (error) throw error
  return data
}

/** True when your partner has an unexpired postcard you can't see yet —
 * i.e. "send one to unlock". */
export async function hasLockedPostcard(): Promise<boolean> {
  const spaceId = await getMySpaceId()
  const { data, error } = await supabase.rpc("has_locked_postcard", { target_space_id: spaceId })

  if (error) throw error
  return data === true
}

/** Whether a postcard is still within its lifetime. */
export function isPostcardActive(postcard: Postcard, now = new Date()): boolean {
  return new Date(postcard.expires_at).getTime() > now.getTime()
}

export interface SendPostcardInput {
  photo: File
  /** For a future front/back camera version. */
  secondaryPhoto?: File
  caption?: string
}

/** Uploads the photo(s), then saves the postcard. If saving fails, the uploads
 * are removed again (best effort) so no orphaned photos are left behind. */
export async function sendPostcard(input: SendPostcardInput): Promise<Postcard> {
  const [spaceId, userId] = await Promise.all([getMySpaceId(), ensureSession()])
  // Client-generated id: photos are filed under it, and the database checks
  // that the paths match it.
  const id = crypto.randomUUID()
  const [photoPath, secondaryPhotoPath] = await step("Uploading the photo", () =>
    Promise.all([
      uploadPostcardPhoto(spaceId, id, input.photo),
      input.secondaryPhoto ? uploadPostcardPhoto(spaceId, id, input.secondaryPhoto) : Promise.resolve(null),
    ]),
  )

  const { data, error } = await supabase
    .from("postcards")
    .insert({
      id,
      space_id: spaceId,
      sender_id: userId,
      photo_path: photoPath,
      secondary_photo_path: secondaryPhotoPath,
      caption: input.caption?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    await deletePostcardPhotos([photoPath, ...(secondaryPhotoPath ? [secondaryPhotoPath] : [])]).catch(() => {})
    throw new Error(`Sending the postcard failed: ${error.message}`, { cause: error })
  }
  return data as Postcard
}

/** Deletes one of your own postcards and its photos. */
export async function deletePostcard(postcard: Postcard): Promise<void> {
  const { error } = await supabase.from("postcards").delete().eq("id", postcard.id)
  if (error) throw error
  const paths = [postcard.photo_path, ...(postcard.secondary_photo_path ? [postcard.secondary_photo_path] : [])]
  await deletePostcardPhotos(paths).catch(() => {})
}

/** Visible postcards plus whether a partner's postcard is waiting to unlock. */
export function usePostcards() {
  const { data, loading, error, refetch } = useLoader(
    async () => {
      const [postcards, locked] = await Promise.all([listPostcards(), hasLockedPostcard()])
      return { postcards, locked }
    },
    { postcards: [] as Postcard[], locked: false },
  )
  return { postcards: data.postcards, locked: data.locked, loading, error, refetch }
}
