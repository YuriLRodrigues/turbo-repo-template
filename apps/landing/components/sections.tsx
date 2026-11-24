import type { ReactNode } from 'react'

import {
  ArrowRightIcon,
  BarChart3Icon,
  KeyRoundIcon,
  LayersIcon,
  type LucideIcon,
  PaletteIcon,
  ShieldCheckIcon,
  ZapIcon,
} from 'lucide-react'

import { Button } from '@workspace/ui/components/button'
import { Disclosure } from '@workspace/ui/components/disclosure'

import { site } from '@/config/site'
import type { Dictionary } from '@/i18n/dictionaries'

/*
 * The sections of the page. The words come from the dictionary of the language (`i18n/dictionaries/`): replace them
 * there, keep the shape (a heading, a short lead, the content), and add or remove sections in `config/site.ts` and
 * `components/home-page.tsx`.
 */

const Section = ({
  id,
  eyebrow,
  title,
  lead,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  lead?: string
  children: ReactNode
}) => (
  <section id={id} aria-labelledby={`${id}-title`} className="border-t border-border py-20 sm:py-24">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <p className="text-sm font-medium text-primary-text">{eyebrow}</p>
      <h2
        id={`${id}-title`}
        className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-[-0.02em] text-balance"
      >
        {title}
      </h2>
      {lead && <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">{lead}</p>}
      <div className="mt-10">{children}</div>
    </div>
  </section>
)

export const Hero = ({ dict }: { dict: Dictionary }) => (
  <section id="top" className="relative isolate">
    <div aria-hidden className="brand-backdrop" />
    <div className="mx-auto max-w-6xl px-4 pt-20 pb-24 sm:px-6 sm:pt-28">
      <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
        <span aria-hidden className="size-1.5 rounded-full bg-success" />
        {dict.hero.badge}
      </p>
      <h1 className="mt-6 max-w-3xl font-display text-4xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
        {dict.hero.title} <span className="text-brand">{dict.hero.titleAccent}</span>
      </h1>
      <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">{dict.hero.lead}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" render={<a href={`${site.appUrl}/sign-up/`} />}>
          {dict.hero.primary}
          <ArrowRightIcon aria-hidden />
        </Button>
        <Button size="lg" variant="secondary" render={<a href="#features" />}>
          {dict.hero.secondary}
        </Button>
      </div>
    </div>
  </section>
)

/** The icon of each feature, in the order of `features.items` in the dictionary. */
const FEATURE_ICONS: LucideIcon[] = [KeyRoundIcon, ShieldCheckIcon, PaletteIcon, LayersIcon, BarChart3Icon, ZapIcon]

export const Features = ({ dict }: { dict: Dictionary }) => (
  <Section id="features" eyebrow={dict.features.eyebrow} title={dict.features.title} lead={dict.features.lead}>
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {dict.features.items.map(({ title, text }, index) => {
        const Icon = FEATURE_ICONS[index] ?? ZapIcon

        return (
          <li key={title} className="rounded-(--radius-card) surface p-5">
            <span aria-hidden className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary-text">
              <Icon className="size-5" />
            </span>
            <h3 className="mt-4 font-display font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{text}</p>
          </li>
        )
      })}
    </ul>
  </Section>
)

export const HowItWorks = ({ dict }: { dict: Dictionary }) => (
  <Section id="how-it-works" eyebrow={dict.howItWorks.eyebrow} title={dict.howItWorks.title}>
    <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {dict.howItWorks.steps.map((step, index) => (
        <li key={step.title} className="flex gap-4">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-full border border-border-strong font-display text-sm font-semibold tabular-nums"
          >
            {index + 1}
          </span>
          <div>
            <h3 className="font-display font-semibold">{step.title}</h3>
            <p className="mt-1 text-sm text-pretty text-muted-foreground">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  </Section>
)

export const Faq = ({ dict }: { dict: Dictionary }) => (
  <Section id="faq" eyebrow={dict.faq.eyebrow} title={dict.faq.title}>
    <ul className="flex max-w-2xl flex-col divide-y divide-border">
      {dict.faq.items.map((item) => (
        <li key={item.question} className="py-3">
          <Disclosure label={item.question}>
            <p className="pt-2 pb-1 text-sm text-pretty text-muted-foreground">{item.answer}</p>
          </Disclosure>
        </li>
      ))}
    </ul>
  </Section>
)

export const Closing = ({ dict }: { dict: Dictionary }) => (
  <section className="border-t border-border py-20 sm:py-24">
    <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
      <h2 className="max-w-xl font-display text-3xl font-semibold tracking-[-0.02em] text-balance">
        {dict.closing.title}
      </h2>
      <Button size="lg" render={<a href={`${site.appUrl}/sign-up/`} />}>
        {dict.closing.cta}
        <ArrowRightIcon aria-hidden />
      </Button>
    </div>
  </section>
)
