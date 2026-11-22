import { ImageResponse } from 'next/og'

import { site } from '@/config/site'

// A static export writes this file at build time.
export const dynamic = 'force-static'

export const alt = site.title
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** The share image of the page, written at build time: the name and the promise, on the neutral dark ground. */
const OpengraphImage = () =>
  new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 80,
        background: '#0b0b0b',
        color: '#f5f5f5',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 36, fontWeight: 600 }}>
        <div
          style={{
            display: 'flex',
            width: 56,
            height: 56,
            borderRadius: 14,
            background: '#f5f5f5',
            color: '#0b0b0b',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {site.name.charAt(0)}
        </div>
        {site.name}
      </div>
      <div style={{ display: 'flex', fontSize: 72, lineHeight: 1.1, letterSpacing: -2, maxWidth: 960 }}>
        {site.title.split(': ')[1] ?? site.title}
      </div>
    </div>,
    size,
  )

export default OpengraphImage
