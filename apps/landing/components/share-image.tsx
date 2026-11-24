import { ImageResponse } from 'next/og'

import { site } from '@/config/site'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

export const shareImageSize = { width: 1200, height: 630 }

/**
 * The share image of the page in one language, written at build time by the `opengraph-image.tsx` next to each root
 * layout: the name and the promise of the hero, on the neutral dark ground.
 */
export const shareImage = (locale: Locale) =>
  new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 80,
        background: '#09090c',
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
            backgroundImage: 'linear-gradient(135deg, #ff1e56, #a066ff)',
            color: '#ffffff',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {site.name.charAt(0)}
        </div>
        {site.name}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          fontSize: 72,
          lineHeight: 1.1,
          letterSpacing: -2,
          maxWidth: 960,
        }}
      >
        <span>{getDictionary(locale).hero.title}</span>
        <span
          style={{
            backgroundImage: 'linear-gradient(92deg, #ff1e56, #a066ff)',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {getDictionary(locale).hero.titleAccent}
        </span>
      </div>
    </div>,
    shareImageSize,
  )
