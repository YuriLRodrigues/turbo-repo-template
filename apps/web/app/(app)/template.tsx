import type { ReactNode } from 'react'

/**
 * The transition between screens. A template is mounted again on every navigation (a layout is not), so the arriving
 * screen rises into place while the shell around it stays still. Reduced motion: the screen is simply there.
 */
const AppTemplate = ({ children }: { children: ReactNode }) => (
  <div className="animate-[page-in_0.35s_var(--ease-out-expo)_both]">{children}</div>
)

export default AppTemplate
