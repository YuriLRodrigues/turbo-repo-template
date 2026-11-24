// Takes the pictures a visual change is judged by, from the running app, and checks while it is there that the
// console is clean, that no request fails and that no screen scrolls sideways.
//
//   npm run dev:api                                   (terminal 1: the API on http://localhost:3500)
//   npm run build -w web && npm run preview -w web    (terminal 2: the static export on http://localhost:3501)
//   npm run screenshots -w web                        (writes to test-results/screenshots, see report.json)
//
// Options (environment):
//   BASE_URL      where the web app answers           default http://localhost:3501
//   SHOTS_DIR     where the pictures go               default test-results/screenshots
//   ONLY          only the runs whose name contains it  e.g. ONLY=mobile  or  ONLY=dark
//
// Each run signs up a fresh account through the screens (the API keeps it: it is a development database), writes a
// note, and pictures every screen. The look is set the way a returning person has it: the appearance in
// localStorage before the page loads, so the pictures also exercise the script that applies it before the first paint.
import { chromium } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const baseUrl = process.env.BASE_URL ?? 'http://localhost:3501'
const outDir = process.env.SHOTS_DIR ?? join(import.meta.dirname, '..', 'test-results', 'screenshots')
const only = process.env.ONLY

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
]

const LOOKS = [
  { name: 'light-rose', theme: 'light', accent: 'rose' },
  { name: 'dark-rose', theme: 'dark', accent: 'rose' },
]

/** The one request that may fail on purpose: restoring a session when there is none yet. */
const isExpectedFailure = (url, status) => status === 401 && url.endsWith('/auth/refresh')

const report = { baseUrl, takenAt: new Date().toISOString(), shots: [], console: [], failures: [] }

const shoot = async (page, name) => {
  await page.waitForTimeout(600)
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: true })
  report.shots.push(`${name}.png`)
  console.log(`  ${name}.png`)

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  if (overflow > 0) report.failures.push(`${name}: the page is ${overflow}px wider than the screen`)
}

const run = async (browser, viewport, look) => {
  const prefix = `${viewport.name}-${look.name}`
  if (only && !prefix.includes(only)) return
  console.log(prefix)

  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor,
    isMobile: viewport.isMobile,
    hasTouch: viewport.hasTouch,
    locale: 'en-US',
    colorScheme: look.theme,
  })
  await context.addInitScript(
    (appearance) => window.localStorage.setItem('app.appearance', JSON.stringify(appearance)),
    { density: 'comfortable', reduceMotion: false, ...look },
  )

  const page = await context.newPage()
  page.on('console', (message) => {
    if (message.type() === 'error' && !/status of 401/.test(message.text())) {
      report.console.push({ shot: prefix, text: message.text() })
    }
  })
  page.on('pageerror', (error) => report.console.push({ shot: prefix, text: String(error) }))
  page.on('response', (response) => {
    if (response.status() >= 400 && !isExpectedFailure(response.url(), response.status())) {
      report.failures.push(`${prefix}: ${response.status()} ${response.url()}`)
    }
  })

  // Signed out: the sign-in screen.
  await page.goto(`${baseUrl}/sign-in/`)
  await page.getByRole('button', { name: 'Sign in' }).waitFor()
  await shoot(page, `${prefix}-sign-in`)

  // A fresh account, through the sign-up screen.
  await page.goto(`${baseUrl}/sign-up/`)
  await page.getByLabel('Name').fill('Jane Doe')
  await page.getByLabel('E-mail').fill(`shots-${randomUUID()}@example.com`)
  await page.getByLabel('Password').fill('shots-password')
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('heading', { name: 'Hello, Jane' }).waitFor()

  // A note, through the sheet of the shell.
  await page.getByRole('button', { name: 'New note' }).first().click()
  await page.getByLabel('Title').fill('Groceries')
  await page.getByLabel('Body').fill('Milk\nBread\nCoffee')
  await page.getByRole('button', { name: 'Save note' }).click()
  await page.getByText('Note saved').waitFor()

  await shoot(page, `${prefix}-home`)

  for (const screen of ['notes', 'charts', 'settings']) {
    await page.goto(`${baseUrl}/${screen}/`)
    await page.getByRole('heading', { level: 1 }).waitFor()
    await shoot(page, `${prefix}-${screen}`)
  }

  await context.close()
}

mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
try {
  for (const viewport of VIEWPORTS) {
    for (const look of LOOKS) await run(browser, viewport, look)
  }
} finally {
  await browser.close()
}

writeFileSync(join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
console.log(`\n${report.shots.length} pictures in ${outDir}`)
if (report.failures.length || report.console.length) {
  for (const failure of report.failures) console.error(`FAIL ${failure}`)
  for (const message of report.console) console.error(`CONSOLE ${message.shot} ${message.text}`)
  process.exitCode = 1
}
