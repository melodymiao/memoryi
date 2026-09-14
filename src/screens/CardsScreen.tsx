import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { PlusIcon } from "../assets/icons/card-icons"
import { Card } from "../components/Card"
import { useCards } from "../data/cards"
import { cardColorForId } from "../lib/cardColor"
import type { CardStatus } from "../types/database"

/**
 * Figma (drank file, cards-1 frame, node 1614:1386) covers the header + the
 * wishlist/visited filter pills + the vertical card list. The category
 * filter row, the empty state, and the header's icon (labeled "btn-add" in
 * Figma but visually a filter/sort glyph with no defined behavior) aren't in
 * the frame — see this session's check-in for those calls. The real
 * "add card" button is the dark plus circle Figma labels "btn-profile".
 */

const STATUS_OPTIONS: { value: CardStatus; label: string }[] = [
  { value: "wishlist", label: "wishlist" },
  { value: "visited", label: "visited" },
]

export function CardsScreen() {
  const { cards, loading, error } = useCards()
  const navigate = useNavigate()
  const [status, setStatus] = useState<CardStatus>("wishlist")
  const [category, setCategory] = useState<string>("all")

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const card of cards) {
      if (card.category) set.add(card.category)
    }
    return Array.from(set).sort()
  }, [cards])

  const filteredCards = useMemo(
    () => cards.filter((card) => card.status === status && (category === "all" || card.category === category)),
    [cards, status, category],
  )

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

      <div className="flex gap-2 px-header-x pt-4 pb-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatus(opt.value)}
            className={`rounded-pill px-4 py-2 text-[12.5px] font-bold ${
              status === opt.value ? "bg-ink text-background" : "bg-surface text-ink-soft"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {categories.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto px-header-x pb-4 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`shrink-0 rounded-pill px-3.5 py-1.5 text-[11.5px] font-semibold ${
              category === "all" ? "bg-ink text-background" : "bg-surface text-ink-soft"
            }`}
          >
            all
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-pill px-3.5 py-1.5 text-[11.5px] font-semibold ${
                category === cat ? "bg-ink text-background" : "bg-surface text-ink-soft"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="px-screen-x pt-2">
        {loading && <p className="text-sm text-ink-soft">loading...</p>}
        {error && <p className="text-sm text-red-600">{error.message}</p>}

        {!loading && !error && filteredCards.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="font-display text-base font-bold text-ink">
              {cards.length === 0 ? "no cards yet" : `no ${status} cards`}
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
              badges={[card.category, ...card.tags].filter((b): b is string => Boolean(b))}
              color={cardColorForId(card.id)}
              onClick={() => navigate(`/cards/${card.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
