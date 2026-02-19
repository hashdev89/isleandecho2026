'use client'

import { useEffect } from 'react'
import Script from 'next/script'

const GOOGLE_TRANSLATE_SCRIPT = 'https://translate.google.com/translate_a/element.js'

declare global {
  interface Window {
    googleTranslateElementInit?: () => void
    google?: {
      translate: {
        TranslateElement: {
          new (config: { pageLanguage: string; includedLanguages: string; layout: number }, elementId: string): void
          InlineLayout: { SIMPLE: number }
        }
      }
    }
  }
}

export function GoogleTranslateWidget() {
  useEffect(() => {
    window.googleTranslateElementInit = function () {
      if (window.google?.translate?.TranslateElement) {
        const Te = window.google.translate.TranslateElement
        new Te(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,ar,de,es,fr,hi,it,ja,ko,nl,pt,ru,ta,zh-CN',
            layout: Te.InlineLayout?.SIMPLE ?? 0,
          },
          'google_translate_element'
        )
      }
    }
  }, [])

  return (
    <>
      {/* Hidden container: Google Translate widget runs here and applies translation to the whole page */}
      <div
        id="google_translate_element"
        className="absolute left-[-9999px] w-0 h-0 overflow-hidden"
        aria-hidden
      />
      <Script
        src={`${GOOGLE_TRANSLATE_SCRIPT}?cb=googleTranslateElementInit`}
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== 'undefined' && window.googleTranslateElementInit) {
            window.googleTranslateElementInit()
          }
        }}
      />
    </>
  )
}

/** Map navbar language code to Google Translate language code (used in cookie). */
export const langToGoogleCode: Record<string, string> = {
  EN: 'en',
  AR: 'ar',
  DE: 'de',
  ES: 'es',
  FR: 'fr',
  HI: 'hi',
  IT: 'it',
  JA: 'ja',
  KO: 'ko',
  NL: 'nl',
  PT: 'pt',
  RU: 'ru',
  TA: 'ta',
  ZH: 'zh-CN',
}

const COOKIE_NAME = 'googtrans'
const COOKIE_PATH = '/'

/** Set Google Translate language and reload so translation applies. */
export function setGoogleTranslateLanguage(navbarCode: string) {
  if (typeof document === 'undefined') return
  const code = langToGoogleCode[navbarCode] ?? 'en'
  if (code === 'en') {
    document.cookie = `${COOKIE_NAME}=; path=${COOKIE_PATH}; max-age=0`
  } else {
    document.cookie = `${COOKIE_NAME}=/en/${code}; path=${COOKIE_PATH}; max-age=31536000`
  }
  window.location.reload()
}

/** Read current Google Translate target language from cookie. Returns navbar code (e.g. EN, FR). */
export function getGoogleTranslateLanguage(): string {
  if (typeof document === 'undefined') return 'EN'
  const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
  const value = match ? match[1].trim() : ''
  if (!value || value === '/en/en') return 'EN'
  const toLang = value.split('/').pop() ?? 'en' // e.g. "fr" or "zh-CN"
  const entry = Object.entries(langToGoogleCode).find(([, v]) => v === toLang || v.toLowerCase() === toLang.toLowerCase())
  return entry ? entry[0] : 'EN'
}
