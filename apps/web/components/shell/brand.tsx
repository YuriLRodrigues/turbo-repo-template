import { siteConfig } from '@/config/site'

/** The mark and the name of the product. Replace both with the real ones (and `app/icon.svg`). */
export const Brand = () => (
  <span className="flex items-center gap-2.5">
    <span
      aria-hidden
      className="grid size-8 place-items-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground"
    >
      {siteConfig.name.charAt(0)}
    </span>
    <span className="font-display text-base font-semibold tracking-[-0.01em]">{siteConfig.name}</span>
  </span>
)
