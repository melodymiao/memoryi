import { supabase } from "./supabase"

/**
 * Interim auth for steps 2-6: one anonymous Supabase session per device,
 * created on first use and persisted by supabase-js in local storage after
 * that. Real per-partner accounts arrive in step 7 — see
 * supabase/migrations/README.md for how that migration works (it doesn't
 * touch RLS policies or this function's callers, only how the session gets
 * established).
 */

let sessionPromise: Promise<string> | null = null

/** Resolves with the current user's id, signing in anonymously if needed. */
export function ensureSession(): Promise<string> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const { data: existing } = await supabase.auth.getSession()
      if (existing.session) return existing.session.user.id

      const { data, error } = await supabase.auth.signInAnonymously()
      if (error || !data.session) {
        sessionPromise = null
        throw error ?? new Error("Anonymous sign-in returned no session")
      }
      return data.session.user.id
    })()
  }
  return sessionPromise
}
