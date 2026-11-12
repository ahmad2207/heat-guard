import type { Language } from '../../data/types'
import { twoWay, type LanguageCode } from './codes'

const LANGUAGE = twoWay<Language, LanguageCode>([
  ['English', 'en'],
  ['Hausa', 'ha'],
  ['Yoruba', 'yo'],
  ['Igbo', 'ig'],
  ['Pidgin', 'pcm'],
])

export function languageToCode(language: Language): LanguageCode {
  // Every Language has a code, so this cannot be null.
  return LANGUAGE.toCode(language) as LanguageCode
}

/** Unknown codes fall back to English, so the app always has a language to show. */
export function languageFromCode(code: unknown): Language {
  return LANGUAGE.fromCode(code) ?? 'English'
}
