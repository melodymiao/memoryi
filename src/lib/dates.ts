/** Today's date on this device as "YYYY-MM-DD". Use this (not the database's
 * current_date, which is UTC) for anything that compares against visit
 * dates — otherwise "next trip" flips over at 5pm Pacific. */
export function todayLocal(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
