import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { PlusIcon } from "../assets/icons/card-icons"
import { Card } from "../components/Card"
import { useCards } from "../data/cards"
import { cardColorForId } from "../lib/cardColor"
import { CATEGORIES, cardBadges, groupChipClasses, type CategorySlug } from "../lib/categories"
import type { CardStatus } from "../types/database"

/**
 * Figma (drank file, cards-1 frame, node 1614:1386) covers the header + the
 * vertical card list. The single filter row (All · Visited dropdown | fixed
 * category chips), the empty state, and the header's icon aren't in the frame.
 * The real "add card" button is the dark plus circle Figma labels
 * "btn-profile".
 */

const STATUS_OPTIONS: { value: CardStatus; label: string }[] = [
  { value: "visited", label: "Visited" },
  { value: "wishlist", label: "Unvisited" },
]

const chipBase = "shrink-0 rounded-pill px-3.5 py-2 text-[11.5px] font-semibold"

export function CardsScreen() {
  const { cards, loading, error } = useCards()
  const navigate = useNavigate()
  // Both statuses on by default so visited + unvisited cards show together.
  const [statuses, setStatuses] = useState<CardStatus[]>(["visited", "wishlist"])
  const [selectedCategories, setSelectedCategories] = useState<CategorySlug[]>([])
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)

  const allStatuses = statuses.length === STATUS_OPTIONS.length
  const isDefaultFilter = allStatuses && selectedCategories.length === 0

  const filteredCards = useMemo(
    () =>
      cards.filter(
        (card) =>
          statuses.includes(card.status) &&
          (selectedCategories.length === 0 || selectedCategories.some((cat) => card.categories.includes(cat))),
      ),
    [cards, statuses, selectedCategories],
  )

  function toggleStatus(value: CardStatus) {
    setStatuses((prev) => {
      if (!prev.includes(value)) return [...prev, value]
      // Keep at least one checked — an empty selection would hide every card.
      return prev.length > 1 ? prev.filter((v) => v !== value) : prev
    })
  }

  function toggleCategory(slug: CategorySlug) {
    setSelectedCategories((prev) => (prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]))
  }

  function resetFilters() {
    setStatuses(["visited", "wishlist"])
    setSelectedCategories([])
    setStatusMenuOpen(false)
  }

  const statusLabel = allStatuses
    ? "Visited"
    : (STATUS_OPTIONS.find((o) => o.value === statuses[0])?.label ?? "Visited")

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between px-header-x">
        <h1 className="font-display text-[27px] font-bold tracking-[-0.54px] text-ink">cards</h1>
        <Link
          to="/cards/new"
          aria-label="Add card"
          className="flex size-[38px] items-center justify-center rounded-pill bg-ink text-background"
        >
          <PlusIcon className="size-[17px]" />
        </Link>
      </div>

      <div className="relative flex items-center gap-2 px-header-x pt-4 pb-4">
        <button
          type="button"
          onClick={resetFilters}
          aria-pressed={isDefaultFilter}
          className={`${chipBase} ${isDefaultFilter ? "bg-ink text-background" : "bg-surface text-ink-soft"}`}
        >
          All
        </button>

        <div className="relative shrink-0">
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={statusMenuOpen}
            onClick={() => setStatusMenuOpen((open) => !open)}
            className={`${chipBase} ${allStatuses ? "bg-surface text-ink" : "bg-ink text-background"}`}
          >
            {statusLabel} <span aria-hidden>▾</span>
          </button>
          {statusMenuOpen && (
            <>
              <button
                type="button"
                aria-label="Close status filter"
                onClick={() => setStatusMenuOpen(false)}
                className="fixed inset-0 z-20 cursor-default"
              />
              <div className="absolute top-full left-0 z-30 mt-2 flex min-w-[150px] flex-col gap-1 rounded-photo bg-background p-2 shadow-float">
                {STATUS_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-2.5 rounded-pill px-2.5 py-2 text-[13px] font-semibold text-ink"
                  >
                    <input
                      type="checkbox"
                      checked={statuses.includes(opt.value)}
                      onChange={() => toggleStatus(opt.value)}
                      className="size-4 accent-ink"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div aria-hidden className="h-5 w-px shrink-0 bg-ink-soft/40" />

        <div
          className="-mr-header-x flex min-w-0 flex-1 gap-2 overflow-x-auto py-1 pr-header-x [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {CATEGORIES.map((cat) => {
            const selected = selectedCategories.includes(cat.slug)
            const classes = groupChipClasses[cat.group]
            return (
              <button
                key={cat.slug}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleCategory(cat.slug)}
                className={`${chipBase} ${selected ? classes.active : classes.idle}`}
              >
                <span aria-hidden>{cat.emoji}</span> {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-screen-x pt-2">
        {loading && <p className="text-sm text-ink-soft">loading...</p>}
        {error && <p className="text-sm text-red-600">{error.message}</p>}

        {!loading && !error && filteredCards.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="font-display text-base font-bold text-ink">
              {cards.length === 0 ? "no cards yet" : "no matching cards"}
            </p>
            <p className="max-w-[240px] text-sm text-ink-soft">
              {cards.length === 0
                ? "Add a place or plan you want to remember, and it'll show up here."
                : "Try a different filter, or add a new card."}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 pb-4">
          {filteredCards.map((card) => (
            <Card
              key={card.id}
              title={card.title}
              badges={cardBadges(card)}
              color={cardColorForId(card.id)}
              onClick={() => navigate(`/cards/${card.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
