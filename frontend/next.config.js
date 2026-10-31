/** @type {import('next').NextConfig} */
const isDocker = process.env.DOCKER_BUILD === '1';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (process.env.NODE_ENV === 'production' && !isDocker ? '/VidNote-AI' : '');

const nextConfig = {
  output: isDocker ? 'standalone' : 'export',
  images: {
    unoptimized: true,
  },
  basePath: basePath,
  trailingSlash: true,
};

module.exports = nextConfig;
