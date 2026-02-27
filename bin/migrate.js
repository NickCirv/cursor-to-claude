#!/usr/bin/env node

import { run } from '../src/index.js'

run().catch((err) => {
  console.error('\n  Error:', err.message)
  process.exit(1)
})
