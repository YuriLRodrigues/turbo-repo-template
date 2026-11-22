# Money and time

Rules 0.1, 0.2 and 0.3 of [`docs/business-rules.md`](../../business-rules.md). Everything here is in `src/core`,
pure and unit-tested. The notes example uses none of the money helpers: they are here for the first context that does.

## Money is an integer number of cents

- A column is `bigint` read as a number (`bigint('amount_cents', { mode: 'number' })`); a field is `amountCents`,
  `totalCents`, `limitCents`. There is no float anywhere. One currency per product is the simple case; a product with
  several stores the currency code next to the amount.
- An amount is positive and a field or a kind says the direction (a refund of `1850`, not a payment of `-1850`).
  A balance is the one value that may be signed.
- `core/money/money.ts`: `isAmountCents(value)` (integer, greater than zero, up to `MAX_AMOUNT_CENTS`, which is
  1,000,000,000.00) and `isSignedAmountCents(value)`. The cap keeps every sum far below 2^53.
- The DTO checks the shape (`@IsInt()`); the domain checks the rule and answers 422 (`<CONTEXT>.INVALID_AMOUNT`).

### Dividing

Every division goes through `core/money/largest-remainder.ts`, so the parts always add up to the total and the
cents that are left go to the first parts:

```ts
splitEvenly(10000, 3) // [3334, 3333, 3333]
allocateByWeights(1000, [1, 1, 2]) // [250, 250, 500]
```

`splitEvenly` is for equal parts (instalments). `allocateByWeights` is for shares that are not equal (a bill split
by usage). Never write `Math.round(total / parts)`: the cents will not add up.

## A day is a text, an instant is a `Date`

| What                                 | Type                           | Column                             |
| ------------------------------------ | ------------------------------ | ---------------------------------- |
| the day something happened or is due | `CalendarDate`, `'2026-11-14'` | `date('date', { mode: 'string' })` |
| a month                              | `YearMonth`, `'2026-11'`       | -                                  |
| an audit stamp (`createdAt`)         | `Date`                         | `timestamp(..., { withTimezone })` |

A `CalendarDate` has no time and no zone, compares with `<` and `>`, and never passes through `new Date()`, which
would shift it by the zone of the server. `core/time/calendar-date.ts` has the arithmetic:

```ts
dateInMonth(2027, 2, 31) // '2027-02-28': rule 0.3, a day the month lacks falls on its last day
addMonths('2026-01-31', 1, 31) // '2026-02-28', and then '2026-03-31': the anchor day is kept
addDays('2026-11-14', -89)
;(firstDayOfMonth('2026-11'), lastDayOfMonth('2026-11'), monthOf('2026-11-14'))
isCalendarDate('2026-02-30') // false: the shape is right, the day does not exist
```

The DTO checks the shape (`@IsDayShape()`, `@IsMonthShape()`); `isCalendarDate` / `isYearMonth` in the domain say
whether the day exists (422).

## "Now" and "today" are injected

```ts
// core/time/clock.ts
export abstract class Clock {
  abstract now(): Date
}
export abstract class UserCalendar {
  abstract today(userId: string): Promise<CalendarDate>
}
```

- `Clock` is the only source of the current instant. Infra binds `SystemClock`.
- `UserCalendar` answers "what day is it for this person": the clock, read in the time zone of their preferences
  (default `UTC`). Infra binds `PreferencesUserCalendar`. At 20:30 in New York it is already tomorrow in Lisbon,
  and every "today" and "this month" of each person follows their own day (the file name of the data export, too).

**Never call `new Date()`, `Date.now()` or `now()` in SQL from the domain or a repository.** A use case that needs
the instant injects `Clock`; one that needs the day injects `UserCalendar`; a policy receives `today` or `now` as
an argument and stays pure:

```ts
signInLockedUntil(failures, now)
note.archive(now)
```

Any module that needs them imports `TimeModule` (`infra/time/time.module.ts`).

### In tests

`test/time/fake-clock.ts`: `FakeClock` stands still at `TEST_NOW` (Saturday, 14 November 2026, 15:00 UTC;
`TEST_TODAY` is that day) until the test moves it with `set` or `advance`. `FakeUserCalendar` follows it, and
`setTimeZone(userId, zone)` gives one person another zone.

The e2e app replaces `Clock` with a `FakeClock` too (`clockOf(app)`), so "today" is the same on every run and a
test can travel: `clockOf(app).set('2027-02-10T15:00:00.000Z')`. Access tokens are the one thing that keeps real
time (the JWT library checks their expiry itself).

## Text sizes

Rule 0.8 lives next door, in `core/text/text.ts`: a name has up to 60 characters, a description 140, a note 500
(a context may set its own, like the title of a note, in its `*-rules.ts`). `cleanName` and `cleanOptionalText`
normalise a text the same way everywhere; `foldText` compares texts when case and accents must not matter.
