/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/PeopleFilter/',
  json: {
    stringify: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
