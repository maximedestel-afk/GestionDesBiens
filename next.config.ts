import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // S'assure que le modèle de bail (lu via fs au moment de la génération)
  // est bien inclus dans le bundle serverless de cette route.
  outputFileTracingIncludes: {
    "/inventaire/biens/[id]/bail": ["lib/inventaire/assets/**/*"],
  },
};

export default nextConfig;
