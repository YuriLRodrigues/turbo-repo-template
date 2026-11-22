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

/*
 * The sections of the page. Generic copy on purpose: replace the words, keep the shape (a heading, a short lead, the
 * content), and add or remove sections in `config/site.ts` and `app/page.tsx`.
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

export const Hero = () => (
  <section id="top" className="mx-auto max-w-6xl px-4 pt-20 pb-24 sm:px-6 sm:pt-28">
    <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
      <span aria-hidden className="size-1.5 rounded-full bg-success" />
      Open for early access
    </p>
    <h1 className="mt-6 max-w-3xl font-display text-4xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
      Start the product, not the plumbing.
    </h1>
    <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">{site.description}</p>
    <div className="mt-8 flex flex-wrap gap-3">
      <Button size="lg" render={<a href={`${site.appUrl}/sign-up/`} />}>
        Start free
        <ArrowRightIcon aria-hidden />
      </Button>
      <Button size="lg" variant="secondary" render={<a href="#features" />}>
        See what is included
      </Button>
    </div>
  </section>
)

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: KeyRoundIcon,
    title: 'Accounts that are done',
    text: 'Sign-up, sign-in, e-mail confirmation, password reset and sessions you can see and end.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Safe by default',
    text: 'Short access tokens, rotating refresh tokens in an httpOnly cookie, and reuse detection.',
  },
  {
    icon: PaletteIcon,
    title: 'A look people choose',
    text: 'Light and dark, six accents and two densities, saved in the account and applied before the first paint.',
  },
  {
    icon: LayersIcon,
    title: 'Clean architecture',
    text: 'Use cases, entities and ports in the API; every rule tested without a framework in the way.',
  },
  {
    icon: BarChart3Icon,
    title: 'Charts that fit the theme',
    text: 'Nine configurable charts on Recharts, colored by the same tokens as the rest of the interface.',
  },
  {
    icon: ZapIcon,
    title: 'Fast to ship',
    text: 'Static exports for the web and this page, one API, and checks that run on every commit.',
  },
]

export const Features = () => (
  <Section
    id="features"
    eyebrow="Features"
    title="What is already there on the first day"
    lead="The parts every product needs and nobody wants to build twice."
  >
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map(({ icon: Icon, title, text }) => (
        <li key={title} className="rounded-(--radius-card) surface p-5">
          <span aria-hidden className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary-text">
            <Icon className="size-5" />
          </span>
          <h3 className="mt-4 font-display font-semibold">{title}</h3>
          <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{text}</p>
        </li>
      ))}
    </ul>
  </Section>
)

const STEPS = [
  { title: 'Create your account', text: 'A name, an e-mail and a password. No card.' },
  { title: 'Make it yours', text: 'Pick the theme and the accent: they follow you to every device.' },
  { title: 'Start working', text: 'Everything you write is yours: download it or delete it whenever you want.' },
]

export const HowItWorks = () => (
  <Section id="how-it-works" eyebrow="How it works" title="Three steps, one minute">
    <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {STEPS.map((step, index) => (
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

const QUESTIONS = [
  { question: 'Is there a free plan?', answer: 'Yes. Start free and decide later; nothing is charged without asking.' },
  {
    question: 'Can I take my data with me?',
    answer: 'Always. One button downloads everything the account has as a JSON file.',
  },
  {
    question: 'What happens when I delete my account?',
    answer: 'Everything that belongs to it is deleted for good, at once. It cannot be undone.',
  },
]

export const Faq = () => (
  <Section id="faq" eyebrow="FAQ" title="The usual questions">
    <ul className="flex max-w-2xl flex-col divide-y divide-border">
      {QUESTIONS.map((item) => (
        <li key={item.question} className="py-3">
          <Disclosure label={item.question}>
            <p className="pt-2 pb-1 text-sm text-pretty text-muted-foreground">{item.answer}</p>
          </Disclosure>
        </li>
      ))}
    </ul>
  </Section>
)

export const Closing = () => (
  <section className="border-t border-border py-20 sm:py-24">
    <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
      <h2 className="max-w-xl font-display text-3xl font-semibold tracking-[-0.02em] text-balance">
        Ready when you are.
      </h2>
      <Button size="lg" render={<a href={`${site.appUrl}/sign-up/`} />}>
        Create your account
        <ArrowRightIcon aria-hidden />
      </Button>
    </div>
  </section>
)
