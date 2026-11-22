# Static export

`apps/web` and `apps/landing` are Next.js apps with `output: 'export'`: `next build` writes plain files to `out/`,
served by any static host (a bucket, a CDN, nginx) or wrapped by a native shell. There is **no Next server at
runtime**.

## What that rules out

| Not available                                              | Instead                                                                    |
| ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| Server Actions (`'use server'`)                            | a call to the API through `@workspace/api-client` (lint error)             |
| Route Handlers, `proxy.ts`                                 | the API                                                                    |
| `next/headers`, `next/server`, `next/cache`, `server-only` | nothing: every module runs in the browser (lint error)                     |
| redirects on the server                                    | a client gate (`RequireSession`) that calls `router.replace`               |
| dynamic routes without known params                        | a query string: `/reset-password?token=...`, not `/reset-password/[token]` |
| the image optimizer                                        | `images: { unoptimized: true }`                                            |

Pages are still React Server Components at build time: `page.tsx` exports `metadata` and renders a client screen
(`'use client'`) that does the work in the browser.

## Patterns

- `useSearchParams()` needs a `<Suspense>` boundary: the page is prerendered without a query
  (`app/(auth)/sign-in/page.tsx`).
- `trailingSlash: true`: `/notes` is written as `out/notes/index.html`, which every static host resolves. Links may use
  either form; `normalizePath` treats them as the same place.
- Environment values are read at **build time** and written into the bundle: `NEXT_PUBLIC_API_URL` (web),
  `SITE_URL` and `NEXT_PUBLIC_APP_URL` (landing). Build once per environment.
- `robots.ts`, `sitemap.ts` and `opengraph-image.tsx` export `dynamic = 'force-static'`.
- The workspace packages are consumed as source: `transpilePackages` in `next.config.ts`, and `@source` in the CSS so
  Tailwind sees their class names.

## Tooling

```bash
npm run build -w web       # next build + tooling/fix-export.mjs
npm run preview -w web     # tooling/serve-out.mjs: out/ on http://localhost:3501, 404.html for unknown paths
```

`fix-export.mjs` renames the per-segment prefetch files that Next writes with Windows separators (on Linux and macOS
it finds nothing). `serve-out.mjs` answers like a static host: `index.html` per folder, `404.html` with a 404, long
cache for hashed assets only. Both apps have the pair.

`next dev` started by a coding agent would write an `AGENTS.md` into the app; `agentRules: false` turns that off,
because what an agent must know is in the `CLAUDE.md` files. Next 16 differs from older versions: its own docs are in
`node_modules/next/dist/docs/`.
