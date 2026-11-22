import type { Dictionary } from './pt'

export const en: Dictionary = {
  meta: {
    tagline: 'start the product, not the plumbing',
    description:
      'Accounts, sessions, preferences and a design system that are already done, so the first day goes to what makes your product different.',
    ogImageAlt: 'The name of the product and the line "Start the product, not the plumbing." on a dark ground',
  },
  nav: {
    home: 'go to the start',
    sections: 'Sections',
    footer: 'Footer',
    features: 'Features',
    howItWorks: 'How it works',
    faq: 'FAQ',
    signIn: 'Sign in',
    start: 'Start free',
    language: 'Language',
    useLight: 'Use the light theme',
    useDark: 'Use the dark theme',
  },
  hero: {
    badge: 'Open for early access',
    title: 'Start the product, not the plumbing.',
    lead: 'Accounts, sessions, preferences and a design system that are already done, so the first day goes to what makes your product different.',
    primary: 'Start free',
    secondary: 'See what is included',
  },
  features: {
    eyebrow: 'Features',
    title: 'What is already there on the first day',
    lead: 'The parts every product needs and nobody wants to build twice.',
    items: [
      {
        title: 'Accounts that are done',
        text: 'Sign-up, sign-in, e-mail confirmation, password reset and sessions you can see and end.',
      },
      {
        title: 'Safe by default',
        text: 'Short access tokens, rotating refresh tokens in an httpOnly cookie, and reuse detection.',
      },
      {
        title: 'A look people choose',
        text: 'Light and dark, six accents and two densities, saved in the account and applied before the first paint.',
      },
      {
        title: 'Clean architecture',
        text: 'Use cases, entities and ports in the API; every rule tested without a framework in the way.',
      },
      {
        title: 'Charts that fit the theme',
        text: 'Nine configurable charts on Recharts, colored by the same tokens as the rest of the interface.',
      },
      {
        title: 'Fast to ship',
        text: 'Static exports for the web and this page, one API, and checks that run on every commit.',
      },
    ],
  },
  howItWorks: {
    eyebrow: 'How it works',
    title: 'Three steps, one minute',
    steps: [
      { title: 'Create your account', text: 'A name, an e-mail and a password. No card.' },
      { title: 'Make it yours', text: 'Pick the theme and the accent: they follow you to every device.' },
      {
        title: 'Start working',
        text: 'Everything you write is yours: download it or delete it whenever you want.',
      },
    ],
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'The usual questions',
    items: [
      {
        question: 'Is there a free plan?',
        answer: 'Yes. Start free and decide later; nothing is charged without asking.',
      },
      {
        question: 'Can I take my data with me?',
        answer: 'Always. One button downloads everything the account has as a JSON file.',
      },
      {
        question: 'What happens when I delete my account?',
        answer: 'Everything that belongs to it is deleted for good, at once. It cannot be undone.',
      },
    ],
  },
  closing: {
    title: 'Ready when you are.',
    cta: 'Create your account',
  },
  footer: {
    rights: 'All rights reserved.',
  },
  notFound: {
    title: 'This page does not exist',
    text: 'The address may be mistyped, or the page moved.',
    back: 'Back to the start',
  },
}
