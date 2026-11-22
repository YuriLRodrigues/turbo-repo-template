// Runs after `next build` (see the `build` script). On Windows, Next 16 writes the per-segment prefetch files of a
// static export with the wrong name: the client asks for
//
//   /notes/__next.!KGFwcCk.notes.__PAGE__.txt
//
// but the export joins the segment path with the platform separator before turning `/` into `.`, so on Windows the
// file lands in nested folders instead:
//
//   out/notes/__next.!KGFwcCk/notes/__PAGE__.txt
//
// Every <Link> prefetch then answers 404 (navigation still works, through the full payload). This script renames
// those files to what the client asks for. On Linux and macOS the export is already right and this finds nothing.
import { existsSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const out = join(import.meta.dirname, '..', 'out')
const PREFIX = '__next.'

/** Every file under a folder, as paths relative to it. */
const filesUnder = (folder, base = folder) =>
  readdirSync(folder).flatMap((name) => {
    const path = join(folder, name)

    return statSync(path).isDirectory() ? filesUnder(path, base) : [relative(base, path)]
  })

const fix = (folder) => {
  let fixed = 0
  for (const name of readdirSync(folder)) {
    const path = join(folder, name)
    if (!statSync(path).isDirectory()) continue

    if (name.startsWith(PREFIX)) {
      // `__next.!KGFwcCk/notes/__PAGE__.txt` becomes `__next.!KGFwcCk.notes.__PAGE__.txt`, next to the folder.
      for (const file of filesUnder(path)) {
        renameSync(join(path, file), join(folder, `${name}.${file.split(sep).join('.')}`))
        fixed++
      }
      rmSync(path, { recursive: true })
    } else if (name !== '_next') {
      fixed += fix(path)
    }
  }

  return fixed
}

if (!existsSync(out)) {
  console.error(`No export found in ${out}.`)
  process.exit(1)
}

const fixed = fix(out)
if (fixed > 0) console.log(`fix-export: renamed ${fixed} segment prefetch file(s) written with Windows separators`)
