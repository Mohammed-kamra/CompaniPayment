import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import translationEN from './locales/en.json'
import translationKU from './locales/ku.json'
import translationAR from './locales/ar.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: translationEN
      },
      ku: {
        translation: translationKU
      },
      ar: {
        translation: translationAR
      }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

// Load admin-edited translations from API (overrides static files, persisted in MongoDB)
// Important: this must target the same backend used by services/api.js in production
const envApiBase = import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || ''
const fallbackApiBase = 'https://companipayment-production-87d9.up.railway.app/api'
const apiBase = (envApiBase || fallbackApiBase).replace(/\/$/, '')
const translationsUrl = apiBase.endsWith('/api')
  ? `${apiBase}/translations`
  : `${apiBase}/api/translations`
const translationsFetchUrl = `${translationsUrl}${translationsUrl.includes('?') ? '&' : '?'}_ts=${Date.now()}`
if (typeof fetch !== 'undefined') {
  fetch(translationsFetchUrl, { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && i18n.addResourceBundle) {
        let hasUpdates = false
        if (data.en && Object.keys(data.en).length > 0) {
          i18n.addResourceBundle('en', 'translation', data.en, true, true)
          hasUpdates = true
        }
        if (data.ku && Object.keys(data.ku).length > 0) {
          i18n.addResourceBundle('ku', 'translation', data.ku, true, true)
          hasUpdates = true
        }
        if (data.ar && Object.keys(data.ar).length > 0) {
          i18n.addResourceBundle('ar', 'translation', data.ar, true, true)
          hasUpdates = true
        }
        if (hasUpdates && i18n.changeLanguage) {
          i18n.changeLanguage(i18n.language)
        }
      }
    })
    .catch((err) => {
      // Keep silent for users, but useful during production debugging
      console.warn('Failed to load translation overrides from API:', err?.message || err)
    })
}

export default i18n
