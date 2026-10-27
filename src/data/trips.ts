import { supabase } from "../lib/supabase"
import { ensureSession } from "../lib/auth"
import { todayLocal } from "../lib/dates"
import { getMySpaceId } from "./spaces"
import { toColumns } from "./columns"
import { useLoader } from "./useLoader"
import type { Trip } from "../types/database"

/**
 * Nothing derived is stored on a trip. "Upcoming" vs "past" compares
 * visit_end with the device's local date (`today` params default to
 * todayLocal()); the trip number is its position by visit_start — see
 * tripNumber().
 */

export interface CreateTripInput {
  /** Who is flying — must be one of the two space members. */
  travelerUserId: string
  destCity: string
  /** "YYYY-MM-DD" */
  visitStart: string
  /** "YYYY-MM-DD" */
  visitEnd: string
  airline?: string | null
  flightNumber?: string | null
  /** "YYYY-MM-DD" */
  flightDate?: string | null
  /** IATA, e.g. "SFO". */
  originCode?: string | null
  destCode?: string | null
  /** ISO timestamp. */
  departAt?: string | null
  arriveAt?: string | null
  arrivalTerminal?: string | null
  arrivalGate?: string | null
  flightStatus?: string | null
  /** When terminal/gate/status were last fetched. */
  flightDataUpdatedAt?: string | null
  /** Defaults to 0 (DB default) if omitted. */
  miles?: number
}

export type UpdateTripInput = Partial<CreateTripInput>

const TRIP_COLUMNS: Record<keyof CreateTripInput, string> = {
  travelerUserId: "traveler_user_id",
  destCity: "dest_city",
  visitStart: "visit_start",
  visitEnd: "visit_end",
  airline: "airline",
  flightNumber: "flight_number",
  flightDate: "flight_date",
  originCode: "origin_code",
  destCode: "dest_code",
  departAt: "depart_at",
  arriveAt: "arrive_at",
  arrivalTerminal: "arrival_terminal",
  arrivalGate: "arrival_gate",
  flightStatus: "flight_status",
  flightDataUpdatedAt: "flight_data_updated_at",
  miles: "miles",
}

/** All trips, oldest first — the order trip numbers come from. */
export async function listTrips(): Promise<Trip[]> {
  const spaceId = await getMySpaceId()
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("space_id", spaceId)
    .order("visit_start", { ascending: true })
    .returns<Trip[]>()

  if (error) throw error
  return data
}

export async function getTrip(id: string): Promise<Trip> {
  const { data, error } = await supabase.from("trips").select("*").eq("id", id).single()

  if (error) throw error
  return data as Trip
}

/** The trip you're on now, or else the soonest one ahead. Null if none. */
export async function getNextTrip(today: string = todayLocal()): Promise<Trip | null> {
  const spaceId = await getMySpaceId()
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("space_id", spaceId)
    .gte("visit_end", today)
    .order("visit_start", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return (data as Trip | null) ?? null
}

/** Visits that have ended, most recent first. */
export async function getPastTrips(today: string = todayLocal()): Promise<Trip[]> {
  const spaceId = await getMySpaceId()
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("space_id", spaceId)
    .lt("visit_end", today)
    .order("visit_start", { ascending: false })
    .returns<Trip[]>()

  if (error) throw error
  return data
}

/** 1-based "trip #N" — the trip's position among all trips by visit_start.
 * Null if the trip isn't in the list. */
export function tripNumber(trips: Trip[], tripId: string): number | null {
  const ordered = [...trips].sort(
    (a, b) => a.visit_start.localeCompare(b.visit_start) || a.created_at.localeCompare(b.created_at),
  )
  const i = ordered.findIndex((t) => t.id === tripId)
  return i === -1 ? null : i + 1
}

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  const [spaceId, userId] = await Promise.all([getMySpaceId(), ensureSession()])
  const { data, error } = await supabase
    .from("trips")
    .insert({ ...toColumns(input, TRIP_COLUMNS), space_id: spaceId, created_by: userId })
    .select()
    .single()

  if (error) throw error
  return data as Trip
}

/** Updates only the fields you pass (null clears a field). */
export async function updateTrip(id: string, input: UpdateTripInput): Promise<Trip> {
  const { data, error } = await supabase
    .from("trips")
    .update(toColumns(input, TRIP_COLUMNS))
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Trip
}

/** Also deletes the trip's plans; its photos stay (entries.trip_id is cleared). */
export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from("trips").delete().eq("id", id)
  if (error) throw error
}

export function useTrips() {
  const { data: trips, loading, error, refetch } = useLoader(listTrips, [] as Trip[])
  return { trips, loading, error, refetch }
}

export function useNextTrip() {
  const { data: trip, loading, error, refetch } = useLoader(() => getNextTrip(), null as Trip | null)
  return { trip, loading, error, refetch }
}
