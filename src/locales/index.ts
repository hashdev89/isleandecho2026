import type { LocaleCode, TranslationKeys } from './types'
import en from './en'
import si from './si'
import ta from './ta'
import fr from './fr'
import de from './de'
import es from './es'

const translations: Record<LocaleCode, TranslationKeys> = { EN: en, SI: si, TA: ta, FR: fr, DE: de, ES: es }

export type { LocaleCode, TranslationKeys }
export { translations }
export default translations
