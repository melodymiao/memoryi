import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { BackChevronIcon } from "../assets/icons/card-icons"
import { cardColorClasses } from "../components/Card"
import { CardForm } from "../components/CardForm"
import { deleteCard, getCard, updateCard, updateCardStatus } from "../data/cards"
import { cardColorForId } from "../lib/cardColor"
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

  async function handleSaveEdit(values: { title: string; category: string | null; notes: string | null; tags: string[] }) {
    if (!card) return
    setSavingEdit(true)
    setActionError(null)
    try {
      const updated = await updateCard(card.id, values)
      setCard(updated)
      setEditing(false)
    } catch (err) {
      setActionError((err as Error).message)
    } finally {
      setSavingEdit(false)
    }
  }

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
          onClick={() => navigate("/cards")}
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
          />
        )}

        {card && editing && (
          <>
            {actionError && <p className="mb-4 text-sm text-red-600">{actionError}</p>}
            <CardForm
              initialValues={{
                title: card.title,
                category: card.category ?? "",
                notes: card.notes ?? "",
                tagsText: card.tags.join(", "),
              }}
              submitLabel="save"
              submitting={savingEdit}
              onSubmit={handleSaveEdit}
              onCancel={() => {
                setEditing(false)
                setActionError(null)
              }}
            />
          </>
        )}
      </div>
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
}: {
  card: Card
  togglingStatus: boolean
  onToggleStatus: () => void
  deleteArmed: boolean
  deleting: boolean
  onDeleteClick: () => void
  actionError: string | null
}) {
  const { bg, fg } = cardColorClasses[cardColorForId(card.id)]
  const badges = [card.category, ...card.tags].filter((b): b is string => Boolean(b))

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
          className="w-full rounded-pill bg-ink py-4 text-[13.5px] font-bold text-background disabled:opacity-60"
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
