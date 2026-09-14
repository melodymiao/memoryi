import { supabase } from "../lib/supabase"
import { ensureSession } from "../lib/auth"

/**
 * There's exactly one space per signed-in device right now (see SCHEMA.md),
 * so every other data-access function resolves "my space" through here
 * instead of taking a space_id param. Cached in memory for the session —
 * membership doesn't change at runtime.
 */

let cachedSpaceId: string | null = null

export async function getMySpaceId(): Promise<string> {
  if (cachedSpaceId) return cachedSpaceId

  const userId = await ensureSession()
  const { data, error } = await supabase
    .from("space_members")
    .select("space_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new Error(
      "This device isn't a space member yet — seed a space_members row for it. See supabase/migrations/README.md.",
    )
  }

  cachedSpaceId = (data as { space_id: string }).space_id
  return cachedSpaceId
}
