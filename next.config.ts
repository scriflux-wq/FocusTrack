import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Dynamic pages (everything under the authenticated app shell) default to
    // a 0s client cache, so even a route explicitly prefetched moments ago is
    // re-fetched from the server on click. A short window lets quick back-
    // and-forth navigation (prev/next day, switching views) reuse what's
    // already on the client instead of round-tripping every time. Mutations
    // already call revalidatePath, which invalidates this cache correctly.
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;
