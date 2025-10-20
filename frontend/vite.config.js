import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '192.168.1.135',
      'tasty-pumas-bake.loca.lt',
      'chubby-waves-remain.loca.lt',
      'shaggy-otters-care.loca.lt',
      'metal-carpets-kneel.loca.lt',
      'purple-crabs-care.loca.lt',
      'seven-meals-exist.loca.lt',
      '.loca.lt'
    ]
  }
})
