import { Card } from "../components/Card"

// Placeholder data just to prove the Card component renders — real data
// loading is a later step.
const sample = { title: "Sushi Gen", badges: ["Little Tokyo", "$$", "omakase"] }

export function CardsScreen() {
  return (
    <div className="px-screen-x pt-4">
      <h1 className="font-display text-[27px] font-bold tracking-[-0.54px] text-ink">cards</h1>
      <p className="mt-4 text-sm text-ink-soft">Screen content coming in a later step — this is just a preview of the Card component and color variants.</p>

      <div className="mt-6 flex flex-col gap-3">
        <Card title={sample.title} badges={sample.badges} color="wasabi" pinned pinnedBy="mel" />
        <Card title={sample.title} badges={sample.badges} color="coolBlue" pinned pinnedBy="mel" />
        <Card title={sample.title} badges={sample.badges} color="sage" />
        <Card title={sample.title} badges={sample.badges} color="orange" />
      </div>
    </div>
  )
}
