/** Runs one stage of a save and, if it throws, says which stage — a bare
 * "Load failed" (Safari's network-error message) doesn't say whether the
 * upload or the save itself failed. */
export async function step<T>(label: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`${label} failed: ${message}`, { cause: err })
  }
}
