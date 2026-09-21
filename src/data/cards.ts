import { useCallback, useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { ensureSession } from "../lib/auth"
import { getMySpaceId } from "./spaces"
import { uploadCardSourceScreenshot } from "../lib/photos"
import type { Card, CardStatus } from "../types/database"

export interface CreateCardInput {
  title: string
  categories?: string[]
  notes?: string
  placeId?: string
  address?: string
  neighborhood?: string
  priceLevel?: number
  types?: string[]
  sourcePerson?: string
  sourceLink?: string
  /** Upload this file as the card's source screenshot. */
  sourceScreenshotFile?: File
  /** Defaults to "wishlist" (DB default) if omitted. */
  status?: CardStatus
}

/** Rows fetched before the category / place-detail migrations are applied lack
 * those columns entirely; default them so the UI never dereferences undefined. */
function normalizeCard(row: Card): Card {
  return {
    ...row,
    categories: row.categories ?? [],
    types: row.types ?? [],
    tags: row.tags ?? [],
    place_id: row.place_id ?? null,
    address: row.address ?? null,
    neighborhood: row.neighborhood ?? null,
    price_level: row.price_level ?? null,
    source_person: row.source_person ?? null,
    source_link: row.source_link ?? null,
    source_screenshot: row.source_screenshot ?? null,
  }
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
  return data.map(normalizeCard)
}

export async function getCard(id: string): Promise<Card> {
  const { data, error } = await supabase.from("cards").select("*").eq("id", id).single()

  if (error) throw error
  return normalizeCard(data as Card)
}

export async function createCard(input: CreateCardInput): Promise<Card> {
  const [spaceId, userId] = await Promise.all([getMySpaceId(), ensureSession()])
  const sourceScreenshot = input.sourceScreenshotFile
    ? await uploadCardSourceScreenshot(spaceId, input.sourceScreenshotFile)
    : null

  const { data, error } = await supabase
    .from("cards")
    .insert({
      space_id: spaceId,
      title: input.title,
      categories: input.categories ?? [],
      notes: input.notes ?? null,
      place_id: input.placeId ?? null,
      address: input.address ?? null,
      neighborhood: input.neighborhood ?? null,
      price_level: input.priceLevel ?? null,
      types: input.types ?? [],
      source_person: input.sourcePerson ?? null,
      source_link: input.sourceLink ?? null,
      source_screenshot: sourceScreenshot,
      status: input.status,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  return normalizeCard(data as Card)
}

export async function updateCardStatus(id: string, status: CardStatus): Promise<Card> {
  const { data, error } = await supabase
    .from("cards")
    .update({ status })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return normalizeCard(data as Card)
}

export interface UpdateCardInput {
  title: string
  categories: string[]
  notes: string | null
  placeId: string | null
  address: string | null
  neighborhood: string | null
  priceLevel: number | null
  types: string[]
  sourcePerson: string | null
  sourceLink: string | null
  /** Existing screenshot path to keep, or null to clear it. Ignored if `sourceScreenshotFile` is set. */
  sourceScreenshot: string | null
  /** A new screenshot to upload (replaces the existing one). */
  sourceScreenshotFile?: File
}

export async function updateCard(id: string, input: UpdateCardInput): Promise<Card> {
  const sourceScreenshot = input.sourceScreenshotFile
    ? await uploadCardSourceScreenshot(await getMySpaceId(), input.sourceScreenshotFile)
    : input.sourceScreenshot
  const { data, error } = await supabase
    .from("cards")
    .update({
      title: input.title,
      categories: input.categories,
      notes: input.notes,
      place_id: input.placeId,
      address: input.address,
      neighborhood: input.neighborhood,
      price_level: input.priceLevel,
      types: input.types,
      source_person: input.sourcePerson,
      source_link: input.sourceLink,
      source_screenshot: sourceScreenshot,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return normalizeCard(data as Card)
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
