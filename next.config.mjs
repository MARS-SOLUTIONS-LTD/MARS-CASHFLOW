import withPWA from 'next-pwa'
import runtimeCaching from 'next-pwa/cache'

const isDev = process.env.NODE_ENV === 'development'
const disablePwa = isDev || process.env.NEXT_PUBLIC_DISABLE_PWA === 'true'

export default withPWA({
  dest: 'public',
  disable: disablePwa,
  register: true,      // set to false if you prefer manual registration
  skipWaiting: true,
  runtimeCaching,      // sensible defaults; customize if needed
  buildExcludes: [/middleware-manifest.json$/, /server\/.*$/, /.*\.map$/],
})({
  reactStrictMode: true,
  images: {
    // Prefer listing domains explicitly. Update as needed.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
})
