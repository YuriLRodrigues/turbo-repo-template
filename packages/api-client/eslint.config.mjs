import { defineConfig } from 'eslint/config'

import { nodeConfig } from '@workspace/config/eslint/node'

// `src/gen` is written by Orval: never edited, never linted.
export default defineConfig([{ ignores: ['src/gen/**'] }, ...nodeConfig()])
