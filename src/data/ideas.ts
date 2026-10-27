import { supabase } from "../lib/supabase"
import { ensureSession } from "../lib/auth"
import { getMySpaceId } from "./spaces"
import { toColumns } from "./columns"
import { useLoader } from "./useLoader"
import type { Idea, IdeaType } from "../types/database"

/** An idea plus who has hearted it (user ids — each person's heart is separate). */
export interface IdeaWithFavorites extends Idea {
  favorited_by: string[]
}

type IdeaRow = Idea & { idea_favorites: { user_id: string }[] | null }

const IDEA_SELECT = "*, idea_favorites(user_id)"

function toIdea(row: IdeaRow): IdeaWithFavorites {
  const { idea_favorites, ...idea } = row
  return { ...idea, favorited_by: (idea_favorites ?? []).map((f) => f.user_id) }
}

export interface CreateIdeaInput {
  title: string
  type: IdeaType
  /** Free text region, e.g. "Bay"; defaults to "Anywhere" (DB default). */
  locationLabel?: string
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  /** TikTok / Reel link etc. */
  sourceUrl?: string | null
  /** "YYYY-MM-DD" — for events. */
  startsOn?: string | null
  endsOn?: string | null
  /** e.g. "Spring". */
  seasonLabel?: string | null
}

export type UpdateIdeaInput = Partial<CreateIdeaInput>

const IDEA_COLUMNS: Record<keyof CreateIdeaInput, string> = {
  title: "title",
  type: "type",
  locationLabel: "location_label",
  address: "address",
  latitude: "latitude",
  longitude: "longitude",
  sourceUrl: "source_url",
  startsOn: "starts_on",
  endsOn: "ends_on",
  seasonLabel: "season_label",
}

/** Newest first, each with its favorites. */
export async function listIdeas(): Promise<IdeaWithFavorites[]> {
  const spaceId = await getMySpaceId()
  const { data, error } = await supabase
    .from("ideas")
    .select(IDEA_SELECT)
    .eq("space_id", spaceId)
    .order("created_at", { ascending: false })
    .returns<IdeaRow[]>()

  if (error) throw error
  return data.map(toIdea)
}

export async function getIdea(id: string): Promise<IdeaWithFavorites> {
  const { data, error } = await supabase.from("ideas").select(IDEA_SELECT).eq("id", id).single()

  if (error) throw error
  return toIdea(data as IdeaRow)
}

export async function createIdea(input: CreateIdeaInput): Promise<IdeaWithFavorites> {
  const [spaceId, userId] = await Promise.all([getMySpaceId(), ensureSession()])
  const { data, error } = await supabase
    .from("ideas")
    .insert({ ...toColumns(input, IDEA_COLUMNS), space_id: spaceId, created_by: userId })
    .select(IDEA_SELECT)
    .single()

  if (error) throw error
  return toIdea(data as IdeaRow)
}

/** Updates only the fields you pass (null clears a field). */
export async function updateIdea(id: string, input: UpdateIdeaInput): Promise<IdeaWithFavorites> {
  const { data, error } = await supabase
    .from("ideas")
    .update(toColumns(input, IDEA_COLUMNS))
    .eq("id", id)
    .select(IDEA_SELECT)
    .single()

  if (error) throw error
  return toIdea(data as IdeaRow)
}

/** Trip plans made from this idea keep their title; only the link is cleared. */
export async function deleteIdea(id: string): Promise<void> {
  const { error } = await supabase.from("ideas").delete().eq("id", id)
  if (error) throw error
}

/** Flips *your* heart on an idea. Pass whether it's currently hearted by you;
 * resolves with the new state. */
export async function toggleIdeaFavorite(ideaId: string, favorited: boolean): Promise<boolean> {
  const [spaceId, userId] = await Promise.all([getMySpaceId(), ensureSession()])
  if (favorited) {
    const { error } = await supabase.from("idea_favorites").delete().eq("idea_id", ideaId).eq("user_id", userId)
    if (error) throw error
    return false
  }
  const { error } = await supabase.from("idea_favorites").insert({ idea_id: ideaId, user_id: userId, space_id: spaceId })
  if (error) throw error
  return true
}

export function useIdeas() {
  const { data: ideas, setData: setIdeas, loading, error, refetch } = useLoader(listIdeas, [] as IdeaWithFavorites[])
  return { ideas, setIdeas, loading, error, refetch }
}
