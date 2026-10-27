import { supabase } from "../lib/supabase"
import { ensureSession } from "../lib/auth"
import { getMySpaceId } from "./spaces"
import { toColumns } from "./columns"
import { useLoader } from "./useLoader"
import type { SpaceMember } from "../types/database"

export interface UpdateProfileInput {
  displayCode?: string | null
  homeCity?: string | null
  homeAirport?: string | null
  homeLat?: number | null
  homeLng?: number | null
}

const PROFILE_COLUMNS: Record<keyof UpdateProfileInput, string> = {
  displayCode: "display_code",
  homeCity: "home_city",
  homeAirport: "home_airport",
  homeLat: "home_lat",
  homeLng: "home_lng",
}

/** Both of you, in the order you joined. */
export async function listMembers(): Promise<SpaceMember[]> {
  const spaceId = await getMySpaceId()
  const { data, error } = await supabase
    .from("space_members")
    .select("*")
    .eq("space_id", spaceId)
    .order("created_at", { ascending: true })
    .returns<SpaceMember[]>()

  if (error) throw error
  return data
}

export async function getMyMember(): Promise<SpaceMember> {
  const [members, userId] = await Promise.all([listMembers(), ensureSession()])
  const me = members.find((m) => m.user_id === userId)
  if (!me) throw new Error("This device isn't a space member yet. See supabase/migrations/README.md.")
  return me
}

/** Your partner's row, or null until they've joined the space. */
export async function getPartner(): Promise<SpaceMember | null> {
  const [members, userId] = await Promise.all([listMembers(), ensureSession()])
  return members.find((m) => m.user_id !== userId) ?? null
}

/** Updates only the fields you pass. Codes are upper-cased (the DB requires
 * 2–4 capital letters for display_code and 3 for the airport). */
export async function updateMyProfile(input: UpdateProfileInput): Promise<SpaceMember> {
  const [spaceId, userId] = await Promise.all([getMySpaceId(), ensureSession()])
  const { data, error } = await supabase
    .from("space_members")
    .update(
      toColumns<UpdateProfileInput>(
        {
          ...input,
          displayCode: input.displayCode?.trim().toUpperCase() ?? input.displayCode,
          homeAirport: input.homeAirport?.trim().toUpperCase() ?? input.homeAirport,
        },
        PROFILE_COLUMNS,
      ),
    )
    .eq("space_id", spaceId)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) throw error
  return data as SpaceMember
}

/** Screen-facing hook: both members, plus which one is you. */
export function useMembers() {
  const { data, loading, error, refetch } = useLoader(
    async () => {
      const [members, userId] = await Promise.all([listMembers(), ensureSession()])
      return { members, userId }
    },
    { members: [] as SpaceMember[], userId: null as string | null },
  )
  const me = data.members.find((m) => m.user_id === data.userId) ?? null
  const partner = data.members.find((m) => m.user_id !== data.userId) ?? null
  return { members: data.members, me, partner, loading, error, refetch }
}
