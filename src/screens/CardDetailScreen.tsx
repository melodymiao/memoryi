import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { BackChevronIcon, PlusIcon } from "../assets/icons/card-icons"
import { cardColorClasses } from "../components/Card"
import { CardForm, type CardFormSubmit } from "../components/CardForm"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { addCardPhotos, deleteCard, getCard, updateCard, updateCardStatus } from "../data/cards"
import { cardColorFor } from "../lib/cardColor"
import { cardBadges, isCategorySlug } from "../lib/categories"
import { linkHost, safeHref } from "../lib/links"
import { mapsUrl } from "../lib/maps"
import { getEntryPhotoUrl } from "../lib/photos"
import { LinkIcon, ScreenshotIcon } from "../assets/icons/source-icons"
import type { Card } from "../types/database"

const DELETE_CONFIRM_WINDOW_MS = 3000

/**
 * Full-screen card detail: view, inline edit, status toggle, delete.
 *
 * Figma (cards-3, node 1614:1652) covers the read view's hero card + tags +
 * "edit" label + "mark as visited" CTA. The notes thread, "where this came
 * from" attribution, photos carousel, and map/address in that frame are
 * deferred (steps 8/6 and not in the cards schema at all) — not built here.
 * Editing, delete, and the category/tags inputs have no Figma frame; see the
 * decisions recorded in this session's check-in.
 */
export function CardDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [card, setCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [editing, setEditing] = useState(false)
  // Unsaved-changes guard for the edit form.
  const [dirty, setDirty] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)
  const [deleteArmed, setDeleteArmed] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const deleteTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    getCard(id)
      .then((result) => {
        if (!cancelled) setCard(result)
      })
      .catch((err) => {
        if (!cancelled) setLoadError((err as Error).message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) window.clearTimeout(deleteTimerRef.current)
    }
  }, [])

  async function handleSaveEdit(values: CardFormSubmit) {
    if (!card) return
    setSavingEdit(true)
    setActionError(null)
    try {
      const { sourceScreenshotFile, photoFiles: _ignored, ...rest } = values
      const updated = await updateCard(card.id, { ...rest, sourceScreenshotFile: sourceScreenshotFile ?? undefined })
      setCard(updated)
      setEditing(false)
      setDirty(false)
    } catch (err) {
      setActionError((err as Error).message)
    } finally {
      setSavingEdit(false)
    }
  }

  function exitEdit() {
    setEditing(false)
    setDirty(false)
    setConfirmLeave(false)
    setActionError(null)
  }

  // While editing, < leaves edit mode (asking first if anything changed);
  // otherwise it goes back to the list.
  function handleBack() {
    if (!editing) {
      navigate("/cards")
      return
    }
    if (dirty) setConfirmLeave(true)
    else exitEdit()
  }

  // Closing the tab / app with unsaved edits.
  useEffect(() => {
    if (!editing || !dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [editing, dirty])

  async function handleToggleStatus() {
    if (!card) return
    setTogglingStatus(true)
    setActionError(null)
    try {
      const next = card.status === "wishlist" ? "visited" : "wishlist"
      setCard(await updateCardStatus(card.id, next))
    } catch (err) {
      setActionError((err as Error).message)
    } finally {
      setTogglingStatus(false)
    }
  }

  function handleDeleteClick() {
    if (!card) return

    if (!deleteArmed) {
      setDeleteArmed(true)
      deleteTimerRef.current = window.setTimeout(() => setDeleteArmed(false), DELETE_CONFIRM_WINDOW_MS)
      return
    }

    if (deleteTimerRef.current) window.clearTimeout(deleteTimerRef.current)
    setDeleting(true)
    setActionError(null)
    deleteCard(card.id)
      .then(() => navigate("/cards"))
      .catch((err) => {
        setActionError((err as Error).message)
        setDeleting(false)
        setDeleteArmed(false)
      })
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-2 pb-3">
        <button
          type="button"
          aria-label="Back"
          onClick={handleBack}
          className="flex size-[38px] items-center justify-center rounded-pill bg-surface text-ink"
        >
          <BackChevronIcon className="size-[17px]" />
        </button>
        {card && !editing && (
          <button type="button" onClick={() => setEditing(true)} className="text-[13px] font-bold text-ink">
            edit
          </button>
        )}
      </div>

      <div className="flex-1 px-screen-x pb-8">
        {loading && <p className="text-sm text-ink-soft">loading...</p>}
        {loadError && <p className="text-sm text-red-600">{loadError}</p>}

        {card && !editing && (
          <CardDetailView
            card={card}
            togglingStatus={togglingStatus}
            onToggleStatus={handleToggleStatus}
            deleteArmed={deleteArmed}
            deleting={deleting}
            onDeleteClick={handleDeleteClick}
            actionError={actionError}
            onCardChange={setCard}
          />
        )}

        {card && editing && (
          <>
            {actionError && <p className="mb-4 text-sm text-red-600">{actionError}</p>}
            <CardForm
              initialValues={{
                title: card.title,
                categories: card.categories.filter(isCategorySlug),
                notes: card.notes ?? "",
                typesText: card.types.join(", "),
                priceLevel: card.price_level,
                neighborhood: card.neighborhood ?? "",
                address: card.address ?? "",
                placeId: card.place_id,
                latitude: card.latitude,
                longitude: card.longitude,
                sourcePerson: card.source_person ?? "",
                sourceLink: card.source_link ?? "",
                sourceScreenshot: card.source_screenshot,
              }}
              submitLabel="save"
              submitting={savingEdit}
              onSubmit={handleSaveEdit}
              onDirtyChange={setDirty}
            />
          </>
        )}
      </div>

      {confirmLeave && (
        <ConfirmDialog
          title="unsaved changes"
          message="Are you sure? Your changes to this card won't be saved."
          cancelLabel="keep editing"
          confirmLabel="discard changes"
          onCancel={() => setConfirmLeave(false)}
          onConfirm={exitEdit}
        />
      )}
    </div>
  )
}

function CardDetailView({
  card,
  togglingStatus,
  onToggleStatus,
  deleteArmed,
  deleting,
  onDeleteClick,
  actionError,
  onCardChange,
}: {
  card: Card
  togglingStatus: boolean
  onToggleStatus: () => void
  deleteArmed: boolean
  deleting: boolean
  onDeleteClick: () => void
  actionError: string | null
  onCardChange: (card: Card) => void
}) {
  const { bg, fg } = cardColorClasses[cardColorFor(card)]
  const badges = cardBadges(card)

  return (
    <div className="flex flex-col gap-6">
      <div className={`flex flex-col gap-3 rounded-card p-5 ${bg} ${fg}`}>
        <p className="font-display text-[28px] font-bold tracking-[-0.5px]">{card.title}</p>
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.map((badge, i) => (
              <span key={`${badge}-${i}`} className="rounded-pill bg-background/60 px-3 py-1.5 text-[11px] font-semibold">
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>

      <SourceBlock card={card} />

      {card.address && (
        <a
          href={mapsUrl({ placeId: card.place_id, name: card.title, address: card.address }) ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-card bg-surface px-4 py-3.5"
        >
          <span aria-hidden className="text-[15px]">
            📍
          </span>
          <span className="min-w-0 flex-1 text-[13px] font-semibold text-ink">{card.address}</span>
          <span className="shrink-0 text-[11px] font-bold text-ink-soft">open in maps</span>
        </a>
      )}

      <CardPhotos card={card} onCardChange={onCardChange} />

      {card.notes && (
        <div>
          <p className="font-display text-[15px] font-bold text-ink">notes</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{card.notes}</p>
        </div>
      )}

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onToggleStatus}
          disabled={togglingStatus}
          className="w-full rounded-pill bg-accent py-4 text-[13.5px] font-bold text-on-accent disabled:opacity-60"
        >
          {togglingStatus ? "updating..." : card.status === "wishlist" ? "mark as visited" : "mark as wishlist"}
        </button>
        <button
          type="button"
          onClick={onDeleteClick}
          disabled={deleting}
          className={`w-full rounded-pill py-3.5 text-[13px] font-bold transition-colors disabled:opacity-60 ${
            deleteArmed ? "bg-red-600 text-white" : "bg-surface text-ink-soft"
          }`}
        >
          {deleting ? "deleting..." : deleteArmed ? "tap again to delete" : "delete card"}
        </button>
      </div>
    </div>
  )
}

/**
 * "where this came from" — Figma cards-3 source-attribution-block (node
 * 1630:6587): a rounded row with an initial avatar, "<name> told us about it",
 * "added <month year>", and a chevron when there's a link to open. Any
 * combination of person / link / screenshot may be present; the screenshot
 * shows below the row. Renders nothing when the card has no source.
 */
function SourceBlock({ card }: { card: Card }) {
  const href = safeHref(card.source_link)
  const person = card.source_person?.trim() || null
  const screenshotPath = card.source_screenshot
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!screenshotPath) {
      setScreenshotUrl(null)
      return
    }
    let cancelled = false
    getEntryPhotoUrl(screenshotPath)
      .then((url) => {
        if (!cancelled) setScreenshotUrl(url)
      })
      .catch(() => {
        if (!cancelled) setScreenshotUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [screenshotPath])

  if (!person && !href && !screenshotPath) return null

  const added = new Date(card.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const headline = person ? `${person} told us about it` : href ? linkHost(href) : "from a screenshot"
  const Avatar = person ? null : href ? LinkIcon : ScreenshotIcon

  const row = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft/40 text-[14px] font-bold text-accent">
        {Avatar ? <Avatar className="size-4" /> : person!.charAt(0).toLowerCase()}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[14px] font-bold text-ink">{headline}</span>
        <span className="text-[11.5px] text-ink-soft">added {added.toLowerCase()}</span>
      </span>
      {href && (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 text-ink-soft">
          <path d="m6 3 5 5-5 5" />
        </svg>
      )}
    </>
  )
  const rowClass = "flex items-center gap-3 rounded-card bg-surface px-4 py-3.5"

  return (
    <div>
      <p className="font-display text-[15px] font-bold text-ink">where this came from</p>
      <div className="mt-3 flex flex-col gap-3">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className={rowClass}>
            {row}
          </a>
        ) : (
          <div className={rowClass}>{row}</div>
        )}

        {person && href && (
          <p className="flex items-center gap-1.5 px-1 text-[11.5px] text-ink-soft">
            <LinkIcon className="size-3.5" />
            {linkHost(href)}
          </p>
        )}
        {screenshotPath && (
          <div className="flex flex-col gap-1.5">
            <p className="flex items-center gap-1.5 px-1 text-[11.5px] text-ink-soft">
              <ScreenshotIcon className="size-3.5" />
              screenshot
            </p>
            {screenshotUrl ? (
              <a href={screenshotUrl} target="_blank" rel="noopener noreferrer">
                <img src={screenshotUrl} alt="Screenshot of the recommendation" className="max-h-80 w-full rounded-photo object-cover object-top" />
              </a>
            ) : (
              <div className="h-40 w-full rounded-photo bg-surface" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Photos row — Figma cards-3 photos-carousel (node 1630:6614): 138×172
 * rounded tiles scrolling sideways, ending in an "add photos" tile. Photos are
 * uploaded to the private bucket and shown via signed URLs; tapping one opens
 * it full size.
 */
function CardPhotos({ card, onCardChange }: { card: Card; onCardChange: (card: Card) => void }) {
  const [urls, setUrls] = useState<(string | null)[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const photosKey = card.photos.join("|")
  useEffect(() => {
    let cancelled = false
    Promise.all(card.photos.map((path) => getEntryPhotoUrl(path).catch(() => null))).then((result) => {
      if (!cancelled) setUrls(result)
    })
    return () => {
      cancelled = true
    }
    // photosKey stands in for the card.photos contents
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [photosKey])

  async function handleFiles(files: FileList | null) {
    const images = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"))
    if (inputRef.current) inputRef.current.value = ""
    if (images.length === 0) return
    setUploading(true)
    setError(null)
    try {
      onCardChange(await addCardPhotos(card, images))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className="-mx-screen-x flex gap-2.5 overflow-x-auto px-screen-x [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {card.photos.map((path, i) =>
          urls[i] ? (
            <a key={path} href={urls[i]!} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <img src={urls[i]!} alt="" className="h-[172px] w-[138px] rounded-photo object-cover" />
            </a>
          ) : (
            <div key={path} className="h-[172px] w-[138px] shrink-0 rounded-photo bg-surface" />
          ),
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-[172px] w-[138px] shrink-0 flex-col items-center justify-center gap-2 rounded-photo bg-surface text-ink-soft disabled:opacity-60"
        >
          <PlusIcon className="size-5" />
          <span className="text-[11.5px] font-bold">{uploading ? "uploading..." : "add photos"}</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
