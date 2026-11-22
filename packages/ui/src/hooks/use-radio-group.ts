'use client'

import type { KeyboardEvent } from 'react'

type RadioGroupOptions<TValue extends string> = {
  /** Every option, in visual order. */
  values: readonly TValue[]
  /** The chosen one, or `null` when nothing is chosen yet. */
  value: TValue | null
  onValueChange: (value: TValue) => void
}

const STEPS: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

/**
 * The behaviour of a radio group for custom options (segments, chips, swatches): one tab stop on the chosen option
 * (or on the first one when nothing is chosen), arrows move and choose, Home and End jump to the ends.
 *
 *   const radio = useRadioGroup({ values, value, onValueChange })
 *   <div aria-label="Tema" {...radio.groupProps}>
 *     {values.map((option) => <button key={option} type="button" {...radio.itemProps(option)}>…</button>)}
 *   </div>
 */
export const useRadioGroup = <TValue extends string>({ values, value, onValueChange }: RadioGroupOptions<TValue>) => {
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const current = Math.max(value === null ? 0 : values.indexOf(value), 0)
    const step = STEPS[event.key]
    const target =
      event.key === 'Home' ? 0 : event.key === 'End' ? values.length - 1 : step ? current + step : undefined
    if (target === undefined) return
    event.preventDefault()

    const next = values[(target + values.length) % values.length]
    if (next === undefined) return
    onValueChange(next)
    event.currentTarget.querySelector<HTMLElement>(`[data-value="${CSS.escape(next)}"]`)?.focus()
  }

  return {
    groupProps: { role: 'radiogroup', onKeyDown } as const,
    itemProps: (itemValue: TValue) =>
      ({
        role: 'radio',
        'aria-checked': itemValue === value,
        'data-value': itemValue,
        tabIndex: itemValue === value || (value === null && itemValue === values[0]) ? 0 : -1,
        onClick: () => onValueChange(itemValue),
      }) as const,
  }
}
