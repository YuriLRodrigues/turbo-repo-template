// Relative import on purpose: editors and git hooks load this file before `npm install` has linked the workspaces.
import { base, tailwind } from './packages/config/prettier/index.mjs'

/** One style for the whole monorepo; Tailwind class sorting where Tailwind classes are written. */
const config = {
  ...base,
  overrides: [
    {
      files: ['apps/web/**/*', 'packages/ui/**/*'],
      options: tailwind('./apps/web/app/globals.css'),
    },
    {
      files: ['apps/landing/**/*'],
      options: tailwind('./apps/landing/app/globals.css'),
    },
  ],
}

export default config
