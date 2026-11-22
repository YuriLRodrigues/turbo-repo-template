import type { ReactNode } from 'react'

import { RequireSession } from '@/components/session/session-gates'
import { AppShell } from '@/components/shell/app-shell'

/** Every signed-in screen lives under `(app)`: the session gate, then the shell around it. */
const AppLayout = ({ children }: { children: ReactNode }) => (
  <RequireSession>
    <AppShell>{children}</AppShell>
  </RequireSession>
)

export default AppLayout
