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
// Uses relative /api/translations (proxied to backend in dev) or full URL when VITE_API_URL is set
const apiBase = import.meta.env?.VITE_API_URL || ''
const translationsUrl = apiBase ? `${apiBase.replace(/\/$/, '')}/api/translations` : '/api/translations'
if (typeof fetch !== 'undefined') {
  fetch(translationsUrl)
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
    .catch(() => {})
}

export default i18n
