import type { ReactNode } from "react"
import { PlaneIcon } from "./icons"

/** Dashed line, plane, dashed line, optional caption below ("412 mi") — Home
 * city card and the ticket. */
export function DashedRoute({ caption, className = "" }: { caption?: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-1.5 self-stretch">
        <div className="h-0 flex-1 border-t-2 border-dashed border-line" />
        <PlaneIcon size={18} strokeWidth={1.6} className="shrink-0 text-ink" />
        <div className="h-0 flex-1 border-t-2 border-dashed border-line" />
      </div>
      {caption && <span className="text-body text-text-muted">{caption}</span>}
    </div>
  )
}
