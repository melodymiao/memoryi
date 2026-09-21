import { useRef, useState, type FormEvent } from "react"
import { CategoryPicker } from "../CategoryPicker"
import { newSessionToken, getPlaceDetails, placesEnabled, type PlaceSuggestion } from "../../lib/places"
import { usePlaceSuggestions } from "../../lib/usePlaceSuggestions"
import type { CategorySlug } from "../../lib/categories"

/**
 * Shared card fields — used by both the add-card screen and the inline edit
 * mode on the card detail screen. No dedicated Figma frame exists for either
 * (see supabase card-detail edit label, node 1614:1659, which has no attached
 * form) — field styling reuses existing tokens (`surface`, `radius-photo`,
 * `radius-pill`) rather than inventing new ones, per THEME.md.
 *
 * Fields: title (with Google Places suggestions), fixed multi-select
 * categories, then the finer details — Type, Price, Location — as separate
 * inputs, then notes.
 */

export interface CardFormValues {
  title: string
  categories: CategorySlug[]
  /** Comma-separated in the UI; split into `types` on submit. */
  typesText: string
  /** 1–4 for $–$$$$, or null. */
  priceLevel: number | null
  /** Neighborhood / area. */
  neighborhood: string
  address: string
  placeId: string | null
  notes: string
}

export interface CardFormSubmit {
  title: string
  categories: CategorySlug[]
  types: string[]
  priceLevel: number | null
  neighborhood: string | null
  address: string | null
  placeId: string | null
  notes: string | null
}

export interface CardFormProps {
  initialValues: CardFormValues
  submitLabel: string
  onSubmit: (values: CardFormSubmit) => void
  onCancel?: () => void
  submitting?: boolean
}

const inputClass =
  "w-full rounded-photo bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-soft focus:outline-none"
const labelClass = "text-[10px] font-bold tracking-[0.6px] text-ink-soft uppercase"

const PRICE_LEVELS = [1, 2, 3, 4] as const

export function CardForm({ initialValues, submitLabel, onSubmit, onCancel, submitting = false }: CardFormProps) {
  const [title, setTitle] = useState(initialValues.title)
  const [categories, setCategories] = useState<CategorySlug[]>(initialValues.categories)
  const [typesText, setTypesText] = useState(initialValues.typesText)
  const [priceLevel, setPriceLevel] = useState<number | null>(initialValues.priceLevel)
  const [neighborhood, setNeighborhood] = useState(initialValues.neighborhood)
  const [address, setAddress] = useState(initialValues.address)
  const [placeId, setPlaceId] = useState<string | null>(initialValues.placeId)
  const [notes, setNotes] = useState(initialValues.notes)
  const [titleError, setTitleError] = useState(false)

  // Autocomplete: suggestions show while the title is being typed. Picking one
  // (or clicking away) closes the list; typing again reopens it.
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [resolving, setResolving] = useState(false)
  const sessionTokenRef = useRef(newSessionToken())
  const { suggestions, loading: suggesting } = usePlaceSuggestions(
    title,
    sessionTokenRef.current,
    suggestOpen,
  )

  async function pickSuggestion(s: PlaceSuggestion) {
    setSuggestOpen(false)
    setTitle(s.name)
    setTitleError(false)
    setPlaceId(s.placeId)
    setAddress(s.secondary)
    setResolving(true)
    try {
      const details = await getPlaceDetails(s.placeId, sessionTokenRef.current)
      setAddress(details.address || s.secondary)
      setNeighborhood(details.neighborhood)
    } catch (err) {
      // Keep the suggestion's address line; neighborhood stays editable by hand.
      console.warn(err)
    } finally {
      setResolving(false)
      // A session ends once details are fetched; start a fresh one.
      sessionTokenRef.current = newSessionToken()
    }
  }

  function handleTitleChange(value: string) {
    setTitle(value)
    setSuggestOpen(true)
    if (titleError) setTitleError(false)
    // Editing the name after picking a place unlinks it.
    if (placeId) {
      setPlaceId(null)
      setAddress("")
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setTitleError(true)
      return
    }

    onSubmit({
      title: trimmedTitle,
      categories,
      types: typesText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      priceLevel,
      neighborhood: neighborhood.trim() || null,
      address: address.trim() || null,
      placeId,
      notes: notes.trim() || null,
    })
  }

  const showSuggestions = suggestOpen && suggestions.length > 0

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative flex flex-col gap-1.5">
        <label htmlFor="card-title" className={labelClass}>
          title
        </label>
        <input
          id="card-title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          onBlur={() => setSuggestOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSuggestOpen(false)
          }}
          placeholder="Sushi Gen"
          className={inputClass}
          autoFocus
          autoComplete="off"
          role={placesEnabled ? "combobox" : undefined}
          aria-expanded={placesEnabled ? showSuggestions : undefined}
          aria-controls={placesEnabled ? "card-title-suggestions" : undefined}
        />
        {titleError && <p className="text-xs text-red-600">Title is required.</p>}
        {placeId && address && (
          <p className="text-[11px] text-ink-soft">
            📍 {address}
            {resolving ? " …" : ""}
          </p>
        )}
        {placesEnabled && suggesting && !showSuggestions && (
          <p className="text-[11px] text-ink-soft">searching places…</p>
        )}

        {showSuggestions && (
          <ul
            id="card-title-suggestions"
            role="listbox"
            className="absolute top-full right-0 left-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-photo bg-background p-1 shadow-float"
          >
            {suggestions.map((s) => (
              <li key={s.placeId} role="option" aria-selected={false}>
                <button
                  type="button"
                  // mousedown (not click) so the input's blur doesn't close the list first.
                  onMouseDown={(e) => {
                    e.preventDefault()
                    void pickSuggestion(s)
                  }}
                  className="flex w-full flex-col items-start gap-0.5 rounded-photo px-3 py-2 text-left hover:bg-surface"
                >
                  <span className="text-[13px] font-bold text-ink">{s.name}</span>
                  {s.secondary && <span className="text-[11px] text-ink-soft">{s.secondary}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className={labelClass}>category</p>
        <CategoryPicker value={categories} onChange={setCategories} />
        <p className="text-[11px] text-ink-soft">Pick as many as fit.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="card-type" className={labelClass}>
          type
        </label>
        <input
          id="card-type"
          value={typesText}
          onChange={(e) => setTypesText(e.target.value)}
          placeholder="omakase, ramen"
          className={inputClass}
        />
        <p className="text-[11px] text-ink-soft">What specifically it is. Comma-separated.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className={labelClass}>price</p>
        <div className="flex gap-2">
          {PRICE_LEVELS.map((level) => {
            const selected = priceLevel === level
            return (
              <button
                key={level}
                type="button"
                aria-pressed={selected}
                aria-label={`${"$".repeat(level)} price`}
                // Tapping the selected level again clears it.
                onClick={() => setPriceLevel(selected ? null : level)}
                className={`flex-1 rounded-pill py-2.5 text-[13px] font-bold ${
                  selected ? "bg-ink text-background" : "bg-surface text-ink-soft"
                }`}
              >
                {"$".repeat(level)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="card-location" className={labelClass}>
          location
        </label>
        <input
          id="card-location"
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
          placeholder="Little Tokyo"
          className={inputClass}
        />
        <p className="text-[11px] text-ink-soft">
          {placesEnabled ? "Filled in when you pick a suggested place." : "Neighborhood or area."}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="card-notes" className={labelClass}>
          notes
        </label>
        <textarea
          id="card-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything worth remembering..."
          rows={4}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="mt-2 flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-pill bg-surface py-3.5 text-[13.5px] font-bold text-ink"
          >
            cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-pill bg-ink py-3.5 text-[13.5px] font-bold text-background disabled:opacity-60"
        >
          {submitting ? "saving..." : submitLabel}
        </button>
      </div>
    </form>
  )
}
