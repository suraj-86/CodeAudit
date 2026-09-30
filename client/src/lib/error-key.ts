/*
 * A stable React `key` per distinct error instance. Every failed request
 * throws a brand-new Error object, so keying a component by this lets it
 * remount (and so reset its own state, e.g. a retry countdown) exactly
 * when a genuinely new error arrives — without the component needing to
 * compare "is this a new error?" itself.
 */
const keys = new WeakMap<object, number>()
let next = 0

export function keyForError(error: unknown): string {
  if (typeof error !== 'object' || error === null) return String(error)
  let key = keys.get(error)
  if (key === undefined) {
    key = next++
    keys.set(error, key)
  }
  return String(key)
}
