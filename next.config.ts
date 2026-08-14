import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep pdfkit out of the Next bundle so AFM fonts resolve from node_modules
  serverExternalPackages: ['pdfkit', 'fontkit', 'linebreak', 'png-js', 'unicode-properties'],
  outputFileTracingIncludes: {
    '/api/**/*': [
      './node_modules/pdfkit/js/data/**/*',
      './node_modules/pdfkit/js/**/*',
    ],
  },
  images: {
    // Enable image optimization for better performance
    // WebP only — Safari AVIF color management often looks different from Chrome
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    // CMS destination/tour/blog images can come from any HTTPS host.
    // Empty `port: ''` entries do not match in Next 16, which caused
    // "hostname is not configured" crashes for otherwise listed domains.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Enable React strict mode for better performance
  reactStrictMode: true,
  // SEO optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // Enable static optimization
  trailingSlash: false,
  // Combined headers for video optimization and security
  async headers() {
    return [
      {
        source: '/:path*\\.(mp4|webm|ogg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Encoding',
            value: 'gzip',
          },
        ],
      },
      {
        source: '/:path*\\.(jpg|jpeg|png|gif|webp|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
