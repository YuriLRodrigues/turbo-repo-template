import { defineConfig } from 'eslint/config'

import { noRawOverflow, noUseActionState, noUseServer, reactConfig } from '@workspace/config/eslint/react'

export default defineConfig([
  ...reactConfig({ tsconfigRootDir: import.meta.dirname }),

  // A static export has no server at runtime: nothing that needs one may be imported.
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'next/headers', message: 'Static export: there is no request on a server to read.' },
            { name: 'next/server', message: 'Static export: no Route Handlers and no proxy.' },
            { name: 'next/cache', message: 'Static export: there is no server cache to revalidate.' },
            { name: 'server-only', message: 'Static export: every module runs in the browser.' },
          ],
        },
      ],
    },
  },

  // `robots.ts` and `sitemap.ts` are App Router conventions too: Next reads their default export.
  {
    files: ['app/robots.ts', 'app/sitemap.ts', 'app/opengraph-image.tsx'],
    rules: {
      'no-restricted-syntax': ['error', ...noRawOverflow, noUseServer, noUseActionState],
    },
  },
])
