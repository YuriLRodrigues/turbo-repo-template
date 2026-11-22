/** `%term%` for `ilike`, with `%`, `_` and `\` in the term matched literally. */
export function containsPattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, '\\$&')}%`
}
