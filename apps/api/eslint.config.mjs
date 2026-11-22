// @ts-check
import { nestConfig } from '@workspace/config/eslint/nest'
import { defineConfig } from 'eslint/config'

// The layer rules (core <- domain <- infra / presentations) live in the shared preset: packages/config/eslint/nest.mjs.
export default defineConfig(nestConfig({ tsconfigRootDir: import.meta.dirname }))
