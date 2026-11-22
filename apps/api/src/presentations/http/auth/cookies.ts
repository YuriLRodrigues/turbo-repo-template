/**
 * Reads one cookie from the `Cookie` request header. The API reads a single cookie (the refresh token), so it
 * needs no cookie middleware. Returns `undefined` when the cookie is absent or cannot be decoded.
 */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined

  for (const pair of header.split(';')) {
    const separator = pair.indexOf('=')
    if (separator === -1 || pair.slice(0, separator).trim() !== name) continue

    const raw = pair
      .slice(separator + 1)
      .trim()
      .replace(/^"(.*)"$/, '$1')

    try {
      return decodeURIComponent(raw) || undefined
    } catch {
      return undefined
    }
  }

  return undefined
}
