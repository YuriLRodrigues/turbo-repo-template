/**
 * Text rules shared by every bounded context. Sizes come from rule 0.8: a name has up to 60 characters, a
 * description up to 140 and a note up to 500.
 */
export const NAME_MAX_LENGTH = 60
export const DESCRIPTION_MAX_LENGTH = 140
export const NOTE_MAX_LENGTH = 500

const collapseSpaces = (text: string): string => text.replace(/\s+/g, ' ').trim()

/**
 * How two texts are compared when case and accents must not matter (a name that must be unique, a search done in
 * memory): lower case, no accents, single spaces. `"  Água  e LUZ "` becomes `"agua e luz"`.
 */
export function foldText(text: string): string {
  return collapseSpaces(
    text
      .normalize('NFD')
      .replace(/\p{M}+/gu, '')
      .toLowerCase(),
  )
}

/** A name as it is stored: trimmed, single spaces. `null` when it is empty or longer than `maxLength`. */
export function cleanName(raw: string, maxLength: number = NAME_MAX_LENGTH): string | null {
  const name = collapseSpaces(raw)

  return name === '' || name.length > maxLength ? null : name
}

export type OptionalText = { valid: true; value: string | null } | { valid: false }

/**
 * An optional free text (description, note): blank means "none" (`null`); longer than `maxLength` is invalid.
 * Line breaks inside a note are kept; only the ends are trimmed.
 */
export function cleanOptionalText(raw: string | null | undefined, maxLength: number): OptionalText {
  const text = raw?.trim() ?? ''
  if (text === '') return { valid: true, value: null }

  return text.length > maxLength ? { valid: false } : { valid: true, value: text }
}

const HEX_COLOR = /^#[0-9a-f]{6}$/

/** A color as the person picked it: `#rrggbb`, stored in lower case. `null` when it is anything else. */
export function cleanHexColor(raw: string): string | null {
  const color = raw.trim().toLowerCase()

  return HEX_COLOR.test(color) ? color : null
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** A short identifier chosen by the client (an icon, a block of a screen): `shopping-bag`. */
export function isSlug(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length <= maxLength && SLUG.test(value)
}
