import { describe, expect, it } from 'vitest'

import {
  formatCompactMoney,
  formatCompactNumber,
  formatDate,
  formatMoney,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  initialsOf,
  isCalendarDate,
} from './format'

describe('money', () => {
  it('formats integer cents in the currency', () => {
    expect(formatMoney(123456)).toBe('$1,234.56')
    expect(formatMoney(-1200)).toBe('-$12.00')
    expect(formatMoney(5)).toBe('$0.05')
  })

  it('takes another locale and currency, and their minor units', () => {
    expect(formatMoney(123456, { locale: 'de-DE', currency: 'EUR' })).toBe('1.234,56 €')
    expect(formatMoney(1234, { locale: 'ja-JP', currency: 'JPY' })).toBe('￥1,234')
  })

  it('has a compact form for axes', () => {
    expect(formatCompactMoney(1250000)).toBe('$12.5K')
  })
})

describe('numbers', () => {
  it('formats plain, compact and percent values', () => {
    expect(formatNumber(12345.678)).toBe('12,345.68')
    expect(formatCompactNumber(1234567)).toBe('1.2M')
    expect(formatPercent(42.4)).toBe('42%')
    expect(formatPercent(4.25, { digits: 1 })).toBe('4.3%')
  })
})

describe('dates', () => {
  it('knows a real calendar day', () => {
    expect(isCalendarDate('2026-11-14')).toBe(true)
    expect(isCalendarDate('2026-02-30')).toBe(false)
    expect(isCalendarDate('2026-11-14T10:00:00Z')).toBe(false)
  })

  it('never moves a calendar day to the day before, whatever the zone', () => {
    expect(formatDate('2026-11-14')).toBe('Nov 14, 2026')
    expect(formatDate('2026-11-14', { style: 'long' })).toBe('November 14, 2026')
  })

  it('says how long ago something happened', () => {
    const now = new Date('2026-11-14T15:00:00Z')

    expect(formatRelativeTime('2026-11-14T14:55:00Z', { now })).toBe('5 minutes ago')
    expect(formatRelativeTime('2026-11-13T15:00:00Z', { now })).toBe('yesterday')
    expect(formatRelativeTime('2026-11-16T15:00:00Z', { now })).toBe('in 2 days')
    expect(formatRelativeTime('2026-11-14T15:00:00Z', { now })).toBe('now')
  })
})

describe('initialsOf', () => {
  it('takes the first letter of the first two names', () => {
    expect(initialsOf('Jane Doe')).toBe('JD')
    expect(initialsOf('  jane  ')).toBe('J')
    expect(initialsOf('Jane Mary Doe')).toBe('JM')
    expect(initialsOf('')).toBe('')
  })
})
