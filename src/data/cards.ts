import { useCallback, useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { ensureSession } from "../lib/auth"
import { getMySpaceId } from "./spaces"
import type { Card, CardStatus } from "../types/database"

export interface CreateCardInput {
  title: string
  category?: string
  notes?: string
  tags?: string[]
  /** Defaults to "wishlist" (DB default) if omitted. */
  status?: CardStatus
}

export async function listCards(): Promise<Card[]> {
  const spaceId = await getMySpaceId()
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("space_id", spaceId)
    .order("created_at", { ascending: false })
    .returns<Card[]>()

  if (error) throw error
  return data
}

export async function getCard(id: string): Promise<Card> {
  const { data, error } = await supabase.from("cards").select("*").eq("id", id).single()

  if (error) throw error
  return data as Card
}

export async function createCard(input: CreateCardInput): Promise<Card> {
  const [spaceId, userId] = await Promise.all([getMySpaceId(), ensureSession()])

  const { data, error } = await supabase
    .from("cards")
    .insert({
      space_id: spaceId,
      title: input.title,
      category: input.category ?? null,
      notes: input.notes ?? null,
      tags: input.tags ?? [],
      status: input.status,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data as Card
}

export async function updateCardStatus(id: string, status: CardStatus): Promise<Card> {
  const { data, error } = await supabase
    .from("cards")
    .update({ status })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Card
}

export interface UpdateCardInput {
  title: string
  category: string | null
  notes: string | null
  tags: string[]
}

export async function updateCard(id: string, input: UpdateCardInput): Promise<Card> {
  const { data, error } = await supabase
    .from("cards")
    .update({
      title: input.title,
      category: input.category,
      notes: input.notes,
      tags: input.tags,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Card
}

export async function deleteCard(id: string): Promise<void> {
  const { error } = await supabase.from("cards").delete().eq("id", id)
  if (error) throw error
}

/** Screen-facing hook — see useEntries in entries.ts for the same pattern. */
export function useCards() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCards(await listCards())
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { cards, loading, error, refetch }
}
