import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600"] });

/** Serifa só na marca e nos títulos: 500 no título principal, 600 nos menores. */
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], weight: ["500", "600"] });

export const metadata: Metadata = {
  title: {
    default: "Traço Studio | Arquitetura e interiores",
    template: "%s · Traço Studio",
  },
  description:
    "Estúdio de arquitetura e interiores: projetos residenciais, comerciais e de interiores, com pedido de orçamento em poucos passos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${lora.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
