import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Turbopack config (Next.js 16+ default)
  turbopack: {},

  webpack: (config, { isServer }) => {
    // SharedWorker no funciona en server-side
    if (!isServer) {
      config.output.globalObject = "self"
    }

    // Configuración para sql.js WASM
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    }

    return config
  },
  // Headers para SharedArrayBuffer (requerido por sql.js en algunos casos)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ]
  },
}

export default nextConfig
