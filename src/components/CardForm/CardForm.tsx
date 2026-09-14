import { useState, type FormEvent } from "react"

/**
 * Shared title/category/notes/tags fields — used by both the add-card screen
 * and the inline edit mode on the card detail screen. No dedicated Figma
 * frame exists for either (see supabase card-detail edit label, node
 * 1614:1659, which has no attached form) — field styling reuses existing
 * tokens (`surface`, `radius-photo`, `radius-pill`) rather than inventing new
 * ones, per THEME.md.
 */

export interface CardFormValues {
  title: string
  category: string
  notes: string
  /** Comma-separated in the UI; split into Card.tags on submit. */
  tagsText: string
}

export interface CardFormProps {
  initialValues: CardFormValues
  submitLabel: string
  onSubmit: (values: { title: string; category: string | null; notes: string | null; tags: string[] }) => void
  onCancel?: () => void
  submitting?: boolean
}

const inputClass =
  "w-full rounded-photo bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-soft focus:outline-none"
const labelClass = "text-[10px] font-bold tracking-[0.6px] text-ink-soft uppercase"

export function CardForm({ initialValues, submitLabel, onSubmit, onCancel, submitting = false }: CardFormProps) {
  const [title, setTitle] = useState(initialValues.title)
  const [category, setCategory] = useState(initialValues.category)
  const [notes, setNotes] = useState(initialValues.notes)
  const [tagsText, setTagsText] = useState(initialValues.tagsText)
  const [titleError, setTitleError] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setTitleError(true)
      return
    }

    onSubmit({
      title: trimmedTitle,
      category: category.trim() || null,
      notes: notes.trim() || null,
      tags: tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="card-title" className={labelClass}>
          title
        </label>
        <input
          id="card-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (titleError) setTitleError(false)
          }}
          placeholder="Sushi Gen"
          className={inputClass}
          autoFocus
        />
        {titleError && <p className="text-xs text-red-600">Title is required.</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="card-category" className={labelClass}>
          category
        </label>
        <input
          id="card-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="food, activity, travel..."
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="card-tags" className={labelClass}>
          tags
        </label>
        <input
          id="card-tags"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="omakase, $$, Little Tokyo"
          className={inputClass}
        />
        <p className="text-[11px] text-ink-soft">Comma-separated.</p>
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
