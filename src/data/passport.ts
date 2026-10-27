import { supabase } from "../lib/supabase"
import { todayLocal } from "../lib/dates"
import { getMySpaceId } from "./spaces"
import { useLoader } from "./useLoader"
import type { PassportStats } from "../types/database"

/** Totals derived from trips by get_passport_stats() (see
 * supabase/migrations/20261027120700_passport_stats.sql). Counts visits that
 * have started by `asOf` (local date); a visit in progress counts up to today. */
export async function getPassportStats(asOf: string = todayLocal()): Promise<PassportStats> {
  const spaceId = await getMySpaceId()
  const { data, error } = await supabase.rpc("get_passport_stats", { target_space_id: spaceId, as_of: asOf })

  if (error) throw error
  return data as PassportStats
}

const EMPTY_STATS: PassportStats = {
  total_miles: 0,
  visit_count: 0,
  days_together: 0,
  distinct_cities: 0,
  visits_per_city: [],
}

export function usePassportStats() {
  const { data: stats, loading, error, refetch } = useLoader(() => getPassportStats(), EMPTY_STATS)
  return { stats, loading, error, refetch }
}
