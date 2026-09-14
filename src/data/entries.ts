import { useCallback, useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { ensureSession } from "../lib/auth"
import { getMySpaceId } from "./spaces"
import type { Entry } from "../types/database"

export interface CreateEntryInput {
  title: string
  placeName?: string
  /** ISO date "YYYY-MM-DD"; defaults to today (DB default) if omitted. */
  entryDate?: string
  caption?: string
  /** Storage object paths, in display order — see src/lib/photos.ts. */
  photos?: string[]
  /** The wishlist card this entry fulfilled, if any. */
  sourceCardId?: string
}

export async function listEntries(): Promise<Entry[]> {
  const spaceId = await getMySpaceId()
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("space_id", spaceId)
    .order("entry_date", { ascending: false })
    .returns<Entry[]>()

  if (error) throw error
  return data
}

export async function createEntry(input: CreateEntryInput): Promise<Entry> {
  const [spaceId, userId] = await Promise.all([getMySpaceId(), ensureSession()])

  const { data, error } = await supabase
    .from("entries")
    .insert({
      space_id: spaceId,
      title: input.title,
      place_name: input.placeName ?? null,
      entry_date: input.entryDate,
      caption: input.caption ?? null,
      photos: input.photos ?? [],
      source_card_id: input.sourceCardId ?? null,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data as Entry
}

/** Screen-facing hook: fetches entries for the current space on mount,
 * exposes `refetch` for after a create. Data-fetching itself lives in the
 * plain functions above so it's testable without React. */
export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setEntries(await listEntries())
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { entries, loading, error, refetch }
}
