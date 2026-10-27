import { Link, useParams } from "react-router-dom"
import { ChevronLeftIcon } from "../components/ui"
import { Screen } from "../shell/Screen"

/** Stamp scrapbook page (StampDetail.html) — no tab bar. Placeholder until step 8. */
export function StampDetailScreen() {
  const { tripId } = useParams()
  return (
    <Screen tabBar={false} background="var(--color-pink)">
      <div className="flex items-center justify-between">
        <Link
          to="/passport"
          aria-label="Back to Passport"
          className="flex size-11 items-center justify-center rounded-full bg-surface text-ink shadow-button"
        >
          <ChevronLeftIcon size={20} strokeWidth={2} />
        </Link>
      </div>
      <h1 className="m-0 px-0.5 text-title font-normal">Stamp {tripId}</h1>
    </Screen>
  )
}
