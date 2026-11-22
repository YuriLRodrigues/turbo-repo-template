import type { RenderContext } from './banner'

export type ErrorDetail = {
  name: string
  message: string
  /** Raw `error.stack`. */
  stack?: string
  /** Logger context (`HttpErrorFilter`) or anything that says where it was caught. */
  context?: string
  cause?: ErrorDetail
}

export function toErrorDetail(error: unknown, context?: string): ErrorDetail {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      cause: error.cause === undefined ? undefined : toErrorDetail(error.cause),
    }
  }

  return { name: 'Error', message: typeof error === 'string' ? error : JSON.stringify(error), context }
}

export type StackFrame = { text: string; own: boolean }

const MAX_FRAMES = 8

/** The `at …` lines of a stack. A frame is the app's own when it is outside `node_modules` and Node internals. */
export function parseStack(stack: string | undefined): StackFrame[] {
  if (!stack) return []

  return stack
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('at '))
    .map((text) => ({ text, own: !/node_modules|node:internal|\(node:/.test(text) }))
}

/**
 * The red block of an unexpected error: what broke, where it was caught and the stack, with the app's own frames
 * in normal text and the framework's dimmed. Long stacks are cut after the frames that matter.
 */
export function renderErrorBlock(detail: ErrorDetail, ctx: RenderContext): string[] {
  const { painter, palette } = ctx
  const badge = painter.enabled ? painter.paint(' ERROR ', palette.errorBadge) : '[ERROR]'
  const [first, ...rest] = detail.message.split('\n')
  const where = detail.context ? painter.paint(` · ${detail.context}`, palette.muted) : ''

  const lines = [
    ` ${badge} ${painter.paint(`${detail.name}: ${first}`, palette.error)}${where}`,
    ...rest.filter((line) => line.trim()).map((line) => `     ${painter.paint(line.trim(), palette.error)}`),
  ]

  const frames = parseStack(detail.stack)
  const shown = frames.slice(0, MAX_FRAMES)
  for (const frame of shown) lines.push(`     ${painter.paint(frame.text, frame.own ? palette.fg : palette.muted)}`)
  if (frames.length > shown.length) {
    lines.push(`     ${painter.paint(`… ${frames.length - shown.length} more frames`, palette.muted)}`)
  }

  if (detail.cause) {
    lines.push(`   ${painter.paint('caused by', palette.hint)}`)
    lines.push(...renderErrorBlock(detail.cause, ctx).map((line) => `  ${line}`))
  }

  return lines
}
