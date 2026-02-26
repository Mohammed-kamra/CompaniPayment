import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { translationsAPI } from '../services/api'
import translationEN from '../locales/en.json'
import translationKU from '../locales/ku.json'
import translationAR from '../locales/ar.json'
import '../styles/global-tables.css'
import './ManageTranslations.css'

// Flatten nested object to dot-notation keys
function flattenObj(obj, prefix = '') {
  const result = {}
  if (obj === null || typeof obj !== 'object') {
    return result
  }
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    const value = obj[key]
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObj(value, fullKey))
    } else {
      result[fullKey] = value == null ? '' : String(value)
    }
  }
  return result
}

// Unflatten dot-notation keys back to nested object
function unflattenObj(flat) {
  const result = {}
  for (const key of Object.keys(flat)) {
    const parts = key.split('.')
    let current = result
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!current[part]) current[part] = {}
      current = current[part]
    }
    current[parts[parts.length - 1]] = flat[key]
  }
  return result
}

// Get all keys from the union of three language objects (use en as base)
function getAllKeys(enFlat, kuFlat, arFlat) {
  const set = new Set([
    ...Object.keys(enFlat),
    ...Object.keys(kuFlat),
    ...Object.keys(arFlat)
  ])
  return Array.from(set).sort()
}

const ManageTranslations = () => {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [searchField, setSearchField] = useState('all') // 'all' | 'key' | 'en' | 'ku' | 'ar'
  const [rows, setRows] = useState([])
  const [source, setSource] = useState('api') // 'api' | 'static'
  const [page, setPage] = useState(1)
  const pageSize = 50

  const defaultEn = useMemo(() => flattenObj(translationEN), [])
  const defaultKu = useMemo(() => flattenObj(translationKU), [])
  const defaultAr = useMemo(() => flattenObj(translationAR), [])

  const allKeys = useMemo(() => getAllKeys(defaultEn, defaultKu, defaultAr), [defaultEn, defaultKu, defaultAr])

  useEffect(() => {
    let cancelled = false
    setError('')
    setLoading(true)
    translationsAPI
      .getAll()
      .then(({ en, ku, ar }) => {
        if (cancelled) return
        const hasData = (en && Object.keys(en).length > 0) ||
          (ku && Object.keys(ku).length > 0) ||
          (ar && Object.keys(ar).length > 0)
        if (hasData) {
          const enFlat = flattenObj(en || {})
          const kuFlat = flattenObj(ku || {})
          const arFlat = flattenObj(ar || {})
          const keys = getAllKeys(enFlat, kuFlat, arFlat)
          setRows(
            keys.map((key) => ({
              key,
              en: enFlat[key] ?? defaultEn[key] ?? '',
              ku: kuFlat[key] ?? defaultKu[key] ?? '',
              ar: arFlat[key] ?? defaultAr[key] ?? ''
            }))
          )
          setSource('api')
        } else {
          setRows(
            allKeys.map((key) => ({
              key,
              en: defaultEn[key] ?? '',
              ku: defaultKu[key] ?? '',
              ar: defaultAr[key] ?? ''
            }))
          )
          setSource('static')
        }
      })
      .catch((err) => {
        if (cancelled) return
        setRows(
          allKeys.map((key) => ({
            key,
            en: defaultEn[key] ?? '',
            ku: defaultKu[key] ?? '',
            ar: defaultAr[key] ?? ''
          }))
        )
        setSource('static')
        setError(err.message || 'Could not load translations from server. Showing default files.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows
    const term = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (searchField === 'key') {
        return r.key.toLowerCase().includes(term)
      }
      if (searchField === 'en') {
        return (r.en || '').toString().toLowerCase().includes(term)
      }
      if (searchField === 'ku') {
        return (r.ku || '').toString().toLowerCase().includes(term)
      }
      if (searchField === 'ar') {
        return (r.ar || '').toString().toLowerCase().includes(term)
      }
      // 'all' - check key and all languages
      return (
        r.key.toLowerCase().includes(term) ||
        (r.en || '').toString().toLowerCase().includes(term) ||
        (r.ku || '').toString().toLowerCase().includes(term) ||
        (r.ar || '').toString().toLowerCase().includes(term)
      )
    })
  }, [rows, search, searchField])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, currentPage, pageSize])

  useEffect(() => {
    setPage(1)
  }, [search, searchField])

  const handleChange = (index, lang, value) => {
    setRows((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [lang]: value }
      return next
    })
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')
    setSaving(true)
    const enFlat = {}
    const kuFlat = {}
    const arFlat = {}
    rows.forEach((r) => {
      enFlat[r.key] = r.en
      kuFlat[r.key] = r.ku
      arFlat[r.key] = r.ar
    })
    const en = unflattenObj(enFlat)
    const ku = unflattenObj(kuFlat)
    const ar = unflattenObj(arFlat)
    try {
      await translationsAPI.update({ en, ku, ar })
      setSuccess('Translations saved successfully. Changes will apply after refresh or language switch.')
      setSource('api')
      if (i18n && i18n.addResourceBundle) {
        i18n.addResourceBundle('en', 'translation', en, true, true)
        i18n.addResourceBundle('ku', 'translation', ku, true, true)
        i18n.addResourceBundle('ar', 'translation', ar, true, true)
      }
    } catch (err) {
      setError(err.message || 'Failed to save translations')
    } finally {
      setSaving(false)
    }
  }

  const handleSeed = async () => {
    setError('')
    setSuccess('')
    setSeeding(true)
    try {
      const result = await translationsAPI.seed()
      setSuccess(
        t('manageTranslations.seedSuccess') ||
        `Translations seeded: ${result.en} EN, ${result.ku} KU, ${result.ar} AR keys saved to database.`
      )
      const { en, ku, ar } = await translationsAPI.getAll()
      const enFlat = flattenObj(en || {})
      const kuFlat = flattenObj(ku || {})
      const arFlat = flattenObj(ar || {})
      const keys = getAllKeys(enFlat, kuFlat, arFlat)
      setRows(
        keys.map((key) => ({
          key,
          en: enFlat[key] ?? defaultEn[key] ?? '',
          ku: kuFlat[key] ?? defaultKu[key] ?? '',
          ar: arFlat[key] ?? defaultAr[key] ?? ''
        }))
      )
      setSource('api')
    } catch (err) {
      setError(err.message || (t('manageTranslations.seedError') || 'Failed to seed translations'))
    } finally {
      setSeeding(false)
    }
  }

  if (loading) {
    return (
      <div className="manage-translations page-container">
        <div className="loading-state">{t('manageTranslations.loading') || 'Loading translations...'}</div>
      </div>
    )
  }

  return (
    <div className="manage-translations page-container">
      <div className="page-header">
        <h1>{t('manageTranslations.title') || 'Manage Translations'}</h1>
        <p className="subtitle">{t('manageTranslations.subtitle') || 'Edit all system text for English, Kurdish, and Arabic.'}</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="translations-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Search text or key"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              setSearch(searchInput)
            }
          }}
        />
        <select
          className="search-field-select"
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
        >
          <option value="all">All (key + all languages)</option>
          <option value="key">Key only</option>
          <option value="en">English</option>
          <option value="ku">Kurdish</option>
          <option value="ar">Arabic</option>
        </select>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setSearch(searchInput)}
        >
          Search
        </button>
        <span className="source-badge">{source === 'api' ? (t('manageTranslations.fromDatabase') || 'From database') : (t('manageTranslations.fromDefaultFiles') || 'From default files')}</span>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleSeed}
          disabled={seeding}
          title={t('manageTranslations.seedTooltip') || 'Copy all locale file translations to database. Use this to initially populate or sync new keys.'}
        >
          {seeding ? (t('common.loading') || 'Loading...') : (t('manageTranslations.seedToDatabase') || 'Save to database')}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (t('settings.saving') || 'Saving...') : (t('manageTranslations.saveThisPage') || 'Save this page')}
        </button>
      </div>

      <div className="translations-table-wrapper">
        <table className="global-table translations-table">
          <thead>
            <tr>
              <th className="col-key">Key</th>
              <th className="col-lang">English</th>
              <th className="col-lang">Kurdish (کوردی)</th>
              <th className="col-lang">Arabic (العربية)</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row) => {
              const rowIndex = rows.findIndex((r) => r.key === row.key)
              return (
                <tr key={row.key}>
                  <td className="col-key">
                    <code>{row.key}</code>
                  </td>
                  <td className="col-lang">
                    <input
                      type="text"
                      value={row.en}
                      onChange={(e) => handleChange(rowIndex, 'en', e.target.value)}
                      className="translation-input"
                      dir="ltr"
                    />
                  </td>
                  <td className="col-lang">
                    <input
                      type="text"
                      value={row.ku}
                      onChange={(e) => handleChange(rowIndex, 'ku', e.target.value)}
                      className="translation-input"
                      dir="rtl"
                    />
                  </td>
                  <td className="col-lang">
                    <input
                      type="text"
                      value={row.ar}
                      onChange={(e) => handleChange(rowIndex, 'ar', e.target.value)}
                      className="translation-input"
                      dir="rtl"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="translations-count">
        {filteredRows.length} key(s) {search ? `(filtered)` : ''} · Page {currentPage} of {pageCount}
      </p>

      <div className="translations-pagination">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setPage(1)}
          disabled={currentPage === 1}
        >
          « First
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          ‹ Prev
        </button>
        <span className="page-info">
          {currentPage} / {pageCount}
        </span>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          disabled={currentPage === pageCount}
        >
          Next ›
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setPage(pageCount)}
          disabled={currentPage === pageCount}
        >
          Last »
        </button>
      </div>
    </div>
  )
}

export default ManageTranslations
