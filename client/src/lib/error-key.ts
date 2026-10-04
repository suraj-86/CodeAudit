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
