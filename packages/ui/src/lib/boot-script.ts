import { APPEARANCE_SCRIPT } from '../appearance/appearance'
import { SIDEBAR_SCRIPT } from './sidebar-state'

/**
 * The one inline script of the app, placed in <head>: before anything paints it reads what the last visit left on
 * the device and writes it on <html> as attributes. The look (theme, accent, density, motion) and the
 * sidebar (expanded or collapsed) are both there for the first paint: nothing flashes and nothing animates on load.
 *
 *   <head>
 *     <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
 *   </head>
 */
export const BOOT_SCRIPT = `${APPEARANCE_SCRIPT};${SIDEBAR_SCRIPT}`
