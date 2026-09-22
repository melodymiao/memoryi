import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { PlusIcon, SortIcon } from "../assets/icons/card-icons"
import { Card } from "../components/Card"
import { MoreFiltersSheet } from "../components/MoreFiltersSheet"
import { useCards } from "../data/cards"
import { collectFacets, EMPTY_FILTERS, filterCards, SORT_OPTIONS, sortCards, type CardFilters, type SortKey } from "../lib/cardFilters"
import { cardColorFor } from "../lib/cardColor"
import { CATEGORIES, cardBadges, selectedCategoryChipClass } from "../lib/categories"
import { getEntryPhotoUrls } from "../lib/photos"
import { useUserLocation } from "../lib/useUserLocation"
import type { CardStatus } from "../types/database"

/**
 * Figma (drank file, cards-1 frame, node 1614:1386) covers the header + the
 * vertical card list; the header's sort button follows node 1661:6895. The
 * filter row (visit-type dropdown, more-filters sheet | fixed category chips)
 * and the empty state aren't in the frame. The real "add card" button is the
 * dark plus circle Figma labels "btn-profile".
 */

const STATUS_OPTIONS: { value: CardStatus; label: string }[] = [
  { value: "visited", label: "Visited" },
  { value: "wishlist", label: "Unvisited" },
]

const chipBase = "shrink-0 rounded-pill px-3.5 py-2 text-[11.5px] font-semibold"

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export function CardsScreen() {
  const { cards, loading, error } = useCards()
  const navigate = useNavigate()

  // Empty selection = no filter for that group.
  const [filters, setFilters] = useState<CardFilters>(EMPTY_FILTERS)
  const patchFilters = (patch: Partial<CardFilters>) => setFilters((prev) => ({ ...prev, ...patch }))
  const [sort, setSort] = useState<SortKey>("newest")
  const geo = useUserLocation()

  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const { statuses, categories } = filters

  const facets = useMemo(() => collectFacets(cards), [cards])

  const visibleCards = useMemo(
    () => sortCards(filterCards(cards, filters, { origin: geo.origin }), sort),
    [cards, filters, geo.origin, sort],
  )

  // Thumbnails: each card's first own photo, signed in one batch.
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const firstPhotoPaths = useMemo(() => cards.flatMap((c) => (c.photos[0] ? [c.photos[0]] : [])), [cards])
  const photoKey = firstPhotoPaths.join("|")
  useEffect(() => {
    let cancelled = false
    getEntryPhotoUrls(firstPhotoPaths)
      .then((urls) => {
        if (!cancelled) setPhotoUrls(urls)
      })
      .catch((err) => console.warn(err))
    return () => {
      cancelled = true
    }
    // photoKey stands in for the contents of firstPhotoPaths
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [photoKey])

  const statusActive = statuses.length > 0
  const statusLabel = statusActive
    ? STATUS_OPTIONS.filter((o) => statuses.includes(o.value))
        .map((o) => o.label)
        .join(", ")
    : "Visit type"

  const moreCount =
    filters.locations.length +
    filters.types.length +
    filters.cuisines.length +
    filters.prices.length +
    filters.sources.length +
    (filters.addedWithin ? 1 : 0) +
    (filters.maxMiles ? 1 : 0)
  const sortActive = sort !== "newest"

  function clearMore() {
    patchFilters({
      locations: [],
      types: [],
      cuisines: [],
      prices: [],
      sources: [],
      addedWithin: null,
      maxMiles: null,
    })
  }

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between px-header-x">
        <h1 className="font-display text-[27px] font-bold tracking-[-0.54px] text-ink">cards</h1>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <button
              type="button"
              aria-label="Sort cards"
              aria-haspopup="true"
              aria-expanded={sortMenuOpen}
              onClick={() => setSortMenuOpen((open) => !open)}
              className={`flex size-[38px] items-center justify-center rounded-pill ${
                sortActive ? "bg-accent text-on-accent" : "bg-surface text-ink"
              }`}
            >
              <SortIcon className="size-4" />
            </button>
            {sortMenuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close sort menu"
                  onClick={() => setSortMenuOpen(false)}
                  className="fixed inset-0 z-20 cursor-default"
                />
                <div
                  role="menu"
                  className="absolute top-full right-0 z-30 mt-2 flex min-w-[190px] flex-col rounded-photo bg-background p-1.5 shadow-float"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={sort === opt.value}
                      onClick={() => {
                        setSort(opt.value)
                        setSortMenuOpen(false)
                      }}
                      className={`flex items-center justify-between gap-3 rounded-pill px-3 py-2.5 text-left text-[13px] text-ink ${
                        sort === opt.value ? "font-bold" : "font-semibold"
                      }`}
                    >
                      {opt.label}
                      {sort === opt.value && <span aria-hidden>✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <Link
            to="/cards/new"
            aria-label="Add card"
            className="flex size-[38px] items-center justify-center rounded-pill bg-accent text-on-accent"
          >
            <PlusIcon className="size-[17px]" />
          </Link>
        </div>
      </div>

      <div className="relative flex items-center gap-2 px-header-x pt-4 pb-4">
        <div className="relative shrink-0">
          <div
            className={`flex items-center rounded-pill text-[11.5px] font-semibold ${
              statusActive ? "bg-accent text-on-accent" : "bg-surface text-ink-soft"
            }`}
          >
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={statusMenuOpen}
              onClick={() => setStatusMenuOpen((open) => !open)}
              className={`py-2 pl-3.5 ${statusActive ? "pr-1.5" : "pr-3.5"}`}
            >
              {statusLabel} <span aria-hidden>▾</span>
            </button>
            {statusActive && (
              <button
                type="button"
                aria-label="Clear visit type"
                onClick={() => {
                  patchFilters({ statuses: [] })
                  setStatusMenuOpen(false)
                }}
                className="py-2 pr-3 pl-1"
              >
                <span aria-hidden>✕</span>
              </button>
            )}
          </div>
          {statusMenuOpen && (
            <>
              <button
                type="button"
                aria-label="Close visit type filter"
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
                      onChange={() => patchFilters({ statuses: toggle(statuses, opt.value) })}
                      className="size-4 accent-accent"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`${chipBase} ${moreCount > 0 ? "bg-accent text-on-accent" : "bg-surface text-ink-soft"}`}
        >
          More filters{moreCount > 0 ? ` · ${moreCount}` : ""}
        </button>

        <div aria-hidden className="h-5 w-px shrink-0 bg-ink-soft/40" />

        <div
          className="-mr-header-x flex min-w-0 flex-1 gap-2 overflow-x-auto py-1 pr-header-x [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {CATEGORIES.map((cat) => {
            const selected = categories.includes(cat.slug)
            return (
              <button
                key={cat.slug}
                type="button"
                aria-pressed={selected}
                onClick={() => patchFilters({ categories: toggle(categories, cat.slug) })}
                className={`${chipBase} ${selected ? `${selectedCategoryChipClass(cat.slug)} font-bold` : "bg-surface text-ink-soft"}`}
              >
                {selected && <span aria-hidden>{cat.emoji} </span>}
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-screen-x pt-2">
        {loading && <p className="text-sm text-ink-soft">loading...</p>}
        {error && <p className="text-sm text-red-600">{error.message}</p>}

        {!loading && !error && visibleCards.length === 0 && (
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
          {visibleCards.map((card) => (
            <Card
              key={card.id}
              title={card.title}
              badges={cardBadges(card, { collapseCategories: true })}
              // Cards with photos reserve the fixed-size photo slot right away;
              // the image fills it once its signed URL arrives.
              hasPhoto={card.photos.length > 0}
              photoUrl={card.photos[0] ? photoUrls[card.photos[0]] : undefined}
              pinBtn={false}
              color={cardColorFor(card)}
              onClick={() => navigate(`/cards/${card.id}`)}
            />
          ))}
        </div>
      </div>

      {moreOpen && (
        <MoreFiltersSheet
          facets={facets}
          filters={filters}
          onChange={patchFilters}
          geo={geo}
          resultCount={visibleCards.length}
          onClearAll={clearMore}
          onClose={() => setMoreOpen(false)}
        />
      )}
    </div>
  )
}
