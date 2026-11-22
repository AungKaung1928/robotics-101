/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // styles.test.ts reads the colour tokens from the real stylesheet; vitest stubs CSS otherwise.
  test: { css: { include: [/index\.css/] } },
})
