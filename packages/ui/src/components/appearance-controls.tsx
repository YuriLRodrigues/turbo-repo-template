'use client'

import { type ReactNode, useId } from 'react'

import { CheckIcon, MonitorIcon, MoonIcon, RotateCcwIcon, SunIcon } from 'lucide-react'

import {
  ACCENT_LABELS,
  ACCENTS,
  type Accent,
  DEFAULT_APPEARANCE,
  DENSITIES,
  DENSITY_LABELS,
  THEME_LABELS,
} from '../appearance/options'
import type { Appearance } from '../appearance/options'
import { useAppearance } from '../appearance/use-appearance'
import { useRadioGroup } from '../hooks/use-radio-group'
import { cn } from '../lib/cn'
import { ArrowScrollArea } from './arrow-scroll-area'
import { Button } from './button'
import { SegmentedControl } from './segmented-control'
import { Switch } from './switch'

type SwatchesProps = {
  value: Accent
  onValueChange: (value: Accent) => void
}

/**
 * The accent, picked by its color. Each swatch carries `data-accent-preview`, which scopes that accent's tokens to
 * the swatch (tokens.css): it shows the real `primary` of the accent in the current theme, not a copy of it.
 *
 * One line: where the six do not fit (a narrow phone), arrows reach the rest.
 */
export const AccentSwatches = ({ value, onValueChange }: SwatchesProps) => {
  const radio = useRadioGroup({ values: ACCENTS, value, onValueChange })

  return (
    // The ring of the chosen swatch stands out of it: room for it on every side.
    <ArrowScrollArea itemsLabel="colors" className="[--bleed-bottom:0.5rem] [--bleed-top:0.5rem] [--bleed-x:0.5rem]">
      <div aria-label="Accent color" className="flex w-max gap-2.5" {...radio.groupProps}>
        {ACCENTS.map((accent) => (
          <button
            key={accent}
            type="button"
            data-accent-preview={accent}
            aria-label={ACCENT_LABELS[accent]}
            title={ACCENT_LABELS[accent]}
            className={cn(
              'grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-elevation-sm',
              'transition-[transform,box-shadow] duration-300 ease-spring hover:scale-110 active:scale-95',
              'aria-checked:shadow-[0_0_0_2px_var(--popover),0_0_0_4px_var(--primary)]',
            )}
            {...radio.itemProps(accent)}
          >
            <CheckIcon
              aria-hidden
              strokeWidth={3}
              className={cn(
                'size-4 transition-[opacity,scale] duration-300 ease-spring',
                accent !== value && 'scale-50 opacity-0',
              )}
            />
          </button>
        ))}
      </div>
    </ArrowScrollArea>
  )
}

const THEME_OPTIONS = [
  { value: 'system', label: THEME_LABELS.system, icon: <MonitorIcon aria-hidden /> },
  { value: 'light', label: THEME_LABELS.light, icon: <SunIcon aria-hidden /> },
  { value: 'dark', label: THEME_LABELS.dark, icon: <MoonIcon aria-hidden /> },
] as const

const DENSITY_OPTIONS = DENSITIES.map((density) => ({ value: density, label: DENSITY_LABELS[density] }))

const Group = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <section className="flex flex-col gap-3">
    <div>
      <h3 className="text-sm leading-tight font-semibold">{title}</h3>
      {hint && <p className="mt-1 text-[0.8125rem] leading-snug text-pretty text-muted-foreground">{hint}</p>}
    </div>
    {children}
  </section>
)

/** What a person can change about the look, in the order the controls are shown. */
export const APPEARANCE_GROUPS = ['theme', 'accent', 'density', 'motion'] as const
export type AppearanceGroup = (typeof APPEARANCE_GROUPS)[number]

type AppearanceControlsProps = {
  /** Which controls to show. Default: all of them. */
  groups?: readonly AppearanceGroup[]
  /** The button that goes back to the defaults. Default: shown. */
  reset?: boolean
  /**
   * Called after every change, with the part that changed: the web app sends it to the API (the user's
   * preferences) when someone is signed in. The look itself is already applied and stored on the device.
   */
  onChange?: (change: Partial<Appearance>) => void
  className?: string
}

/**
 * The controls of the look, changed live: theme, accent, density and "reduce motion". Each change is applied at once
 * and remembered on the device (`appearance.ts`): only attributes on <html> change, so nothing is mounted again and
 * the page stays where it is.
 *
 * They are the same wherever the look can be changed: the panel of the app, the product page.
 */
export const AppearanceControls = ({
  groups = APPEARANCE_GROUPS,
  reset = true,
  onChange,
  className,
}: AppearanceControlsProps) => {
  const { appearance, setAppearance } = useAppearance()
  const motionId = useId()
  const shows = (group: AppearanceGroup) => groups.includes(group)

  const change = (next: Partial<Appearance>) => {
    setAppearance(next)
    onChange?.(next)
  }

  return (
    <div className={cn('flex flex-col gap-7', className)}>
      {shows('theme') && (
        <Group title="Theme">
          <SegmentedControl
            label="Theme"
            value={appearance.theme}
            onValueChange={(theme) => change({ theme })}
            options={THEME_OPTIONS}
          />
        </Group>
      )}

      {shows('accent') && (
        <Group title="Accent color">
          <AccentSwatches value={appearance.accent} onValueChange={(accent) => change({ accent })} />
        </Group>
      )}

      {shows('density') && (
        <Group title="Density" hint="Compact brings everything a little closer and shows more per screen.">
          <SegmentedControl
            label="Density"
            value={appearance.density}
            onValueChange={(density) => change({ density })}
            options={DENSITY_OPTIONS}
          />
        </Group>
      )}

      {shows('motion') && (
        <label htmlFor={motionId} className="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span className="block text-sm leading-tight font-semibold">Reduce motion</span>
            <span className="mt-1 block text-[0.8125rem] leading-snug text-pretty text-muted-foreground">
              Transitions end at once and nothing slides, whatever the system says.
            </span>
          </span>
          <Switch
            id={motionId}
            checked={appearance.reduceMotion}
            onCheckedChange={(reduceMotion) => change({ reduceMotion })}
          />
        </label>
      )}

      {reset && (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => change(DEFAULT_APPEARANCE)}>
          <RotateCcwIcon aria-hidden />
          Reset to defaults
        </Button>
      )}
    </div>
  )
}
