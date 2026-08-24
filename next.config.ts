import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Cabeçalhos de segurança. Só os que não quebram uma loja Next.js comum —
  // um CSP estrito exige inventariar cada script inline e foi deixado de fora
  // de propósito, para não bloquear o próprio site sem teste dedicado.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Impede que o navegador "adivinhe" tipo de conteúdo (anti-XSS).
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Só o próprio site pode embutir as páginas em iframe (anti-clickjacking).
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Não vaza a URL completa de origem para outros sites.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Desliga APIs sensíveis que a loja não usa.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
