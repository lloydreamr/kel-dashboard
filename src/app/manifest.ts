import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kel Dashboard',
    short_name: 'Kel',
    description: 'Strategic question tracking for Kel project - Philippine snack market entry',
    start_url: '/',
    display: 'standalone',
    background_color: '#FEFAE0', // cream (UX spec)
    theme_color: '#86A789', // sage green (UX spec)
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      // TODO: Add these icons before production deployment (Story 8.1 deferred items):
      // - /icons/apple-touch-icon.png (180x180) for iOS
      // - /icons/maskable_icon-512x512.png for adaptive icons
    ],
  };
}
