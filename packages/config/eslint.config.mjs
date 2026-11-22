import { defineConfig } from 'eslint/config'

import { nodeConfig } from './eslint/node.mjs'

export default defineConfig(nodeConfig())
