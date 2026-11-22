---
name: rename-project
description: Give this template its product name and identity - package names, app name in the API and the apps, cookie and storage keys, the brand mark, the landing copy and the example context. Use right after creating a project from the template, or when the user says "rename the project to X".
---

# Rename the project

Ask for the product name (display, `Acme Notes`), a short slug (`acme`) and whether the `notes` example stays.

1. **Root.** `package.json` `name` and `description`; the title of `README.md`.
2. **API.** `APP_NAME` default in `apps/api/src/infra/env/env.ts` and `.env.example` (it is said in the e-mails, drawn
   in the boot banner and in the OpenAPI title); `MAIL_FROM`; the cookie name `REFRESH_COOKIE` in
   `presentations/http/auth/refresh-transport.ts` (`<slug>.refresh_token`, and the same constant in the e2e specs);
   the export `format` (`<slug>.export`) in `export-user-data.use-case.ts`, its DTO example and specs; the database
   names in `docker-compose.yml` and `.env.example`; `SIGNATURE` in `infra/logger/terminal/banner.ts`.
3. **Front.** `apps/web/config/site.ts` and `apps/landing/config/site.ts`; the storage keys
   `APPEARANCE_STORAGE_KEY` (`packages/ui/src/appearance/appearance.ts`), `SIDEBAR_STORAGE_KEY`
   (`packages/ui/src/lib/sidebar-state.ts`) and the key in `apps/web/tooling/screenshots.mjs`; the lock name
   `REFRESH_LOCK` (`packages/api-client/src/http/session.ts`); `components/shell/brand.tsx`, `app/icon.svg` of both
   apps, the share image of the landing.
4. **Look.** If the product has a palette or a font: `packages/ui/src/styles/tokens.css` (values only, names stay) and
   the fonts of the root layouts; then `npm run contrast`.
5. **Example.** To drop `notes`: delete `domain/notes`, its schema/mapper/repository/binding, controllers and module,
   subscriber, tests, factory, world and e2e spec, the contributor in `identity-http.module.ts`, section 2 of
   `docs/business-rules.md`; regenerate the `init` migration (nothing is deployed yet) and the client; in the web app,
   the notes screen, `components/notes`, the home's notes widgets and the nav entry. Keep it until the first real
   context exists: it is the reference to copy.
6. Search what is left: `git grep -n -i -E "\bApp\b|app\.(refresh_token|appearance|sidebar|export)"` and read the
   matches.
7. Run the `pre-pr-checklist` skill.
