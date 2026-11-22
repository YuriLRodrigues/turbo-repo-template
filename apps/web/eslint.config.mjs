import { defineConfig } from 'eslint/config'

import { reactConfig } from '@workspace/config/eslint/react'

export default defineConfig([
  ...reactConfig({ tsconfigRootDir: import.meta.dirname }),

  // A static export has no server at runtime (docs/patterns/web/static-export.md): nothing that needs one may be imported.
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
])
