import { useState, type ReactNode } from "react"
import { Screen } from "../shell/Screen"
import { cityTint } from "../lib/cityTint"
import {
  ArrowRightIcon,
  BookmarkIcon,
  CalendarIcon,
  CameraIcon,
  Card,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Chip,
  CloseIcon,
  CloudIcon,
  DarkBanner,
  DashedRoute,
  HeartIcon,
  LinkIcon,
  PassportIcon,
  PencilIcon,
  PerforatedStamp,
  PinIcon,
  PixelText,
  PlaneIcon,
  PlusIcon,
  SectionHeader,
  SplitFlap,
  SunIcon,
  TicketIcon,
} from "../components/ui"

/** Dev-only gallery at /dev/ui: every shared component in its states, for
 * checking against docs/design-reference on a phone. */

const COLORS = [
  "ink",
  "lime",
  "pink",
  "bg",
  "surface",
  "surface-muted",
  "divider",
  "line",
  "line-strong",
  "text-muted",
  "icon-muted",
  "on-dark-muted",
  "flap",
  "flap-seam",
]

const TYPE = [
  ["hero", "text-hero", "做啥呢 Plans"],
  ["display", "text-display", "SFO 09:30"],
  ["title", "text-title", "Plans for this trip"],
  ["temp", "text-temp", "61°"],
  ["body", "text-body", "Lands End trail"],
  ["small", "text-small", "680 Point Lobos Ave"],
] as const

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="m-0 px-0.5 text-small text-text-muted uppercase tracking-[0.06em]">{title}</h2>
      {children}
    </section>
  )
}

function RoundButton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-11 cursor-pointer items-center justify-center rounded-full border-none bg-surface text-ink"
    >
      {children}
    </button>
  )
}

export default function UiGallery() {
  const [type, setType] = useState("All")

  return (
    <Screen className="gap-8">
      <h1 className="m-0 px-0.5 text-hero font-normal">UI gallery</h1>

      <Section title="Colors">
        <div className="grid grid-cols-2 gap-2">
          {COLORS.map((name) => (
            <div key={name} className="flex items-center gap-2 text-small">
              <span
                className="size-8 shrink-0 rounded-thumb border border-divider"
                style={{ background: `var(--color-${name})` }}
              />
              {name}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type">
        <Card className="flex flex-col gap-3">
          {TYPE.map(([name, cls, sample]) => (
            <div key={name} className="flex flex-col">
              <span className="text-small text-text-muted">{name}</span>
              <span className={cls}>{sample}</span>
            </div>
          ))}
          <span className="font-serif text-[16px]">Instrument Serif — San Francisco</span>
        </Card>
      </Section>

      <Section title="Chips">
        <div className="flex flex-wrap gap-2">
          <Chip>Default</Chip>
          <Chip selected>Selected</Chip>
          <Chip leading={<PinIcon size={15} />} trailing={<ChevronDownIcon size={14} strokeWidth={2} />}>
            All places
          </Chip>
        </div>
        <div className="-mx-screen-x flex gap-2 overflow-x-auto px-screen-x [scrollbar-width:none]">
          {["All", "Eat", "Do", "Go", "Stay", "Events"].map((t) => (
            <Chip key={t} selected={type === t} onClick={() => setType(t)}>
              {t}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="SplitFlap">
        <DarkBanner className="flex flex-wrap items-center gap-4">
          <SplitFlap value="09" />
          <SplitFlap value={4944} />
        </DarkBanner>
        <DarkBanner variant="board" className="flex flex-col gap-3.5">
          <SplitFlap value="09" size="lg" />
          <SplitFlap value={4944} size="lg" />
        </DarkBanner>
      </Section>

      <Section title="DarkBanner">
        <DarkBanner className="flex flex-col gap-2.5">
          <PixelText size="label" muted>
            STATUS
          </PixelText>
          <div className="flex items-center gap-3">
            <PixelText muted className="w-9">
              MEL
            </PixelText>
            <PixelText>BUSY WEEK</PixelText>
          </div>
          <div className="flex items-center gap-3">
            <PixelText muted className="w-9">
              YIC
            </PixelText>
            <PixelText>AT THE BEACH</PixelText>
          </div>
        </DarkBanner>
        <DarkBanner variant="countdown" className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PixelText>LANDING IN</PixelText>
            <SplitFlap value="09" />
            <PixelText>DAYS</PixelText>
          </div>
          <span className="flex items-center gap-1.5 whitespace-nowrap text-[12px] font-semibold">
            SFO
            <PlaneIcon className="text-lime" />
            LAX
          </span>
        </DarkBanner>
        <DarkBanner variant="board" className="flex flex-col gap-3.5">
          <PixelText muted>MILES FLOWN</PixelText>
          <SplitFlap value={4944} size="lg" />
        </DarkBanner>
      </Section>

      <Section title="Card">
        <Card>Default padding (24 × 22)</Card>
        <Card padding="stats" className="flex justify-between gap-4">
          {[
            ["Days tgt", "41"],
            ["Visits", "12"],
            ["Cities", "3"],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-body text-text-muted">{label}</span>
              <span className="text-title">{value}</span>
            </div>
          ))}
        </Card>
      </Section>

      <Section title="SectionHeader">
        <SectionHeader title="Most visited" />
        <SectionHeader title="Plans" muted="for this trip" />
        <SectionHeader title="Stamps" right={<span className="text-body text-text-muted">Newest first</span>} />
        <SectionHeader
          title="October"
          muted="2026"
          align="center"
          right={
            <div className="flex gap-1.5">
              <RoundButton label="Previous month">
                <ChevronLeftIcon />
              </RoundButton>
              <RoundButton label="Next month">
                <ChevronRightIcon />
              </RoundButton>
            </div>
          }
        />
      </Section>

      <Section title="DashedRoute">
        <Card className="flex flex-col gap-6">
          <DashedRoute caption="412 mi" />
          <DashedRoute />
        </Card>
      </Section>

      <Section title="PerforatedStamp">
        <div className="grid grid-cols-3 gap-x-2.5 gap-y-3">
          <PerforatedStamp city="San Francisco" dates="Oct 31 – Nov 2" number={12} tint={cityTint("San Francisco")} tilt={-1.5} />
          <PerforatedStamp city="Los Angeles" dates="Oct 17 – 19" number={11} tint={cityTint("Los Angeles")} tilt={1} />
          <PerforatedStamp city="San Diego" dates="Aug 22 – 24" number={7} tint={cityTint("San Diego")} tilt={0.5} />
          <PerforatedStamp city="Seattle" dates="Jan 9 – 11" number={13} tint={cityTint("Seattle")} tilt={-1} />
        </div>
        <div className="flex gap-4">
          <PerforatedStamp size="sm" city="San Francisco" shortLabel="SF" number={12} tint="pink" tilt={-3} />
          <PerforatedStamp size="sm" city="Los Angeles" shortLabel="LA" number={11} tint="lime" tilt={-3} />
          <PerforatedStamp size="sm" city="San Diego" shortLabel="SD" number={7} tint="on-dark-muted" tilt={-3} />
        </div>
      </Section>

      <Section title="Icons">
        <Card className="grid grid-cols-5 gap-4 text-ink">
          {[
            ["plane", <PlaneIcon key="i" size={22} />],
            ["ticket", <TicketIcon key="i" size={22} />],
            ["bookmark", <BookmarkIcon key="i" size={22} />],
            ["passport", <PassportIcon key="i" size={22} />],
            ["pencil", <PencilIcon key="i" size={22} />],
            ["chev-l", <ChevronLeftIcon key="i" size={22} />],
            ["chev-r", <ChevronRightIcon key="i" size={22} />],
            ["chev-d", <ChevronDownIcon key="i" size={22} />],
            ["arrow", <ArrowRightIcon key="i" size={22} />],
            ["camera", <CameraIcon key="i" size={22} />],
            ["link", <LinkIcon key="i" size={22} />],
            ["pin", <PinIcon key="i" size={22} />],
            ["calendar", <CalendarIcon key="i" size={22} />],
            ["check", <CheckIcon key="i" size={22} />],
            ["plus", <PlusIcon key="i" size={22} />],
            ["close", <CloseIcon key="i" size={22} />],
            ["cloud", <CloudIcon key="i" size={22} />],
            ["sun", <SunIcon key="i" size={22} />],
            ["heart", <HeartIcon key="i" size={22} />],
            ["heart pink", <HeartIcon key="i" size={22} fill="pink" label="Melody's favorite" />],
            ["heart lime", <HeartIcon key="i" size={22} fill="lime" label="Partner's favorite" />],
          ].map(([name, icon]) => (
            <div key={name as string} className="flex flex-col items-center gap-1 text-center text-[11px] text-text-muted">
              <span className="text-ink">{icon}</span>
              {name}
            </div>
          ))}
        </Card>
        <Card className="text-body">
          Tartine
          <HeartIcon fill="pink" label="Melody's favorite" className="ml-1.5 align-[-1px]" />
          <HeartIcon fill="lime" label="Partner's favorite" className="ml-1 align-[-1px]" />
        </Card>
      </Section>
    </Screen>
  )
}
