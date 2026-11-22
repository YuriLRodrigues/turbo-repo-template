import type { NextConfig } from 'next'

/**
 * The web app is a static export (docs/patterns/web/static-export.md): `next build` writes plain files to `out/`, served
 * by any static host (or wrapped by a native shell). There is no Next server at runtime: no Server Actions, no Route
 * Handlers, no `proxy.ts`, no `next/headers`. Every call to the API goes from the browser, through
 * `@workspace/api-client`.
 */
const nextConfig: NextConfig = {
  output: 'export',
  // `/notes` is written as `out/notes/index.html`, which every static host resolves.
  trailingSlash: true,
  // The image optimizer is a server: without it, <Image> serves the file as it is.
  images: { unoptimized: true },
  reactStrictMode: true,
  // Development only: lets a phone on the same network open `http://<ip-of-the-pc>:3501`. Without it Next blocks the
  // dev scripts requested from another origin and the page loads without JavaScript.
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*', '172.*.*.*', '*.local'],
  // The workspace packages are consumed as source (TypeScript and CSS), not as built packages.
  transpilePackages: ['@workspace/ui', '@workspace/api-client', '@workspace/utils'],
  // `next dev` writes an AGENTS.md into the app when it is started by a coding agent. What an agent must know about
  // this project is written by hand (CLAUDE.md), so the generated file would only be a change that keeps coming back.
  agentRules: false,
}

export default nextConfig
