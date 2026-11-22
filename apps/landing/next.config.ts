import type { NextConfig } from 'next'

/**
 * The product page is a static export, like the app: `next build` writes plain files to `out/` and any static host
 * serves them. There is no Next server at runtime: no Server Actions, no Route Handlers, no `proxy.ts`.
 */
const nextConfig: NextConfig = {
  output: 'export',
  // `/` is written as `out/index.html` and any later page as `out/<page>/index.html`.
  trailingSlash: true,
  // The image optimizer is a server: images are served as they are.
  images: { unoptimized: true },
  reactStrictMode: true,
  // Development only: lets a phone on the same network open `http://<ip-of-the-pc>:3502`.
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*', '172.*.*.*', '*.local'],
  // The design system is consumed as source (TypeScript and CSS), not as a built package.
  transpilePackages: ['@workspace/ui', '@workspace/utils'],
  // `next dev` started by a coding agent would write an AGENTS.md here: what an agent must know is written by hand.
  agentRules: false,
}

export default nextConfig
