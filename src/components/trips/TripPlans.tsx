import { Link } from "react-router-dom"
import { Card, CheckIcon, ChevronDownIcon } from "../ui"
import { setTripPlanDone, useTripPlans } from "../../data/tripPlans"
import { planCountLabel, planTypeLabel } from "../../lib/trips"
import type { Idea, TripPlan } from "../../types/database"

/**
 * "Plans for this trip" (Trips.html): a collapsible checklist of the trip's
 * plan items. Ticking updates immediately and saves in the background,
 * reverting if the save fails.
 */
export function TripPlans({
  tripId,
  ideasById,
  open,
  onToggle,
}: {
  tripId: string
  ideasById: Map<string, Idea>
  open: boolean
  onToggle: () => void
}) {
  const { plans, setPlans, loading, error, refetch } = useTripPlans(tripId)

  const toggleDone = async (plan: TripPlan) => {
    const done = !plan.done
    const patch = (value: boolean) =>
      setPlans((current) => current.map((p) => (p.id === plan.id ? { ...p, done: value } : p)))
    patch(done)
    try {
      await setTripPlanDone(plan.id, done)
    } catch {
      patch(!done)
    }
  }

  return (
    <section className="mt-2 flex flex-col gap-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-11 cursor-pointer items-center justify-between border-none bg-transparent px-0.5 text-left font-sans text-ink"
      >
        <span className="text-title">
          Plans <span className="text-text-muted">for this trip</span>
        </span>
        <span className="flex items-center gap-2 text-body text-text-muted">
          {loading ? "" : planCountLabel(plans.length)}
          <ChevronDownIcon
            className={`text-ink transition-transform duration-200 ease-in-out ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <Card padding="none" className="flex flex-col px-[22px] py-1.5 text-body">
          {error ? (
            <div className="flex min-h-14 items-center gap-2 text-text-muted">
              Couldn't load plans.
              <button type="button" onClick={refetch} className="cursor-pointer border-none bg-transparent p-0 font-sans text-body text-ink underline">
                Retry
              </button>
            </div>
          ) : (
            plans.map((plan) => {
              const idea = plan.idea_id ? ideasById.get(plan.idea_id) : undefined
              return (
                <button
                  key={plan.id}
                  type="button"
                  role="checkbox"
                  aria-checked={plan.done}
                  onClick={() => toggleDone(plan)}
                  className="flex min-h-14 cursor-pointer items-center gap-3.5 border-0 border-b border-solid border-divider bg-transparent p-0 text-left font-sans text-body text-ink"
                >
                  <span
                    className={`box-border flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-solid ${
                      plan.done ? "border-ink bg-ink" : "border-line bg-transparent"
                    }`}
                  >
                    {plan.done && <CheckIcon size={11} strokeWidth={3.5} className="text-surface" />}
                  </span>
                  <span className={`flex-1 ${plan.done ? "text-text-muted line-through" : ""}`}>{idea?.title ?? plan.title}</span>
                  {idea && <span className="text-text-muted">{planTypeLabel(idea)}</span>}
                </button>
              )
            })
          )}
          <Link to="/plans" className="flex min-h-14 items-center gap-3.5 text-text-muted no-underline">
            <span aria-hidden="true" className="w-5 text-center text-[20px] leading-none">
              +
            </span>
            <span>Add from ideas</span>
          </Link>
        </Card>
      )}
    </section>
  )
}
