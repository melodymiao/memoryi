import { useCallback, useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { ensureSession } from "../lib/auth"
import { getMySpaceId } from "./spaces"
import { uploadCardPhoto, uploadCardSourceScreenshot } from "../lib/photos"
import type { Card, CardStatus } from "../types/database"

export interface CreateCardInput {
  title: string
  categories?: string[]
  notes?: string
  placeId?: string
  latitude?: number
  longitude?: number
  address?: string
  neighborhood?: string
  priceLevel?: number
  types?: string[]
  sourcePerson?: string
  sourceLink?: string
  /** The card's own photos to upload; the first becomes its list thumbnail. */
  photoFiles?: File[]
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
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    photos: row.photos ?? [],
    source_person: row.source_person ?? null,
    source_link: row.source_link ?? null,
    source_screenshot: row.source_screenshot ?? null,
  }
}

/** Runs one stage of a save and, if it throws, says which stage — a bare
 * "Load failed" (Safari's network-error message) doesn't say whether the
 * screenshot upload or the save itself failed. */
async function step<T>(label: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`${label} failed: ${message}`, { cause: err })
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
  // Client-generated id so photos can be filed under it before the row exists.
  const id = crypto.randomUUID()
  const photoFiles = input.photoFiles ?? []
  const photos =
    photoFiles.length > 0
      ? await step("Uploading photos", () => Promise.all(photoFiles.map((f) => uploadCardPhoto(spaceId, id, f))))
      : []
  const sourceScreenshot = input.sourceScreenshotFile
    ? await step("Uploading the screenshot", () => uploadCardSourceScreenshot(spaceId, input.sourceScreenshotFile!))
    : null

  const { data, error } = await supabase
    .from("cards")
    .insert({
      id,
      space_id: spaceId,
      title: input.title,
      categories: input.categories ?? [],
      notes: input.notes ?? null,
      place_id: input.placeId ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      address: input.address ?? null,
      neighborhood: input.neighborhood ?? null,
      price_level: input.priceLevel ?? null,
      types: input.types ?? [],
      source_person: input.sourcePerson ?? null,
      source_link: input.sourceLink ?? null,
      source_screenshot: sourceScreenshot,
      photos,
      status: input.status,
      created_by: userId,
    })
    .select()
    .single()

  // supabase-js reports network failures (Safari: "TypeError: Load failed") as
  // `error` rather than throwing, so name the stage here too.
  if (error) throw new Error(`Saving the card failed: ${error.message}`, { cause: error })
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
  latitude: number | null
  longitude: number | null
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
    ? await step("Uploading the screenshot", async () =>
        uploadCardSourceScreenshot(await getMySpaceId(), input.sourceScreenshotFile!),
      )
    : input.sourceScreenshot
  const { data, error } = await supabase
    .from("cards")
    .update({
      title: input.title,
      categories: input.categories,
      notes: input.notes,
      place_id: input.placeId,
      latitude: input.latitude,
      longitude: input.longitude,
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

/** Uploads photos and appends them to the card's own photo list. */
export async function addCardPhotos(card: Card, files: File[]): Promise<Card> {
  const spaceId = await getMySpaceId()
  const paths = await step("Uploading photos", () => Promise.all(files.map((f) => uploadCardPhoto(spaceId, card.id, f))))
  const { data, error } = await supabase
    .from("cards")
    .update({ photos: [...card.photos, ...paths] })
    .eq("id", card.id)
    .select()
    .single()

  if (error) throw new Error(`Saving the photos failed: ${error.message}`, { cause: error })
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
