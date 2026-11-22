/**
 * Where the API answers. The web app is a static export, so the value is read at build time and written into the
 * bundle: set `NEXT_PUBLIC_API_URL` before `npm run build` (or `npm run dev`). Default: the API of `npm run dev`.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3500'
