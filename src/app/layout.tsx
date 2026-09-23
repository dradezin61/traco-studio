import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

/** Serifa só na marca e nos títulos; o resto é Inter. */
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400" });

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
    <html lang="pt-BR" className={`${inter.variable} ${instrument.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
