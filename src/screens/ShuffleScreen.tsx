import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { BackChevronIcon } from "../assets/icons/card-icons"
import { Card } from "../components/Card"
import { useCards } from "../data/cards"
import { cardColorFor } from "../lib/cardColor"
import type { LatLng } from "../lib/cardFilters"
import { CATEGORIES, cardBadges, priceLabel, selectedCategoryChipClass } from "../lib/categories"
import { getEntryPhotoUrls } from "../lib/photos"
import {
  AREAS,
  detailOptions,
  EMPTY_PREFS,
  matchesPrefs,
  shuffled,
  type AreaKey,
  type SavedPlaces,
  type ShufflePrefs,
} from "../lib/shuffle"
import type { Card as CardRow } from "../types/database"

/**
 * Shuffle: a few quick questions (type → follow-ups, budget, where), then a
 * swipeable stack of matching cards. Swipe down = maybe pile, left/right =
 * skip. Once the stack runs out you can reshuffle everything that isn't
 * already a maybe.
 *
 * The session (answers, remaining stack, maybe pile) lives in sessionStorage
 * so opening a maybe card and coming back doesn't lose your place. Home/work
 * spots are saved in localStorage from the device location.
 */

interface Session {
  stage: "setup" | "deck"
  prefs: ShufflePrefs
  /** Card ids left in the stack, top first. */
  deck: string[]
  maybe: string[]
}

const SESSION_KEY = "shuffle.session"
const PLACES_KEY = "shuffle.places"

const NEW_SESSION: Session = { stage: "setup", prefs: EMPTY_PREFS, deck: [], maybe: [] }

function readJson<T extends object>(storage: () => Storage, key: string, fallback: T): T {
  try {
    const raw = storage().getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

function writeJson(storage: () => Storage, key: string, value: unknown) {
  try {
    storage().setItem(key, JSON.stringify(value))
  } catch {
    // private mode / blocked storage — the page still works, it just won't remember
  }
}

const BUDGETS = [1, 2, 3]

const chip = (selected: boolean) =>
  `rounded-pill px-3.5 py-2 text-[12px] ${
    selected ? "bg-accent font-bold text-on-accent" : "bg-surface font-semibold text-ink-soft"
  }`

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export function ShuffleScreen() {
  const { cards, loading, error } = useCards()
  const [session, setSession] = useState<Session>(() => readJson(() => sessionStorage, SESSION_KEY, NEW_SESSION))
  const [places, setPlaces] = useState<SavedPlaces>(() =>
    readJson(() => localStorage, PLACES_KEY, { home: null, work: null }),
  )

  useEffect(() => writeJson(() => sessionStorage, SESSION_KEY, session), [session])
  useEffect(() => writeJson(() => localStorage, PLACES_KEY, places), [places])

  const matching = useMemo(
    () => cards.filter((c) => matchesPrefs(c, session.prefs, places)),
    [cards, session.prefs, places],
  )

  /** Deal a fresh stack: every match that isn't already a maybe. */
  function deal() {
    setSession((s) => ({
      ...s,
      stage: "deck",
      deck: shuffled(matching.filter((c) => !s.maybe.includes(c.id)).map((c) => c.id)),
    }))
  }

  if (loading) return <p className="px-screen-x pt-4 text-sm text-ink-soft">loading...</p>
  if (error) return <p className="px-screen-x pt-4 text-sm text-red-600">{error.message}</p>

  return session.stage === "setup" ? (
    <SetupStep
      cards={cards}
      prefs={session.prefs}
      onChange={(prefs) => setSession((s) => ({ ...s, prefs }))}
      places={places}
      onSavePlace={(key, spot) => setPlaces((p) => ({ ...p, [key]: spot }))}
      matchCount={matching.filter((c) => !session.maybe.includes(c.id)).length}
      onStart={deal}
    />
  ) : (
    <DeckStep
      cards={cards}
      session={session}
      setSession={setSession}
      reshuffleCount={matching.filter((c) => !session.maybe.includes(c.id)).length}
      onReshuffle={deal}
    />
  )
}

/* ───────────────────────── setup: the questions ───────────────────────── */

function SetupStep({
  cards,
  prefs,
  onChange,
  places,
  onSavePlace,
  matchCount,
  onStart,
}: {
  cards: CardRow[]
  prefs: ShufflePrefs
  onChange: (prefs: ShufflePrefs) => void
  places: SavedPlaces
  onSavePlace: (key: "home" | "work", spot: LatLng | null) => void
  matchCount: number
  onStart: () => void
}) {
  const [locating, setLocating] = useState<"home" | "work" | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const patch = (p: Partial<ShufflePrefs>) => onChange({ ...prefs, ...p })

  function toggleCategory(slug: string) {
    const on = prefs.categories.includes(slug)
    const details = { ...prefs.details }
    if (on) delete details[slug]
    patch({ categories: toggle(prefs.categories, slug), details })
  }

  function toggleDetail(slug: string, value: string) {
    patch({ details: { ...prefs.details, [slug]: toggle(prefs.details[slug] ?? [], value) } })
  }

  /** Home/work need a saved spot first — grab it from the device on the first tap. */
  function toggleArea(area: AreaKey) {
    if ((area === "home" || area === "work") && !places[area] && !prefs.areas.includes(area)) {
      if (!("geolocation" in navigator)) {
        setGeoError("This browser can't share its location.")
        return
      }
      setLocating(area)
      setGeoError(null)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onSavePlace(area, { latitude: pos.coords.latitude, longitude: pos.coords.longitude })
          patch({ areas: [...prefs.areas, area] })
          setLocating(null)
        },
        (err) => {
          setGeoError(
            err.code === err.PERMISSION_DENIED
              ? "Location permission is off — enable it for this site to save a spot."
              : "Couldn't get your location. Try again in a moment.",
          )
          setLocating(null)
        },
        { enableHighAccuracy: true, timeout: 10_000 },
      )
      return
    }
    patch({ areas: toggle(prefs.areas, area) })
  }

  const selectedCats = CATEGORIES.filter((c) => prefs.categories.includes(c.slug))
  const anySelected = prefs.categories.length + prefs.prices.length + prefs.areas.length > 0

  return (
    <div className="flex flex-col gap-7 px-header-x pt-4 pb-6">
      <div>
        <h1 className="font-display text-[27px] font-bold tracking-[-0.54px] text-ink">shuffle</h1>
        <p className="mt-1 text-sm text-ink-soft">A few quick questions, then swipe through your cards.</p>
      </div>

      <Section title="what type?">
        {CATEGORIES.map((cat) => {
          const selected = prefs.categories.includes(cat.slug)
          return (
            <button
              key={cat.slug}
              type="button"
              aria-pressed={selected}
              title={cat.description}
              onClick={() => toggleCategory(cat.slug)}
              className={`rounded-pill px-3.5 py-2 text-[12px] ${
                selected ? `${selectedCategoryChipClass(cat.slug)} font-bold` : "bg-surface font-semibold text-ink-soft"
              }`}
            >
              <span aria-hidden>{cat.emoji} </span>
              {cat.label}
            </button>
          )
        })}
      </Section>

      {selectedCats.map((cat) => {
        const options = detailOptions(cards, cat.slug)
        if (options.length === 0) return null
        const picks = prefs.details[cat.slug] ?? []
        return (
          <Section key={cat.slug} title={cat.slug === "food" ? "any cuisine in mind?" : `what kind of ${cat.label.toLowerCase()}?`}>
            <button type="button" aria-pressed={picks.length === 0} onClick={() => patch({ details: { ...prefs.details, [cat.slug]: [] } })} className={chip(picks.length === 0)}>
              Anything
            </button>
            {options.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={picks.includes(value)}
                onClick={() => toggleDetail(cat.slug, value)}
                className={chip(picks.includes(value))}
              >
                {value}
              </button>
            ))}
          </Section>
        )
      })}

      <Section title="budget">
        {BUDGETS.map((level) => (
          <button
            key={level}
            type="button"
            aria-pressed={prefs.prices.includes(level)}
            onClick={() => patch({ prices: toggle(prefs.prices, level) })}
            className={`${chip(prefs.prices.includes(level))} min-w-14`}
          >
            {priceLabel(level)}
            {level === 3 && "+"}
          </button>
        ))}
      </Section>

      <Section title="where?">
        {AREAS.map((area) => (
          <button
            key={area.key}
            type="button"
            aria-pressed={prefs.areas.includes(area.key)}
            disabled={locating !== null}
            onClick={() => toggleArea(area.key)}
            className={chip(prefs.areas.includes(area.key))}
          >
            {locating === area.key ? "Locating…" : area.label}
          </button>
        ))}
        <div className="basis-full text-[11.5px] text-ink-soft">
          {geoError ??
            (!places.home || !places.work
              ? `Tap near home / near work while you're there to save that spot.`
              : null)}
          {(["home", "work"] as const)
            .filter((k) => places[k])
            .map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  onSavePlace(k, null)
                  patch({ areas: prefs.areas.filter((a) => a !== k) })
                }}
                className="mr-3 font-semibold text-accent"
              >
                reset {k} spot
              </button>
            ))}
        </div>
      </Section>

      <div className="flex gap-2">
        {anySelected && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_PREFS)}
            className="rounded-pill bg-surface px-5 py-3.5 text-[13.5px] font-bold text-ink"
          >
            clear
          </button>
        )}
        <button
          type="button"
          disabled={matchCount === 0}
          onClick={onStart}
          className="flex-1 rounded-pill bg-accent py-3.5 text-[13.5px] font-bold text-on-accent disabled:opacity-40"
        >
          {matchCount === 0 ? "no matching cards" : `shuffle ${matchCount} ${matchCount === 1 ? "card" : "cards"}`}
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[10px] font-bold tracking-[0.6px] text-ink-soft uppercase">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

/* ───────────────────────── deck: the swipe stack ───────────────────────── */

type Verdict = "maybe" | "skip"

/** How far (px) a drag must travel to count as a swipe. */
const SWIPE_PX = 90
const FLY_MS = 220

function DeckStep({
  cards,
  session,
  setSession,
  reshuffleCount,
  onReshuffle,
}: {
  cards: CardRow[]
  session: Session
  setSession: (update: (s: Session) => Session) => void
  reshuffleCount: number
  onReshuffle: () => void
}) {
  const navigate = useNavigate()
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards])
  // Ids of cards deleted since the stack was dealt just drop out.
  const resolve = (ids: string[]) => ids.map((id) => byId.get(id)).filter((c): c is CardRow => c !== undefined)
  const deck = resolve(session.deck)
  const maybe = resolve(session.maybe)
  const [maybeOpen, setMaybeOpen] = useState(false)
  const [leaving, setLeaving] = useState<{ x: number; y: number } | null>(null)

  // First photo of every card in play, signed in one batch.
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const photoPaths = [...new Set([...deck, ...maybe].flatMap((c) => (c.photos[0] ? [c.photos[0]] : [])))].sort()
  const photoKey = photoPaths.join("|")
  useEffect(() => {
    let cancelled = false
    getEntryPhotoUrls(photoPaths)
      .then((urls) => {
        if (!cancelled) setPhotoUrls(urls)
      })
      .catch((err) => console.warn(err))
    return () => {
      cancelled = true
    }
    // photoKey stands in for the contents of photoPaths
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [photoKey])

  const top = deck[0]

  /** Fly the top card off-screen, then move it out of the stack. */
  function decide(verdict: Verdict, direction: 1 | -1 = 1) {
    if (!top || leaving) return
    setLeaving(verdict === "maybe" ? { x: 0, y: window.innerHeight } : { x: direction * window.innerWidth * 1.2, y: 0 })
    window.setTimeout(() => {
      setSession((s) => ({
        ...s,
        deck: s.deck.filter((id) => id !== top.id),
        maybe: verdict === "maybe" && !s.maybe.includes(top.id) ? [...s.maybe, top.id] : s.maybe,
      }))
      setLeaving(null)
    }, FLY_MS)
  }

  return (
    <div className="flex min-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-96px)] flex-col pt-4">
      <div className="flex items-center justify-between px-header-x">
        <button
          type="button"
          aria-label="Back to questions"
          onClick={() => setSession((s) => ({ ...s, stage: "setup" }))}
          className="flex size-[38px] items-center justify-center rounded-pill bg-surface text-ink"
        >
          <BackChevronIcon className="size-[17px]" />
        </button>
        <h1 className="font-display text-[19px] font-bold text-ink">
          {deck.length > 0 ? `${deck.length} left` : "shuffle"}
        </h1>
        <button
          type="button"
          onClick={() => setMaybeOpen(true)}
          className={`rounded-pill px-3.5 py-2.5 text-[12px] font-bold ${
            maybe.length > 0 ? "bg-accent text-on-accent" : "bg-surface text-ink-soft"
          }`}
        >
          maybe · {maybe.length}
        </button>
      </div>

      {top ? (
        <>
          <div className="relative mx-screen-x mt-5 flex-1">
            {/* The next two cards peek out underneath. */}
            {deck
              .slice(1, 3)
              .reverse()
              .map((card, i, arr) => {
                const depth = arr.length - i
                return (
                  <div
                    key={card.id}
                    aria-hidden
                    className="absolute inset-x-0 top-0 transition-transform duration-200"
                    style={{ transform: `translateY(${depth * 10}px) scale(${1 - depth * 0.04})` }}
                  >
                    <DeckCard card={card} photoUrl={card.photos[0] ? photoUrls[card.photos[0]] : undefined} />
                  </div>
                )
              })}
            <SwipeCard key={top.id} leaving={leaving} onRelease={decide}>
              <DeckCard card={top} photoUrl={top.photos[0] ? photoUrls[top.photos[0]] : undefined} />
            </SwipeCard>
          </div>

          <div className="flex items-center justify-center gap-4 px-screen-x pt-6 pb-4">
            <button
              type="button"
              onClick={() => decide("skip", -1)}
              className="rounded-pill bg-surface px-6 py-3.5 text-[13.5px] font-bold text-ink"
            >
              ← skip
            </button>
            <button
              type="button"
              onClick={() => decide("maybe")}
              className="rounded-pill bg-accent px-6 py-3.5 text-[13.5px] font-bold text-on-accent"
            >
              ↓ maybe
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-header-x py-16 text-center">
          <p className="font-display text-xl font-bold text-ink">that's the whole stack</p>
          <p className="max-w-[260px] text-sm text-ink-soft">
            {maybe.length > 0
              ? `You've got ${maybe.length} in your maybe pile to compare.`
              : "Nothing in the maybe pile yet — give it another spin."}
          </p>
          <div className="mt-3 flex w-full max-w-[280px] flex-col gap-2">
            {maybe.length > 0 && (
              <button
                type="button"
                onClick={() => setMaybeOpen(true)}
                className="rounded-pill bg-accent py-3.5 text-[13.5px] font-bold text-on-accent"
              >
                compare maybes
              </button>
            )}
            <button
              type="button"
              disabled={reshuffleCount === 0}
              onClick={onReshuffle}
              className={`rounded-pill py-3.5 text-[13.5px] font-bold disabled:opacity-40 ${
                maybe.length > 0 ? "bg-surface text-ink" : "bg-accent text-on-accent"
              }`}
            >
              {reshuffleCount === 0 ? "nothing left to reshuffle" : `reshuffle ${reshuffleCount} ${reshuffleCount === 1 ? "card" : "cards"}`}
            </button>
            <button
              type="button"
              onClick={() => setSession((s) => ({ ...s, stage: "setup" }))}
              className="py-2 text-[13px] font-bold text-ink-soft"
            >
              change answers
            </button>
          </div>
        </div>
      )}

      {maybeOpen && (
        <MaybeSheet
          cards={maybe}
          photoUrls={photoUrls}
          onOpen={(id) => navigate(`/cards/${id}`)}
          onRemove={(id) => setSession((s) => ({ ...s, maybe: s.maybe.filter((m) => m !== id) }))}
          onClear={() => setSession((s) => ({ ...s, maybe: [] }))}
          onClose={() => setMaybeOpen(false)}
        />
      )}
    </div>
  )
}

function DeckCard({ card, photoUrl }: { card: CardRow; photoUrl?: string }) {
  return (
    <Card
      title={card.title}
      subtitle={card.neighborhood}
      badges={cardBadges(card, { collapseCategories: true })}
      hasPhoto={card.photos.length > 0}
      photoUrl={photoUrl}
      pinBtn={false}
      color={cardColorFor(card)}
      className="min-h-[300px] shadow-float"
    >
      {card.notes && <p className="mt-1 line-clamp-4 text-[12.5px] font-medium opacity-85">{card.notes}</p>}
    </Card>
  )
}

/** Drag wrapper for the top card. Down past the threshold = maybe, sideways = skip. */
function SwipeCard({
  children,
  leaving,
  onRelease,
}: {
  children: ReactNode
  leaving: { x: number; y: number } | null
  onRelease: (verdict: Verdict, direction?: 1 | -1) => void
}) {
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const start = useRef<{ x: number; y: number } | null>(null)

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (leaving) return
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY }
    setDragging(true)
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!start.current) return
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y })
  }

  function onPointerUp() {
    if (!start.current) return
    start.current = null
    setDragging(false)
    const { x, y } = drag
    if (y > SWIPE_PX && y > Math.abs(x)) onRelease("maybe")
    else if (Math.abs(x) > SWIPE_PX) onRelease("skip", x > 0 ? 1 : -1)
    else setDrag({ x: 0, y: 0 })
  }

  const pos = leaving ?? drag
  const hint =
    !leaving && drag.y > 40 && drag.y > Math.abs(drag.x) ? "maybe" : !leaving && Math.abs(drag.x) > 40 ? "skip" : null

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative cursor-grab touch-none select-none active:cursor-grabbing"
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px) rotate(${pos.x / 18}deg)`,
        transition: dragging ? "none" : `transform ${FLY_MS}ms ease-out`,
      }}
    >
      {children}
      {hint && (
        <span
          className={`pointer-events-none absolute top-5 rounded-pill px-3.5 py-1.5 text-[12px] font-bold tracking-[0.6px] uppercase shadow-float ${
            hint === "maybe" ? "left-1/2 -translate-x-1/2 bg-accent text-on-accent" : drag.x > 0 ? "left-5 bg-background text-ink" : "right-5 bg-background text-ink"
          }`}
        >
          {hint}
        </span>
      )}
    </div>
  )
}

function MaybeSheet({
  cards,
  photoUrls,
  onOpen,
  onRemove,
  onClear,
  onClose,
}: {
  cards: CardRow[]
  photoUrls: Record<string, string>
  onOpen: (id: string) => void
  onRemove: (id: string) => void
  onClear: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Maybe pile">
      <button type="button" aria-label="Close maybe pile" onClick={onClose} className="absolute inset-0 cursor-default bg-ink/40" />
      <div
        className="relative flex max-h-[82dvh] w-full max-w-md flex-col rounded-t-tabbar bg-background"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between px-header-x pt-5 pb-3">
          <h2 className="font-display text-[19px] font-bold text-ink">maybe pile</h2>
          <div className="flex items-center gap-4">
            {cards.length > 0 && (
              <button type="button" onClick={onClear} className="text-[13px] font-bold text-ink-soft">
                clear
              </button>
            )}
            <button type="button" onClick={onClose} className="text-[13px] font-bold text-ink">
              done
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto px-screen-x pb-5">
          {cards.length === 0 && (
            <p className="py-10 text-center text-sm text-ink-soft">Swipe a card down to save it here.</p>
          )}
          {cards.map((card) => (
            <div key={card.id} className="relative">
              <Card
                title={card.title}
                subtitle={card.neighborhood}
                badges={cardBadges(card, { collapseCategories: true })}
                hasPhoto={card.photos.length > 0}
                photoUrl={card.photos[0] ? photoUrls[card.photos[0]] : undefined}
                pinBtn={false}
                color={cardColorFor(card)}
                onClick={() => onOpen(card.id)}
              />
              <button
                type="button"
                aria-label={`Remove ${card.title} from maybe pile`}
                onClick={() => onRemove(card.id)}
                className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-pill bg-background/60 text-[12px] font-bold text-ink"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
