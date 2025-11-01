export function createId(prefix: string) {
  const base = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
  return `${prefix}-${base}`
}
