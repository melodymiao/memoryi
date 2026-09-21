import { CATEGORIES, type CategorySlug } from "../../lib/categories"

export interface CategoryPickerProps {
  value: CategorySlug[]
  onChange: (next: CategorySlug[]) => void
}

/** All fixed categories laid out as toggle chips; any number can be picked. */
export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  function toggle(slug: CategorySlug) {
    onChange(value.includes(slug) ? value.filter((s) => s !== slug) : [...value, slug])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => {
        const selected = value.includes(cat.slug)
        return (
          <button
            key={cat.slug}
            type="button"
            aria-pressed={selected}
            title={cat.description}
            onClick={() => toggle(cat.slug)}
            className={`rounded-pill px-3.5 py-2 text-[12px] ${
              selected ? "bg-accent font-bold text-accent-soft" : "bg-surface font-semibold text-ink-soft"
            }`}
          >
            <span aria-hidden>{cat.emoji}</span> {cat.label}
          </button>
        )
      })}
    </div>
  )
}
