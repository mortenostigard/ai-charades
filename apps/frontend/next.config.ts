import type { NextConfig } from 'next';

// On a Vercel preview build triggered by a PR, point the socket connection at
// the matching Render service preview backend instead of the production
// backend defined in Vercel's project-level NEXT_PUBLIC_SOCKET_URL. Production
// builds, branch deploys without a PR, and local dev all fall through to
// whatever the env already provides.
//
// Render Service Previews: https://render.com/docs/service-previews
// Vercel system env vars:  https://vercel.com/docs/projects/environment-variables/system-environment-variables
const env: Record<string, string> = {};
const prNumber = process.env.VERCEL_GIT_PULL_REQUEST_ID;
if (prNumber) {
  env.NEXT_PUBLIC_SOCKET_URL = `https://charades-directors-cut-backend-pr-${prNumber}.onrender.com`;
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ['@charades/shared'],
  env,
};

export default nextConfig;
