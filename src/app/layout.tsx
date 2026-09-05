import type { Metadata } from "next";
import { Bodoni_Moda, Jost } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { Rastreamento } from "@/components/Rastreamento";
import { Chrome } from "@/components/Chrome";
import { SITE } from "@/lib/site";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Sem metadataBase as URLs de imagem saem relativas e quebram no WhatsApp,
  // no Instagram e nos buscadores.
  metadataBase: new URL(SITE.url),
  title: {
    default: "BAILATTO Calçados — Sapatos Femininos em São Carlos-SP",
    template: "%s | BAILATTO Calçados",
  },
  description: SITE.descricaoCurta,
  applicationName: SITE.nome,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE.nome,
    url: SITE.url,
    title: "BAILATTO Calçados — Sapatos Femininos em São Carlos-SP",
    description: SITE.descricaoCurta,
  },
  twitter: {
    card: "summary_large_image",
    title: "BAILATTO Calçados — Sapatos Femininos em São Carlos-SP",
    description: SITE.descricaoCurta,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${bodoni.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        <Rastreamento />
        <CartProvider>
          <Chrome>{children}</Chrome>
        </CartProvider>
      </body>
    </html>
  );
}
