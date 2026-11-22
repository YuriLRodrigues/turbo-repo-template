// Serves the static export (`out/`) the way a static host does: `/notes/` answers `out/notes/index.html`, anything
// unknown answers `out/404.html` with a 404. Run `npm run build` first.
//
//   npm run preview                 http://localhost:3501
//   PORT=3510 npm run preview
//
// It listens on every interface of this machine, so a phone on the same network can open it at
// http://<address of this machine>:3501 (the firewall has to allow Node on that port).
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, sep } from 'node:path'

const root = join(import.meta.dirname, '..', 'out')
const port = Number(process.env.PORT ?? 3501)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

if (!existsSync(join(root, 'index.html'))) {
  console.error(`No export found in ${root}. Run "npm run build" first.`)
  process.exit(1)
}

/** The file a URL path stands for, or `undefined`. Never outside `out/`. */
const resolveFile = (pathname) => {
  let decoded
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    // A malformed escape (`/%E0%A4`): not a file.
    return undefined
  }
  const path = normalize(join(root, decoded))
  if (path !== root && !path.startsWith(root + sep)) return undefined

  const candidates = [path, join(path, 'index.html'), `${path}.html`]

  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile())
}

const server = createServer((request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost')
  const file = resolveFile(pathname)
  const found = file ?? join(root, '404.html')
  const immutable = pathname.startsWith('/_next/static/')

  response.writeHead(file ? 200 : 404, {
    'content-type': TYPES[extname(found)] ?? 'application/octet-stream',
    // Hashed assets never change; pages are always asked again, so a new build shows up on reload.
    'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  })
  createReadStream(found).pipe(response)
})

server.listen(port, () => {
  console.log(`web (static export) on http://localhost:${port}`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(() => process.exit(0)))
}
