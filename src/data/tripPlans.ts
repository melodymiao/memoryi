import { supabase } from "../lib/supabase"
import { ensureSession } from "../lib/auth"
import { getMySpaceId } from "./spaces"
import { useLoader } from "./useLoader"
import type { Idea, TripPlan } from "../types/database"

/** A trip's plan items in display order. */
export async function listTripPlans(tripId: string): Promise<TripPlan[]> {
  const { data, error } = await supabase
    .from("trip_plans")
    .select("*")
    .eq("trip_id", tripId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<TripPlan[]>()

  if (error) throw error
  return data
}

async function nextPosition(tripId: string): Promise<number> {
  const { data, error } = await supabase
    .from("trip_plans")
    .select("position")
    .eq("trip_id", tripId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data ? (data as { position: number }).position + 1 : 0
}

async function insertPlan(tripId: string, title: string, ideaId: string | null): Promise<TripPlan> {
  const [spaceId, userId, position] = await Promise.all([getMySpaceId(), ensureSession(), nextPosition(tripId)])
  const { data, error } = await supabase
    .from("trip_plans")
    .insert({ space_id: spaceId, trip_id: tripId, idea_id: ideaId, title, position, created_by: userId })
    .select()
    .single()

  if (error) throw error
  return data as TripPlan
}

/** Adds an idea to the end of a trip's plan. The idea's title is copied in, so
 * the item keeps its name if the idea is deleted later. Fails if the idea is
 * already on this trip. */
export function addIdeaToTrip(tripId: string, idea: Pick<Idea, "id" | "title">): Promise<TripPlan> {
  return insertPlan(tripId, idea.title, idea.id)
}

/** Adds an ad-hoc item (not from an idea) to the end of a trip's plan. */
export function addTripPlan(tripId: string, title: string): Promise<TripPlan> {
  return insertPlan(tripId, title, null)
}

export async function setTripPlanDone(id: string, done: boolean): Promise<TripPlan> {
  const { data, error } = await supabase
    .from("trip_plans")
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as TripPlan
}

export async function updateTripPlan(id: string, input: { title: string }): Promise<TripPlan> {
  const { data, error } = await supabase.from("trip_plans").update({ title: input.title }).eq("id", id).select().single()

  if (error) throw error
  return data as TripPlan
}

/** Saves a new order: `orderedIds[i]` gets position i. */
export async function reorderTripPlans(orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, position) => supabase.from("trip_plans").update({ position }).eq("id", id)),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}

export async function deleteTripPlan(id: string): Promise<void> {
  const { error } = await supabase.from("trip_plans").delete().eq("id", id)
  if (error) throw error
}

export function useTripPlans(tripId: string) {
  const { data: plans, setData: setPlans, loading, error, refetch } = useLoader(
    () => listTripPlans(tripId),
    [] as TripPlan[],
    [tripId],
  )
  return { plans, setPlans, loading, error, refetch }
}
