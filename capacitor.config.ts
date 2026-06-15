import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.galleria.app',
  appName: 'Galleria',
  webDir: 'out',
  server: {
    url: 'https://galleria-flame-ten.vercel.app',
    cleartext: false,
  },
}

export default config