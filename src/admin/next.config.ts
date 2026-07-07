import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Imagens de espaço são servidas pela API (Render em produção, localhost em dev).
    remotePatterns: [
      { protocol: "https", hostname: "agendify-api-j6da.onrender.com" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
