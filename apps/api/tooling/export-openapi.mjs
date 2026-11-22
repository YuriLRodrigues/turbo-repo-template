// Writes the OpenAPI document of the compiled app to a file. It needs no database: the app runs on its embedded
// PGlite, in memory, only long enough to answer `/docs-json`.
//   npm run docs:openapi -w api                     -> apps/api/openapi.json
//   node tooling/export-openapi.mjs ../../packages/api-client/openapi.json
import { spawn } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import * as prettier from 'prettier'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const output = resolve(process.argv[2] ?? join(root, 'openapi.json'))

if (!existsSync(join(root, 'dist', 'main.js'))) {
  throw new Error('dist/main.js is missing: run `npm run build -w api` first (`npm run docs:openapi -w api` does it)')
}

/** A port nobody is using right now, so the export never collides with a running API. */
function freePort() {
  return new Promise((done, fail) => {
    const probe = createServer()
    probe.once('error', fail)
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address()
      probe.close(() => done(port))
    })
  })
}

const port = await freePort()
const base = `http://127.0.0.1:${port}`
const lines = []

const app = spawn(process.execPath, ['dist/main'], {
  cwd: root,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    // Blank is "not set" for the app, also when a local `.env` has one: the export never touches a real database.
    DATABASE_URL: '',
    PGLITE_DATA_DIR: 'memory://',
    PGLITE_PORT: '0',
    JWT_SECRET: 'x'.repeat(40),
    SMTP_HOST: '',
    PORT: String(port),
    LOG_BANNER: 'off',
    LOG_FORMAT: 'json',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})
for (const stream of [app.stdout, app.stderr]) {
  stream.setEncoding('utf8')
  stream.on('data', (chunk) => lines.push(...chunk.split('\n').filter(Boolean)))
}

let exited = false
app.once('exit', () => {
  exited = true
})

try {
  let document
  for (let attempt = 0; attempt < 240 && !document && !exited; attempt++) {
    document = await fetch(`${base}/docs-json`)
      .then((response) => (response.ok ? response.json() : undefined))
      .catch(() => undefined)
    if (!document) await new Promise((done) => setTimeout(done, 250))
  }
  if (!document) {
    throw new Error(`the app did not answer /docs-json. Its last lines:\n${lines.slice(-15).join('\n')}`)
  }

  // Formatted with the repository's Prettier, so the file passes `prettier --check` wherever it is written.
  const options = (await prettier.resolveConfig(output)) ?? {}
  writeFileSync(output, await prettier.format(JSON.stringify(document), { ...options, parser: 'json' }))

  const paths = Object.values(document.paths ?? {})
  const operations = paths.reduce((count, path) => count + Object.keys(path).length, 0)
  console.log(`OpenAPI document written to ${output} (${paths.length} paths, ${operations} operations)`)
} finally {
  app.kill()
}
