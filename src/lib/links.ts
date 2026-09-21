/** Turns user-typed link text into a normalized http(s) URL, or reports it
 * invalid. Bare domains ("eater.com/la/x") get https:// prepended. Only
 * http(s) is accepted — the link is rendered as an anchor, so other schemes
 * (javascript:, data:) must never get through. */
export function normalizeLink(input: string): { ok: true; url: string | null } | { ok: false } {
  const text = input.trim()
  if (!text) return { ok: true, url: null }
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`
  try {
    const url = new URL(withScheme)
    if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false }
    if (!url.hostname.includes(".")) return { ok: false }
    return { ok: true, url: url.toString() }
  } catch {
    return { ok: false }
  }
}

/** Only http(s) URLs are safe to use as an href; anything else → null. */
export function safeHref(url: string | null): string | null {
  if (!url) return null
  const result = normalizeLink(url)
  return result.ok ? result.url : null
}

/** "eater.com" for display. */
export function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}
