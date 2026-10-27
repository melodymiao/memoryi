import { supabase } from "../lib/supabase"
import { ensureSession } from "../lib/auth"
import { getMySpaceId } from "./spaces"
import { useLoader } from "./useLoader"
import type { FavoriteSong } from "../types/database"

export interface FaveSongInput {
  /** http(s) link, e.g. a YouTube Music URL. */
  url: string
  title?: string | null
  artist?: string | null
  thumbnailUrl?: string | null
}

/** Both of your current fave songs (0–2 rows). */
export async function listFaveSongs(): Promise<FavoriteSong[]> {
  const spaceId = await getMySpaceId()
  const { data, error } = await supabase
    .from("favorite_songs")
    .select("*")
    .eq("space_id", spaceId)
    .returns<FavoriteSong[]>()

  if (error) throw error
  return data
}

/** Sets your fave song, replacing the previous one. */
export async function upsertMyFaveSong(input: FaveSongInput): Promise<FavoriteSong> {
  const [spaceId, userId] = await Promise.all([getMySpaceId(), ensureSession()])
  const { data, error } = await supabase
    .from("favorite_songs")
    .upsert(
      {
        space_id: spaceId,
        user_id: userId,
        url: input.url.trim(),
        title: input.title ?? null,
        artist: input.artist ?? null,
        thumbnail_url: input.thumbnailUrl ?? null,
      },
      { onConflict: "space_id,user_id" },
    )
    .select()
    .single()

  if (error) throw error
  return data as FavoriteSong
}

export async function clearMyFaveSong(): Promise<void> {
  const [spaceId, userId] = await Promise.all([getMySpaceId(), ensureSession()])
  const { error } = await supabase.from("favorite_songs").delete().eq("space_id", spaceId).eq("user_id", userId)
  if (error) throw error
}

export function useFaveSongs() {
  const { data: songs, loading, error, refetch } = useLoader(listFaveSongs, [] as FavoriteSong[])
  return { songs, loading, error, refetch }
}
