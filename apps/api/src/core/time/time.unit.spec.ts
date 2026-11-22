import { describe, expect, it } from 'vitest'

import {
  addDays,
  addMonths,
  dateInMonth,
  daysBetween,
  daysInMonth,
  earliestDate,
  firstDayOfMonth,
  isCalendarDate,
  isYearMonth,
  lastDayOfMonth,
  monthOf,
  partsOf,
} from './calendar-date'
import { calendarDateIn, DEFAULT_TIME_ZONE, isTimeZone } from './time-zone'

describe('calendar dates (rule 0.2)', () => {
  it('accepts only real days', () => {
    expect(isCalendarDate('2026-11-14')).toBe(true)
    expect(isCalendarDate('2028-02-29')).toBe(true)
  })

  it.each([
    '2026-02-29',
    '2026-02-30',
    '2026-13-01',
    '2026-00-10',
    '2026-11-00',
    '2026-11-31',
    '26-11-14',
    '2026-11-14T00:00:00Z',
    '14/11/2026',
    '1899-12-31',
    '3000-01-01',
    '',
    20261114,
    null,
  ])('rejects %s', (value) => {
    expect(isCalendarDate(value)).toBe(false)
  })

  it('recognises a calendar month', () => {
    expect(isYearMonth('2026-11')).toBe(true)
    expect(isYearMonth('2026-13')).toBe(false)
    expect(isYearMonth('2026-1')).toBe(false)
    expect(isYearMonth('2026-11-01')).toBe(false)
    expect(isYearMonth(202611)).toBe(false)
  })

  it('reads the parts and the month of a date', () => {
    expect(partsOf('2026-03-09')).toEqual({ year: 2026, month: 3, day: 9 })
    expect(monthOf('2026-03-09')).toBe('2026-03')
  })

  it('knows the length of every month, leap years included', () => {
    expect(daysInMonth(2026, 2)).toBe(28)
    expect(daysInMonth(2028, 2)).toBe(29)
    expect(daysInMonth(2100, 2)).toBe(28)
    expect(daysInMonth(2026, 4)).toBe(30)
    expect(daysInMonth(2026, 12)).toBe(31)
  })

  it('gives the first and the last day of a month', () => {
    expect(firstDayOfMonth('2026-02')).toBe('2026-02-01')
    expect(lastDayOfMonth('2026-02')).toBe('2026-02-28')
    expect(lastDayOfMonth('2028-02')).toBe('2028-02-29')
    expect(lastDayOfMonth('2026-12')).toBe('2026-12-31')
  })

  it('moves by days across months and years', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2026-11-14', -89)).toBe('2026-08-17')
    expect(daysBetween('2026-11-14', '2026-11-17')).toBe(3)
    expect(daysBetween('2026-11-14', '2026-11-10')).toBe(-4)
  })

  it('orders as text', () => {
    expect(earliestDate('2026-11-14', '2026-02-01')).toBe('2026-02-01')
    expect(earliestDate('2026-01-01', '2026-01-01')).toBe('2026-01-01')
  })
})

describe('a day that does not exist in the month (rule 0.3)', () => {
  it('falls on the last day of that month', () => {
    expect(dateInMonth(2026, 2, 31)).toBe('2026-02-28')
    expect(dateInMonth(2028, 2, 30)).toBe('2028-02-29')
    expect(dateInMonth(2026, 4, 31)).toBe('2026-04-30')
    expect(dateInMonth(2026, 1, 31)).toBe('2026-01-31')
  })

  it('keeps the same day when adding months', () => {
    expect(addMonths('2026-01-15', 1)).toBe('2026-02-15')
    expect(addMonths('2026-11-14', 2)).toBe('2027-01-14')
    expect(addMonths('2026-03-10', -3)).toBe('2025-12-10')
  })

  it('clamps to the end of a shorter month', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2026-10-31', 1)).toBe('2026-11-30')
  })

  it('goes back to the anchor day after a shorter month', () => {
    const months = [0, 1, 2, 3].map((offset) => addMonths('2026-01-31', offset))

    expect(months).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30'])
    // The clamped date alone would drift: the anchor day is what repeats.
    expect(addMonths('2026-02-28', 1)).toBe('2026-03-28')
    expect(addMonths('2026-02-28', 1, 31)).toBe('2026-03-31')
  })
})

describe('time zones (rule 0.2)', () => {
  it('defaults to UTC', () => {
    expect(DEFAULT_TIME_ZONE).toBe('UTC')
    expect(isTimeZone(DEFAULT_TIME_ZONE)).toBe(true)
  })

  it.each(['UTC', 'Europe/Lisbon', 'America/Argentina/Buenos_Aires', 'Asia/Tokyo'])('knows %s', (zone) => {
    expect(isTimeZone(zone)).toBe(true)
  })

  it.each(['', 'Mars/Olympus', '+03:00', 'America/New York', 'x'.repeat(65), 3, null])('rejects %s', (zone) => {
    expect(isTimeZone(zone)).toBe(false)
  })

  it('computes today where the person lives, not in UTC', () => {
    const lateEvening = new Date('2026-11-15T01:30:00Z')

    expect(calendarDateIn('America/New_York', lateEvening)).toBe('2026-11-14')
    expect(calendarDateIn('UTC', lateEvening)).toBe('2026-11-15')
    expect(calendarDateIn('Asia/Tokyo', lateEvening)).toBe('2026-11-15')
  })

  it('turns the month at local midnight', () => {
    expect(calendarDateIn('America/New_York', new Date('2026-12-01T04:59:59Z'))).toBe('2026-11-30')
    expect(calendarDateIn('America/New_York', new Date('2026-12-01T05:00:00Z'))).toBe('2026-12-01')
  })
})
