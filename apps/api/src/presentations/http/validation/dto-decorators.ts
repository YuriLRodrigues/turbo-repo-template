import { applyDecorators } from '@nestjs/common'
import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional, Matches, ValidateIf } from 'class-validator'

/**
 * Shape checks shared by the DTOs. A DTO says what a field looks like (a text, a whole number, the shape of a
 * date); whether the value is acceptable is a business rule and belongs to the domain, which answers 422.
 */

/**
 * For a field of a PATCH that can be left out but not emptied: absent keeps the current value, and `null` is
 * rejected by the validators that follow. (`@IsOptional()` would let `null` through: use it where `null` clears.)
 */
export const Sent = () => ValidateIf((_, value) => value !== undefined)

/** `YYYY-MM-DD`. Whether it is a real day (`2026-02-30` is not) is checked by the domain. */
export const IsDayShape = () => Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '$property must be a date as YYYY-MM-DD' })

/** `YYYY-MM`. Whether it is a real month is checked by the domain. */
export const IsMonthShape = () => Matches(/^\d{4}-\d{2}$/, { message: '$property must be a month as YYYY-MM' })

/** A flag in the query string: `?includeArchived=true`. Anything other than `true` or `false` is a 400. */
export const QueryFlag = () =>
  applyDecorators(
    IsOptional(),
    Transform(({ value }: { value: unknown }) => (value === 'true' ? true : value === 'false' ? false : value)),
    IsBoolean(),
  )
