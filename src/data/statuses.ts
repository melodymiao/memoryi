import { supabase } from "../lib/supabase"
import { ensureSession } from "../lib/auth"
import { getMySpaceId } from "./spaces"
import { useLoader } from "./useLoader"
import type { Status } from "../types/database"

/** The database rejects anything longer. */
export const STATUS_MAX_LENGTH = 40

/** Both of your current statuses (0–2 rows). */
export async function listStatuses(): Promise<Status[]> {
  const spaceId = await getMySpaceId()
  const { data, error } = await supabase.from("statuses").select("*").eq("space_id", spaceId).returns<Status[]>()

  if (error) throw error
  return data
}

/** Sets your status, replacing the previous one. */
export async function upsertMyStatus(text: string): Promise<Status> {
  const trimmed = text.trim()
  if (!trimmed) throw new Error("Status can't be empty — use clearMyStatus() instead.")
  if (trimmed.length > STATUS_MAX_LENGTH) throw new Error(`Status can be at most ${STATUS_MAX_LENGTH} characters.`)

  const [spaceId, userId] = await Promise.all([getMySpaceId(), ensureSession()])
  const { data, error } = await supabase
    .from("statuses")
    .upsert({ space_id: spaceId, user_id: userId, text: trimmed }, { onConflict: "space_id,user_id" })
    .select()
    .single()

  if (error) throw error
  return data as Status
}

export async function clearMyStatus(): Promise<void> {
  const [spaceId, userId] = await Promise.all([getMySpaceId(), ensureSession()])
  const { error } = await supabase.from("statuses").delete().eq("space_id", spaceId).eq("user_id", userId)
  if (error) throw error
}

export function useStatuses() {
  const { data: statuses, loading, error, refetch } = useLoader(listStatuses, [] as Status[])
  return { statuses, loading, error, refetch }
}
