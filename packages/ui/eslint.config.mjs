import { defineConfig } from 'eslint/config'

import { reactConfig } from '@workspace/config/eslint/react'

export default defineConfig([...reactConfig({ tsconfigRootDir: import.meta.dirname, next: false })])
