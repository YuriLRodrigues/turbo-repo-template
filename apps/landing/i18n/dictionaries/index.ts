import type { Locale } from '../config'
import { en } from './en'
import { es } from './es'
import { type Dictionary, pt } from './pt'

const dictionaries: Record<Locale, Dictionary> = { pt, en, es }

/** The dictionary of a language. They are small and static: imported directly, no async loading. */
export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale]

export type { Dictionary }
