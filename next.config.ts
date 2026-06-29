import type { NextConfig } from 'next';

const config: NextConfig = {
  // Allow longer timeouts for AI responses
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default config;
