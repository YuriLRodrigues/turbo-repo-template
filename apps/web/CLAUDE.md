# CLAUDE.md — apps/web

## What this is

The web app: Next.js 16 (App Router) as a **static export**, React 19, Tailwind v4 through `@workspace/ui`, TanStack
Query over `@workspace/api-client`, react-hook-form + zod. There is no Next server at runtime
(`docs/patterns/web/static-export.md`): no Server Actions, no Route Handlers, no `next/headers`.

## Commands

```bash
npm run dev -w web            # http://localhost:3501 (start the API too: npm run dev at the root)
npm run build -w web          # out/ (next build + tooling/fix-export.mjs)
npm run preview -w web        # serves out/ on :3501 like a static host
npm test -w web               # Vitest: schemas, helpers, client components (jsdom)
npm run screenshots -w web    # Playwright: every screen, desktop and phone, both themes (API + preview running)
npm run lint:check -w web
npm run typecheck -w web      # next typegen + tsc
```

`NEXT_PUBLIC_API_URL` (default `http://localhost:3500`) is read at build time.

## Map

```
app/
  layout.tsx                  root: fonts, BOOT_SCRIPT (look + sidebar before the first paint), providers, Toaster
  (auth)/                     sign-in, sign-up, forgot-password, reset-password?token=, verify-email?token=
  (app)/                      every signed-in screen: RequireSession + AppShell
    page.tsx                  home (indicators, a chart, pinned notes)
    notes/                    the example screen: list, search, tabs, pages, sheet, pin, archive, delete
    charts/                   every chart of @workspace/ui/charts with sample data
    settings/                 account, appearance, export, sign out, delete account
components/
  session/                    SessionProvider (restore, me, signIn, signOut), RequireSession, safeNext
  shell/                      AppShell, AppSidebar, AppTabBar, PageHeader, navigation.ts, brand
  appearance/                 the appearance sheet and the sync with the account's preferences
  notes/                      hooks of the resource (use-notes.ts), the note sheet and its schema
  form/                       useAppForm and the controlled fields
  auth/                       AuthCard and the schemas of the auth screens
lib/                          api.ts (configures the client), env, query client, query keys, useApiMutation
tooling/                      fix-export, serve-out, screenshots
```

A screen's own components live next to it (`app/(app)/notes/components/`); what more than one screen uses lives in
`components/`.

## Rules

1. Data only through `@workspace/api-client`: `useQuery({ queryKey, queryFn: () => unwrap(fn(...)) })` to read,
   `useApiMutation(...)` to change, invalidating by the resource key of `lib/query-keys.ts`
   (`docs/patterns/web/data-fetching.md`). Never `fetch` directly, never edit `src/gen`.
2. A new signed-in screen goes under `app/(app)/` and gets its line in `components/shell/navigation.ts`.
3. `page.tsx` exports `metadata` and renders a client screen; `useSearchParams` needs a `<Suspense>`.
4. Forms: `useAppForm(schema)` + the controlled fields; the schema next to the form with a spec
   (`docs/patterns/web/forms.md`).
5. Every list has its loading (`Skeleton`), empty (`EmptyState`) and error states.
6. Style with the roles of the tokens and the primitives of `@workspace/ui`; no raw colors, no raw overflow
   (`ScrollArea`), grids with sized tracks (`docs/patterns/web/layout.md`). Charts from `@workspace/ui/charts`.
7. Components are arrow functions in a `const` with named exports; a default export only for App Router files.
8. Copy in English, short, saying what to do. Icon-only buttons have a `label`.
9. The session is the provider's business: screens use `useSession()`; nothing reads or stores tokens
   (`docs/patterns/web/auth.md`).
