import Link from 'next/link'

import { Button } from '@workspace/ui/components/button'

const NotFound = () => (
  <main className="grid min-h-svh place-items-center px-6 text-center">
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="font-display text-2xl font-semibold">This page does not exist</h1>
      <Button render={<Link href="/" />} className="mt-2">
        Back to the start
      </Button>
    </div>
  </main>
)

export default NotFound
