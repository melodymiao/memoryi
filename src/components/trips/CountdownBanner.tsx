import { DarkBanner, PixelText, PlaneIcon, SplitFlap } from "../ui"
import { padDays, type Countdown } from "../../lib/trips"

/**
 * "LANDING IN [0][4] DAYS" (Trips.html). Always about the next visit that
 * hasn't started — never a past ticket you've tapped. Other states:
 * arrival day "LANDING TODAY", mid-visit "TOGETHER NOW", nothing booked
 * "NO TRIP BOOKED". The route on the right shows when there's a trip to count to.
 */
export function CountdownBanner({ countdown }: { countdown: Countdown }) {
  const trip = countdown.kind === "days" || countdown.kind === "today" ? countdown.trip : null

  return (
    <DarkBanner variant="countdown" className="flex min-h-12 items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {countdown.kind === "days" && (
          <>
            <PixelText>LANDING IN</PixelText>
            <SplitFlap value={padDays(countdown.days)} />
            <PixelText>DAYS</PixelText>
          </>
        )}
        {countdown.kind === "today" && <PixelText>LANDING TODAY</PixelText>}
        {countdown.kind === "together" && <PixelText>TOGETHER NOW</PixelText>}
        {countdown.kind === "none" && <PixelText>NO TRIP BOOKED</PixelText>}
      </div>
      {trip?.origin_code && trip.dest_code && (
        <span className="flex items-center gap-1.5 whitespace-nowrap text-small">
          <span className="sr-only">From </span>
          {trip.origin_code}
          <PlaneIcon className="text-lime" />
          <span className="sr-only"> to </span>
          {trip.dest_code}
        </span>
      )}
    </DarkBanner>
  )
}
