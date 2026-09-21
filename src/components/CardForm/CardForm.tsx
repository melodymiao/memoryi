import { useEffect, useRef, useState, type FormEvent } from "react"
import { LinkIcon, PersonIcon, ScreenshotIcon } from "../../assets/icons/source-icons"
import { CategoryPicker } from "../CategoryPicker"
import { newSessionToken, getPlaceDetails, placesEnabled, stripAreaFromName, type PlaceSuggestion } from "../../lib/places"
import { mapsUrl } from "../../lib/maps"
import { usePlaceSuggestions } from "../../lib/usePlaceSuggestions"
import { categoriesFromPlaceTypes } from "../../lib/placeTypes"
import type { CategorySlug } from "../../lib/categories"
import { normalizeLink } from "../../lib/links"
import { getEntryPhotoUrl } from "../../lib/photos"

/**
 * Shared card fields — used by both the add-card screen and the inline edit
 * mode on the card detail screen. No dedicated Figma frame exists for either
 * (see supabase card-detail edit label, node 1614:1659, which has no attached
 * form) — field styling reuses existing tokens (`surface`, `radius-photo`,
 * `radius-pill`) rather than inventing new ones, per THEME.md.
 *
 * Fields: title (with Google Places suggestions that autofill Type, Price and
 * Location), fixed multi-select categories, the finer details — Type, Price,
 * Location — as separate inputs, where the recommendation came from (a
 * screenshot, a link and/or a person), then notes.
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
  sourcePerson: string
  sourceLink: string
  /** Existing screenshot's storage path, if any. */
  sourceScreenshot: string | null
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
  sourcePerson: string | null
  sourceLink: string | null
  /** Existing screenshot path to keep (null if none or removed). */
  sourceScreenshot: string | null
  /** A newly chosen screenshot to upload. */
  sourceScreenshotFile: File | null
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
const MAX_SCREENSHOT_BYTES = 15 * 1024 * 1024 // matches the storage bucket limit

const chipClass = (active: boolean) =>
  `flex items-center gap-1.5 rounded-pill px-3.5 py-2 text-[12px] ${
    active ? "bg-accent font-bold text-on-accent" : "bg-surface font-semibold text-ink-soft"
  }`

export function CardForm({ initialValues, submitLabel, onSubmit, onCancel, submitting = false }: CardFormProps) {
  const [title, setTitle] = useState(initialValues.title)
  const [categories, setCategories] = useState<CategorySlug[]>(initialValues.categories)
  const [typesText, setTypesText] = useState(initialValues.typesText)
  const [priceLevel, setPriceLevel] = useState<number | null>(initialValues.priceLevel)
  const [neighborhood, setNeighborhood] = useState(initialValues.neighborhood)
  const [address, setAddress] = useState(initialValues.address)
  const [placeId, setPlaceId] = useState<string | null>(initialValues.placeId)
  const [notes, setNotes] = useState(initialValues.notes)

  // Source: any combination of a person, a link and a screenshot.
  const [showPerson, setShowPerson] = useState(Boolean(initialValues.sourcePerson))
  const [sourcePerson, setSourcePerson] = useState(initialValues.sourcePerson)
  const [showLink, setShowLink] = useState(Boolean(initialValues.sourceLink))
  const [sourceLink, setSourceLink] = useState(initialValues.sourceLink)
  const [linkError, setLinkError] = useState(false)
  const [screenshotPath, setScreenshotPath] = useState<string | null>(initialValues.sourceScreenshot)
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotError, setScreenshotError] = useState<string | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Preview: the chosen file if any, otherwise a signed URL for the saved one.
  useEffect(() => {
    if (screenshotFile) {
      const url = URL.createObjectURL(screenshotFile)
      setScreenshotPreview(url)
      return () => URL.revokeObjectURL(url)
    }
    if (!screenshotPath) {
      setScreenshotPreview(null)
      return
    }
    let cancelled = false
    getEntryPhotoUrl(screenshotPath)
      .then((url) => {
        if (!cancelled) setScreenshotPreview(url)
      })
      .catch(() => {
        if (!cancelled) setScreenshotPreview(null)
      })
    return () => {
      cancelled = true
    }
  }, [screenshotFile, screenshotPath])

  function handleScreenshotPicked(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setScreenshotError("That file isn't an image.")
      return
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      setScreenshotError("Image is over 15 MB.")
      return
    }
    setScreenshotError(null)
    setScreenshotFile(file)
  }

  function removeScreenshot() {
    setScreenshotFile(null)
    setScreenshotPath(null)
    setScreenshotError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const hasScreenshot = Boolean(screenshotFile || screenshotPath)
  const [titleError, setTitleError] = useState(false)
  const [categoryError, setCategoryError] = useState(false)
  // Once the user picks categories themselves, place autofill stops overriding them.
  const categoriesTouchedRef = useRef(initialValues.categories.length > 0)
  const [locationError, setLocationError] = useState(false)

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
      // Drop a trailing city/neighborhood from the name (the location field and
      // address carry it); skip if the title was edited in the meantime.
      setTitle((current) => (current === s.name ? stripAreaFromName(s.name, details.areaNames) : current))
      setNeighborhood(details.neighborhood)
      // Autofill Type and Price when Google has them; both stay editable.
      if (details.type) setTypesText(details.type)
      if (details.priceLevel !== null) setPriceLevel(details.priceLevel)
      const suggested = categoriesFromPlaceTypes(details.placeTypes)
      if (suggested.length > 0 && !categoriesTouchedRef.current) {
        setCategories(suggested)
        setCategoryError(false)
      }
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
    const missingTitle = !trimmedTitle
    const missingCategory = categories.length === 0
    const missingLocation = !neighborhood.trim()
    setTitleError(missingTitle)
    setCategoryError(missingCategory)
    setLocationError(missingLocation)
    if (missingTitle || missingCategory || missingLocation) return

    let link: string | null = null
    if (showLink) {
      const result = normalizeLink(sourceLink)
      if (!result.ok) {
        setLinkError(true)
        return
      }
      link = result.url
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
      sourcePerson: showPerson ? sourcePerson.trim() || null : null,
      sourceLink: link,
      sourceScreenshot: screenshotFile ? null : screenshotPath,
      sourceScreenshotFile: screenshotFile,
      notes: notes.trim() || null,
    })
  }

  const showSuggestions = suggestOpen && suggestions.length > 0

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative flex flex-col gap-1.5">
        <label htmlFor="card-title" className={labelClass}>
          title *
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
            <a
              href={mapsUrl({ placeId, name: title, address }) ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              📍 {address}
            </a>
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
        <label htmlFor="card-location" className={labelClass}>
          location *
        </label>
        <input
          id="card-location"
          value={neighborhood}
          onChange={(e) => {
            setNeighborhood(e.target.value)
            if (locationError) setLocationError(false)
          }}
          placeholder="Little Tokyo"
          className={inputClass}
        />
        {locationError && <p className="text-xs text-red-600">Location is required.</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className={labelClass}>category *</p>
        <CategoryPicker
          value={categories}
          onChange={(next) => {
            categoriesTouchedRef.current = true
            setCategories(next)
            if (categoryError) setCategoryError(false)
          }}
        />
        {categoryError && <p className="text-xs text-red-600">Pick at least one category.</p>}
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
                  selected ? "bg-accent text-on-accent" : "bg-surface text-ink-soft"
                }`}
              >
                {"$".repeat(level)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className={labelClass}>where this came from</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={hasScreenshot} onClick={() => fileInputRef.current?.click()} className={chipClass(hasScreenshot)}>
            <ScreenshotIcon className="size-3.5" />
            screenshot
          </button>
          <button type="button" aria-pressed={showLink} onClick={() => {
            setShowLink((v) => !v)
            if (showLink) {
              setSourceLink("")
              setLinkError(false)
            }
          }} className={chipClass(showLink)}>
            <LinkIcon className="size-3.5" />
            link
          </button>
          <button type="button" aria-pressed={showPerson} onClick={() => {
            setShowPerson((v) => !v)
            if (showPerson) setSourcePerson("")
          }} className={chipClass(showPerson)}>
            <PersonIcon className="size-3.5" />
            someone else
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleScreenshotPicked(e.target.files?.[0])}
        />
        {screenshotError && <p className="text-xs text-red-600">{screenshotError}</p>}
        {hasScreenshot && (
          <div className="flex items-center gap-3">
            {screenshotPreview ? (
              <img src={screenshotPreview} alt="Screenshot preview" className="size-16 rounded-photo object-cover" />
            ) : (
              <div className="size-16 rounded-photo bg-surface" />
            )}
            <button type="button" onClick={removeScreenshot} className="text-[12px] font-bold text-ink-soft">
              remove
            </button>
          </div>
        )}
        {showLink && (
          <div className="flex flex-col gap-1">
            <input
              value={sourceLink}
              onChange={(e) => {
                setSourceLink(e.target.value)
                if (linkError) setLinkError(false)
              }}
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="https://..."
              aria-label="Source link"
              className={inputClass}
            />
            {linkError && <p className="text-xs text-red-600">That doesn't look like a valid link.</p>}
          </div>
        )}
        {showPerson && (
          <input
            value={sourcePerson}
            onChange={(e) => setSourcePerson(e.target.value)}
            placeholder="Who told you about it?"
            aria-label="Who recommended it"
            className={inputClass}
          />
        )}
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
          className="flex-1 rounded-pill bg-accent py-3.5 text-[13.5px] font-bold text-on-accent disabled:opacity-60"
        >
          {submitting ? "saving..." : submitLabel}
        </button>
      </div>
    </form>
  )
}
